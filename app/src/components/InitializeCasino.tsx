import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';
import { useCasino } from '../hooks/useCasino';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export const InitializeCasino: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { program, getCasinoPDA, getVaultPDA, fetchCasino } = useCasino();
  
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [minBet, setMinBet] = useState('0.01');
  const [maxBet, setMaxBet] = useState('1');
  const [initialVault, setInitialVault] = useState('2');

  useEffect(() => {
    checkInitialization();
  }, [wallet.publicKey, connection]);

  const checkInitialization = async () => {
    try {
      const casino = await fetchCasino();
      setIsInitialized(casino !== null);
    } catch {
      setIsInitialized(false);
    }
  };

  const initializeCasino = async () => {
    if (!wallet.publicKey || !program) {
      toast.error('Please connect your wallet first');
      return;
    }

    const minBetNum = parseFloat(minBet);
    const maxBetNum = parseFloat(maxBet);
    const initialVaultNum = parseFloat(initialVault);

    if (isNaN(minBetNum) || minBetNum <= 0) {
      toast.error('Min bet must be a positive number');
      return;
    }

    if (isNaN(maxBetNum) || maxBetNum < minBetNum) {
      toast.error('Max bet must be greater than or equal to min bet');
      return;
    }

    if (isNaN(initialVaultNum) || initialVaultNum < 0) {
      toast.error('Initial vault must be a non-negative number');
      return;
    }

    if (maxBetNum > initialVaultNum / 2) {
      toast.error(
        `Max bet (${maxBetNum} SOL) must be at most half of initial vault (${initialVaultNum / 2} SOL).`
      );
      return;
    }

    try {
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      const requiredSOL = initialVaultNum + 0.05;
      
      if (balanceSOL < requiredSOL) {
        toast.error(
          `Insufficient balance. You have ${balanceSOL.toFixed(4)} SOL but need at least ${requiredSOL.toFixed(2)} SOL`
        );
        return;
      }
    } catch {
      toast.error('Failed to check wallet balance');
      return;
    }

    setIsInitializing(true);
    const toastId = toast.loading('Initializing casino...');

    try {
      const minBetLamports = new BN(minBetNum * LAMPORTS_PER_SOL);
      const maxBetLamports = new BN(maxBetNum * LAMPORTS_PER_SOL);
      const initialVaultLamports = new BN(initialVaultNum * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .initialize(minBetLamports, maxBetLamports, initialVaultLamports)
        .accounts({
          casino: getCasinoPDA.pda,
          vault: getVaultPDA.pda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const simulation = await connection.simulateTransaction(tx);
      if (simulation.value.err) {
        throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      toast.success('Casino initialized successfully!', { id: toastId });
      await checkInitialization();
    } catch (error: any) {
      console.error('Initialize error:', error);
      toast.error(
        `Failed to initialize: ${error.message || 'Unknown error'}`,
        { id: toastId }
      );
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitialized === null) {
    return (
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 text-white/50">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-body">Checking casino status...</span>
        </div>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="glass-card p-5 mb-6 border-success/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-muted flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-display font-semibold text-success">Casino is initialized and ready</p>
            <p className="text-sm text-white/40 font-body">You can now place bets</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 mb-6 border-warning/30">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-display font-semibold text-warning mb-1">
            Casino Not Initialized
          </h3>
          <p className="text-sm text-white/50 font-body">
            The casino needs to be initialized before players can place bets.
          </p>
        </div>
      </div>

      {!wallet.connected ? (
        <p className="text-white/50 font-body text-sm">
          Please connect your wallet to initialize the casino.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-display font-medium text-white/60 mb-2">
                Min Bet (SOL)
              </label>
              <input
                type="number"
                step="0.01"
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-accent focus:outline-none transition-all"
                disabled={isInitializing}
              />
            </div>

            <div>
              <label className="block text-xs font-display font-medium text-white/60 mb-2">
                Max Bet (SOL)
              </label>
              <input
                type="number"
                step="0.1"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-accent focus:outline-none transition-all"
                disabled={isInitializing}
              />
            </div>

            <div>
              <label className="block text-xs font-display font-medium text-white/60 mb-2">
                Initial Vault (SOL)
              </label>
              <input
                type="number"
                step="1"
                value={initialVault}
                onChange={(e) => setInitialVault(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-accent focus:outline-none transition-all"
                disabled={isInitializing}
              />
            </div>
          </div>

          <button
            onClick={initializeCasino}
            disabled={isInitializing}
            className="w-full btn-gold flex items-center justify-center gap-2"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize Casino'
            )}
          </button>

          <p className="text-xs text-white/30 font-body">
            This will create the casino account and fund the vault with {initialVault} SOL.
          </p>
        </div>
      )}
    </div>
  );
};
