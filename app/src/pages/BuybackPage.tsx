import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BuybackPanel } from '../components/BuybackPanel';
import { isOperatorPublicKey } from '../utils/operatorGate';
import { BarChart2, Gem, Flame, ShieldCheck, ArrowRightLeft, Wallet } from 'lucide-react';

export const BuybackPage: FC = () => {
  const { publicKey } = useWallet();
  const isOperator = isOperatorPublicKey(publicKey);

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-3">
          Buyback & Burn
        </h1>
        <p className="text-white/50 text-lg font-body">
          Deflationary mechanics powered by casino revenue
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-accent" />
            <span>Mechanism Overview</span>
          </h3>
          <div className="space-y-4 text-white/50 font-body text-sm leading-relaxed">
            <p>
              The Sol Vegas Buyback & Burn protocol creates continuous
              deflationary pressure on the native token.
            </p>
            <p>
              A portion of the house edge from every game is directed to a treasury.
              When the balance exceeds a threshold, the system initiates an automated buyback.
            </p>
            <p>
              Purchased tokens are immediately sent to a burn address, permanently
              removing them from circulation.
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Gem className="w-5 h-5 text-gold" />
            <span>Benefits for Holders</span>
          </h3>
          <div className="space-y-3 text-sm font-body">
            {[
              { label: 'Deflationary Pressure', desc: 'Continuous token burns reduce supply' },
              { label: 'Price Support', desc: 'Automated buying creates consistent demand' },
              { label: 'Revenue Share', desc: 'House profits directly benefit holders' },
              { label: 'Sustainable', desc: 'Powered by real casino revenue' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Flame className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-accent font-medium">{item.label}:</span>{' '}
                  <span className="text-white/50">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-white mb-5 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-success" />
          <span>How It Works</span>
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Revenue Collection', desc: 'House edge allocated to treasury', color: 'accent' },
            { step: '2', title: 'Automated Buyback', desc: 'Bot executes swaps via Pump.fun or Jupiter', color: 'gold' },
            { step: '3', title: 'Token Burn', desc: 'Purchased tokens immediately burned', color: 'error' },
            { step: '4', title: 'Price Impact', desc: 'Reduced supply + demand = upward pressure', color: 'success' },
          ].map((item, i) => (
            <div key={i} className="surface-elevated p-4">
              <div className={`text-${item.color} font-display font-semibold text-sm mb-2`}>
                {item.step}. {item.title}
              </div>
              <div className="text-xs text-white/40 font-body">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-white mb-5 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <span>Safety Features</span>
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="surface-elevated p-4">
            <div className="text-accent font-display font-semibold text-sm mb-1">Protected Vault</div>
            <div className="text-xs text-white/40 font-body">0.5 SOL always reserved for gameplay</div>
          </div>
          <div className="surface-elevated p-4">
            <div className="text-gold font-display font-semibold text-sm mb-1">Transparent</div>
            <div className="text-xs text-white/40 font-body">All transactions logged and auditable</div>
          </div>
          <div className="surface-elevated p-4">
            <div className="text-error font-display font-semibold text-sm mb-1">Kill Switch</div>
            <div className="text-xs text-white/40 font-body">Can be paused by casino authority</div>
          </div>
          <div className="surface-elevated p-4">
            <div className="text-success font-display font-semibold text-sm mb-1">Price Protection</div>
            <div className="text-xs text-white/40 font-body">Slippage limits and price validation</div>
          </div>
        </div>
      </div>

      {publicKey && isOperator && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-5 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-accent" />
            <span>Operator Controls</span>
          </h3>
          <BuybackPanel />
        </div>
      )}

      {(!publicKey || !isOperator) && (
        <div className="glass-card p-6 text-center">
          <p className="text-white/40 text-sm font-body">
            Buyback statistics and real-time events will be displayed here once the system is active
          </p>
        </div>
      )}
    </div>
  );
};
