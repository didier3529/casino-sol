import { FC, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  netProfit: number;
  totalGames: number;
  totalWins: number;
  winRate: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const Leaderboard: FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leaderboard?limit=100`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setLeaderboard(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    const socketInstance = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      socketInstance.emit('subscribe:leaderboard');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('leaderboard:update', (data) => {
      if (data.data) {
        setLeaderboard(data.data);
        setLastUpdate(new Date(data.timestamp));
      }
    });

    socketInstance.on('leaderboard:data', (data) => {
      if (data.data) {
        setLeaderboard(data.data);
        setLastUpdate(new Date(data.timestamp));
      }
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.emit('unsubscribe:leaderboard');
        socketInstance.disconnect();
      }
    };
  }, [fetchLeaderboard]);

  const formatWallet = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatProfit = (profit: number): string => {
    const sign = profit >= 0 ? '+' : '';
    return `${sign}${profit.toFixed(4)} SOL`;
  };

  const getProfitColor = (profit: number): string => {
    if (profit > 0) return 'text-success';
    if (profit < 0) return 'text-error';
    return 'text-white/50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-white/20'}`} />
          <span className="text-xs text-white/40 font-display">{connected ? 'Live' : 'Offline'}</span>
        </div>
        {lastUpdate && (
          <span className="text-xs text-white/30 font-body">Updated {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-background-secondary/50 to-background-tertiary/50 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-gold/5 opacity-50"></div>
          <div className="relative flex flex-col items-center justify-center text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(58, 243, 224, 0.1) 0%, rgba(242, 185, 80, 0.1) 100%)',
                border: '1px solid rgba(58, 243, 224, 0.2)',
              }}
            >
              <span className="text-4xl">🏆</span>
            </div>
            <h4 className="text-xl font-display font-bold text-white mb-2">Leaderboard Empty</h4>
            <p className="text-white/40 font-body mb-4 max-w-sm">No players have competed yet. Be the first to play and claim the top spot!</p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <span className="text-xs font-display text-accent">🎮 Start playing to rank up</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-accent/5 via-transparent to-gold/5">
                <th className="text-left py-4 px-5 text-xs font-display font-bold text-accent uppercase tracking-wider">Rank</th>
                <th className="text-left py-4 px-5 text-xs font-display font-bold text-white/60 uppercase tracking-wider">Player</th>
                <th className="text-right py-4 px-5 text-xs font-display font-bold text-white/60 uppercase tracking-wider">Net Profit</th>
                <th className="text-right py-4 px-5 text-xs font-display font-bold text-white/60 uppercase tracking-wider">Games</th>
                <th className="text-right py-4 px-5 text-xs font-display font-bold text-white/60 uppercase tracking-wider">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.walletAddress}
                  className={`border-b border-white/[0.03] hover:bg-white/[0.03] transition-all duration-200 ${
                    entry.rank === 1 ? 'bg-gradient-to-r from-gold/10 via-gold/5 to-transparent' :
                    entry.rank === 2 ? 'bg-gradient-to-r from-white/5 via-white/[0.02] to-transparent' :
                    entry.rank === 3 ? 'bg-gradient-to-r from-amber-700/10 via-amber-700/5 to-transparent' : ''
                  }`}
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      {entry.rank === 1 && <span className="text-lg">🥇</span>}
                      {entry.rank === 2 && <span className="text-lg">🥈</span>}
                      {entry.rank === 3 && <span className="text-lg">🥉</span>}
                      <span className={`text-sm font-display font-bold ${
                        entry.rank === 1 ? 'text-gold' :
                        entry.rank === 2 ? 'text-white/80' :
                        entry.rank === 3 ? 'text-amber-600' : 'text-white/60'
                      }`}>#{entry.rank}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: entry.rank <= 3 
                            ? 'linear-gradient(135deg, rgba(58, 243, 224, 0.2), rgba(242, 185, 80, 0.2))'
                            : 'rgba(255,255,255,0.05)',
                          border: entry.rank <= 3 ? '1px solid rgba(58, 243, 224, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {entry.walletAddress.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-mono text-sm text-white/70">
                        {formatWallet(entry.walletAddress)}
                      </span>
                    </div>
                  </td>
                  <td className={`py-4 px-5 text-right font-mono font-bold text-sm ${getProfitColor(entry.netProfit)}`}>
                    {formatProfit(entry.netProfit)}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-sm text-white/60 font-mono">
                      {entry.totalGames}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span className={`px-2 py-1 rounded-md text-sm font-mono font-semibold ${
                      entry.winRate >= 60 ? 'bg-success/10 text-success' :
                      entry.winRate >= 40 ? 'bg-gold/10 text-gold' : 'bg-error/10 text-error'
                    }`}>
                      {entry.winRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
