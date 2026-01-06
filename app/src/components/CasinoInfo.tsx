import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCasino } from '../hooks/useCasino';
import { formatLamportsToSol } from '../utils/format';
import { RefreshCw } from 'lucide-react';

/**
 * CasinoInfo - Public casino statistics
 * 
 * Shows public stats available to all players.
 * Operator-only tools (fund/drain vault, buyback, etc.) are in OperatorPanel.
 */
export const CasinoInfo: FC = () => {
  const { publicKey } = useWallet();
  const { fetchCasino, fetchVaultBalance } = useCasino();
  const [casinoData, setCasinoData] = useState<any>(null);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadCasinoInfo = async () => {
    setIsLoading(true);
    try {
      const casino = await fetchCasino();
      const balance = await fetchVaultBalance();
      setCasinoData(casino);
      setVaultBalance(balance);
    } catch (error) {
      // Only log in development
      if (import.meta.env.DEV) {
        console.error('Error loading casino info:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      loadCasinoInfo();
      // Auto-refresh every 10 seconds
      const interval = setInterval(loadCasinoInfo, 10000);
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="text-center py-6">
        <div className="text-sm font-medium text-slate-200">Connect your wallet to view casino stats.</div>
        <div className="text-xs text-slate-500 mt-1">Stats are fetched on-chain and refresh automatically.</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Casino Stats</h2>
          <p className="text-xs text-slate-500 mt-1">Live on-chain metrics</p>
        </div>
          <button
            onClick={loadCasinoInfo}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <RefreshCw className={['w-4 h-4', isLoading ? 'animate-spin' : ''].join(' ')} />
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {casinoData ? (
          <div className="space-y-4">
            {/* Casino Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-black/20 text-center">
                <div className="text-2xl font-bold text-[var(--success)]">
                  {formatLamportsToSol(vaultBalance.toString())}
                </div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Treasury (Vault)</div>
                <div className="text-[11px] text-slate-500 mt-1">Current SOL balance</div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-black/20 text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {casinoData.totalGames.toString()}
                </div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Total Games</div>
                <div className="text-[11px] text-slate-500 mt-1">Bets placed</div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-black/20 text-center">
                <div className="text-2xl font-bold text-[var(--secondary)]">
                  {formatLamportsToSol(casinoData.totalVolume.toString())}
                </div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Total Volume</div>
                <div className="text-[11px] text-slate-500 mt-1">All bets (SOL)</div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-black/20 text-center">
                <div className="text-2xl font-bold text-[var(--gold)]">
                  {formatLamportsToSol(casinoData.totalPayouts.toString())}
                </div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Total Payouts</div>
                <div className="text-[11px] text-slate-500 mt-1">Winnings paid (SOL)</div>
              </div>
            </div>

            {/* House Edge & Buyback Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/10 bg-black/20">
                <div className="text-xs font-semibold text-slate-200 mb-2">House Profit</div>
                <div className="text-2xl font-bold text-[var(--success)]">
                  {(() => {
                    const volumeBigInt = BigInt(casinoData.totalVolume.toString());
                    const payoutsBigInt = BigInt(casinoData.totalPayouts.toString());
                    const profit = volumeBigInt - payoutsBigInt;
                    return formatLamportsToSol(profit.toString());
                  })()} SOL
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Volume - Payouts = House Edge
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-black/20">
                <div className="text-xs font-semibold text-slate-200 mb-2">Buyback Budget (Est.)</div>
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {(() => {
                    const volumeBigInt = BigInt(casinoData.totalVolume.toString());
                    const payoutsBigInt = BigInt(casinoData.totalPayouts.toString());
                    const profit = volumeBigInt - payoutsBigInt;
                    // Assume 50% of profit for buybacks (configurable later)
                    const buybackBudget = profit / BigInt(2);
                    return formatLamportsToSol(buybackBudget.toString());
                  })()} SOL
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  50% of house profit for token buybacks
                </div>
              </div>
            </div>

            {/* Buyback Info Banner */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/20">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-slate-200 mb-1">Token Buyback Strategy</div>
                  <p className="text-sm text-slate-400">
                    The casino accumulates house edge from bets. A portion of profits will be used for 
                    automated buybacks of the casino token on Pump.fun, supporting token price and rewarding holders.
                  </p>
                  <div className="mt-2 text-[11px] text-slate-600 italic">
                    Buyback execution will be implemented via off-chain bot with on-chain verification.
                  </div>
                </div>
              </div>
            </div>

            {/* Bet Limits */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/20">
              <div className="text-xs font-semibold text-slate-200 mb-2">Bet Limits</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Min Bet: </span>
                  <span className="font-semibold text-slate-200">
                    {formatLamportsToSol(casinoData.minBet.toString())} SOL
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Max Bet: </span>
                  <span className="font-semibold text-slate-200">
                    {formatLamportsToSol(casinoData.maxBet.toString())} SOL
                  </span>
                </div>
              </div>
            </div>

          
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">
            {isLoading ? 'Loading casino info...' : 'Casino not initialized'}
          </div>
        )}
    </div>
  );
};


