import { PublicKey } from '@solana/web3.js';

export interface ErrorContext {
  action: string;
  wallet?: PublicKey;
  cluster?: string;
  txSignature?: string;
  betAmount?: number | string;
  choice?: number;
  pdas?: {
    casino?: string;
    vault?: string;
    session?: string;
  };
}

/**
 * Comprehensive error logger for screenshot-friendly console output
 * Follows the plan requirement for explicit, actionable error messages
 */
export function logTransactionError(context: ErrorContext, error: any): void {
  console.error(`\n${'='.repeat(80)}`);
  console.error(`🚨 ${context.action.toUpperCase()} TRANSACTION FAILED`);
  console.error(`${'='.repeat(80)}\n`);
  
  // Context information
  console.error('📍 Context:');
  console.error('  Action:', context.action);
  if (context.wallet) {
    console.error('  Wallet:', context.wallet.toBase58());
  }
  if (context.cluster) {
    console.error('  Cluster:', context.cluster);
  }
  if (context.txSignature) {
    console.error('  Transaction Signature:', context.txSignature);
  }
  if (context.betAmount !== undefined) {
    if (typeof context.betAmount === 'number') {
      console.error('  Bet Amount:', context.betAmount, 'lamports (', context.betAmount / 1e9, 'SOL)');
    } else {
      console.error('  Bet Amount:', context.betAmount, 'lamports');
    }
  }
  if (context.choice !== undefined) {
    console.error('  Choice:', context.choice === 0 ? 'Heads (0)' : 'Tails (1)');
  }
  
  // PDA information
  if (context.pdas) {
    console.error('\n🔑 PDAs:');
    if (context.pdas.casino) console.error('  Casino PDA:', context.pdas.casino);
    if (context.pdas.vault) console.error('  Vault PDA:', context.pdas.vault);
    if (context.pdas.session) console.error('  Session PDA:', context.pdas.session);
  }
  
  // Error details
  console.error('\n❌ Error Details:');
  console.error('  Error Type:', error?.constructor?.name || 'Unknown');
  console.error('  Error Message:', error?.message || 'No message');
  
  // Parse Anchor errors
  if (error?.logs) {
    console.error('\n📜 Transaction Logs:');
    error.logs.forEach((log: string, i: number) => {
      console.error(`    ${i + 1}. ${log}`);
    });
  }
  
  // Detect common error patterns
  console.error('\n🔍 Diagnosis:');
  const errorMsg = (error?.message || '').toLowerCase();
  const errorLogs = (error?.logs || []).join(' ').toLowerCase();
  const combinedError = errorMsg + ' ' + errorLogs;
  
  if (combinedError.includes('insufficient funds') || combinedError.includes('insufficient lamports')) {
    console.error('  ⚠️  INSUFFICIENT FUNDS');
    console.error('  💡 Solution: Player needs more SOL for bet + transaction fees + rent');
    console.error('  💡 Minimum needed: Bet amount + 0.01 SOL buffer');
  } else if (combinedError.includes('program id mismatch') || combinedError.includes('declaredprogramidmismatch')) {
    console.error('  ⚠️  PROGRAM ID MISMATCH');
    console.error('  💡 Critical Issue: The Program ID in your code doesn\'t match the deployed program!');
    console.error('  💡 Causes:');
    console.error('      1. Anchor.toml has different ID than app/src/utils/constants.ts');
    console.error('      2. programs/casino/src/lib.rs declare_id!() not synced');
    console.error('      3. Deployed a different program than what code expects');
    console.error('  💡 Solution:');
    console.error('      1. Run: anchor keys sync');
    console.error('      2. Update app/src/utils/constants.ts with correct PROGRAM_ID');
    console.error('      3. Ensure all three files have SAME Program ID:');
    console.error('         - Anchor.toml [programs.localnet]');
    console.error('         - programs/casino/src/lib.rs declare_id!()');
    console.error('         - app/src/utils/constants.ts PROGRAM_ID');
  } else if (combinedError.includes('invalid instruction') || combinedError.includes('unknown instruction')) {
    console.error('  ⚠️  INVALID/UNKNOWN INSTRUCTION');
    console.error('  💡 Possible causes:');
    console.error('      1. IDL mismatch - frontend IDL doesn\'t match deployed program');
    console.error('      2. Wrong instruction discriminator');
    console.error('      3. Instruction arguments don\'t match program expectations');
    console.error('  💡 Solution:');
    console.error('      1. Ensure app/src/idl/casino.json matches deployed program');
    console.error('      2. Rebuild program if needed: anchor build');
    console.error('      3. Check that IDL was generated after last code change');
  } else if (combinedError.includes('account not found') || combinedError.includes('accountnotfound')) {
    console.error('  ⚠️  ACCOUNT NOT FOUND');
    console.error('  💡 Possible causes:');
    console.error('      - Wrong Program ID (check constants.ts matches Anchor.toml)');
    console.error('      - PDA derivation mismatch (seeds don\'t match Rust program)');
    console.error('      - Casino not initialized');
    console.error('  💡 Solution: Check Program IDs are synced (see Program ID Mismatch above)');
  } else if (combinedError.includes('constraint')) {
    console.error('  ⚠️  CONSTRAINT VIOLATION');
    console.error('  💡 Possible causes:');
    console.error('      - Wrong signer (wallet doesn\'t match expected authority)');
    console.error('      - Casino paused');
    console.error('      - Session already resolved');
    console.error('      - Invalid bet amount (below min or above max)');
  } else if (combinedError.includes('blockhash') || combinedError.includes('block height exceeded')) {
    console.error('  ⚠️  BLOCKHASH EXPIRED');
    console.error('  💡 Solution: Transaction took too long, retry immediately');
  } else if (combinedError.includes('simulation failed')) {
    console.error('  ⚠️  SIMULATION FAILED');
    console.error('  💡 Possible causes:');
    console.error('      - Insufficient balance');
    console.error('      - Invalid instruction data');
    console.error('      - Account ownership issues');
    console.error('  💡 Check logs above for specific error');
  } else if (combinedError.includes('invalid choice')) {
    console.error('  ⚠️  INVALID CHOICE');
    console.error('  💡 Choice must be 0 (Heads) or 1 (Tails)');
  } else if (combinedError.includes('invalid bet amount')) {
    console.error('  ⚠️  INVALID BET AMOUNT');
    console.error('  💡 Bet must be between min and max bet amounts');
    console.error('  💡 Check casino config for limits');
  } else if (combinedError.includes('casino paused')) {
    console.error('  ⚠️  CASINO PAUSED');
    console.error('  💡 Casino is in maintenance mode');
  } else {
    console.error('  ⚠️  UNKNOWN ERROR');
    console.error('  💡 Check error message and logs above');
    console.error('  💡 If PDA-related, verify seeds match Rust program exactly');
  }
  
  // Full error object
  console.error('\n📦 Full Error Object:');
  try {
    console.error(JSON.stringify(error, null, 2));
  } catch {
    console.error(error);
  }
  
  console.error(`\n${'='.repeat(80)}\n`);
}

