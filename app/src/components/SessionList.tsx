import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useBet } from '../hooks/useBet';
import { useFulfillRandomness } from '../hooks/useFulfillRandomness';
import { useVrfResolve } from '../hooks/useVrfResolve';
import { useCasino } from '../hooks/useCasino';
import { formatLamportsToSol, shortPubkey } from '../utils/format';

const SESSION_EXPIRY_SECONDS = 3600; // 1 hour

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
      // Refresh sessions after successful resolution
      await loadSessions();
    }
  };

  const handleRefund = async (sessionPubkey: string, playerPubkey: string) => {
    const result = await refundExpired(
      new PublicKey(sessionPubkey),
      new PublicKey(playerPubkey)
    );
    if (result) {
      // Refresh sessions after successful refund
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

  // Update current time every second for countdown
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="glass-effect rounded-2xl shadow-glow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">📜 Your Game Sessions</h2>
          <button
            onClick={loadSessions}
            disabled={isFetchingSessions}
            className="px-4 py-2 glass-effect rounded-lg hover:border-[var(--accent)] transition-all text-sm font-semibold text-[var(--text-primary)] disabled:opacity-50"
          >
            {isFetchingSessions ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 glass-effect rounded-lg border border-[var(--border)]">
          <div className="flex items-start gap-2">
            <span className="text-xl">⏰</span>
            <div className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Session Expiry:</strong> Pending bets expire after 1 hour. 
              If a session expires before being resolved, you can click <strong className="text-[var(--warning)]">Refund</strong> to get your bet back.
            </div>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-8">
            No sessions found. Place your first bet above!
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.publicKey}
                className="glass-effect border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] transition-colors"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-[var(--text-secondary)]">Game ID</div>
                    <div className="font-semibold text-[var(--text-primary)]">#{session.account.gameId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-secondary)]">Your Choice</div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {session.account.choice === 0 ? '🪙 Heads' : '🎯 Tails'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-secondary)]">Bet Amount</div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {formatLamportsToSol(session.account.betAmount)} SOL
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-secondary)]">Status</div>
                    <div className="flex items-center gap-2">
                      {session.account.status.pending && (() => {
                        const timeLeft = getTimeRemaining(session.account.createdAt);
                        return (
                          <>
                            <div className="flex flex-col gap-1">
                              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                timeLeft.expired ? 'bg-[var(--error-glow)] text-[var(--error)]' : 'bg-[var(--warning-glow)] text-[var(--warning)]'
                              }`}>
                                {timeLeft.expired ? '⏰ Expired' : '⏳ Pending'}
                              </span>
                              {!timeLeft.expired && (
                                <span className="text-xs text-[var(--text-muted)]">
                                  {timeLeft.minutes}m {timeLeft.seconds}s left
                                </span>
                              )}
                            </div>
                            {publicKey && !timeLeft.expired && casinoAuthority === publicKey.toBase58() && (
                              <button
                                onClick={() => handleResolve(session.publicKey, session.account.player)}
                                disabled={isFulfilling}
                                className="px-2 py-1 text-xs font-semibold rounded bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
                                title="Manual resolve (casino authority only)"
                              >
                                {isFulfilling ? 'Resolving...' : 'Resolve'}
                              </button>
                            )}
                            {publicKey && timeLeft.expired && (
                              <button
                                onClick={() => handleRefund(session.publicKey, session.account.player)}
                                disabled={isRefunding}
                                className="px-2 py-1 text-xs font-semibold rounded bg-[var(--secondary)] text-white hover:opacity-90 disabled:opacity-50 transition-all"
                                title="Refund your bet (session expired)"
                              >
                                {isRefunding ? 'Refunding...' : 'Refund'}
                              </button>
                            )}
                          </>
                        );
                      })()}
                      {session.account.status.resolved && session.account.result && (
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          session.account.result.isWin
                            ? 'bg-[var(--success-glow)] text-[var(--success)]'
                            : 'bg-[var(--error-glow)] text-[var(--error)]'
                        }`}>
                          {session.account.result.isWin ? '✅ WIN' : '❌ LOSS'}
                        </span>
                      )}
                      {session.account.status.expired && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-[var(--card)] text-[var(--text-secondary)]">
                          🔒 Expired (Refunded)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {session.account.result && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--text-secondary)]">Outcome</div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {session.account.result.outcome === 0 ? '🪙 Heads' : '🎯 Tails'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)]">Payout</div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {formatLamportsToSol(session.account.result.payout)} SOL
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-secondary)]">Session</div>
                        <div className="font-mono text-xs truncate text-[var(--text-muted)]" title={session.publicKey}>
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
    </div>
  );
};

