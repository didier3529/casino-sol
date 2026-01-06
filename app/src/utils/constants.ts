import { PublicKey, clusterApiUrl } from '@solana/web3.js';

// Program IDs synced with Anchor.toml
const PROGRAM_IDS = {
  localnet: 'AUqeYqxd7bAtrvyu7icRVgfLBa8i5jiS9QiHx6WfUhpf', // from keypair
  devnet: 'CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma',   // deployed
  'mainnet-beta': 'CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma', // TBD
};

// Select program ID based on network
const getProgramId = (): string => {
  const network = import.meta.env.VITE_NETWORK || 'devnet';
  return PROGRAM_IDS[network as keyof typeof PROGRAM_IDS] || PROGRAM_IDS.devnet;
};

export const PROGRAM_ID = new PublicKey(getProgramId());

// PDA Seeds (must match Rust program)
// Using TextEncoder for browser compatibility (no Buffer needed)
const encoder = new TextEncoder();
export const CASINO_SEED = encoder.encode('casino');
export const VAULT_SEED = encoder.encode('vault');
export const SESSION_SEED = encoder.encode('session');

// Network configuration
export const NETWORK = import.meta.env.VITE_NETWORK || 'devnet';

export function getClusterUrl(): string {
  // Allow custom RPC URL via environment variable
  const customRpc = import.meta.env.VITE_RPC_URL;
  if (customRpc) {
    return customRpc;
  }

  switch (NETWORK) {
    case 'mainnet':
      return clusterApiUrl('mainnet-beta');
    case 'devnet':
      return clusterApiUrl('devnet');
    case 'localnet':
    default:
      return 'http://localhost:8899';
  }
}

// Game constants
export const BASIS_POINTS = 10000;
export const WIN_PROBABILITY_BP = 4800; // 48%
export const PAYOUT_MULTIPLIER_BP = 19600; // 1.96x

// Calculate expected payout for a bet amount
export function calculatePayout(betAmount: number): number {
  return Math.floor((betAmount * PAYOUT_MULTIPLIER_BP) / BASIS_POINTS);
}

// Switchboard VRF (for devnet)
// TODO: Set actual Switchboard function account for devnet
export const SWITCHBOARD_FUNCTION = null; // Will be set for devnet deployment

/**
 * PROGRAM ID SYNC PROCESS:
 * 
 * 1. Build the program:
 *    anchor build
 * 
 * 2. Sync program IDs:
 *    anchor keys sync
 * 
 * 3. Check Anchor.toml [programs.localnet] section for the program ID
 * 
 * 4. Update PROGRAM_ID constant above
 * 
 * 5. Rebuild frontend:
 *    cd app && npm run build
 */