/**
 * Success logger for positive confirmation
 */
export function logTransactionSuccess(
  action: string,
  txSignature: string,
  details?: Record<string, any>
): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ ${action.toUpperCase()} SUCCESS`);
  console.log(`${'='.repeat(80)}\n`);
  console.log('  Transaction Signature:', txSignature);
  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      console.log(`  ${key}:`, value);
    });
  }
  console.log(`\n${'='.repeat(80)}\n`);
}

/**
 * Get user-friendly error message for toasts
 */
export function getUserFriendlyError(error: any): string {
  const errorMsg = (error?.message || '').toLowerCase();
  const errorLogs = (error?.logs || []).join(' ').toLowerCase();
  const combined = errorMsg + ' ' + errorLogs;
  
  if (combined.includes('program id mismatch') || combined.includes('declaredprogramidmismatch')) {
    return 'Program ID mismatch - check setup guide (F12 console for details)';
  } else if (combined.includes('invalid instruction') || combined.includes('unknown instruction')) {
    return 'IDL mismatch - program and frontend out of sync (F12 console for details)';
  } else if (combined.includes('insufficient funds') || combined.includes('insufficient lamports')) {
    return 'Insufficient SOL balance for bet + fees';
  } else if (combined.includes('account not found')) {
    return 'Account not found - check program ID sync (F12 console for details)';
  } else if (combined.includes('constraint')) {
    return 'Transaction constraint failed';
  } else if (combined.includes('blockhash')) {
    return 'Transaction expired - please retry';
  } else if (combined.includes('invalid choice')) {
    return 'Invalid choice - must be Heads or Tails';
  } else if (combined.includes('invalid bet amount')) {
    return 'Invalid bet amount';
  } else if (combined.includes('casino paused')) {
    return 'Casino is currently paused';
  } else if (combined.includes('simulation failed')) {
    return 'Transaction simulation failed - check console (F12)';
  } else {
    return error?.message || 'Transaction failed - check console (F12) for details';
  }
}

