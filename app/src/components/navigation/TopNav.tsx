import { FC } from 'react';
import { Gamepad2, Flame, Terminal, BookOpen, Home, Github } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { isLocalEnvironment } from '../../utils/isLocal';

export type TabType = 'home' | 'games' | 'how' | 'buyback' | 'developer';
export type TopNavView = 'landing' | 'app';

interface TopNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onGoHome?: () => void;
  currentView?: TopNavView;
}

export const TopNav: FC<TopNavProps> = ({ activeTab, onTabChange, onGoHome, currentView = 'app' }) => {
  const showDeveloper = isLocalEnvironment();

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'how', label: 'How it works', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'buyback', label: 'Buyback & Burn', icon: <Flame className="w-4 h-4" /> },
  ];

  if (showDeveloper) {
    tabs.push({ id: 'developer', label: 'Developer', icon: <Terminal className="w-4 h-4" /> });
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav h-14 transition-all duration-300">
      <div className="flex h-full max-w-7xl mx-auto px-6 items-center justify-between">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 group cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img 
            src="/assets/images/logo.jpg" 
            alt="SOL VEGAS" 
            className="w-8 h-8 object-contain"
          />
          <span className="font-display font-semibold text-white text-base tracking-tight">SOL VEGAS</span>
        </button>

        <div className="flex-1 flex items-center justify-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 font-display
                ${currentView !== 'landing' && activeTab === tab.id
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="https://x.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a 
            href="https://github.com/didier3529/casino-sol" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <Github className="w-4 h-4" />
          </a>
          <WalletMultiButton className="wallet-adapter-button-trigger" />
        </div>
      </div>
    </nav>
  );
};
