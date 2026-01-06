import { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { getClusterUrl } from '../utils/constants';
import type { WalletError } from '@solana/wallet-adapter-base';
import toast from 'react-hot-toast';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

/**
 * Phantom-only wallet provider with robust error handling.
 * Uses SolanaWalletProvider with a single Phantom legacy adapter.
 */
export const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(() => getClusterUrl(), []);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // Robust error handler with debug logging and user feedback
  const handleError = useCallback((error: WalletError, adapter?: any) => {
    console.group('🔴 [Wallet Error]');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Adapter:', adapter?.name || 'Unknown');
    console.error('Stack:', error.stack);
    console.groupEnd();

    // User-facing error messages with actionable hints
    let userMessage = 'Wallet connection failed';
    let userHint = '';

    if (error.name === 'WalletNotReadyError') {
      userMessage = 'Phantom wallet not found';
      userHint = 'Please install the Phantom browser extension';
    } else if (error.name === 'WalletConnectionError') {
      userMessage = 'Failed to connect to Phantom';
      userHint = 'Make sure Phantom is unlocked and try again';
      // Clear saved selection so the next click is a clean user-gesture connect
      try {
        localStorage.removeItem('walletName');
      } catch {
        // ignore
      }
    } else if (error.name === 'WalletNotConnectedError') {
      userMessage = 'Wallet not connected';
      userHint = 'Please connect your wallet first';
    } else if (error.message?.includes('User rejected')) {
      userMessage = 'Connection rejected';
      userHint = 'Please approve the connection in Phantom';
    } else {
      // Generic error
      userMessage = 'Wallet error';
      userHint = error.message || 'Please try again';
    }

    // Show toast with error details
    toast.error(
      <div>
        <div className="font-semibold">{userMessage}</div>
        {userHint && <div className="text-sm mt-1 opacity-90">{userHint}</div>}
      </div>,
      {
        duration: 5000,
        id: 'wallet-error', // Prevent duplicate toasts
      }
    );
  }, []);

  // IMPORTANT: do NOT autoConnect here.
  // In Chromium forks (e.g., Vivaldi) Phantom often will not show the unlock popup
  // if connect is triggered without a direct user gesture, which surfaces as
  // WalletConnectionError: Unexpected error. We only connect on user click.

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false} onError={handleError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
