import { FC } from 'react';
import { 
  Wallet, ArrowRightLeft, Cpu, Trophy, Dices, Vault, Recycle, 
  Flame, ShieldCheck, Coins, Check, ArrowDown, AlertCircle 
} from 'lucide-react';

export const HowItWorksPage: FC = () => {
  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
          How it works
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Learn how our on-chain casino operates and how the buyback & burn mechanism creates value for token holders.
        </p>
      </div>

      {/* Section 1: Casino Flow */}
      <section className="glass-panel rounded-2xl p-8 border-brand-accent/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Dices className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Casino Flow</h2>
            <p className="text-sm text-slate-400">How on-chain gaming works</p>
          </div>
        </div>

        {/* Step-by-step Casino Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Step 1: Connect Wallet */}
          <div className="bg-black/40 rounded-xl p-6 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">1. Connect Wallet</h3>
                <p className="text-sm text-slate-400">
                  Connect your Phantom or Solflare wallet. No account registration or KYC required. Your wallet is your identity.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Place Bet */}
          <div className="bg-black/40 rounded-xl p-6 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">2. Place Your Bet</h3>
                <p className="text-sm text-slate-400">
                  Sign a transaction to place your bet. Your funds are held in a secure escrow vault on-chain until the game settles.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Randomness & Settlement */}
          <div className="bg-black/40 rounded-xl p-6 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">3. Verifiable Randomness</h3>
                <p className="text-sm text-slate-400">
                  Our relayer detects your bet and calls Switchboard VRF oracle for provably fair randomness. The result is recorded on-chain.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Instant Payout */}
          <div className="bg-black/40 rounded-xl p-6 border border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">4. Instant Payout</h3>
                <p className="text-sm text-slate-400">
                  Winnings are transferred directly to your wallet in the same transaction. No withdrawal delays or manual claims.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* On-Chain Transparency Callout */}
        <div className="mt-8 bg-gradient-to-br from-brand-accent/5 to-transparent rounded-xl p-6 border border-brand-accent/20">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-brand-accent shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">100% On-Chain & Auditable</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every bet, random number, and payout is a transaction on Solana. The game logic and settlement are handled by 
                immutable smart contracts. You can verify every result on the blockchain explorer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Buyback & Burn */}
      <section className="glass-panel rounded-2xl p-8 border-brand-purple/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Buyback & Burn Mechanics</h2>
            <p className="text-sm text-slate-400">How fees create deflationary value</p>
          </div>
        </div>

        <div className="space-y-6 mt-8">
          {/* Explanation Text */}
          <div className="bg-black/40 rounded-xl p-6 border border-white/5">
            <p className="text-slate-300 leading-relaxed">
              The casino generates revenue through a small house edge on each game. Instead of extracting profit, 
              we use the treasury to automatically buy back tokens from the market and burn them permanently. This 
              reduces total supply and creates long-term value for token holders.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="bg-black/40 rounded-xl p-8 border border-white/5">
            <div className="space-y-6">
              {/* Step 1: Bets Generate Fees */}
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Bets Generate Fees</div>
                  <div className="text-xs text-slate-500">House edge accumulates in the treasury</div>
                </div>
                <ArrowDown className="w-5 h-5 text-brand-accent/50" />
              </div>

              {/* Step 2: Treasury & Vault Safety */}
              <div className="flex items-center gap-4 group pl-8 relative">
                <div className="absolute left-[23px] -top-6 bottom-6 w-0.5 bg-gradient-to-b from-brand-accent/20 to-brand-gold/20"></div>
                <div className="w-12 h-12 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform z-10 bg-[#0a0a0f]">
                  <Vault className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Vault Protection</div>
                  <div className="text-xs text-slate-500">Excess funds above safety threshold move to treasury</div>
                </div>
                <ArrowDown className="w-5 h-5 text-brand-gold/50" />
              </div>

              {/* Step 3: Automated Buyback */}
              <div className="flex items-center gap-4 group pl-16 relative">
                <div className="absolute left-[55px] -top-6 bottom-6 w-0.5 bg-gradient-to-b from-brand-gold/20 to-brand-purple/20"></div>
                <div className="w-12 h-12 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform z-10 bg-[#0a0a0f]">
                  <Recycle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Automated Buyback</div>
                  <div className="text-xs text-slate-500">Treasury purchases tokens from the market via Jupiter</div>
                </div>
                <ArrowDown className="w-5 h-5 text-brand-purple/50" />
              </div>

              {/* Step 4: Permanent Burn */}
              <div className="flex items-center gap-4 group pl-24 relative">
                <div className="absolute left-[87px] -top-6 bottom-4 w-0.5 bg-gradient-to-b from-brand-purple/20 to-brand-ruby/20"></div>
                <div className="w-12 h-12 rounded-xl bg-brand-ruby/10 border border-brand-ruby/20 flex items-center justify-center text-brand-ruby group-hover:scale-110 transition-transform z-10 bg-[#0a0a0f]">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">Permanent Burn</div>
                  <div className="text-xs text-slate-500">Tokens are sent to a burn address, reducing total supply forever</div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety & Transparency Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/40 rounded-xl p-6 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Vault Always Protected</h4>
                  <p className="text-xs text-slate-400">
                    Buybacks only occur when the vault has sufficient reserves to cover all player bets and payouts.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-6 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Fully Automated</h4>
                  <p className="text-xs text-slate-400">
                    No manual intervention. The smart contract handles all treasury management and burn operations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-6 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Transparent On-Chain</h4>
                  <p className="text-xs text-slate-400">
                    Every buyback and burn transaction is publicly verifiable on Solana explorer.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-6 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Deflationary by Design</h4>
                  <p className="text-xs text-slate-400">
                    As casino volume grows, more tokens are burned, reducing supply and increasing scarcity over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Terms Reference Table */}
      <section className="glass-panel rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-white mb-6">Key Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-4 border border-white/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm mb-1">House Edge</h4>
                <p className="text-xs text-slate-400">
                  The small percentage the casino retains from each bet (typically 1-3.5%). This funds operations and buybacks.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4 border border-white/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm mb-1">Vault</h4>
                <p className="text-xs text-slate-400">
                  The secure on-chain escrow holding all player bets and reserves. Protects against insolvency risk.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4 border border-white/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm mb-1">Treasury</h4>
                <p className="text-xs text-slate-400">
                  Collects excess fees after vault safety requirements are met. Used exclusively for buybacks.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4 border border-white/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-ruby shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium text-sm mb-1">Burn Address</h4>
                <p className="text-xs text-slate-400">
                  A special wallet with no private key. Tokens sent here are permanently removed from circulation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};











