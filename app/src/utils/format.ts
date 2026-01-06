/**
 * UI formatting utilities
 * Converts blockchain types (BN, PublicKey, lamports) to display-safe strings
 */

import BN from 'bn.js';

/**
 * Format lamports to SOL with fixed decimals
 * @param lamports - lamports as string (from BN.toString())
 * @param decimals - number of decimal places (default 4)
 * @returns formatted SOL string
 */
export function formatLamportsToSol(lamports: string | number, decimals: number = 4): string {
  const lamportsBn = typeof lamports === 'string' ? new BN(lamports) : new BN(lamports);
  const solBn = lamportsBn.div(new BN(1_000_000_000));
  const remainderBn = lamportsBn.mod(new BN(1_000_000_000));
  
  const solWhole = solBn.toString();
  const remainderStr = remainderBn.toString().padStart(9, '0');
  const fractional = remainderStr.slice(0, decimals);
  
  return `${solWhole}.${fractional}`;
}

/**
 * Calculate coinflip payout in lamports (1.96x multiplier)
 * Uses BigInt for precision without floating point errors
 * @param betLamports - bet amount in lamports as string
 * @returns payout in lamports as string
 */
export function calcCoinflipPayoutLamports(betLamports: string): string {
  try {
    const bet = BigInt(betLamports);
    // On-chain uses: (bet_amount * 19600) / 10000 = bet * 1.96
    const payout = (bet * BigInt(19600)) / BigInt(10000);
    return payout.toString();
  } catch {
    return '0';
  }
}

/**
 * Calculate the maximum bet (lamports) allowed given vault liquidity.
 *
 * IMPORTANT: matches on-chain check in `place_bet`:
 *   require!(vault_balance >= potential_payout)
 * where:
 *   potential_payout = (bet_amount * COINFLIP_PAYOUT_MULTIPLIER_BP) / BASIS_POINTS
 *
 * So:
 *   bet_amount <= vault_balance * BASIS_POINTS / COINFLIP_PAYOUT_MULTIPLIER_BP
 */
export function calcCoinflipMaxBetFromVaultLamports(vaultLamports: string): string {
  try {
    const vault = BigInt(vaultLamports);
    const maxBet =
      (vault * BigInt(BASIS_POINTS)) / BigInt(COINFLIP_PAYOUT_MULTIPLIER_BP);
    return maxBet.toString();
  } catch {
    return '0';
  }
}

/**
 * Calculate coinflip payout in SOL
 * @param betLamports - bet amount in lamports as string
 * @param decimals - number of decimal places (default 4)
 * @returns payout in SOL as string
 */
export function calcCoinflipPayoutSol(betLamports: string, decimals: number = 4): string {
  const payoutLamports = calcCoinflipPayoutLamports(betLamports);
  return formatLamportsToSol(payoutLamports, decimals);
}

/**
 * Shorten a public key for display
 * @param pubkey - base58 public key string
 * @param prefixLen - number of chars to show at start (default 4)
 * @param suffixLen - number of chars to show at end (default 4)
 * @returns shortened pubkey like "AbCd...XyZ1"
 */
export function shortPubkey(pubkey: string, prefixLen: number = 4, suffixLen: number = 4): string {
  if (!pubkey || pubkey.length <= prefixLen + suffixLen) {
    return pubkey;
  }
  return `${pubkey.slice(0, prefixLen)}...${pubkey.slice(-suffixLen)}`;
}

/**
 * On-chain constants (match program state/mod.rs)
 */
export const BASIS_POINTS = 10000;

// CoinFlip
export const COINFLIP_WIN_PROBABILITY_BP = 4800; // 48%
export const COINFLIP_PAYOUT_MULTIPLIER_BP = 19600; // 1.96x

// Dice
export const DICE_PAYOUT_MULTIPLIER_BP = 50000; // 5.0x (exact match)
export const DICE_WIN_PROBABILITY_BP = 278; // ~2.78% (1/36 for exact match)

// Slots
export const SLOTS_PAYOUT_MULTIPLIER_BP = 100000; // 10.0x (3-of-a-kind)
export const SLOTS_WIN_PROBABILITY_BP = 1000; // 10% (1/10 for each reel)

/**
 * Get win probability as percentage string
 */
export function getCoinflipWinProbability(): string {
  return `${COINFLIP_WIN_PROBABILITY_BP / 100}%`;
}

/**
 * Get payout multiplier as formatted string
 */
export function getCoinflipPayoutMultiplier(): string {
  return `${(COINFLIP_PAYOUT_MULTIPLIER_BP / 10000).toFixed(2)}x`;
}

/**
 * Calculate dice payout in lamports (5x multiplier for exact match)
 */
export function calcDicePayoutLamports(betLamports: string): string {
  try {
    const bet = BigInt(betLamports);
    const payout = (bet * BigInt(DICE_PAYOUT_MULTIPLIER_BP)) / BigInt(BASIS_POINTS);
    return payout.toString();
  } catch {
    return '0';
  }
}

/**
 * Get dice win probability as percentage string
 */
export function getDiceWinProbability(): string {
  return `${(DICE_WIN_PROBABILITY_BP / 100).toFixed(2)}%`;
}

/**
 * Get dice payout multiplier as formatted string
 */
export function getDicePayoutMultiplier(): string {
  return `${(DICE_PAYOUT_MULTIPLIER_BP / 10000).toFixed(1)}x`;
}

/**
 * Calculate slots payout in lamports (10x multiplier for 3-of-a-kind)
 */
export function calcSlotsPayoutLamports(betLamports: string): string {
  try {
    const bet = BigInt(betLamports);
    const payout = (bet * BigInt(SLOTS_PAYOUT_MULTIPLIER_BP)) / BigInt(BASIS_POINTS);
    return payout.toString();
  } catch {
    return '0';
  }
}

/**
 * Get slots win probability as percentage string
 */
export function getSlotsWinProbability(): string {
  return `${(SLOTS_WIN_PROBABILITY_BP / 100).toFixed(0)}%`;
}

/**
 * Get slots payout multiplier as formatted string
 */
export function getSlotsPayoutMultiplier(): string {
  return `${(SLOTS_PAYOUT_MULTIPLIER_BP / 10000).toFixed(1)}x`;
}

