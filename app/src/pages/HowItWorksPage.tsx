import { FC } from 'react';
import { 
  Wallet, ArrowRightLeft, Cpu, Trophy, Dices, 
  ShieldCheck, Info 
} from 'lucide-react';

export const HowItWorksPage: FC = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">
          How It Works
        </h1>
        <p className="text-lg text-white/50 max-w-2xl mx-auto font-body">
          Learn how our on-chain casino operates and how the buyback mechanism creates value.
        </p>
      </div>

      <section className="glass-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
            <Dices className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold text-white">Casino Flow</h2>
            <p className="text-sm text-white/40 font-body">How on-chain gaming works</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="surface-elevated p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-display font-semibold mb-2">1. Connect Wallet</h3>
                <p className="text-sm text-white/40 font-body leading-relaxed">
                  Connect your Phantom wallet. No account registration or KYC required.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-elevated p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold-muted flex items-center justify-center text-gold shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-display font-semibold mb-2">2. Place Your Bet</h3>
                <p className="text-sm text-white/40 font-body leading-relaxed">
                  Sign a transaction to place your bet. Funds are held in secure escrow on-chain.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-elevated p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center text-accent shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-display font-semibold mb-2">3. Verifiable Randomness</h3>
                <p className="text-sm text-white/40 font-body leading-relaxed">
                  Switchboard VRF oracle provides provably fair randomness recorded on-chain.
                </p>
              </div>
            </div>
          </div>

          <div className="surface-elevated p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-success-muted flex items-center justify-center text-success shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-display font-semibold mb-2">4. Instant Payout</h3>
                <p className="text-sm text-white/40 font-body leading-relaxed">
                  Winnings transfer directly to your wallet in the same transaction.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 surface-elevated p-5 border-accent/20">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-display font-semibold mb-2">100% On-Chain & Auditable</h3>
              <p className="text-sm text-white/40 font-body leading-relaxed">
                Every bet, random number, and payout is a transaction on Solana. Verify every result on the blockchain explorer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-8">
        <h3 className="text-xl font-display font-semibold text-white mb-6">Key Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { term: 'House Edge', desc: 'Small percentage retained from each bet (1-3.5%). Funds operations and buybacks.', color: 'accent' },
            { term: 'Vault', desc: 'Secure on-chain escrow holding player bets and reserves.', color: 'gold' },
            { term: 'Treasury', desc: 'Collects excess fees after vault safety. Used for buybacks.', color: 'accent' },
            { term: 'Burn Address', desc: 'Wallet with no private key. Tokens sent here are gone forever.', color: 'error' },
          ].map((item, i) => (
            <div key={i} className="surface-elevated p-4">
              <div className="flex items-start gap-3">
                <Info className={`w-5 h-5 text-${item.color} shrink-0 mt-0.5`} />
                <div>
                  <h4 className="text-white font-display font-medium text-sm mb-1">{item.term}</h4>
                  <p className="text-xs text-white/40 font-body">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
