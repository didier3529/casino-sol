import { FC } from 'react';
import { 
  ArrowRight, Gamepad2, Gem, Twitter, Github, Terminal
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

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="overflow-hidden md:pt-48 z-10 pt-36 px-6 pb-32 relative">
        <div className="flex flex-col z-20 text-center max-w-full mx-auto items-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-accent/20 bg-brand-accent/5 text-brand-accent text-xs font-semibold tracking-wide mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
            </span>
            PROVABLY FAIR ON-CHAIN CASINO
          </div>

          {/* Preview Image */}
          {/* TODO: Replace placeholder with actual preview image/screenshot from casino-solitaire/app/src/assets/landing/hero-preview.png */}
          <div className="relative w-full max-w-4xl aspect-video bg-black/40 rounded-2xl border border-white/10 shadow-fabulous backdrop-blur-sm mb-12 overflow-hidden mx-auto group">
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🎰
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/10 via-transparent to-brand-accent/10 pointer-events-none"></div>
          </div>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Experience the first fully non-custodial casino on Solana. Instant
            settlements, verifiable randomness, and direct-to-wallet payouts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleEnterCasino}
              className="w-full sm:w-auto h-12 px-8 bg-fabulous hover:brightness-110 transition-all duration-300 flex font-semibold text-black rounded-lg shadow-fabulous gap-2 items-center justify-center"
            >
              Enter Casino
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleViewGames}
              className="w-full sm:w-auto h-12 px-8 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 text-slate-300" />
              View Games
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#020205] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-accent to-blue-600 flex items-center justify-center text-black font-bold">
              <Gem className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">SOL VEGAS</span>
          </div>

          <div className="text-xs text-slate-500">
            © 2024 Sol Vegas Casino. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Terminal className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

