import { FC, useEffect, useRef, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import toast from 'react-hot-toast';
import { useBet } from '../hooks/useBet';
import { useCasino } from '../hooks/useCasino';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useFulfillRandomness } from '../hooks/useFulfillRandomness';
import { CoinFlipView } from '../games/coinflip/CoinFlipView';
import { RoundStatus } from '../games/common/RoundStatus';
import { 
  calcCoinflipPayoutLamports, 
  calcCoinflipMaxBetFromVaultLamports,
  formatLamportsToSol, 
  getCoinflipWinProbability, 
  getCoinflipPayoutMultiplier 
} from '../utils/format';

function solToLamportsBn(sol: string): BN {
  const s = (sol || '').trim();
  if (!s) return new BN(0);

  // Allow "0.1", "1", ".5"
  const normalized = s.startsWith('.') ? `0${s}` : s;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return new BN(0);

  const [whole, fracRaw = ''] = normalized.split('.');
  // Pad / truncate to 9 decimals (lamports)
  const frac = (fracRaw + '000000000').slice(0, 9);

  const wholeBn = new BN(whole || '0');
  const fracBn = new BN(frac || '0');

  return wholeBn.mul(new BN(1_000_000_000)).add(fracBn);
}

export const CoinFlip: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { placeBet, isPlacingBet } = useBet();
  const { fetchCasino, fetchVaultBalance, fetchSessionByPubkey } = useCasino();
  const { reportGameResultFromLamports } = useLeaderboard();
  const { fulfillRandomness, isFulfilling } = useFulfillRandomness();
  
  const [choice, setChoice] = useState<0 | 1>(0);
  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [casinoConfig, setCasinoConfig] = useState<any>(null);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [playerBalance, setPlayerBalance] = useState<number>(0);
  const [isRoundInProgress, setIsRoundInProgress] = useState(false);
  const [isAuthority, setIsAuthority] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'submitting' | 'flipping' | 'result'>('submitting');
  const [modalData, setModalData] = useState<{
    betAmount: string;
    choice: number;
    betTxSignature?: string;
    sessionPubkey?: string;
    playerPubkey?: string;
    result?: {
      outcome: number;
      isWin: boolean;
      payout: string;
      payoutClaimed: boolean;
    };
    resolveTxSignature?: string;
  }>({
    betAmount: '0',
    choice: 0,
  });

  // Cancels any in-flight polling loop when the user closes the modal or starts a new round
  const pollTokenRef = useRef(0);

  // Load casino config and balances
  useEffect(() => {
    if (publicKey) {
      loadCasinoData();
      checkAuthority();
      const interval = setInterval(loadCasinoData, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  const checkAuthority = async () => {
    if (!publicKey) {
      setIsAuthority(false);
      return;
    }
    
    try {
      const casino = await fetchCasino();
      if (casino && casino.authority.toBase58() === publicKey.toBase58()) {
        setIsAuthority(true);
      } else {
        setIsAuthority(false);
      }
    } catch (error) {
      setIsAuthority(false);
    }
  };

  const loadCasinoData = async () => {
    try {
      const casino = await fetchCasino();
      const vault = await fetchVaultBalance();
      const player = publicKey ? await connection.getBalance(publicKey) : 0;
      setCasinoConfig(casino);
      setVaultBalance(vault);
      setPlayerBalance(player);
    } catch (error) {
      console.error('Error loading casino data:', error);
    }
  };

  const handlePlaceBet = async () => {
    const amountInLamports = solToLamportsBn(betAmount);
    
    // Validation 1: Non-zero bet
    if (amountInLamports.lte(new BN(0))) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    // Validation 2: Casino initialized
    if (!casinoConfig) {
      toast.error('Casino not initialized. Please initialize it first.');
      return;
    }

    // Validation 3: Min bet
    const minBet = new BN(casinoConfig.minBet.toString());
    if (amountInLamports.lt(minBet)) {
      toast.error(`Bet amount must be at least ${(minBet.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      return;
    }

    // Validation 4: Max bet
    const maxBet = new BN(casinoConfig.maxBet.toString());
    if (amountInLamports.gt(maxBet)) {
      toast.error(`Bet amount cannot exceed ${(maxBet.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      return;
    }

    // Validation 5: Vault liquidity (match on-chain: vault_balance >= potential_payout)
    const maxAllowedBetStr = calcCoinflipMaxBetFromVaultLamports(vaultBalance.toString());
    const maxAllowedBet = new BN(maxAllowedBetStr);
    if (maxAllowedBet.eq(new BN(0))) {
      toast.error('Casino vault is out of liquidity (likely drained for testing). Fund the vault in the Operator panel to enable bets.');
      return;
    }
    if (amountInLamports.gt(maxAllowedBet)) {
      toast.error(`Insufficient vault liquidity. Max bet: ${formatLamportsToSol(maxAllowedBetStr)} SOL`);
      return;
    }

    // Validation 6: Player balance
    if (amountInLamports.gt(new BN(playerBalance))) {
      toast.error(`Insufficient balance. You have ${(playerBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      return;
    }

    // Start the game round
    setIsRoundInProgress(true);
    setModalOpen(true);
    setModalStep('submitting');
    setModalData({
      betAmount: amountInLamports.toString(),
      choice,
    });

    // Place bet
    const betResult = await placeBet('coinflip', choice, amountInLamports);
    
    if (!betResult) {
      // Bet failed
      setModalOpen(false);
      setIsRoundInProgress(false);
      return;
    }

    // Bet placed successfully - show flipping state
    setModalStep('flipping');
    setModalData(prev => ({
      ...prev,
      betTxSignature: betResult.betTx,
      sessionPubkey: betResult.sessionPda,
      playerPubkey: publicKey!.toBase58(),
    }));

    // Relayer mode: players never sign a resolve transaction.
    // We just poll until the session is resolved on-chain by the authority relayer.
    console.log('⏳ Waiting for relayer to settle session:', betResult.sessionPda);
    const startedAt = Date.now();
    const timeoutMs = 45_000;
    let didResolve = false;
    const myPollToken = ++pollTokenRef.current;

    while (Date.now() - startedAt < timeoutMs) {
      if (pollTokenRef.current !== myPollToken) break; // cancelled

      // Poll every 500ms to catch session before relayer closes it (relayer settles very fast)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const found = await fetchSessionByPubkey(new PublicKey(betResult.sessionPda));
        if (found?.account?.result) {
          const actualBetAmountLamports = amountInLamports.toString();
          const payoutLamports = found.account.result.payout;
          setModalStep('result');
          setModalData(prev => ({
            ...prev,
            betAmount: actualBetAmountLamports,
            result: {
              outcome: found.account.result.outcome,
              isWin: found.account.result.isWin,
              payout: payoutLamports,
              payoutClaimed: found.account.result.payoutClaimed,
            },
          }));
          didResolve = true;
          
          // Report result to leaderboard (non-blocking)
          if (publicKey) {
            reportGameResultFromLamports(
              publicKey.toBase58(),
              betResult.betTx,
              'coinflip',
              actualBetAmountLamports,
              payoutLamports,
              found.account.result.isWin,
              { choice, outcome: found.account.result.outcome }
            ).catch(err => console.warn('Failed to report to leaderboard:', err));
          }
          
          break;
        }
      } catch (fetchError) {
        // Transient fetch error (e.g., network, RPC rate limit) - continue polling
        console.warn('Polling fetch error (will retry):', fetchError);
      }
    }

    // If timeout, allow user to close and check sessions list
    if (!didResolve && pollTokenRef.current === myPollToken) {
      toast('Still settling... check Session List in a few seconds.', { icon: '⏳' });
      setModalOpen(false);
    }

    setIsRoundInProgress(false);
    
    // Refresh data after round
    setTimeout(loadCasinoData, 2000);
  };

  const handleStopWaiting = () => {
    pollTokenRef.current++; // cancel any in-flight poll loop
    setModalOpen(false);
    setIsRoundInProgress(false);
    // Refresh sessions
    setTimeout(loadCasinoData, 1000);
  };

  const handleManualResolve = async () => {
    if (!modalData.sessionPubkey || !modalData.playerPubkey) {
      toast.error('Session information missing');
      return;
    }
    
    try {
      const sessionPk = new PublicKey(modalData.sessionPubkey);
      const playerPk = new PublicKey(modalData.playerPubkey);
      
      const result = await fulfillRandomness(sessionPk, playerPk);
      if (result) {
        toast.success('Session manually resolved!');
        // Re-check the session
        const session = await fetchSessionByPubkey(sessionPk);
        if (session?.account?.result) {
          setModalStep('result');
          setModalData(prev => ({
            ...prev,
            result: {
              outcome: session.account.result.outcome,
              isWin: session.account.result.isWin,
              payout: session.account.result.payout,
              payoutClaimed: session.account.result.payoutClaimed,
            },
          }));
        }
      }
    } catch (error: any) {
      console.error('Manual resolve error:', error);
      toast.error(error.message || 'Failed to resolve session');
    }
  };

  const betAmountInLamportsBn = solToLamportsBn(betAmount || '0');
  const betAmountInLamportsStr = betAmountInLamportsBn.toString();
  const expectedPayoutLamportsStr = calcCoinflipPayoutLamports(betAmountInLamportsStr);
  const expectedPayoutSol = formatLamportsToSol(expectedPayoutLamportsStr);
  const maxBetFromVaultLamportsStr = calcCoinflipMaxBetFromVaultLamports(vaultBalance.toString());

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-effect rounded-2xl shadow-glow-lg p-8">
          <h1 className="text-4xl font-bold text-center mb-8 gradient-text">🪙 CoinFlip</h1>
          
          {!publicKey ? (
            <div className="text-center">
              <p className="mb-4 text-[var(--text-secondary)]">Connect your wallet to start playing</p>
              <WalletMultiButton />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Coin Flip View */}
              <CoinFlipView
                isFlipping={isRoundInProgress && modalStep === 'flipping'}
                choice={choice}
                result={modalData.result?.outcome}
                isWin={modalData.result?.isWin}
              />

              {/* Round Status */}
              {isRoundInProgress && (
                <RoundStatus
                  step={modalStep}
                  betAmount={modalData.betAmount}
                  betTxSignature={modalData.betTxSignature}
                  result={modalData.result}
                  onStopWaiting={handleStopWaiting}
                  isAuthority={isAuthority}
                  onManualResolve={handleManualResolve}
                  isFulfilling={isFulfilling}
                  sessionPubkey={modalData.sessionPubkey}
                  playerPubkey={modalData.playerPubkey}
                  gameType="coinflip"
                />
              )}

              {/* Choice Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-[var(--text-primary)]">
                  Choose Your Side
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setChoice(0)}
                    disabled={isRoundInProgress}
                    className={`p-6 glass-effect rounded-xl border-2 transition-all ${
                      isRoundInProgress ? 'opacity-50 cursor-not-allowed' :
                      choice === 0
                        ? 'border-[var(--accent)] bg-gradient-to-br from-[var(--accent-glow)] to-[var(--card)]'
                        : 'border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <div className="text-4xl mb-2">🪙</div>
                    <div className="font-semibold text-[var(--text-primary)]">Heads</div>
                    <div className="text-sm text-[var(--text-secondary)]">(0)</div>
                  </button>
                  <button
                    onClick={() => setChoice(1)}
                    disabled={isRoundInProgress}
                    className={`p-6 glass-effect rounded-xl border-2 transition-all ${
                      isRoundInProgress ? 'opacity-50 cursor-not-allowed' :
                      choice === 1
                        ? 'border-[var(--secondary)] bg-gradient-to-br from-[var(--secondary-glow)] to-[var(--card)]'
                        : 'border-[var(--border)] hover:border-[var(--secondary)]'
                    }`}
                  >
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="font-semibold text-[var(--text-primary)]">Tails</div>
                    <div className="text-sm text-[var(--text-secondary)]">(1)</div>
                  </button>
                </div>
              </div>

              {/* Bet Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--text-primary)]">
                  Bet Amount (SOL)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full px-4 py-3 glass-effect rounded-xl text-[var(--text-primary)] font-mono text-lg focus:border-[var(--accent)] transition-all"
                  placeholder="0.1"
                  disabled={isRoundInProgress}
                />
              </div>

              {/* Payout Display */}
              <div className="glass-effect rounded-xl p-4 border border-[var(--border)]">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-secondary)] font-medium">💰 You bet:</span>
                    <span className="text-xl font-bold text-[var(--text-primary)]">{betAmount || '0'} SOL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--success)] font-medium">🎉 If you win:</span>
                    <span className="text-xl font-bold text-[var(--success)]">{expectedPayoutSol} SOL</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between text-xs text-[var(--text-muted)]">
                    <span>Win chance: <span className="font-semibold text-[var(--accent)]">{getCoinflipWinProbability()}</span></span>
                    <span>Payout: <span className="font-semibold text-[var(--accent)]">{getCoinflipPayoutMultiplier()}</span></span>
                  </div>
                </div>
              </div>

              {/* Place Bet Button */}
              <button
                onClick={handlePlaceBet}
                disabled={isRoundInProgress}
                className="w-full py-5 rounded-xl font-bold text-xl text-white bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isRoundInProgress ? '🪙 Flipping...' : `🪙 Flip: ${betAmount} SOL on ${choice === 0 ? 'Heads' : 'Tails'}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
