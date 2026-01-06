import { FC } from 'react';
import { 
  Wallet, ArrowRightLeft, Cpu, Trophy, Dices, Vault, Recycle, 
  Flame, ShieldCheck, Coins, Check, ArrowDown, Info 
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center text-gold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold text-white">Buyback & Burn</h2>
            <p className="text-sm text-white/40 font-body">How fees create deflationary value</p>
          </div>
        </div>

        <div className="surface-elevated p-5 mb-6">
          <p className="text-white/60 font-body leading-relaxed">
            The casino generates revenue through a small house edge. Instead of extracting profit, 
            we use the treasury to automatically buy back tokens from the market and burn them permanently.
          </p>
        </div>

        <div className="surface-elevated p-6 space-y-5">
          <div className="flex items-center gap-4 group">
            <div className="w-11 h-11 rounded-xl bg-accent-muted flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-white font-display font-medium">Bets Generate Fees</div>
              <div className="text-xs text-white/40 font-body">House edge accumulates in the treasury</div>
            </div>
            <ArrowDown className="w-5 h-5 text-accent/40" />
          </div>

          <div className="flex items-center gap-4 group pl-6 relative">
            <div className="absolute left-[21px] -top-5 h-5 w-px bg-gradient-to-b from-accent/30 to-gold/30"></div>
            <div className="w-11 h-11 rounded-xl bg-gold-muted flex items-center justify-center text-gold group-hover:scale-105 transition-transform">
              <Vault className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-white font-display font-medium">Vault Protection</div>
              <div className="text-xs text-white/40 font-body">Excess funds above safety threshold move to treasury</div>
            </div>
            <ArrowDown className="w-5 h-5 text-gold/40" />
          </div>

          <div className="flex items-center gap-4 group pl-12 relative">
            <div className="absolute left-[45px] -top-5 h-5 w-px bg-gradient-to-b from-gold/30 to-accent/30"></div>
            <div className="w-11 h-11 rounded-xl bg-accent-muted flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
              <Recycle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-white font-display font-medium">Automated Buyback</div>
              <div className="text-xs text-white/40 font-body">Treasury purchases tokens via Jupiter</div>
            </div>
            <ArrowDown className="w-5 h-5 text-accent/40" />
          </div>

          <div className="flex items-center gap-4 group pl-[72px] relative">
            <div className="absolute left-[69px] -top-5 h-5 w-px bg-gradient-to-b from-accent/30 to-error/30"></div>
            <div className="w-11 h-11 rounded-xl bg-error-muted flex items-center justify-center text-error group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-white font-display font-medium">Permanent Burn</div>
              <div className="text-xs text-white/40 font-body">Tokens sent to burn address, reducing supply forever</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[
            { title: 'Vault Always Protected', desc: 'Buybacks only when vault has sufficient reserves' },
            { title: 'Fully Automated', desc: 'Smart contract handles all treasury operations' },
            { title: 'Transparent On-Chain', desc: 'Every transaction publicly verifiable' },
            { title: 'Deflationary by Design', desc: 'More volume = more burns = increasing scarcity' },
          ].map((item, i) => (
            <div key={i} className="surface-elevated p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-success-muted flex items-center justify-center text-success shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-white font-display font-medium text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-white/40 font-body">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
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
