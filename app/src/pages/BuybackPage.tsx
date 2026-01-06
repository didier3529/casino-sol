import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BuybackPanel } from '../components/BuybackPanel';
import { isOperatorPublicKey } from '../utils/operatorGate';
import { BarChart2, Gem, Flame, ShieldCheck, ArrowRightLeft, Wallet } from 'lucide-react';

export const BuybackPage: FC = () => {
  const { publicKey } = useWallet();
  const isOperator = isOperatorPublicKey(publicKey);

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-ruby">
            Buyback & Burn
          </span>
        </h1>
        <p className="text-slate-400 text-lg">
          Deflationary mechanics powered by casino revenue.
        </p>
      </div>

      {/* Public Information Section */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mechanism Overview */}
        <div className="glass-panel rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-purple" />
            <span>Mechanism Overview</span>
          </h3>
          <div className="space-y-4 text-slate-400">
            <p>
              The Sol Vegas Buyback & Burn protocol is designed to create continuous
              deflationary pressure on the native token. A portion of the house
              edge from every game played is automatically directed to a treasury.
            </p>
            <p>
              When the treasury balance exceeds a predefined threshold, the system
              initiates an automated buyback. It uses the accumulated SOL to purchase
              the native token from the open market via Jupiter Aggregator or Pump.fun.
            </p>
            <p>
              Immediately after the buyback, the purchased tokens are sent to a burn
              address, permanently removing them from circulation. This reduces the
              total supply, benefiting existing token holders by increasing scarcity.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-6 glass-panel rounded-xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Gem className="w-6 h-6 text-brand-gold" />
            <span>Benefits for Token Holders</span>
          </h3>
          <div className="space-y-2 text-slate-400">
            <p>
              <Flame className="inline-block w-4 h-4 mr-2 text-brand-accent" /> <strong className="text-brand-accent">Deflationary Pressure</strong>: Continuous token burns reduce supply over time
            </p>
            <p>
              <Flame className="inline-block w-4 h-4 mr-2 text-brand-accent" /> <strong className="text-brand-accent">Price Support</strong>: Automated buying creates consistent demand
            </p>
            <p>
              <Flame className="inline-block w-4 h-4 mr-2 text-brand-accent" /> <strong className="text-brand-accent">Revenue Share</strong>: House profits directly benefit token holders
            </p>
            <p>
              <Flame className="inline-block w-4 h-4 mr-2 text-brand-accent" /> <strong className="text-brand-accent">Sustainable</strong>: Powered by real casino revenue, not external funding
            </p>
          </div>
        </div>
      </div>

      {/* How It Works - Process Flow */}
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-brand-emerald" />
            <span>How It Works</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-purple mb-2">1. Revenue Collection</div>
              <div className="text-sm text-slate-400">
                House edge from every bet is allocated to the treasury account
              </div>
            </div>
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-purple mb-2">2. Automated Buyback</div>
              <div className="text-sm text-slate-400">
                Bot executes swaps via Pump.fun (bonding curve) or Jupiter (DEX)
              </div>
            </div>
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-ruby mb-2">3. Token Burn</div>
              <div className="text-sm text-slate-400">
                Purchased tokens are immediately burned, reducing total supply
              </div>
            </div>
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-emerald mb-2">4. Price Impact</div>
              <div className="text-sm text-slate-400">
                Reduced supply + consistent demand = upward price pressure
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Features */}
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel rounded-xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-emerald" />
            <span>Safety Features</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-emerald mb-1">Protected Vault</div>
              <div className="text-sm text-slate-400">
                0.5 SOL always reserved for gameplay liquidity
              </div>
            </div>
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-emerald mb-1">Transparent</div>
              <div className="text-sm text-slate-400">
                All buyback transactions logged and auditable
              </div>
            </div>
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-emerald mb-1">Kill Switch</div>
              <div className="text-sm text-slate-400">
                Can be paused/resumed by casino authority
              </div>
            </div>
            <div className="p-4 glass-panel rounded-lg border border-white/10">
              <div className="font-semibold text-brand-emerald mb-1">Price Protection</div>
              <div className="text-sm text-slate-400">
                Slippage limits and price impact validation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Controls (if authorized) */}
      {publicKey && isOperator && (
        <div className="max-w-6xl mx-auto">
          <div className="glass-panel rounded-xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-brand-accent" />
              <span>Operator Controls</span>
            </h3>
            <BuybackPanel />
          </div>
        </div>
      )}

      {/* Coming Soon (if not connected or not operator) */}
      {(!publicKey || !isOperator) && (
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-xl p-6 text-center border border-white/10">
            <div className="text-slate-500 text-sm">
              💡 Buyback statistics and real-time events will be displayed here once the system is active
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

