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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial leaderboard data
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
    // Fetch initial data
    fetchLeaderboard();

    // Setup Socket.IO connection for live updates
    const socketInstance = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to leaderboard socket');
      setConnected(true);
      
      // Subscribe to leaderboard updates
      socketInstance.emit('subscribe:leaderboard');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from leaderboard socket');
      setConnected(false);
    });

    socketInstance.on('subscribed', (data) => {
      console.log('Subscribed to leaderboard:', data);
    });

    // Listen for leaderboard updates
    socketInstance.on('leaderboard:update', (data) => {
      console.log('Leaderboard update received:', data);
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

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
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
    if (profit > 0) return 'text-[var(--success)]';
    if (profit < 0) return 'text-[var(--error)]';
    return 'text-[var(--text-secondary)]';
  };

  const formatRank = (rank: number): string => `#${rank}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div>
      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
          {/* Status row - centered */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />
              <span className="text-xs text-slate-500 font-semibold">{connected ? 'Live' : 'Offline'}</span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-slate-600">Updated {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
          
          {/* Empty state message */}
          <p className="text-slate-500 text-center">No players yet. Be the first to play!</p>
        </div>
      ) : (
        <>
          {/* Status row (compact; parent card provides header) */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />
              <span className="text-xs text-slate-500 font-semibold">{connected ? 'Live' : 'Offline'}</span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-slate-600">Updated {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
          
          {/* Leaderboard table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-200">
                  Rank
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-200">
                  Player
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-200">
                  Net Profit
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-200">
                  Games
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-200">
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.walletAddress}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-semibold text-slate-200">{formatRank(entry.rank)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-slate-200">
                      {formatWallet(entry.walletAddress)}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${getProfitColor(entry.netProfit)}`}>
                    {formatProfit(entry.netProfit)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-200">
                    {entry.totalGames}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-200">
                    {entry.winRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
};



