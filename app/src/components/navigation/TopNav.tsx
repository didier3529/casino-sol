import { FC } from 'react';
import { Gamepad2, Flame, Terminal, BookOpen, Home } from 'lucide-react';
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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-gold flex items-center justify-center">
            <span className="text-black font-bold text-sm font-display">SV</span>
          </div>
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

        <WalletMultiButton className="wallet-adapter-button-trigger" />
      </div>
    </nav>
  );
};
