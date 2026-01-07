import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';
import { useCasino } from '../hooks/useCasino';
import { CheckCircle, Loader2, Sparkles, Zap, Coins } from 'lucide-react';

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
    const toastId = toast.loading('Activating the casino...');

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

      toast.success('Casino is now LIVE!', { id: toastId });
      await checkInitialization();
    } catch (error: any) {
      console.error('Initialize error:', error);
      toast.error(
        `Failed to activate: ${error.message || 'Unknown error'}`,
        { id: toastId }
      );
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitialized === null) {
    return (
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-center gap-3 text-white/50">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span className="font-display text-sm">Checking casino status...</span>
        </div>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="glass-card p-4 mb-4 border-success/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-display font-bold text-success">Casino is LIVE</p>
            <p className="text-xs text-white/50 font-body">Tables are open - place your bets!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 mb-4 border-gold/20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
      
      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">Activate the Casino</h3>
            <p className="text-xs text-white/50 font-body">Initialize the on-chain casino to start accepting bets</p>
          </div>
        </div>

        {!wallet.connected ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm text-white/70 font-display">Connect your wallet to activate</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-display font-semibold text-gold/80 mb-1.5 uppercase tracking-wider">
                  <Coins className="w-3 h-3" />
                  Min Bet
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={minBet}
                    onChange={(e) => setMinBet(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-gold/50 focus:outline-none transition-all"
                    disabled={isInitializing}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 font-mono text-xs">SOL</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-display font-semibold text-gold/80 mb-1.5 uppercase tracking-wider">
                  <Coins className="w-3 h-3" />
                  Max Bet
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={maxBet}
                    onChange={(e) => setMaxBet(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-gold/50 focus:outline-none transition-all"
                    disabled={isInitializing}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 font-mono text-xs">SOL</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-display font-semibold text-gold/80 mb-1.5 uppercase tracking-wider">
                  <Coins className="w-3 h-3" />
                  Vault
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={initialVault}
                    onChange={(e) => setInitialVault(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:border-gold/50 focus:outline-none transition-all"
                    disabled={isInitializing}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 font-mono text-xs">SOL</span>
                </div>
              </div>
            </div>

            <button
              onClick={initializeCasino}
              disabled={isInitializing}
              className="w-full btn-gold flex items-center justify-center gap-2 py-3 text-sm"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Light Up the Casino
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
