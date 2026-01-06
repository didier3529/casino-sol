import { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCasino } from '../hooks/useCasino';
import { formatLamportsToSol } from '../utils/format';
import { RefreshCw, Wallet } from 'lucide-react';

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
      const interval = setInterval(loadCasinoInfo, 10000);
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-muted mb-4">
          <Wallet className="w-6 h-6 text-accent" />
        </div>
        <div className="text-sm font-display font-medium text-white mb-1">Connect your wallet</div>
        <div className="text-xs text-white/40 font-body">View live on-chain casino statistics</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-display font-semibold text-white">Casino Stats</h2>
          <p className="text-xs text-white/40 font-body mt-0.5">Live on-chain metrics</p>
        </div>
        <button
          onClick={loadCasinoInfo}
          disabled={isLoading}
          className="btn-secondary py-2 px-3 text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {casinoData ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="surface-elevated p-4 text-center">
              <div className="text-2xl font-bold font-mono text-success">
                {formatLamportsToSol(vaultBalance.toString())}
              </div>
              <div className="text-xs text-white font-display font-medium mt-1">Treasury</div>
              <div className="text-[10px] text-white/30 font-body mt-0.5">SOL Balance</div>
            </div>

            <div className="surface-elevated p-4 text-center">
              <div className="text-2xl font-bold font-mono text-accent">
                {casinoData.totalGames.toString()}
              </div>
              <div className="text-xs text-white font-display font-medium mt-1">Total Games</div>
              <div className="text-[10px] text-white/30 font-body mt-0.5">Bets placed</div>
            </div>

            <div className="surface-elevated p-4 text-center">
              <div className="text-2xl font-bold font-mono text-gold">
                {formatLamportsToSol(casinoData.totalVolume.toString())}
              </div>
              <div className="text-xs text-white font-display font-medium mt-1">Total Volume</div>
              <div className="text-[10px] text-white/30 font-body mt-0.5">All bets (SOL)</div>
            </div>

            <div className="surface-elevated p-4 text-center">
              <div className="text-2xl font-bold font-mono text-success">
                {formatLamportsToSol(casinoData.totalPayouts.toString())}
              </div>
              <div className="text-xs text-white font-display font-medium mt-1">Total Payouts</div>
              <div className="text-[10px] text-white/30 font-body mt-0.5">Winnings (SOL)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-elevated p-4">
              <div className="text-xs font-display font-medium text-white/60 mb-2">House Profit</div>
              <div className="text-xl font-bold font-mono text-success">
                {(() => {
                  const volumeBigInt = BigInt(casinoData.totalVolume.toString());
                  const payoutsBigInt = BigInt(casinoData.totalPayouts.toString());
                  const profit = volumeBigInt - payoutsBigInt;
                  return formatLamportsToSol(profit.toString());
                })()} SOL
              </div>
              <div className="text-[10px] text-white/30 font-body mt-1">Volume - Payouts</div>
            </div>

            <div className="surface-elevated p-4">
              <div className="text-xs font-display font-medium text-white/60 mb-2">Buyback Budget</div>
              <div className="text-xl font-bold font-mono text-accent">
                {(() => {
                  const volumeBigInt = BigInt(casinoData.totalVolume.toString());
                  const payoutsBigInt = BigInt(casinoData.totalPayouts.toString());
                  const profit = volumeBigInt - payoutsBigInt;
                  const buybackBudget = profit / BigInt(2);
                  return formatLamportsToSol(buybackBudget.toString());
                })()} SOL
              </div>
              <div className="text-[10px] text-white/30 font-body mt-1">50% of house profit</div>
            </div>
          </div>

          <div className="surface-elevated p-4">
            <div className="text-xs font-display font-medium text-white/60 mb-3">Bet Limits</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-white/40 font-body">Min: </span>
                <span className="font-mono font-medium text-white">
                  {formatLamportsToSol(casinoData.minBet.toString())} SOL
                </span>
              </div>
              <div>
                <span className="text-xs text-white/40 font-body">Max: </span>
                <span className="font-mono font-medium text-white">
                  {formatLamportsToSol(casinoData.maxBet.toString())} SOL
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-white/40 py-10 font-body">
          {isLoading ? 'Loading casino info...' : 'Casino not initialized'}
        </div>
      )}
    </div>
  );
};
