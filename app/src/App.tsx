import { FC, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './components/WalletProvider';
import { TopNav, TabType } from './components/navigation/TopNav';
import { GamesPage } from './pages/GamesPage';
import { BuybackPage } from './pages/BuybackPage';
import { DeveloperPage } from './pages/DeveloperPage';
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PROGRAM_ID, NETWORK, getClusterUrl } from './utils/constants';

type AppView = 'landing' | 'app';

const App: FC = () => {
  const [appView, setAppView] = useState<AppView>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('games');

  const handleEnterApp = () => {
    setAppView('app');
  };

  const handleNavigateToTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleGoHome = () => {
    setAppView('landing');
  };

  return (
    <WalletProvider>
      {/* Global Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/5 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-secondary/5 blur-[100px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10">
          {/* Unified Navigation (Landing + App) */}
          <TopNav
            activeTab={activeTab}
            currentView={appView}
            onGoHome={handleGoHome}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (appView === 'landing') {
                setAppView('app');
              }
            }}
          />

          {appView === 'landing' ? (
            <LandingPage 
              onEnterApp={handleEnterApp}
              onNavigateToTab={handleNavigateToTab}
            />
          ) : (
            <>
              {/* Main Content Container */}
              <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
                {/* Network Info Banner */}
                <div className="glass-panel rounded-xl px-6 py-3 mb-8 inline-block">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-medium text-slate-400">Network:</span>{' '}
                      <span className="text-brand-accent uppercase font-semibold">{NETWORK}</span>
                    </div>
                    <div className="border-l border-white/10 pl-6">
                      <span className="font-medium text-slate-400">RPC:</span>{' '}
                      <span className="text-slate-500 font-mono text-xs">{getClusterUrl()}</span>
                    </div>
                    <div className="border-l border-white/10 pl-6">
                      <span className="font-medium text-slate-400">Program:</span>{' '}
                      <span className="text-slate-500 font-mono text-xs">
                        {PROGRAM_ID.toBase58().slice(0, 8)}...{PROGRAM_ID.toBase58().slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab Pages */}
                <div className="mt-8">
                  {activeTab === 'games' && <GamesPage />}
                  {activeTab === 'how' && <HowItWorksPage />}
                  {activeTab === 'buyback' && <BuybackPage />}
                  {activeTab === 'developer' && <DeveloperPage />}
                </div>
              </main>

              {/* Footer */}
              <footer className="py-12 border-t border-white/10 bg-[#020205]/80 mt-16">
                <div className="max-w-7xl mx-auto px-6 text-center">
                  <div className="text-xs text-slate-500 space-y-2">
                    <p>
                      Network: <span className="font-semibold text-brand-accent">{NETWORK}</span> • 
                      Program: <span className="font-mono">{PROGRAM_ID.toBase58().slice(0, 4)}...{PROGRAM_ID.toBase58().slice(-4)}</span>
                    </p>
                  </div>
                </div>
              </footer>
            </>
          )}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#00ff9d',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ff003c',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </div>
    </WalletProvider>
  );
};

export default App;
