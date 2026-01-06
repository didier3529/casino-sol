import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface BuybackConfig {
  id: number;
  token_mint: string;
  treasury_address: string;
  min_vault_reserve: string;
  max_spend_per_interval: string;
  interval_seconds: number;
  slippage_bps: number;
  is_active: boolean;
  dry_run: boolean;
  last_run_at: string | null;
  execution_mode?: string; // 'pumpfun' | 'jupiter'
  pumpfun_mint?: string;
  pumpfun_enabled_until_migration?: boolean;
}

interface BuybackStats {
  totalSolSpent: number;
  totalTokensBought: number;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  lastRunAt: string | null;
}

interface BuybackEvent {
  id: number;
  timestamp: string;
  sol_spent: string;
  token_bought: string;
  token_mint: string;
  transaction_signature: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
}

export const BuybackPanel: FC = () => {
  const [config, setConfig] = useState<BuybackConfig | null>(null);
  const [stats, setStats] = useState<BuybackStats | null>(null);
  const [events, setEvents] = useState<BuybackEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const loadBuybackData = async () => {
    setIsLoading(true);
    try {
      const [configRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/buyback/config`),
        axios.get(`${BACKEND_URL}/api/admin/buyback/stats`),
      ]);
      
      if (configRes.data.success) {
        setConfig(configRes.data.data);
      }
      
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load buyback data:', error);
      toast.error('Failed to load buyback data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/admin/buyback/events?limit=10`);
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load buyback events:', error);
    }
  };

  useEffect(() => {
    loadBuybackData();
  }, []);

  useEffect(() => {
    if (showEvents) {
      loadEvents();
    }
  }, [showEvents]);

  const handleTogglePause = async () => {
    if (!config) return;
    
    try {
      const endpoint = config.is_active ? 'pause' : 'resume';
      const res = await axios.post(`${BACKEND_URL}/api/admin/buyback/${endpoint}`);
      
      if (res.data.success) {
        toast.success(`Buyback ${config.is_active ? 'paused' : 'resumed'}`);
        await loadBuybackData();
      } else {
        toast.error(`Failed to ${endpoint} buyback`);
      }
    } catch (error) {
      console.error('Failed to toggle buyback:', error);
      toast.error(`Failed to ${config.is_active ? 'pause' : 'resume'} buyback`);
    }
  };

  const [pumpfunMintInput, setPumpfunMintInput] = useState('');
  const [executionModeInput, setExecutionModeInput] = useState<'pumpfun' | 'jupiter'>('jupiter');
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

  useEffect(() => {
    if (config) {
      setExecutionModeInput((config.execution_mode as 'pumpfun' | 'jupiter') || 'jupiter');
      setPumpfunMintInput(config.pumpfun_mint || '');
    }
  }, [config]);

  const handleUpdatePumpfunConfig = async () => {
    if (executionModeInput === 'pumpfun' && !pumpfunMintInput.trim()) {
      toast.error('Please enter a token mint address for Pump.fun mode');
      return;
    }

    setIsUpdatingConfig(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/buyback/update-config`, {
        execution_mode: executionModeInput,
        pumpfun_mint: executionModeInput === 'pumpfun' ? pumpfunMintInput.trim() : null,
      });

      if (res.data.success) {
        toast.success('Buyback configuration updated');
        await loadBuybackData();
      } else {
        toast.error('Failed to update configuration');
      }
    } catch (error: any) {
      console.error('Failed to update config:', error);
      toast.error(error.response?.data?.error || 'Failed to update configuration');
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/admin/buyback/run`);
      
      if (res.data.success && res.data.data.success) {
        toast.success('Buyback executed successfully!');
        await loadBuybackData();
        if (showEvents) {
          await loadEvents();
        }
      } else {
        toast.error(`Buyback failed: ${res.data.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to run buyback:', error);
      toast.error('Failed to run buyback');
    } finally {
      setIsRunning(false);
    }
  };

  const handleToggleDryRun = async () => {
    if (!config) return;
    
    try {
      const res = await axios.patch(`${BACKEND_URL}/api/admin/buyback/config`, {
        dry_run: !config.dry_run,
      });
      
      if (res.data.success) {
        toast.success(`Dry run mode ${!config.dry_run ? 'enabled' : 'disabled'}`);
        await loadBuybackData();
      } else {
        toast.error('Failed to update dry run mode');
      }
    } catch (error) {
      console.error('Failed to toggle dry run:', error);
      toast.error('Failed to toggle dry run mode');
    }
  };

  if (!config) {
    return (
      <div className="p-4 glass-effect rounded-xl border-2 border-[var(--accent)]">
        <div className="text-center text-[var(--text-secondary)] py-4">
          {isLoading ? 'Loading buyback configuration...' : 'Buyback not configured'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 glass-effect rounded-xl border-2 border-[var(--accent)]">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🔄</span>
          <div>
            <div className="text-sm font-bold text-[var(--accent)]">
              Buyback & Burn System
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {config.is_active ? (
                <span className="text-[var(--success)]">● Active</span>
              ) : (
                <span className="text-[var(--text-muted)]">○ Paused</span>
              )}
              {config.dry_run && (
                <span className="ml-2 text-[var(--warning)]">(Dry Run)</span>
              )}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--text-secondary)]"
        >
          ▼
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 glass-effect rounded-lg text-center">
                    <div className="text-lg font-bold text-[var(--success)]">
                      {stats.totalSolSpent.toFixed(2)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">SOL Spent</div>
                  </div>
                  <div className="p-2 glass-effect rounded-lg text-center">
                    <div className="text-lg font-bold text-[var(--accent)]">
                      {stats.totalEvents}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">Total Runs</div>
                  </div>
                  <div className="p-2 glass-effect rounded-lg text-center">
                    <div className="text-lg font-bold text-[var(--success)]">
                      {stats.totalEvents > 0 
                        ? Math.round((stats.successfulEvents / stats.totalEvents) * 100)
                        : 0}%
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">Success Rate</div>
                  </div>
                </div>
              )}

              {/* Configuration Summary */}
              <div className="p-3 glass-effect rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Min Vault Reserve:</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {0.5.toFixed(2)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Max Spend/Interval:</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {parseFloat(config.max_spend_per_interval).toFixed(2)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Interval:</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {Math.floor(config.interval_seconds / 3600)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Slippage:</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {(config.slippage_bps / 100).toFixed(2)}%
                  </span>
                </div>
                {config.last_run_at && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Last Run:</span>
                    <span className="text-[var(--text-primary)] font-semibold">
                      {new Date(config.last_run_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Pump.fun Configuration */}
              <div className="p-3 glass-effect rounded-lg border-2 border-[var(--accent)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🚀</span>
                  <div className="text-sm font-bold text-[var(--accent)]">Pump.fun Buyback Configuration</div>
                </div>
                
                <div className="space-y-3">
                  {/* Execution Mode */}
                  <div>
                    <label className="text-xs text-[var(--text-secondary)] mb-1 block">Execution Mode:</label>
                    <select
                      value={executionModeInput}
                      onChange={(e) => setExecutionModeInput(e.target.value as 'pumpfun' | 'jupiter')}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="jupiter">Jupiter (DEX)</option>
                      <option value="pumpfun">Pump.fun (Bonding Curve)</option>
                    </select>
                    <div className="mt-1 text-xs text-[var(--text-secondary)]">
                      {executionModeInput === 'pumpfun' 
                        ? '🔥 Continuous buybacks during bonding curve phase' 
                        : '💎 Standard DEX buybacks after migration'}
                    </div>
                  </div>

                  {/* Token Mint (only for Pump.fun) */}
                  {executionModeInput === 'pumpfun' && (
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                        Token Mint Address:
                      </label>
                      <input
                        type="text"
                        value={pumpfunMintInput}
                        onChange={(e) => setPumpfunMintInput(e.target.value)}
                        placeholder="Enter Pump.fun token mint address..."
                        className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                      />
                      <div className="mt-1 text-xs text-[var(--text-secondary)]">
                        Paste your token mint after launch. Buybacks will execute every 10-15s during bonding curve.
                      </div>
                    </div>
                  )}

                  {/* Current Status */}
                  <div className="p-2 bg-[var(--background)] rounded-lg">
                    <div className="text-xs text-[var(--text-secondary)]">
                      <strong>Current Mode:</strong>{' '}
                      <span className={`font-semibold ${config.execution_mode === 'pumpfun' ? 'text-[var(--accent)]' : 'text-[var(--success)]'}`}>
                        {config.execution_mode === 'pumpfun' ? '🚀 Pump.fun' : '💎 Jupiter'}
                      </span>
                    </div>
                    {config.execution_mode === 'pumpfun' && config.pumpfun_mint && (
                      <div className="text-xs text-[var(--text-secondary)] mt-1">
                        <strong>Mint:</strong>{' '}
                        <span className="font-mono text-[10px]">{config.pumpfun_mint.slice(0, 8)}...{config.pumpfun_mint.slice(-8)}</span>
                      </div>
                    )}
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleUpdatePumpfunConfig}
                    disabled={isUpdatingConfig}
                    className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {isUpdatingConfig ? 'Updating...' : 'Update Configuration'}
                  </button>
                </div>
              </div>

              {/* How It Works Info */}
              <div className="p-3 glass-effect rounded-lg border border-[var(--border)]">
                <div className="text-xs text-[var(--text-secondary)]">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-[var(--info)]">ℹ️</span>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)] mb-1">How Auto-Buyback Works:</div>
                      <ul className="space-y-0.5 text-[var(--text-secondary)]">
                        <li>• <strong>Vault always keeps 0.5 SOL</strong> safe for gameplay</li>
                        <li>• <strong>Everything above 0.5 SOL</strong> can be used for buybacks</li>
                        <li>• <strong>Auto runs:</strong> Every {Math.floor(config.interval_seconds / 60)} min (capped per interval)</li>
                        <li>• <strong>Manual "Run Now":</strong> Available anytime (30s anti-spam only)</li>
                        <li>• Tokens are bought from the market and burned immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePause();
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    config.is_active
                      ? 'bg-[var(--warning)] text-white hover:opacity-90'
                      : 'bg-[var(--success)] text-white hover:opacity-90'
                  }`}
                >
                  {config.is_active ? '⏸️ Pause' : '▶️ Resume'}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunNow();
                  }}
                  disabled={isRunning}
                  className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isRunning ? '⏳ Running...' : '▶️ Run Now'}
                </button>
              </div>

              {/* Dry Run Toggle */}
              <div className="flex items-center justify-between p-3 glass-effect rounded-lg">
                <div className="text-xs">
                  <div className="font-semibold text-[var(--text-primary)]">Dry Run Mode</div>
                  <div className="text-[var(--text-secondary)]">
                    {config.dry_run ? 'Logs only, no real transactions' : 'Real transactions enabled'}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleDryRun();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    config.dry_run
                      ? 'bg-[var(--warning)] text-white'
                      : 'bg-[var(--success)] text-white'
                  }`}
                >
                  {config.dry_run ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Recent Events Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEvents(!showEvents);
                }}
                className="w-full px-3 py-2 glass-effect rounded-lg text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
              >
                {showEvents ? '▼ Hide Recent Events' : '▶️ Show Recent Events'}
              </button>

              {/* Recent Events List */}
              <AnimatePresence>
                {showEvents && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {events.length === 0 ? (
                      <div className="text-xs text-center text-[var(--text-secondary)] py-2">
                        No buyback events yet
                      </div>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.id}
                          className="p-2 glass-effect rounded-lg text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)]">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                event.status === 'success'
                                  ? 'bg-[var(--success)] text-white'
                                  : event.status === 'failed'
                                  ? 'bg-[var(--error)] text-white'
                                  : 'bg-[var(--warning)] text-white'
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-secondary)]">SOL Spent:</span>
                            <span className="text-[var(--text-primary)] font-semibold">
                              {parseFloat(event.sol_spent).toFixed(4)}
                            </span>
                          </div>
                          {event.transaction_signature && !event.transaction_signature.includes('dry-run') && (
                            <div className="text-[var(--text-muted)] truncate">
                              TX: {event.transaction_signature.slice(0, 8)}...{event.transaction_signature.slice(-8)}
                            </div>
                          )}
                          {event.error_message && (
                            <div className="text-[var(--error)] text-xs">
                              {event.error_message}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Banner */}
              <div className="p-3 glass-effect rounded-lg text-xs text-[var(--text-secondary)]">
                <p>
                  💡 The buyback system automatically purchases and burns the casino token using excess SOL from the treasury, 
                  supporting token price while ensuring vault liquidity is always maintained.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
