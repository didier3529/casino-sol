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
        <div className="text-center py-12">
          <p className="text-white/40 font-body">No players yet. Be the first to play!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Rank</th>
                <th className="text-left py-3 px-4 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Player</th>
                <th className="text-right py-3 px-4 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Net Profit</th>
                <th className="text-right py-3 px-4 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Games</th>
                <th className="text-right py-3 px-4 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.walletAddress}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-display font-semibold text-white">#{entry.rank}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-white/70">
                      {formatWallet(entry.walletAddress)}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold text-sm ${getProfitColor(entry.netProfit)}`}>
                    {formatProfit(entry.netProfit)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-white/60 font-mono">
                    {entry.totalGames}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-white/60 font-mono">
                    {entry.winRate.toFixed(1)}%
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
