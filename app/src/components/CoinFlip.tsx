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
import { Wallet } from 'lucide-react';
import coinflipIcon from '../assets/game-icons/coinflip.png';

function solToLamportsBn(sol: string): BN {
  const s = (sol || '').trim();
  if (!s) return new BN(0);

  const normalized = s.startsWith('.') ? `0${s}` : s;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return new BN(0);

  const [whole, fracRaw = ''] = normalized.split('.');
  const frac = (fracRaw + '000000000').slice(0, 9);

  const wholeBn = new BN(whole || '0');
  const fracBn = new BN(frac || '0');

  return wholeBn.mul(new BN(1_000_000_000)).add(fracBn);
}

export const CoinFlip: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { placeBet } = useBet();
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
      payoutClaimed?: boolean;
    };
    resolveTxSignature?: string;
  }>({
    betAmount: '0',
    choice: 0,
  });

  const pollTokenRef = useRef(0);

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
      if (casino && (casino as any).authority?.toBase58() === publicKey.toBase58()) {
        setIsAuthority(true);
      } else {
        setIsAuthority(false);
      }
    } catch {
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
    
    if (amountInLamports.lte(new BN(0))) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    if (!casinoConfig) {
      toast.error('Casino not initialized. Please initialize it first.');
      return;
    }

    const minBet = new BN(casinoConfig.minBet.toString());
    if (amountInLamports.lt(minBet)) {
      toast.error(`Bet amount must be at least ${(minBet.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      return;
    }

    const maxBet = new BN(casinoConfig.maxBet.toString());
    if (amountInLamports.gt(maxBet)) {
      toast.error(`Bet amount cannot exceed ${(maxBet.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      return;
    }

    const maxAllowedBetStr = calcCoinflipMaxBetFromVaultLamports(vaultBalance.toString());
    const maxAllowedBet = new BN(maxAllowedBetStr);
    if (maxAllowedBet.eq(new BN(0))) {
      toast.error('Casino vault is out of liquidity.');
      return;
    }
    if (amountInLamports.gt(maxAllowedBet)) {
      toast.error(`Insufficient vault liquidity. Max bet: ${formatLamportsToSol(maxAllowedBetStr)} SOL`);
      return;
    }

    if (amountInLamports.gt(new BN(playerBalance))) {
      toast.error(`Insufficient balance. You have ${(playerBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      return;
    }

    setIsRoundInProgress(true);
    setModalStep('submitting');
    setModalData({
      betAmount: amountInLamports.toString(),
      choice,
    });

    const betResult = await placeBet('coinflip', choice, amountInLamports);
    
    if (!betResult) {
      setIsRoundInProgress(false);
      return;
    }

    setModalStep('flipping');
    setModalData(prev => ({
      ...prev,
      betTxSignature: betResult.betTx,
      sessionPubkey: betResult.sessionPda,
      playerPubkey: publicKey!.toBase58(),
    }));

    const startedAt = Date.now();
    const timeoutMs = 45_000;
    let didResolve = false;
    const myPollToken = ++pollTokenRef.current;

    while (Date.now() - startedAt < timeoutMs) {
      if (pollTokenRef.current !== myPollToken) break;

      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const found = await fetchSessionByPubkey(new PublicKey(betResult.sessionPda));
        if (found?.account?.result) {
          const result = found.account.result;
          const actualBetAmountLamports = amountInLamports.toString();
          const payoutLamports = result.payout;
          setModalStep('result');
          setModalData(prev => ({
            ...prev,
            betAmount: actualBetAmountLamports,
            result: {
              outcome: result.outcome,
              isWin: result.isWin,
              payout: payoutLamports,
              payoutClaimed: (result as any).payoutClaimed,
            },
          }));
          didResolve = true;
          
          if (publicKey) {
            reportGameResultFromLamports(
              publicKey.toBase58(),
              betResult.betTx,
              'coinflip',
              actualBetAmountLamports,
              payoutLamports,
              result.isWin,
              { choice, outcome: result.outcome }
            ).catch(err => console.warn('Failed to report to leaderboard:', err));
          }
          
          break;
        }
      } catch (fetchError) {
        console.warn('Polling fetch error (will retry):', fetchError);
      }
    }

    if (!didResolve && pollTokenRef.current === myPollToken) {
      toast('Still settling... check Session List in a few seconds.', { icon: '⏳' });
    }

    setIsRoundInProgress(false);
    setTimeout(loadCasinoData, 2000);
  };

  const handleStopWaiting = () => {
    pollTokenRef.current++;
    setIsRoundInProgress(false);
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
        const session = await fetchSessionByPubkey(sessionPk);
        if (session?.account?.result) {
          const sessionResult = session.account.result;
          setModalStep('result');
          setModalData(prev => ({
            ...prev,
            result: {
              outcome: sessionResult.outcome,
              isWin: sessionResult.isWin,
              payout: sessionResult.payout,
              payoutClaimed: (sessionResult as any).payoutClaimed,
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-8">
        <img src={coinflipIcon} alt="CoinFlip" className="w-14 h-14 object-contain" />
        <h1 className="text-3xl font-display font-bold text-white">CoinFlip</h1>
      </div>
      
      {!publicKey ? (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-accent-muted mb-4">
            <Wallet className="w-7 h-7 text-accent" />
          </div>
          <p className="mb-4 text-white/50 font-body">Connect your wallet to start playing</p>
          <WalletMultiButton />
        </div>
      ) : (
        <div className="space-y-6">
          <CoinFlipView
            isFlipping={isRoundInProgress && modalStep === 'flipping'}
            choice={choice}
            result={modalData.result?.outcome}
            isWin={modalData.result?.isWin}
          />

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

          <div className="space-y-3">
            <label className="block text-sm font-display font-medium text-white/60">
              Choose Your Side
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setChoice(0)}
                disabled={isRoundInProgress}
                className={`p-5 surface-elevated text-center transition-all ${
                  isRoundInProgress ? 'opacity-50 cursor-not-allowed' :
                  choice === 0
                    ? 'border-accent bg-accent-muted'
                    : 'hover:border-accent/30'
                }`}
              >
                <div className="text-3xl mb-2">🪙</div>
                <div className="font-display font-semibold text-white">Heads</div>
              </button>
              <button
                onClick={() => setChoice(1)}
                disabled={isRoundInProgress}
                className={`p-5 surface-elevated text-center transition-all ${
                  isRoundInProgress ? 'opacity-50 cursor-not-allowed' :
                  choice === 1
                    ? 'border-gold bg-gold-muted'
                    : 'hover:border-gold/30'
                }`}
              >
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-display font-semibold text-white">Tails</div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-display font-medium text-white/60">
              Bet Amount (SOL)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-lg focus:border-accent focus:outline-none transition-all"
              placeholder="0.1"
              disabled={isRoundInProgress}
            />
          </div>

          <div className="surface-elevated p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/50 font-body text-sm">You bet:</span>
                <span className="text-lg font-mono font-semibold text-white">{betAmount || '0'} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-success font-body text-sm">If you win:</span>
                <span className="text-lg font-mono font-semibold text-success">{expectedPayoutSol} SOL</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-xs text-white/40 font-body">
                <span>Win chance: <span className="font-semibold text-accent">{getCoinflipWinProbability()}</span></span>
                <span>Payout: <span className="font-semibold text-accent">{getCoinflipPayoutMultiplier()}</span></span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaceBet}
            disabled={isRoundInProgress}
            className="w-full btn-primary py-4 text-lg"
          >
            {isRoundInProgress ? 'Flipping...' : `Flip: ${betAmount} SOL on ${choice === 0 ? 'Heads' : 'Tails'}`}
          </button>
        </div>
      )}
    </div>
  );
};
