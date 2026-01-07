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
      <div className="glass-card p-8 mb-6">
        <div className="flex items-center justify-center gap-4 text-white/50">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
          <span className="font-display text-lg">Checking casino status...</span>
        </div>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="glass-card p-6 mb-6 border-success/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.2)]">
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
          <div>
            <p className="font-display font-bold text-xl text-success">Casino is LIVE</p>
            <p className="text-sm text-white/50 font-body">Tables are open - place your bets!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 mb-6 border-gold/20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-gold/10 rounded-full blur-3xl"></div>
      
      <div className="relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 rounded-2xl blur-lg animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>
            </div>
          </div>
          
          <h3 className="text-2xl font-display font-bold text-white mb-2">
            Activate the Casino
          </h3>
          <p className="text-white/50 font-body max-w-md mx-auto">
            Light up the tables and open the floor. Initialize the on-chain casino to start accepting bets.
          </p>
        </div>

        {!wallet.connected ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-white/70 font-display">Connect your wallet to activate</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-display font-semibold text-gold/80 mb-2 uppercase tracking-wider">
                  <Coins className="w-3.5 h-3.5" />
                  Min Bet
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={minBet}
                    onChange={(e) => setMinBet(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-base focus:border-gold/50 focus:bg-white/[0.07] focus:outline-none transition-all"
                    disabled={isInitializing}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">SOL</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-display font-semibold text-gold/80 mb-2 uppercase tracking-wider">
                  <Coins className="w-3.5 h-3.5" />
                  Max Bet
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={maxBet}
                    onChange={(e) => setMaxBet(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-base focus:border-gold/50 focus:bg-white/[0.07] focus:outline-none transition-all"
                    disabled={isInitializing}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">SOL</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-display font-semibold text-gold/80 mb-2 uppercase tracking-wider">
                  <Coins className="w-3.5 h-3.5" />
                  House Vault
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={initialVault}
                    onChange={(e) => setInitialVault(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-base focus:border-gold/50 focus:bg-white/[0.07] focus:outline-none transition-all"
                    disabled={isInitializing}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">SOL</span>
                </div>
              </div>
            </div>

            <button
              onClick={initializeCasino}
              disabled={isInitializing}
              className="w-full btn-gold flex items-center justify-center gap-3 py-4 text-lg"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Light Up the Casino
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-white/30 font-body">
              <Zap className="w-3.5 h-3.5" />
              <span>Funds the house vault with {initialVault} SOL to cover player wins</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
