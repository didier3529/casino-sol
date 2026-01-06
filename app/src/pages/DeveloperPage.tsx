import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { OperatorPanel } from '../components/OperatorPanel';
import { isOperatorBuildEnabled, isOperatorPublicKey } from '../utils/operatorGate';
import { Activity, Server, Database, Zap, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const DeveloperPage: FC = () => {
  const { publicKey } = useWallet();
  const [showHealthPanel, setShowHealthPanel] = useState(true);
  const { health, loading: healthLoading, error: healthError, refresh: refreshHealth } = useSystemHealth(true);
  
  const isOperator = isOperatorPublicKey(publicKey) && isOperatorBuildEnabled();

  if (!publicKey) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="aura-card group">
          <div className="relative z-10 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple/20 to-brand-accent/20 mb-6">
              <Zap className="w-10 h-10 text-brand-accent" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Connect Wallet
            </h2>
            <p className="text-slate-400 text-lg">
              Connect your wallet to access developer tools and monitoring
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-8 h-8 text-brand-accent" />
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Developer Tools
          </h2>
        </div>
        <p className="text-slate-400 text-lg">
          System monitoring and operator controls (local environment only).
        </p>
      </div>

      {/* System Health Panel */}
      <div className="aura-card group">
        <div className="relative z-10 p-6">
          <button
            onClick={() => setShowHealthPanel(!showHealthPanel)}
            className="w-full flex items-center justify-between text-left group/header"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-brand-emerald/20 to-brand-accent/20 group-hover/header:from-brand-emerald/30 group-hover/header:to-brand-accent/30 transition-all">
                <Server className="w-6 h-6 text-brand-emerald" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">System Health</h3>
                <p className="text-sm text-slate-400">Real-time monitoring and diagnostics</p>
              </div>
              {health && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-semibold ${
                  health.status === 'healthy' ? 'bg-brand-emerald/20 text-brand-emerald' :
                  health.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {health.status === 'healthy' ? (
                    <><CheckCircle className="w-4 h-4" /> Operational</>
                  ) : health.status === 'degraded' ? (
                    <><AlertCircle className="w-4 h-4" /> Degraded</>
                  ) : (
                    <><AlertCircle className="w-4 h-4" /> Down</>
                  )}
                </div>
              )}
            </div>
            <div className="text-slate-400 transition-transform duration-300" style={{ transform: showHealthPanel ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showHealthPanel && (
            <div className="mt-6 space-y-6 animate-fadeIn">
              {healthLoading && (
                <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-brand-accent" />
                  <p className="font-mono text-sm">Loading health data...</p>
                </div>
              )}

              {healthError && (
                <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">Failed to fetch health data</div>
                      <div className="text-sm opacity-80">{healthError}</div>
                    </div>
                  </div>
                </div>
              )}

              {health && !healthLoading && (
                <>
                  {/* Services Status Grid - Vercel Style */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Services</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(health.services).map(([service, status]) => {
                        const isHealthy = status === 'connected' || status === 'active';
                        const isDegraded = status === 'inactive';
                        return (
                          <div key={service} className="group/service relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-4 hover:border-white/20 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover/service:from-white/5 group-hover/service:to-white/0 transition-all" />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  isHealthy ? 'bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                                  isDegraded ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' :
                                  'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'
                                }`} />
                                {isHealthy ? (
                                  <CheckCircle className="w-4 h-4 text-brand-emerald" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mb-1 capitalize font-medium">{service}</div>
                              <div className={`text-sm font-mono font-bold ${
                                isHealthy ? 'text-brand-emerald' :
                                isDegraded ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {status === 'connected' ? 'Connected' :
                                 status === 'active' ? 'Active' :
                                 status === 'inactive' ? 'Inactive' :
                                 'Disconnected'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* System Stats - Premium Cards */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="group/stat relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 hover:border-brand-accent/50 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/0 to-brand-accent/0 group-hover/stat:from-brand-accent/10 group-hover/stat:to-brand-accent/0 transition-all" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-brand-accent" />
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Uptime</div>
                          </div>
                          <div className="text-3xl font-bold text-white font-mono">
                            {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                          </div>
                        </div>
                      </div>

                      <div className="group/stat relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 hover:border-brand-emerald/50 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/0 to-brand-emerald/0 group-hover/stat:from-brand-emerald/10 group-hover/stat:to-brand-emerald/0 transition-all" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Errors (1h)</div>
                          </div>
                          <div className={`text-3xl font-bold font-mono ${
                            health.errors.last_hour === 0 ? 'text-brand-emerald' :
                            health.errors.last_hour < 5 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {health.errors.last_hour}
                          </div>
                        </div>
                      </div>

                      <div className="group/stat relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 hover:border-brand-emerald/50 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/0 to-brand-emerald/0 group-hover/stat:from-brand-emerald/10 group-hover/stat:to-brand-emerald/0 transition-all" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Errors (24h)</div>
                          </div>
                          <div className={`text-3xl font-bold font-mono ${
                            health.errors.last_24h === 0 ? 'text-brand-emerald' :
                            health.errors.last_24h < 20 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {health.errors.last_24h}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Balances - Premium Cards */}
                  {health.balances && Object.keys(health.balances).length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">On-Chain Balances</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {health.balances.vault && (
                          <div className="group/balance relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 hover:border-brand-emerald/50 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/0 to-brand-emerald/0 group-hover/balance:from-brand-emerald/10 group-hover/balance:to-brand-emerald/0 transition-all" />
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <Database className="w-4 h-4 text-brand-emerald" />
                                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Vault</div>
                              </div>
                              <div className="text-2xl font-bold text-brand-emerald font-mono">{health.balances.vault} SOL</div>
                            </div>
                          </div>
                        )}
                        {health.balances.treasury && (
                          <div className="group/balance relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 hover:border-brand-accent/50 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/0 to-brand-accent/0 group-hover/balance:from-brand-accent/10 group-hover/balance:to-brand-accent/0 transition-all" />
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <Database className="w-4 h-4 text-brand-accent" />
                                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Treasury</div>
                              </div>
                              <div className="text-2xl font-bold text-brand-accent font-mono">{health.balances.treasury} SOL</div>
                            </div>
                          </div>
                        )}
                        {health.balances.vault_reserve && (
                          <div className="group/balance relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 hover:border-white/30 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover/balance:from-white/5 group-hover/balance:to-white/0 transition-all" />
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <Database className="w-4 h-4 text-slate-400" />
                                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reserve</div>
                              </div>
                              <div className="text-2xl font-bold text-white font-mono">{health.balances.vault_reserve} SOL</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last Buyback */}
                  {health.lastBuybackAt && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Last Buyback</h4>
                      <div className="relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-accent/20">
                            <Clock className="w-5 h-5 text-brand-accent" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Executed At</div>
                            <div className="text-lg font-mono font-semibold text-white">
                              {new Date(health.lastBuybackAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer with Refresh */}
                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <div className="text-xs text-slate-500 font-mono">
                      Auto-refresh: 30s • Response: {health.responseTime || 'N/A'}
                    </div>
                    <button
                      onClick={refreshHealth}
                      className="group/refresh flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 hover:border-brand-accent/50 hover:bg-brand-accent/10 transition-all text-sm font-semibold text-white"
                    >
                      <RefreshCw className="w-4 h-4 group-hover/refresh:rotate-180 transition-transform duration-500" />
                      Refresh Now
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Operator Panel (if authorized) */}
      {isOperator && <OperatorPanel />}
      
      {/* Not Authorized Message */}
      {!isOperator && (
        <div className="aura-card group">
          <div className="relative z-10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-slate-400 text-lg font-semibold mb-2">
              Operator Controls Require Authorization
            </div>
            <div className="text-slate-500 text-sm">
              Connect with an authorized operator wallet to access advanced tools
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

