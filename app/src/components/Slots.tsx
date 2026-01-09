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
import { SlotsView } from '../games/slots/SlotsView';
import { RoundStatus } from '../games/common/RoundStatus';
import { outcomeToSymbols } from '../games/slots/slotsSymbols';
import { 
  calcSlotsPayoutLamports, 
  formatLamportsToSol, 
  getSlotsWinProbability, 
  getSlotsPayoutMultiplier 
} from '../utils/format';
import slotsIcon from '../assets/game-icons/slots.png';

function solToLamportsBn(sol: string): BN {
  const s = (sol || '').trim();
  if (!s) return new BN(0);
  const normalized = s.startsWith('.') ? `0${s}` : s;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return new BN(0);
  const [whole, fracRaw = ''] = normalized.split('.');
  const frac = (fracRaw + '000000000').slice(0, 9);
  return new BN(whole || '0').mul(new BN(1_000_000_000)).add(new BN(frac || '0'));
}

export const Slots: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { placeBet, isPlacingBet } = useBet();
  const { fetchCasino, fetchVaultBalance, fetchSessionByPubkey } = useCasino();
  const { reportGameResultFromLamports } = useLeaderboard();
  const { fulfillRandomness, isFulfilling } = useFulfillRandomness();
  
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
    };
    resolveTxSignature?: string;
  }>({
    betAmount: '0',
    choice: 0, // Slots doesn't use choice
  });

  // Cancels any in-flight polling loop when the user closes the modal or starts a new round
  const pollTokenRef = useRef(0);

  // Load casino data
  useEffect(() => {
    if (publicKey) {
      loadCasinoData();
      checkAuthority();
      const interval = setInterval(loadCasinoData, 10000);
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

    // Validation 5: Player balance
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
      choice: 0, // Slots doesn't use choice
    });

    // Place bet (choice=0 for slots, it's unused)
    const betResult = await placeBet('slots', 0, amountInLamports);
    
    if (!betResult) {
      setIsRoundInProgress(false);
      setModalOpen(false);
      return;
    }

    // Move to settling step - relayer will resolve
    setModalStep('flipping');
    setModalData(prev => ({
      ...prev,
      betTxSignature: betResult.betTx,
      sessionPubkey: betResult.sessionPda,
      playerPubkey: publicKey!.toBase58(),
    }));

    // Poll for result (relayer settles automatically)
    const pollForResult = async () => {
      const myPollToken = ++pollTokenRef.current;
      for (let i = 0; i < 90; i++) { // 90 iterations × 500ms = 45 seconds max
        if (pollTokenRef.current !== myPollToken) return; // cancelled
        await new Promise(resolve => setTimeout(resolve, 500)); // Poll every 500ms
        
        try {
          const session = await fetchSessionByPubkey(new PublicKey(betResult.sessionPda));
          if (session && session.account.result) {
            console.log('✅ Slots game settled! Result:', session.account.result);
            
            setModalData(prev => ({
              ...prev,
              result: {
                outcome: session.account.result.outcome,
                isWin: session.account.result.isWin,
                payout: session.account.result.payout,
                payoutClaimed: session.account.result.payoutClaimed,
              },
            }));
            setModalStep('result');
            setIsRoundInProgress(false);
            
            // Report result to leaderboard (non-blocking)
            if (publicKey) {
              reportGameResultFromLamports(
                publicKey.toBase58(),
                betResult.betTx,
                'slots',
                modalData.betAmount,
                session.account.result.payout,
                session.account.result.isWin,
                { outcome: session.account.result.outcome }
              ).catch(err => console.warn('Failed to report to leaderboard:', err));
            }
            
            return;
          }
        } catch (fetchError) {
          // Transient fetch error (e.g., network, RPC rate limit) - continue polling
          console.warn('Polling fetch error (will retry):', fetchError);
        }
      }
      
      if (pollTokenRef.current === myPollToken) {
        toast.error('Game resolution timeout. Check sessions list.');
        setModalOpen(false);
        setIsRoundInProgress(false);
      }
    };

    pollForResult();
  };

  const handleStopWaiting = () => {
    pollTokenRef.current++; // cancel any in-flight poll loop
    setModalOpen(false);
    setIsRoundInProgress(false);
    loadCasinoData();
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
            },
          }));
        }
      }
    } catch (error: any) {
      console.error('Manual resolve error:', error);
      toast.error(error.message || 'Failed to resolve session');
    }
  };

  const betAmountInLamportsStr = solToLamportsBn(betAmount || '0').toString();
  const expectedPayoutLamportsStr = calcSlotsPayoutLamports(betAmountInLamportsStr);
  const expectedPayoutSol = formatLamportsToSol(expectedPayoutLamportsStr);

  const finalSymbols = modalData.result?.outcome !== undefined 
    ? outcomeToSymbols(modalData.result.outcome)
    : undefined;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <div className="glass-effect rounded-2xl shadow-glow-lg p-8">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={slotsIcon} alt="Cyber Slots" className="w-14 h-14 object-contain" />
            <h1 className="text-3xl font-display font-bold text-white">Cyber Slots</h1>
          </div>
          
          {!publicKey ? (
            <div className="text-center">
              <p className="mb-4 text-[var(--text-secondary)]">Connect your wallet to start playing</p>
              <WalletMultiButton />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Slot Machine */}
              <SlotsView
                isSpinning={isRoundInProgress && modalStep === 'flipping'}
                finalSymbols={finalSymbols}
                betAmount={betAmount}
                isWin={modalData.result?.isWin}
                payout={modalData.result?.payout ? formatLamportsToSol(modalData.result.payout) : undefined}
              />

              {/* Round Status (replaces modal for slots) */}
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
                  gameType="slots"
                />
              )}

              {/* Betting Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                    Bet Amount (SOL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isRoundInProgress}
                    className="w-full px-4 py-3 glass-effect rounded-xl text-[var(--text-primary)] font-mono text-lg focus:border-[var(--accent)] transition-all"
                    placeholder="0.1"
                  />
                </div>

                <div className="glass-effect rounded-xl p-4 border border-[var(--border)]">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)] font-medium">💰 You bet:</span>
                      <span className="text-xl font-bold text-[var(--text-primary)]">{betAmount || '0'} SOL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--gold)] font-medium">🎉 Max win:</span>
                      <span className="text-xl font-bold text-[var(--gold)]">{expectedPayoutSol} SOL</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between text-xs text-[var(--text-muted)]">
                      <span>Win chance: <span className="font-semibold text-[var(--accent)]">{getSlotsWinProbability()}</span></span>
                      <span>Max payout: <span className="font-semibold text-[var(--gold)]">{getSlotsPayoutMultiplier()}</span></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={isPlacingBet || isRoundInProgress}
                  className="w-full py-5 rounded-xl font-bold text-xl text-black bg-gradient-to-r from-[var(--gold)] via-[var(--gold-glow)] to-[var(--gold)] hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 animate-pulse-glow"
                >
                  {isPlacingBet || isRoundInProgress ? '🎰 Spinning...' : `🎰 Spin: ${betAmount} SOL`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
