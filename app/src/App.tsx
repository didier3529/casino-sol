import { FC, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './components/WalletProvider';
import { TopNav, TabType } from './components/navigation/TopNav';
import { GamesPage } from './pages/GamesPage';
import { BuybackPage } from './pages/BuybackPage';
import { DeveloperPage } from './pages/DeveloperPage';
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PROGRAM_ID, NETWORK } from './utils/constants';
import { useCasino } from './hooks/useCasino';
import { useWallet } from '@solana/wallet-adapter-react';
import { CheckCircle, Vault, Landmark, ExternalLink, Shield } from 'lucide-react';

type AppView = 'landing' | 'app';

const StatusBar: FC = () => {
  const { fetchVaultBalance, fetchCasino, program } = useCasino();
  const { connected } = useWallet();
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);

  useEffect(() => {
    const loadBalances = async () => {
      if (!program) return;
      
      try {
        const vault = await fetchVaultBalance();
        if (typeof vault === 'number') {
          setVaultBalance(vault / 1e9);
        }
        
        const casino = await fetchCasino();
        if (casino && (casino as any).treasuryBalance) {
          setTreasuryBalance(Number((casino as any).treasuryBalance) / 1e9);
        }
      } catch {
        // Silently fail - balances will show as ---
      }
    };
    
    loadBalances();
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [program, connected]);

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-success/20 bg-success/5">
        <CheckCircle className="w-3.5 h-3.5 text-success" />
        <span className="text-xs font-display font-medium text-success">Live on {NETWORK}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
          <Vault className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-white/50 font-display">Vault:</span>
          <span className="text-xs font-mono text-white font-medium">
            {vaultBalance !== null ? `${vaultBalance.toFixed(2)} SOL` : '---'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
          <Landmark className="w-3.5 h-3.5 text-gold" />
          <span className="text-xs text-white/50 font-display">Treasury:</span>
          <span className="text-xs font-mono text-white font-medium">
            {treasuryBalance !== null ? `${treasuryBalance.toFixed(4)} SOL` : '---'}
          </span>
        </div>
      </div>

      <a 
        href={`https://solscan.io/account/${PROGRAM_ID.toBase58()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-accent transition-colors font-mono"
      >
        <span>{PROGRAM_ID.toBase58().slice(0, 4)}...{PROGRAM_ID.toBase58().slice(-4)}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};

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
              <StatusBar />

              <div className="mt-6">
                {activeTab === 'games' && <GamesPage />}
                {activeTab === 'how' && <HowItWorksPage />}
                {activeTab === 'buyback' && <BuybackPage />}
                {activeTab === 'developer' && <DeveloperPage />}
              </div>
            </main>

            <footer className="py-8 border-t border-white/5 bg-background-secondary/50">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <img 
                    src="/assets/images/logo.jpg" 
                    alt="SOL VEGAS" 
                    className="w-6 h-6 object-contain"
                  />
                  <span className="font-display font-medium text-white/60 text-xs">SOL VEGAS</span>
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
