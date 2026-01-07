import { FC, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { useCasino } from '../hooks/useCasino';
import { OperatorPanel } from '../components/OperatorPanel';
import { isOperatorBuildEnabled, isOperatorPublicKey } from '../utils/operatorGate';
import { 
  Activity, Server, Database, Zap, Clock, AlertCircle, CheckCircle, RefreshCw, Lock,
  TrendingUp, TrendingDown, Users, Wallet, ArrowUpRight, ArrowDownRight, Flame,
  Trophy, DollarSign, BarChart3, ExternalLink
} from 'lucide-react';

interface RecentTransaction {
  id: string;
  wallet: string;
  type: 'bet' | 'win' | 'loss';
  amount: number;
  game: string;
  timestamp: Date;
}

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  netProfit: number;
  totalGames: number;
  totalWins: number;
  winRate: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const DeveloperPage: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { fetchVaultBalance, fetchCasino, getVaultPDA } = useCasino();
  const [showHealthPanel, setShowHealthPanel] = useState(true);
  const [showTreasuryPanel, setShowTreasuryPanel] = useState(true);
  const [showLeaderboardPanel, setShowLeaderboardPanel] = useState(true);
  const [showActivityPanel, setShowActivityPanel] = useState(true);
  const { health, loading: healthLoading, error: healthError, refresh: refreshHealth } = useSystemHealth(true);
  
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [casinoConfig, setCasinoConfig] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentTxs, setRecentTxs] = useState<RecentTransaction[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  const isOperator = isOperatorPublicKey(publicKey) && isOperatorBuildEnabled();

  const fetchBalances = useCallback(async () => {
    setLoadingBalances(true);
    try {
      const vault = await fetchVaultBalance();
      setVaultBalance(vault / LAMPORTS_PER_SOL);
      
      const casino = await fetchCasino();
      setCasinoConfig(casino);
      
      if (casino && (casino as any).treasury) {
        const treasuryBal = await connection.getBalance((casino as any).treasury);
        setTreasuryBalance(treasuryBal / LAMPORTS_PER_SOL);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoadingBalances(false);
    }
  }, [fetchVaultBalance, fetchCasino, connection]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leaderboard?limit=10`);
      const result = await response.json();
      if (result.success && result.data) {
        setLeaderboard(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/recent-games?limit=10`);
      const result = await response.json();
      if (result.success && result.data) {
        setRecentTxs(result.data.map((tx: any) => ({
          id: tx.id || tx.signature,
          wallet: tx.walletAddress || tx.wallet,
          type: tx.isWin ? 'win' : 'loss',
          amount: tx.betAmount || tx.amount,
          game: tx.gameType || 'coinflip',
          timestamp: new Date(tx.createdAt || tx.timestamp),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      setRecentTxs([]);
    }
  }, []);

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
      fetchLeaderboard();
      fetchRecentActivity();
      
      const interval = setInterval(() => {
        fetchBalances();
        fetchLeaderboard();
        fetchRecentActivity();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [publicKey, fetchBalances, fetchLeaderboard, fetchRecentActivity]);

  const formatWallet = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!publicKey) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="glass-card p-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-muted mb-6">
            <Zap className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-3">
            Connect Wallet
          </h2>
          <p className="text-white/50 font-body">
            Connect your wallet to access developer tools and monitoring
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-7 h-7 text-accent" />
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">
            Developer Dashboard
          </h2>
        </div>
        <p className="text-white/50 font-body">
          Real-time casino monitoring, analytics, and operator controls
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-success" />
            <span className="text-xs text-white/50 font-display uppercase tracking-wider">Vault</span>
          </div>
          <div className="text-2xl font-bold text-success font-mono">
            {vaultBalance !== null ? `${vaultBalance.toFixed(4)}` : '---'}
          </div>
          <div className="text-xs text-white/30 font-mono mt-1">SOL</div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-gold" />
            <span className="text-xs text-white/50 font-display uppercase tracking-wider">Treasury</span>
          </div>
          <div className="text-2xl font-bold text-gold font-mono">
            {treasuryBalance !== null ? `${treasuryBalance.toFixed(4)}` : '---'}
          </div>
          <div className="text-xs text-white/30 font-mono mt-1">SOL</div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-xs text-white/50 font-display uppercase tracking-wider">Players</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {leaderboard.length > 0 ? leaderboard.length : '0'}
          </div>
          <div className="text-xs text-white/30 font-mono mt-1">Active</div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-xs text-white/50 font-display uppercase tracking-wider">Total Games</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {leaderboard.reduce((acc, e) => acc + e.totalGames, 0)}
          </div>
          <div className="text-xs text-white/30 font-mono mt-1">Played</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <button
            onClick={() => setShowTreasuryPanel(!showTreasuryPanel)}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gold-muted">
                <DollarSign className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-white mb-0.5">Treasury & Buyback</h3>
                <p className="text-xs text-white/40 font-body">House funds and burn mechanics</p>
              </div>
            </div>
            <div className="text-white/40 transition-transform duration-300" style={{ transform: showTreasuryPanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showTreasuryPanel && (
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="surface-elevated p-4">
                  <div className="text-xs text-white/50 mb-2 font-display">Min Bet</div>
                  <div className="text-lg font-bold text-white font-mono">
                    {casinoConfig?.minBet ? (Number(casinoConfig.minBet) / LAMPORTS_PER_SOL).toFixed(4) : '---'} SOL
                  </div>
                </div>
                <div className="surface-elevated p-4">
                  <div className="text-xs text-white/50 mb-2 font-display">Max Bet</div>
                  <div className="text-lg font-bold text-white font-mono">
                    {casinoConfig?.maxBet ? (Number(casinoConfig.maxBet) / LAMPORTS_PER_SOL).toFixed(4) : '---'} SOL
                  </div>
                </div>
              </div>

              <div className="surface-elevated p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-error" />
                    <span className="text-xs text-white/50 font-display uppercase tracking-wider">Buyback Status</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-success-muted text-success font-display">Ready</span>
                </div>
                <div className="text-sm text-white/60 font-body">
                  Treasury funds are available for buyback and burn operations when token CA is live.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <a
                  href={`https://solscan.io/account/${getVaultPDA.pda.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Vault
                </a>
                <button
                  onClick={fetchBalances}
                  disabled={loadingBalances}
                  className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBalances ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card">
          <button
            onClick={() => setShowActivityPanel(!showActivityPanel)}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent-muted">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-white mb-0.5">Recent Activity</h3>
                <p className="text-xs text-white/40 font-body">Latest transactions and bets</p>
              </div>
            </div>
            <div className="text-white/40 transition-transform duration-300" style={{ transform: showActivityPanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showActivityPanel && (
            <div className="px-5 pb-5">
              {recentTxs.length === 0 ? (
                <div className="text-center py-8 text-white/40 font-body">
                  <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-xs mt-1">Transactions will appear here as players bet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentTxs.map((tx) => (
                    <div key={tx.id} className="surface-elevated p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.type === 'win' ? 'bg-success-muted' : 'bg-error-muted'
                        }`}>
                          {tx.type === 'win' ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-error" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-mono text-white/80">{formatWallet(tx.wallet)}</div>
                          <div className="text-xs text-white/40 capitalize">{tx.game}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono font-semibold ${
                          tx.type === 'win' ? 'text-success' : 'text-error'
                        }`}>
                          {tx.type === 'win' ? '+' : '-'}{tx.amount.toFixed(4)} SOL
                        </div>
                        <div className="text-xs text-white/30">
                          {tx.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <button
          onClick={() => setShowLeaderboardPanel(!showLeaderboardPanel)}
          className="w-full p-5 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gold-muted">
              <Trophy className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-white mb-0.5">Wallet Leaderboard</h3>
              <p className="text-xs text-white/40 font-body">Top players by net profit</p>
            </div>
          </div>
          <div className="text-white/40 transition-transform duration-300" style={{ transform: showLeaderboardPanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showLeaderboardPanel && (
          <div className="px-5 pb-5">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-white/40 font-body">
                <Trophy className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No players yet</p>
                <p className="text-xs mt-1">Leaderboard will populate as players bet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-3 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Rank</th>
                      <th className="text-left py-3 px-3 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Wallet</th>
                      <th className="text-right py-3 px-3 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Net Profit</th>
                      <th className="text-right py-3 px-3 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Games</th>
                      <th className="text-right py-3 px-3 text-xs font-display font-semibold text-white/50 uppercase tracking-wider">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.slice(0, 10).map((entry, idx) => (
                      <tr key={entry.walletAddress} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-gold text-background' :
                            idx === 1 ? 'bg-white/20 text-white' :
                            idx === 2 ? 'bg-amber-700/50 text-amber-200' :
                            'bg-white/5 text-white/50'
                          }`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-sm text-white/70">{formatWallet(entry.walletAddress)}</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-mono text-sm font-semibold flex items-center justify-end gap-1 ${
                            entry.netProfit >= 0 ? 'text-success' : 'text-error'
                          }`}>
                            {entry.netProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {entry.netProfit >= 0 ? '+' : ''}{entry.netProfit.toFixed(4)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-sm text-white/60 font-mono">{entry.totalGames}</td>
                        <td className="py-3 px-3 text-right text-sm text-white/60 font-mono">{entry.winRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-card">
        <button
          onClick={() => setShowHealthPanel(!showHealthPanel)}
          className="w-full p-5 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-muted">
              <Server className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-white mb-0.5">System Health</h3>
              <p className="text-xs text-white/40 font-body">Real-time monitoring and diagnostics</p>
            </div>
            {health && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display font-semibold ${
                health.status === 'healthy' ? 'bg-success-muted text-success' :
                health.status === 'degraded' ? 'bg-warning/20 text-warning' :
                'bg-error-muted text-error'
              }`}>
                {health.status === 'healthy' ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Operational</>
                ) : health.status === 'degraded' ? (
                  <><AlertCircle className="w-3.5 h-3.5" /> Degraded</>
                ) : (
                  <><AlertCircle className="w-3.5 h-3.5" /> Down</>
                )}
              </div>
            )}
          </div>
          <div className="text-white/40 transition-transform duration-300" style={{ transform: showHealthPanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showHealthPanel && (
          <div className="px-5 pb-5 space-y-5">
            {healthLoading && (
              <div className="text-center text-white/40 py-8 flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                <p className="font-mono text-sm">Loading health data...</p>
              </div>
            )}

            {healthError && (
              <div className="p-4 rounded-xl bg-error-muted border border-error/20">
                <div className="flex items-center gap-3 text-error">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-display font-semibold mb-1">Failed to fetch health data</div>
                    <div className="text-sm opacity-80 font-body">{healthError}</div>
                  </div>
                </div>
              </div>
            )}

            {health && !healthLoading && (
              <>
                <div>
                  <h4 className="text-xs font-display font-semibold text-white/60 mb-3 uppercase tracking-wider">Services</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(health.services).map(([service, status]) => {
                      const isHealthy = status === 'connected' || status === 'active';
                      const isDegraded = status === 'inactive';
                      return (
                        <div key={service} className="surface-elevated p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-2 h-2 rounded-full ${
                              isHealthy ? 'bg-success shadow-[0_0_6px_rgba(52,211,153,0.5)]' :
                              isDegraded ? 'bg-warning shadow-[0_0_6px_rgba(251,191,36,0.5)]' :
                              'bg-error shadow-[0_0_6px_rgba(248,113,113,0.5)]'
                            }`} />
                            {isHealthy ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-error" />
                            )}
                          </div>
                          <div className="text-xs text-white/50 mb-1 capitalize font-display">{service}</div>
                          <div className={`text-sm font-mono font-semibold ${
                            isHealthy ? 'text-success' : isDegraded ? 'text-warning' : 'text-error'
                          }`}>
                            {status === 'connected' ? 'Connected' :
                             status === 'active' ? 'Active' :
                             status === 'inactive' ? 'Inactive' : 'Disconnected'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="surface-elevated p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <div className="text-xs text-white/50 font-display uppercase tracking-wider">Uptime</div>
                    </div>
                    <div className="text-xl font-bold text-white font-mono">
                      {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                    </div>
                  </div>

                  <div className="surface-elevated p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-white/40" />
                      <div className="text-xs text-white/50 font-display uppercase tracking-wider">Errors (1h)</div>
                    </div>
                    <div className={`text-xl font-bold font-mono ${
                      health.errors.last_hour === 0 ? 'text-success' :
                      health.errors.last_hour < 5 ? 'text-warning' : 'text-error'
                    }`}>
                      {health.errors.last_hour}
                    </div>
                  </div>

                  <div className="surface-elevated p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-white/40" />
                      <div className="text-xs text-white/50 font-display uppercase tracking-wider">Errors (24h)</div>
                    </div>
                    <div className={`text-xl font-bold font-mono ${
                      health.errors.last_24h === 0 ? 'text-success' :
                      health.errors.last_24h < 20 ? 'text-warning' : 'text-error'
                    }`}>
                      {health.errors.last_24h}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <div className="text-xs text-white/30 font-mono">
                    Auto-refresh: 30s | Response: {health.responseTime || 'N/A'}
                  </div>
                  <button
                    onClick={refreshHealth}
                    className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isOperator && <OperatorPanel />}
      
      {!isOperator && (
        <div className="glass-card p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 mb-4">
            <Lock className="w-7 h-7 text-white/40" />
          </div>
          <div className="text-white/50 text-base font-display font-medium mb-2">
            Operator Controls Require Authorization
          </div>
          <div className="text-white/30 text-sm font-body">
            Connect with an authorized operator wallet to access advanced tools
          </div>
        </div>
      )}
    </div>
  );
};
