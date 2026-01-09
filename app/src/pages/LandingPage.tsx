import { FC } from 'react';
import { 
  ArrowRight, Gamepad2, Shield, Zap, Lock
} from 'lucide-react';
import { TabType } from '../components/navigation/TopNav';

interface LandingPageProps {
  onEnterApp: () => void;
  onNavigateToTab: (tab: TabType) => void;
}

export const LandingPage: FC<LandingPageProps> = ({ onEnterApp, onNavigateToTab }) => {
  const handleEnterCasino = () => {
    onEnterApp();
    onNavigateToTab('games');
  };

  const handleViewGames = () => {
    onEnterApp();
    onNavigateToTab('games');
  };

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Provably Fair',
      description: 'Every outcome verified on-chain with cryptographic proofs'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Instant Payouts',
      description: 'Winnings sent directly to your wallet in seconds'
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'Non-Custodial',
      description: 'Your funds stay in your wallet until you play'
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="video-background"
        poster="/assets/images/casino-poster.jpg"
      >
        <source src="/assets/videos/casino-bg.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />

      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-32">
        <div className="flex flex-col text-center max-w-4xl mx-auto items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold tracking-wider mb-8 animate-fade-in-up font-display uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
            </span>
            Live on Solana Mainnet
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            The Future of
            <span className="block neon-text">On-Chain Gaming</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed font-body animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Experience the first fully non-custodial casino on Solana. 
            Verifiable randomness, instant settlements, and direct-to-wallet payouts.
          </p>

          <div className="flex items-center justify-center gap-2 mb-10 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <span className="text-xs text-white/40 font-display uppercase tracking-wider">CA:</span>
            <span className="text-xs font-mono text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              Coming Soon
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleEnterCasino}
              className="btn-primary flex items-center gap-2 text-base"
            >
              Enter Casino
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleViewGames}
              className="btn-secondary flex items-center gap-2 text-base"
            >
              <Gamepad2 className="w-4 h-4 opacity-70" />
              View Games
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-6 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/15 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-display font-semibold text-white text-base mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-8 border-t border-white/5 bg-background-secondary/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <img 
              src="/assets/images/logo.png" 
              alt="SOL VEGAS" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-semibold text-sm neon-text">SOL VEGAS</span>
          </div>

          <div className="text-xs text-white/30 font-body">
            2026 Sol Vegas. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
              <span className="text-white/40 font-display">Solana Mainnet</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-display">Provably Fair</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
