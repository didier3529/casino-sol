import { PublicKey } from '@solana/web3.js';

/**
 * Operator gating utilities
 * 
 * For PRODUCTION: Only show operator tools to allowlisted wallets
 * For DEVELOPMENT: Still require allowlist (strict operator mode)
 */

/**
 * Check if operator tools should be available at all in this build
 */
export function isOperatorBuildEnabled(): boolean {
  // In development, always allow operator tools
  if (import.meta.env.DEV) {
    return true;
  }
  
  // In production, only if explicitly enabled via build flag
  return import.meta.env.VITE_OPERATOR_BUILD === 'true';
}

/**
 * Get list of allowed operator wallet addresses
 */
export function getOperatorWallets(): string[] {
  const walletsEnv = import.meta.env.VITE_OPERATOR_WALLETS || '';
  
  if (!walletsEnv) {
    return [];
  }
  
  // Parse comma-separated list
  return walletsEnv
    .split(',')
    .map((addr: string) => addr.trim())
    .filter((addr: string) => addr.length > 0);
}

/**
 * Check if the given wallet is authorized as an operator
 */
export function isOperatorWallet(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) {
    return false;
  }
  
  // If operator build is not enabled, no one is an operator
  if (!isOperatorBuildEnabled()) {
    return false;
  }
  
  const allowedWallets = getOperatorWallets();
  
  // Strict mode: if no wallets specified, nobody is an operator (even in dev).
  // This prevents accidentally exposing operator tools on local dev setups.
  if (allowedWallets.length === 0) {
    return false;
  }
  
  // Check if wallet is in allowlist
  return allowedWallets.some(allowed => {
    try {
      // Case-insensitive comparison of base58 addresses
      return allowed.toLowerCase() === walletAddress.toLowerCase();
    } catch {
      return false;
    }
  });
}

/**
 * Check if a PublicKey is an operator
 */
export function isOperatorPublicKey(publicKey: PublicKey | null | undefined): boolean {
  if (!publicKey) {
    return false;
  }
  return isOperatorWallet(publicKey.toBase58());
}

/**
 * Production-safe logging: only log in dev or operator builds
 */
export function operatorLog(message: string, ...args: any[]): void {
  if (import.meta.env.DEV || isOperatorBuildEnabled()) {
    console.log(`[OPERATOR] ${message}`, ...args);
  }
}

/**
 * Production-safe error logging: only log details in dev/operator builds
 */
export function operatorError(message: string, error: any): void {
  if (import.meta.env.DEV || isOperatorBuildEnabled()) {
    console.error(`[OPERATOR ERROR] ${message}`, error);
  } else {
    // In production public builds, only log generic messages
    console.error('An error occurred');
  }
}