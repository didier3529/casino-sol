import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useBet } from '../hooks/useBet';
import { useFulfillRandomness } from '../hooks/useFulfillRandomness';
import { useVrfResolve } from '../hooks/useVrfResolve';
import { useCasino } from '../hooks/useCasino';
import { formatLamportsToSol, shortPubkey } from '../utils/format';
import { Clock, RefreshCw, History } from 'lucide-react';

const SESSION_EXPIRY_SECONDS = 3600;

interface Session {
  publicKey: string;
  account: {
    player: string;
    gameId: string;
    betAmount: string;
    choice: number;
    status: any;
    createdAt: string;
    result?: {
      outcome: number;
      isWin: boolean;
      payout: string;
    };
  };
}

export const SessionList: FC = () => {
  const { publicKey } = useWallet();
  const { fetchSessions, isFetchingSessions } = useBet();
  const { fulfillRandomness, isFulfilling } = useFulfillRandomness();
  const { refundExpired, isRefunding } = useVrfResolve();
  const { fetchCasino } = useCasino();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [casinoAuthority, setCasinoAuthority] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));

  const loadSessions = async () => {
    const fetchedSessions = await fetchSessions();
    setSessions(fetchedSessions as any);
  };

  const loadCasinoAuthority = async () => {
    const casinoData = await fetchCasino();
    if (casinoData) {
      setCasinoAuthority(casinoData.authority.toBase58());
    }
  };

  const handleResolve = async (sessionPubkey: string, playerPubkey: string) => {
    const result = await fulfillRandomness(
      new PublicKey(sessionPubkey),
      new PublicKey(playerPubkey)
    );
    if (result) {
      await loadSessions();
    }
  };

  const handleRefund = async (sessionPubkey: string, playerPubkey: string) => {
    const result = await refundExpired(
      new PublicKey(sessionPubkey),
      new PublicKey(playerPubkey)
    );
    if (result) {
      await loadSessions();
    }
  };

  const getTimeRemaining = (createdAt: string): { total: number; minutes: number; seconds: number; expired: boolean } => {
    const created = parseInt(createdAt);
    const elapsed = currentTime - created;
    const remaining = SESSION_EXPIRY_SECONDS - elapsed;
    
    return {
      total: remaining,
      minutes: Math.floor(Math.max(0, remaining) / 60),
      seconds: Math.max(0, remaining) % 60,
      expired: remaining <= 0,
    };
  };

  useEffect(() => {
    if (publicKey) {
      loadSessions();
      loadCasinoAuthority();
    }
  }, [publicKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!publicKey) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-semibold text-white">Your Game Sessions</h2>
        </div>
        <button
          onClick={loadSessions}
          disabled={isFetchingSessions}
          className="btn-secondary py-2 px-3 text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSessions ? 'animate-spin' : ''}`} />
          {isFetchingSessions ? 'Loading' : 'Refresh'}
        </button>
      </div>

      <div className="surface-elevated p-4 mb-5 flex items-start gap-3">
        <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-white/50 font-body">
          <span className="text-white font-medium">Session Expiry:</span> Pending bets expire after 1 hour. 
          If a session expires, click <span className="text-warning font-medium">Refund</span> to get your bet back.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center text-white/40 py-10 font-body">
          No sessions found. Place your first bet!
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.publicKey}
              className="surface-elevated p-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-white/40 font-body mb-1">Game ID</div>
                  <div className="font-display font-semibold text-white">#{session.account.gameId}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 font-body mb-1">Your Choice</div>
                  <div className="font-display font-medium text-white">
                    {session.account.choice === 0 ? 'Heads' : 'Tails'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 font-body mb-1">Bet Amount</div>
                  <div className="font-mono font-medium text-white">
                    {formatLamportsToSol(session.account.betAmount)} SOL
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 font-body mb-1">Status</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {session.account.status.pending && (() => {
                      const timeLeft = getTimeRemaining(session.account.createdAt);
                      return (
                        <>
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block px-2 py-1 text-xs font-display font-semibold rounded ${
                              timeLeft.expired ? 'bg-error-muted text-error' : 'bg-warning/20 text-warning'
                            }`}>
                              {timeLeft.expired ? 'Expired' : 'Pending'}
                            </span>
                            {!timeLeft.expired && (
                              <span className="text-[10px] text-white/30 font-mono">
                                {timeLeft.minutes}m {timeLeft.seconds}s
                              </span>
                            )}
                          </div>
                          {publicKey && !timeLeft.expired && casinoAuthority === publicKey.toBase58() && (
                            <button
                              onClick={() => handleResolve(session.publicKey, session.account.player)}
                              disabled={isFulfilling}
                              className="px-2 py-1 text-xs font-display font-semibold rounded bg-accent text-black hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                              {isFulfilling ? 'Resolving' : 'Resolve'}
                            </button>
                          )}
                          {publicKey && timeLeft.expired && (
                            <button
                              onClick={() => handleRefund(session.publicKey, session.account.player)}
                              disabled={isRefunding}
                              className="px-2 py-1 text-xs font-display font-semibold rounded bg-gold text-black hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                              {isRefunding ? 'Refunding' : 'Refund'}
                            </button>
                          )}
                        </>
                      );
                    })()}
                    {session.account.status.resolved && session.account.result && (
                      <span className={`inline-block px-2 py-1 text-xs font-display font-semibold rounded ${
                        session.account.result.isWin
                          ? 'bg-success-muted text-success'
                          : 'bg-error-muted text-error'
                      }`}>
                        {session.account.result.isWin ? 'WIN' : 'LOSS'}
                      </span>
                    )}
                    {session.account.status.expired && (
                      <span className="inline-block px-2 py-1 text-xs font-display font-semibold rounded bg-white/5 text-white/40">
                        Refunded
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {session.account.result && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-white/40 font-body mb-1">Outcome</div>
                      <div className="font-display font-medium text-white">
                        {session.account.result.outcome === 0 ? 'Heads' : 'Tails'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 font-body mb-1">Payout</div>
                      <div className="font-mono font-medium text-white">
                        {formatLamportsToSol(session.account.result.payout)} SOL
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 font-body mb-1">Session</div>
                      <div className="font-mono text-xs text-white/40 truncate" title={session.publicKey}>
                        {shortPubkey(session.publicKey, 8, 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
