import { FC } from 'react';
import { Gem, Gamepad2, Flame, Terminal, Home, BookOpen } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { isLocalEnvironment } from '../../utils/isLocal';

export type TabType = 'games' | 'how' | 'buyback' | 'developer';
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
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'how', label: 'How it works', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'buyback', label: 'Buyback & Burn', icon: <Flame className="w-4 h-4" /> },
  ];

  if (showDeveloper) {
    tabs.push({ id: 'developer', label: 'Developer', icon: <Terminal className="w-4 h-4" /> });
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav h-16 transition-all duration-300">
      <div className="flex h-full max-w-7xl mx-auto px-6 items-center justify-between">
        {/* Logo - Clickable to return home */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-accent to-blue-600 flex items-center justify-center">
            <Gem className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-white text-lg">SOL VEGAS</span>
        </button>

        {/* Center Navigation */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {/* Home Button */}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          )}
          
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
                ${currentView !== 'landing' && activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Wallet Button */}
        <WalletMultiButton className="!bg-white/5 hover:!bg-white/10 !border !border-white/10 !text-sm !font-medium !rounded-full !transition-all !duration-300" />
      </div>
    </nav>
  );
};

