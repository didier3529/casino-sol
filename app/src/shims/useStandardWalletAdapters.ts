import type { Adapter } from '@solana/wallet-adapter-base';

// Shim that bypasses Wallet Standard auto-injection.
// Returns the provided adapters unchanged.
export function useStandardWalletAdapters(adapters: Adapter[]) {
  return adapters;
}




