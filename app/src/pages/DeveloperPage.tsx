import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { OperatorPanel } from '../components/OperatorPanel';
import { isOperatorBuildEnabled, isOperatorPublicKey } from '../utils/operatorGate';
import { Activity, Server, Database, Zap, Clock, AlertCircle, CheckCircle, RefreshCw, Lock } from 'lucide-react';

export const DeveloperPage: FC = () => {
  const { publicKey } = useWallet();
  const [showHealthPanel, setShowHealthPanel] = useState(true);
  const { health, loading: healthLoading, error: healthError, refresh: refreshHealth } = useSystemHealth(true);
  
  const isOperator = isOperatorPublicKey(publicKey) && isOperatorBuildEnabled();

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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-7 h-7 text-accent" />
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">
            Developer Tools
          </h2>
        </div>
        <p className="text-white/50 font-body">
          System monitoring and operator controls (local environment only)
        </p>
      </div>

      <div className="glass-card">
        <button
          onClick={() => setShowHealthPanel(!showHealthPanel)}
          className="w-full p-6 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-muted">
              <Server className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-display font-semibold text-white mb-1">System Health</h3>
              <p className="text-sm text-white/40 font-body">Real-time monitoring and diagnostics</p>
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
          <div className="px-6 pb-6 space-y-6">
            {healthLoading && (
              <div className="text-center text-white/40 py-12 flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                <p className="font-mono text-sm">Loading health data...</p>
              </div>
            )}

            {healthError && (
              <div className="p-5 rounded-xl bg-error-muted border border-error/20">
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
                  <h4 className="text-xs font-display font-semibold text-white/60 mb-4 uppercase tracking-wider">Services</h4>
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

                <div>
                  <h4 className="text-xs font-display font-semibold text-white/60 mb-4 uppercase tracking-wider">Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="surface-elevated p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-accent" />
                        <div className="text-xs text-white/50 font-display uppercase tracking-wider">Uptime</div>
                      </div>
                      <div className="text-2xl font-bold text-white font-mono">
                        {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                      </div>
                    </div>

                    <div className="surface-elevated p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-white/40" />
                        <div className="text-xs text-white/50 font-display uppercase tracking-wider">Errors (1h)</div>
                      </div>
                      <div className={`text-2xl font-bold font-mono ${
                        health.errors.last_hour === 0 ? 'text-success' :
                        health.errors.last_hour < 5 ? 'text-warning' : 'text-error'
                      }`}>
                        {health.errors.last_hour}
                      </div>
                    </div>

                    <div className="surface-elevated p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-white/40" />
                        <div className="text-xs text-white/50 font-display uppercase tracking-wider">Errors (24h)</div>
                      </div>
                      <div className={`text-2xl font-bold font-mono ${
                        health.errors.last_24h === 0 ? 'text-success' :
                        health.errors.last_24h < 20 ? 'text-warning' : 'text-error'
                      }`}>
                        {health.errors.last_24h}
                      </div>
                    </div>
                  </div>
                </div>

                {health.balances && Object.keys(health.balances).length > 0 && (
                  <div>
                    <h4 className="text-xs font-display font-semibold text-white/60 mb-4 uppercase tracking-wider">On-Chain Balances</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {health.balances.vault && (
                        <div className="surface-elevated p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Database className="w-4 h-4 text-success" />
                            <div className="text-xs text-white/50 font-display uppercase tracking-wider">Vault</div>
                          </div>
                          <div className="text-xl font-bold text-success font-mono">{health.balances.vault} SOL</div>
                        </div>
                      )}
                      {health.balances.treasury && (
                        <div className="surface-elevated p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Database className="w-4 h-4 text-accent" />
                            <div className="text-xs text-white/50 font-display uppercase tracking-wider">Treasury</div>
                          </div>
                          <div className="text-xl font-bold text-accent font-mono">{health.balances.treasury} SOL</div>
                        </div>
                      )}
                      {health.balances.vault_reserve && (
                        <div className="surface-elevated p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Database className="w-4 h-4 text-white/40" />
                            <div className="text-xs text-white/50 font-display uppercase tracking-wider">Reserve</div>
                          </div>
                          <div className="text-xl font-bold text-white font-mono">{health.balances.vault_reserve} SOL</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {health.lastBuybackAt && (
                  <div>
                    <h4 className="text-xs font-display font-semibold text-white/60 mb-4 uppercase tracking-wider">Last Buyback</h4>
                    <div className="surface-elevated p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-accent-muted">
                          <Clock className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <div className="text-xs text-white/50 mb-1 font-body">Executed At</div>
                          <div className="text-base font-mono font-semibold text-white">
                            {new Date(health.lastBuybackAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="text-xs text-white/30 font-mono">
                    Auto-refresh: 30s | Response: {health.responseTime || 'N/A'}
                  </div>
                  <button
                    onClick={refreshHealth}
                    className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
                  >
                    <RefreshCw className="w-4 h-4" />
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
        <div className="glass-card p-10 text-center">
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
