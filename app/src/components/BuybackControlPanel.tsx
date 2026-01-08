import { FC, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { isOperatorPublicKey, isOperatorBuildEnabled } from '../utils/operatorGate';
import { 
  Flame, Save, Play, Pause, AlertTriangle, CheckCircle, 
  RefreshCw, History, ExternalLink, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface BuybackConfig {
  id: number;
  token_mint: string;
  pumpfun_mint: string;
  execution_mode: 'pumpfun' | 'jupiter';
  max_spend_per_interval: string;
  interval_seconds: number;
  slippage_bps: number;
  is_active: boolean;
  dry_run: boolean;
  last_run_at: string | null;
}

interface BuybackEvent {
  id: number;
  timestamp: string;
  sol_spent: string;
  token_bought: string;
  token_mint: string;
  transaction_signature: string;
  status: 'success' | 'failed';
  error_message: string | null;
}

interface BuybackStats {
  totalBuybacks: number;
  totalSolSpent: number;
  totalTokensBurned: number;
  lastRunAt: string | null;
}

export const BuybackControlPanel: FC = () => {
  const { publicKey } = useWallet();
  const isOperator = isOperatorPublicKey(publicKey) && isOperatorBuildEnabled();
  
  const [config, setConfig] = useState<BuybackConfig | null>(null);
  const [events, setEvents] = useState<BuybackEvent[]>([]);
  const [stats, setStats] = useState<BuybackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [tokenCA, setTokenCA] = useState('');
  const [maxSpend, setMaxSpend] = useState('0.1');
  const [intervalHours, setIntervalHours] = useState('1');
  const [dryRun, setDryRun] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/buyback/config`);
      const result = await response.json();
      if (result.success && result.data) {
        setConfig(result.data);
        setTokenCA(result.data.pumpfun_mint || result.data.token_mint || '');
        setMaxSpend(result.data.max_spend_per_interval || '0.1');
        setIntervalHours(String(Math.round((result.data.interval_seconds || 3600) / 3600)));
        setDryRun(result.data.dry_run ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch buyback config:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/buyback/events?limit=10`);
      const result = await response.json();
      if (result.success && result.data) {
        setEvents(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch buyback events:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/buyback/stats`);
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch buyback stats:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConfig(), fetchEvents(), fetchStats()]);
    setLoading(false);
  }, [fetchConfig, fetchEvents, fetchStats]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const saveConfig = async () => {
    if (!tokenCA.trim()) {
      toast.error('Please enter a valid Contract Address');
      return;
    }

    setSaving(true);
    try {
      const updates = {
        pumpfun_mint: tokenCA.trim(),
        token_mint: tokenCA.trim(),
        execution_mode: 'pumpfun',
        max_spend_per_interval: maxSpend,
        interval_seconds: parseInt(intervalHours) * 3600,
        dry_run: dryRun,
      };

      const response = await fetch(`${BACKEND_URL}/api/admin/buyback/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Buyback config saved!');
        await fetchConfig();
      } else {
        toast.error(result.error || 'Failed to save config');
      }
    } catch (error) {
      toast.error('Failed to save config');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    try {
      const endpoint = config?.is_active ? 'pause' : 'resume';
      const response = await fetch(`${BACKEND_URL}/api/admin/buyback/${endpoint}`, {
        method: 'POST',
      });

      const result = await response.json();
      if (result.success) {
        toast.success(config?.is_active ? 'Buyback paused' : 'Buyback activated');
        await fetchConfig();
      } else {
        toast.error(result.error || 'Failed to toggle buyback');
      }
    } catch (error) {
      toast.error('Failed to toggle buyback');
      console.error(error);
    }
  };

  const executeBuyback = async () => {
    if (!tokenCA.trim()) {
      toast.error('Set a Contract Address first');
      return;
    }

    setExecuting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/buyback/run`, {
        method: 'POST',
      });

      const result = await response.json();
      if (result.success && result.data?.success) {
        toast.success(`Buyback executed! Spent ${result.data.solSpent} SOL`);
        await refresh();
      } else {
        toast.error(result.data?.error || result.error || 'Buyback failed');
      }
    } catch (error) {
      toast.error('Failed to execute buyback');
      console.error(error);
    } finally {
      setExecuting(false);
    }
  };

  const copyCA = () => {
    if (tokenCA) {
      navigator.clipboard.writeText(tokenCA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleString();
  };

  if (!isOperator) {
    return null;
  }

  return (
    <div className="glass-card">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-error-muted">
              <Flame className="w-5 h-5 text-error" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-white mb-0.5">
                Buyback Control
              </h3>
              <p className="text-xs text-white/40 font-body">
                Pump.fun buyback & burn automation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {config?.is_active ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-muted text-success text-xs font-display font-semibold">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-white/40 text-xs font-display font-semibold">
                <Pause className="w-3 h-3" /> Paused
              </span>
            )}
            
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-3">
          <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider">
            Token Contract Address (CA)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={tokenCA}
                onChange={(e) => setTokenCA(e.target.value)}
                placeholder="Paste your Pump.fun token mint address..."
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50 transition-colors"
              />
              {tokenCA && (
                <button
                  onClick={copyCA}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/40" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-2">
              Max Spend (SOL)
            </label>
            <input
              type="number"
              value={maxSpend}
              onChange={(e) => setMaxSpend(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-2">
              Interval (Hours)
            </label>
            <input
              type="number"
              value={intervalHours}
              onChange={(e) => setIntervalHours(e.target.value)}
              min="1"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-display font-semibold text-white/60 uppercase tracking-wider mb-2">
              Mode
            </label>
            <button
              onClick={() => setDryRun(!dryRun)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm font-display font-semibold transition-colors ${
                dryRun 
                  ? 'bg-warning/10 border-warning/30 text-warning' 
                  : 'bg-success/10 border-success/30 text-success'
              }`}
            >
              {dryRun ? 'Dry Run' : 'Live'}
            </button>
          </div>
        </div>

        {dryRun && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning/80 font-body">
              Dry run mode is enabled. Buybacks will be simulated but no actual transactions will occur.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={saveConfig}
            disabled={saving || !tokenCA.trim()}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Config
          </button>
          
          <button
            onClick={toggleActive}
            className={`px-4 py-3 rounded-lg font-display font-semibold text-sm flex items-center gap-2 transition-colors ${
              config?.is_active
                ? 'bg-error/10 border border-error/30 text-error hover:bg-error/20'
                : 'bg-success/10 border border-success/30 text-success hover:bg-success/20'
            }`}
          >
            {config?.is_active ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Activate
              </>
            )}
          </button>
        </div>

        <div className="pt-3 border-t border-white/5">
          <button
            onClick={executeBuyback}
            disabled={executing || !tokenCA.trim()}
            className="w-full btn-gold flex items-center justify-center gap-2 py-3"
          >
            {executing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Buyback...
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                Execute Buyback Now
              </>
            )}
          </button>
          
          <p className="text-xs text-white/30 text-center mt-2 font-body">
            Uses treasury SOL to buy and burn tokens on Pump.fun
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
            <div className="surface-elevated p-3 text-center">
              <div className="text-lg font-bold text-white font-mono">{stats.totalBuybacks}</div>
              <div className="text-xs text-white/40 font-display">Total Buybacks</div>
            </div>
            <div className="surface-elevated p-3 text-center">
              <div className="text-lg font-bold text-gold font-mono">{stats.totalSolSpent.toFixed(4)}</div>
              <div className="text-xs text-white/40 font-display">SOL Spent</div>
            </div>
            <div className="surface-elevated p-3 text-center">
              <div className="text-lg font-bold text-error font-mono">{(stats.totalTokensBurned / 1e6).toFixed(2)}M</div>
              <div className="text-xs text-white/40 font-display">Tokens Burned</div>
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-white/40" />
              <span className="text-xs font-display font-semibold text-white/60 uppercase tracking-wider">
                Recent Buybacks
              </span>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="surface-elevated p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.status === 'success' ? 'bg-success' : 'bg-error'
                    }`} />
                    <div>
                      <div className="text-sm font-mono text-white/80">
                        {parseFloat(event.sol_spent).toFixed(4)} SOL
                      </div>
                      <div className="text-xs text-white/40">
                        {formatTime(event.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {event.transaction_signature && !event.transaction_signature.startsWith('dry-run') && !event.transaction_signature.startsWith('error') && (
                    <a
                      href={`https://solscan.io/tx/${event.transaction_signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-white/20 text-center pt-2 font-mono">
          Last run: {formatTime(config?.last_run_at || null)}
        </div>
      </div>
    </div>
  );
};
