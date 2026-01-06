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
      <div className="min-h-screen relative bg-background">
        <TopNav
          activeTab={activeTab}
          currentView={appView}
          onGoHome={handleGoHome}
          onTabChange={(tab) => {
            if (tab === 'home') {
              setAppView('landing');
            } else {
              setActiveTab(tab);
              if (appView === 'landing') {
                setAppView('app');
              }
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
            <main className="max-w-7xl mx-auto px-6 pt-20 pb-12">
              <div className="glass-card px-5 py-3 mb-8 inline-flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 font-display">Network</span>
                  <span className="text-xs text-accent font-display font-semibold uppercase">{NETWORK}</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 font-display">RPC</span>
                  <span className="text-xs text-white/50 font-mono">{getClusterUrl().slice(0, 30)}...</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 font-display">Program</span>
                  <span className="text-xs text-white/50 font-mono">
                    {PROGRAM_ID.toBase58().slice(0, 6)}...{PROGRAM_ID.toBase58().slice(-6)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                {activeTab === 'games' && <GamesPage />}
                {activeTab === 'how' && <HowItWorksPage />}
                {activeTab === 'buyback' && <BuybackPage />}
                {activeTab === 'developer' && <DeveloperPage />}
              </div>
            </main>

            <footer className="py-8 border-t border-white/5 bg-background-secondary/50">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="text-xs text-white/30 font-body space-x-4">
                  <span>Network: <span className="text-accent font-medium">{NETWORK}</span></span>
                  <span>|</span>
                  <span className="font-mono">{PROGRAM_ID.toBase58().slice(0, 8)}...{PROGRAM_ID.toBase58().slice(-8)}</span>
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
              background: 'rgba(12, 12, 18, 0.95)',
              color: '#FAFAFA',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '14px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#34D399',
                secondary: '#FAFAFA',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#F87171',
                secondary: '#FAFAFA',
              },
            },
          }}
        />
      </div>
    </WalletProvider>
  );
};

export default App;
