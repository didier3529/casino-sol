import { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';
import { useCasino } from '../hooks/useCasino';

export const InitializeCasino: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { program, getCasinoPDA, getVaultPDA, fetchCasino } = useCasino();
  
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [minBet, setMinBet] = useState('0.01');
  const [maxBet, setMaxBet] = useState('1');
  const [initialVault, setInitialVault] = useState('2');

  // Check if casino is already initialized
  useEffect(() => {
    checkInitialization();
  }, [wallet.publicKey, connection]);

  const checkInitialization = async () => {
    try {
      const casino = await fetchCasino();
      setIsInitialized(casino !== null);
    } catch (error) {
      console.log('Casino not initialized yet');
      setIsInitialized(false);
    }
  };

  const initializeCasino = async () => {
    if (!wallet.publicKey || !program) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate inputs
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

    // Validate the constraint: max_bet <= initial_vault / 2
    if (maxBetNum > initialVaultNum / 2) {
      toast.error(
        `Max bet (${maxBetNum} SOL) must be at most half of initial vault (${initialVaultNum / 2} SOL). ` +
        `Either reduce max bet to ${(initialVaultNum / 2).toFixed(2)} SOL or increase vault to ${(maxBetNum * 2).toFixed(2)} SOL.`
      );
      return;
    }

    // Check wallet balance
    try {
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;
      const requiredSOL = initialVaultNum + 0.05; // vault + buffer for fees/rent
      
      if (balanceSOL < requiredSOL) {
        toast.error(
          `Insufficient balance. You have ${balanceSOL.toFixed(4)} SOL but need at least ${requiredSOL.toFixed(2)} SOL ` +
          `(${initialVaultNum} SOL for vault + 0.05 SOL for fees/rent)`
        );
        return;
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      toast.error('Failed to check wallet balance');
      return;
    }

    setIsInitializing(true);
    const toastId = toast.loading('Initializing casino...');

    try {
      // Convert SOL to lamports
      const minBetLamports = new BN(minBetNum * LAMPORTS_PER_SOL);
      const maxBetLamports = new BN(maxBetNum * LAMPORTS_PER_SOL);
      const initialVaultLamports = new BN(initialVaultNum * LAMPORTS_PER_SOL);

      console.log('🎰 Initializing casino with:');
      console.log('  Min Bet:', minBetNum, 'SOL');
      console.log('  Max Bet:', maxBetNum, 'SOL');
      console.log('  Initial Vault:', initialVaultNum, 'SOL');
      console.log('  Casino PDA:', getCasinoPDA.pda.toString());
      console.log('  Vault PDA:', getVaultPDA.pda.toString());

      // Build transaction
      const tx = await program.methods
        .initialize(minBetLamports, maxBetLamports, initialVaultLamports)
        .accounts({
          casino: getCasinoPDA.pda,
          vault: getVaultPDA.pda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      // Simulate first
      console.log('🔍 Simulating transaction...');
      try {
        const simulation = await connection.simulateTransaction(tx);
        if (simulation.value.err) {
          console.error('❌ Simulation failed:', simulation.value.err);
          console.error('Logs:', simulation.value.logs);
          throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        console.log('✅ Simulation successful');
      } catch (simError: any) {
        console.error('❌ Simulation error:', simError);
        throw new Error(`Transaction simulation failed: ${simError.message}`);
      }

      // Send transaction
      const signature = await wallet.sendTransaction(tx, connection);
      console.log('📤 Transaction sent:', signature);

      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('✅ Casino initialized! Tx:', signature);
      toast.success('Casino initialized successfully!', { id: toastId });

      // Refresh status
      await checkInitialization();
    } catch (error: any) {
      console.error('❌ Initialize error:', error);
      toast.error(
        `Failed to initialize: ${error.message || 'Unknown error'}`,
        { id: toastId }
      );
    } finally {
      setIsInitializing(false);
    }
  };

  // If still checking, show loading
  if (isInitialized === null) {
    return (
      <div className="glass-effect rounded-xl shadow-glow p-6 mb-8">
        <p className="text-[var(--text-secondary)]">Checking casino status...</p>
      </div>
    );
  }

  // If already initialized, show success message
  if (isInitialized) {
    return (
      <div className="glass-effect border-2 border-[var(--success)] rounded-xl p-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-[var(--success)]">Casino is initialized and ready!</p>
            <p className="text-sm text-[var(--text-secondary)]">You can now place bets.</p>
          </div>
        </div>
      </div>
    );
  }

  // If not initialized, show initialize form
  return (
    <div className="glass-effect border-2 border-[var(--warning)] rounded-xl p-6 mb-8">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl">⚠️</span>
        <div>
          <h3 className="text-xl font-bold text-[var(--warning)] mb-1">
            Casino Not Initialized
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            The casino needs to be initialized before players can place bets. Only the authority wallet can initialize the casino.
          </p>
        </div>
      </div>

      {!wallet.connected ? (
        <p className="text-[var(--text-secondary)] font-medium">
          Please connect your wallet to initialize the casino.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Min Bet (SOL)
              </label>
              <input
                type="number"
                step="0.01"
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
                className="w-full px-3 py-2 glass-effect rounded-lg text-[var(--text-primary)] focus:border-[var(--warning)] transition-all"
                disabled={isInitializing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Max Bet (SOL)
              </label>
              <input
                type="number"
                step="0.1"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                className="w-full px-3 py-2 glass-effect rounded-lg text-[var(--text-primary)] focus:border-[var(--warning)] transition-all"
                disabled={isInitializing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Initial Vault (SOL)
              </label>
              <input
                type="number"
                step="1"
                value={initialVault}
                onChange={(e) => setInitialVault(e.target.value)}
                className="w-full px-3 py-2 glass-effect rounded-lg text-[var(--text-primary)] focus:border-[var(--warning)] transition-all"
                disabled={isInitializing}
              />
            </div>
          </div>

          <button
            onClick={initializeCasino}
            disabled={isInitializing}
            className="w-full bg-[var(--warning)] hover:opacity-90 disabled:opacity-50 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isInitializing ? (
              <>
                <span className="animate-spin">⏳</span>
                Initializing...
              </>
            ) : (
              <>
                <span>🎰</span>
                Initialize Casino
              </>
            )}
          </button>

          <p className="text-xs text-[var(--text-secondary)]">
            This will create the casino account and fund the vault with {initialVault} SOL.
            Make sure you have enough SOL in your wallet.
          </p>
        </div>
      )}
    </div>
  );
};





