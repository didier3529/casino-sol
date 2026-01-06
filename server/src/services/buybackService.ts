import { Connection, PublicKey, Keypair, Transaction, VersionedTransaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { getDatabase } from '../database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { 
  getJupiterQuote, 
  executeSwap,
  burnTokens as burnTokensJupiter
} from '../utils/jupiter';
import { getPumpPortalClient } from './pumpPortalClient';
import { burnTokens, getTokenBalance } from '../utils/tokenBurn';

interface BuybackConfig {
  id: number;
  token_mint: string;
  treasury_address: string;
  min_vault_reserve: string;
  max_spend_per_interval: string;
  interval_seconds: number;
  slippage_bps: number;
  is_active: boolean;
  dry_run: boolean;
  last_run_at: Date | null;
  execution_mode?: string; // 'pumpfun' | 'jupiter'
  pumpfun_mint?: string; // Token mint for Pump.fun phase
  pumpfun_enabled_until_migration?: boolean;
}

interface BuybackResult {
  success: boolean;
  solSpent?: number;
  tokenBought?: number;
  transactionSignature?: string;
  error?: string;
}

interface BuybackOptions {
  ignoreCooldown?: boolean;
  minManualSpacingSeconds?: number;
}

// Constants for vault and treasury minimums
const VAULT_RESERVE_SOL = 0.5; // Always keep 0.5 SOL in vault for gameplay
const TREASURY_RENT_MIN_LAMPORTS = 890880; // ~0.00089 SOL rent-exempt minimum to keep PDA alive

export class BuybackService {
  private connection: Connection;
  private authorityKeypair: Keypair | null = null;
  private casinoProgram: any = null; // AnchorProgram type

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    
    // Load authority keypair if available
    const authorityPrivateKey = process.env.AUTHORITY_PRIVATE_KEY;
    if (authorityPrivateKey) {
      try {
        const secretKey = JSON.parse(authorityPrivateKey);
        this.authorityKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        logger.info(`Buyback service initialized with authority: ${this.authorityKeypair.publicKey.toBase58()}`);
      } catch (error) {
        logger.error('Failed to parse AUTHORITY_PRIVATE_KEY:', error);
      }
    } else {
      logger.warn('AUTHORITY_PRIVATE_KEY not set - buyback service will run in dry-run mode only');
    }
  }

  /**
   * Check if buyback should run based on config
   */
  async shouldRunBuyback(options: BuybackOptions = {}): Promise<{ should: boolean; reason: string; config?: BuybackConfig }> {
    const db = getDatabase();
    
    try {
      const configs = await db<BuybackConfig>('buyback_config').select('*').limit(1);
      
      if (configs.length === 0) {
        return { should: false, reason: 'No buyback config found' };
      }
      
      const config = configs[0];
      
      if (!config.is_active) {
        return { should: false, reason: 'Buyback is not active', config };
      }
      
      // Check if enough time has passed since last run
      if (config.last_run_at) {
        const timeSinceLastRun = Date.now() - new Date(config.last_run_at).getTime();
        
        // Use different cooldown for manual runs vs auto runs
        const cooldownMs = options.ignoreCooldown && options.minManualSpacingSeconds !== undefined
          ? options.minManualSpacingSeconds * 1000
          : config.interval_seconds * 1000;
        
        if (timeSinceLastRun < cooldownMs) {
          const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastRun) / 1000);
          return { 
            should: false, 
            reason: `Cooldown active: ${remainingSeconds}s remaining`,
            config 
          };
        }
      }
      
      return { should: true, reason: 'Ready to run', config };
    } catch (error) {
      logger.error('Error checking buyback status:', error);
      return { should: false, reason: `Error: ${error}` };
    }
  }

  /**
   * Execute buyback flow
   */
  async executeBuyback(options: BuybackOptions = {}): Promise<BuybackResult> {
    const { should, reason, config: buybackConfig } = await this.shouldRunBuyback(options);
    
    if (!should || !buybackConfig) {
      logger.info(`Buyback skipped: ${reason}`);
      return { success: false, error: reason };
    }
    
    logger.info('Starting buyback execution...');
    
    try {
      // Step 1: Get vault and treasury PDAs
      // IMPORTANT: Must match on-chain seeds:
      // - casino PDA:  ["casino"]
      // - vault PDA:   ["vault", casino_pda]
      // - treasury PDA:["treasury", casino_pda]
      const programId = new PublicKey(config.solana.casinoProgram);
      const [casinoPDA] = PublicKey.findProgramAddressSync([Buffer.from('casino')], programId);
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), casinoPDA.toBuffer()],
        programId
      );
      const [treasuryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury'), casinoPDA.toBuffer()],
        programId
      );

      logger.info(`Casino PDA: ${casinoPDA.toBase58()}`);
      logger.info(`Vault PDA: ${vaultPDA.toBase58()}`);
      logger.info(`Treasury PDA: ${treasuryPDA.toBase58()}`);
      
      // Step 2: Check balances
      const vaultBalance = await this.connection.getBalance(vaultPDA);
      const treasuryBalance = await this.connection.getBalance(treasuryPDA);
      const vaultReserveLamports = VAULT_RESERVE_SOL * 1e9; // 0.5 SOL fixed reserve
      const maxSpendLamports = parseFloat(buybackConfig.max_spend_per_interval) * 1e9;
      
      logger.info(`Vault balance: ${vaultBalance / 1e9} SOL`);
      logger.info(`Treasury balance: ${treasuryBalance / 1e9} SOL`);
      logger.info(`Vault reserve (fixed): ${VAULT_RESERVE_SOL} SOL`);
      logger.info(`Treasury rent-min: ${TREASURY_RENT_MIN_LAMPORTS / 1e9} SOL`);
      logger.info(`Max spend per interval: ${maxSpendLamports / 1e9} SOL`);
      
      // Step 3: Calculate how much we can skim from vault (anything above 0.5 SOL)
      const excessInVault = Math.max(0, vaultBalance - vaultReserveLamports);
      const amountToSkim = Math.min(excessInVault, maxSpendLamports);
      
      // Step 4: Calculate how much we can spend from treasury (keep rent-min)
      const treasurySpendable = Math.max(0, treasuryBalance - TREASURY_RENT_MIN_LAMPORTS);
      
      // If there's nothing to skim and nothing to spend, skip
      if (amountToSkim <= 0 && treasurySpendable <= 0) {
        logger.info('No excess SOL in vault and no spendable SOL in treasury');
        // Don't update last_run_at when there's nothing to do
        return { success: false, error: 'No excess SOL available in vault or treasury' };
      }
      
      if (amountToSkim > 0) {
        logger.info(`Will skim ${amountToSkim / 1e9} SOL from vault to treasury`);
      }
      if (treasurySpendable > 0) {
        const spendAmount = Math.min(treasurySpendable, maxSpendLamports);
        logger.info(`Will spend ${spendAmount / 1e9} SOL from treasury for buyback`);
      }
      
      // Dry run mode - log but don't execute
      if (buybackConfig.dry_run) {
        logger.info('[DRY RUN] Would execute buyback with:');
        if (amountToSkim > 0) {
          logger.info(`  - Skim: ${amountToSkim / 1e9} SOL from vault to treasury`);
        }
        const spendAmount = Math.min(treasurySpendable + amountToSkim, maxSpendLamports);
        if (spendAmount > 0) {
          logger.info(`  - Swap: ${spendAmount / 1e9} SOL for tokens`);
          logger.info(`  - Burn: tokens received`);
          logger.info(`  - Keep treasury rent-min: ${TREASURY_RENT_MIN_LAMPORTS / 1e9} SOL`);
        }
        
        await this.logBuybackEvent({
          sol_spent: spendAmount / 1e9,
          token_bought: 0,
          token_mint: buybackConfig.token_mint,
          transaction_signature: `dry-run-${Date.now()}`,
          status: 'success',
          error_message: 'Dry run - no actual transaction',
        });
        
        await this.updateLastRunTime(buybackConfig.id);
        return { success: true, solSpent: spendAmount / 1e9, tokenBought: 0, transactionSignature: 'dry-run' };
      }
      
      // Step 5: Check authority keypair
      if (!this.authorityKeypair) {
        throw new Error('Authority keypair not available - cannot execute real buyback');
      }

      // Determine execution mode
      const executionMode = buybackConfig.execution_mode || 'jupiter';
      logger.info(`Execution mode: ${executionMode}`);

      if (executionMode === 'pumpfun') {
        // ========== PUMP.FUN EXECUTION MODE ==========
        return await this.executePumpfunBuyback(buybackConfig, {
          vaultBalance,
          treasuryBalance,
          excessInVault,
          treasurySpendable,
          maxSpendLamports,
          vaultReserveLamports,
        });
      } else {
        // ========== JUPITER EXECUTION MODE ==========
        // Step 1: Skim excess from vault to treasury (if needed)
        const amountToSkim = Math.min(excessInVault, maxSpendLamports);
        if (amountToSkim > 0) {
          logger.info(`Attempting to skim ${amountToSkim / 1e9} SOL from vault to treasury...`);
          try {
            // NOTE: skim_excess_to_treasury instruction must be deployed to program first
            // If instruction not found, this will fail gracefully and continue with treasury balance
            await this.callSkimExcessToTreasury(amountToSkim, vaultReserveLamports);
            logger.info(`✅ Skimmed ${amountToSkim / 1e9} SOL to treasury`);
          } catch (error: any) {
            logger.warn(`Skim instruction failed (may not be deployed yet): ${error.message}`);
            logger.info('Continuing with existing treasury balance...');
          }
        }
        
        // Calculate spend amount from treasury (keep rent-min)
        const actualTreasurySpendable = Math.min(treasurySpendable, maxSpendLamports);
        
        if (actualTreasurySpendable <= 0) {
          logger.info('No spendable SOL in treasury after rent-min reserve');
          await this.updateLastRunTime(buybackConfig.id);
          return { success: false, error: 'No spendable SOL in treasury' };
        }
        
        // Get Jupiter quote
        const inputMint = 'So11111111111111111111111111111111111111112'; // SOL
        const outputMint = buybackConfig.token_mint;
        const spendAmount = actualTreasurySpendable;
        
        const quote = await getJupiterQuote({
          inputMint,
          outputMint,
          amount: spendAmount,
          slippageBps: buybackConfig.slippage_bps
        });
        
        if (!quote) {
          throw new Error('Failed to get Jupiter quote');
        }
        
        logger.info(`Jupiter quote received:`);
        logger.info(`  - Input: ${quote.inAmount} lamports SOL`);
        logger.info(`  - Output: ${quote.outAmount} tokens`);
        logger.info(`  - Price impact: ${quote.priceImpactPct}%`);
        
        // Validate price impact
        if (quote.priceImpactPct > 5) {
          throw new Error(`Price impact too high: ${quote.priceImpactPct}% (max 5%)`);
        }
        
        // Execute swap
        logger.info('Executing Jupiter swap...');
        const swapSignature = await executeSwap({
          quote,
          wallet: this.authorityKeypair!,
          connection: this.connection,
        });
        
        logger.info(`✅ Swap completed: ${swapSignature}`);
        
        // Get token balance to burn
        const tokenMint = new PublicKey(buybackConfig.token_mint);
        const tokenBalance = await getTokenBalance(
          this.connection,
          tokenMint,
          this.authorityKeypair!.publicKey
        );
        
        if (tokenBalance === 0) {
          throw new Error('No tokens received from swap');
        }
        
        logger.info(`Received ${tokenBalance} tokens, burning...`);
        
        // Burn tokens
        const burnResult = await burnTokens({
          connection: this.connection,
          payer: this.authorityKeypair!,
          tokenMint,
          amount: tokenBalance,
        });
        
        if (!burnResult.success) {
          throw new Error(`Token burn failed: ${burnResult.error}`);
        }
        
        logger.info(`✅ Tokens burned: ${burnResult.signature}`);
        
        // Log success
        await this.logBuybackEvent({
          sol_spent: spendAmount / 1e9,
          token_bought: tokenBalance,
          token_mint: buybackConfig.token_mint,
          transaction_signature: swapSignature,
          burn_signature: burnResult.signature,
          status: 'success',
          jupiter_quote_response: quote,
        });
        
        await this.updateLastRunTime(buybackConfig.id);
        
        return {
          success: true,
          solSpent: spendAmount / 1e9,
          tokenBought: tokenBalance,
          transactionSignature: swapSignature,
        };
      }
      
    } catch (error) {
      logger.error('Buyback execution failed:', error);
      
      await this.logBuybackEvent({
        sol_spent: 0,
        token_bought: 0,
        token_mint: buybackConfig.token_mint,
        transaction_signature: `error-${Date.now()}`,
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Call skim_excess_to_treasury instruction on-chain
   * Transfers excess SOL from vault to treasury PDA
   */
  private async callSkimExcessToTreasury(
    amount: number,
    minVaultReserve: number
  ): Promise<string> {
    if (!this.authorityKeypair) {
      throw new Error('Authority keypair not available');
    }

    // NOTE: This requires the skim_excess_to_treasury instruction to be deployed
    // If the instruction doesn't exist in the deployed program, this will throw
    
    // TODO: Load casino program with IDL and call:
    // const program = new Program(casinoIdl, programId, provider);
    // const tx = await program.methods
    //   .skimExcessToTreasury(new BN(amount), new BN(minVaultReserve))
    //   .accounts({
    //     casino: casinoPda,
    //     vault: vaultPda,
    //     treasury: treasuryPda,
    //     authority: this.authorityKeypair.publicKey,
    //     systemProgram: SystemProgram.programId,
    //   })
    //   .rpc();
    
    throw new Error('skim_excess_to_treasury instruction not yet deployed to program');
  }

  /**
   * Execute Pump.fun buyback using PumpPortal API
   */
  private async executePumpfunBuyback(
    buybackConfig: BuybackConfig,
    balances: {
      vaultBalance: number;
      treasuryBalance: number;
      excessInVault: number;
      treasurySpendable: number;
      maxSpendLamports: number;
      vaultReserveLamports: number;
    }
  ): Promise<BuybackResult> {
    try {
      logger.info('🚀 Starting Pump.fun buyback execution');

      const { excessInVault, treasurySpendable, maxSpendLamports } = balances;

      // Calculate total spendable (excess from vault + treasury spendable)
      // Respect max_spend_per_interval cap
      const totalAvailable = excessInVault + treasurySpendable;
      const spendAmount = Math.min(totalAvailable, maxSpendLamports);

      if (spendAmount <= 0) {
        logger.info('No SOL available to spend for Pump.fun buyback');
        return { success: false, error: 'No SOL available for buyback' };
      }

      logger.info(`Will spend ${spendAmount / 1e9} SOL on Pump.fun buyback`);
      logger.info(`  - Excess in vault: ${excessInVault / 1e9} SOL`);
      logger.info(`  - Treasury spendable: ${treasurySpendable / 1e9} SOL`);
      logger.info(`  - Max spend cap: ${maxSpendLamports / 1e9} SOL`);

      // Get token mint (use pumpfun_mint if available, fallback to token_mint)
      const tokenMint = new PublicKey(buybackConfig.pumpfun_mint || buybackConfig.token_mint);

      // Build buy transaction using PumpPortal
      const pumpPortalClient = getPumpPortalClient();
      const unsignedTx = await pumpPortalClient.buildBuyTransaction({
        authorityPublicKey: this.authorityKeypair!.publicKey.toBase58(),
        tokenMint: tokenMint.toBase58(),
        amountLamports: spendAmount,
        slippagePercent: 5, // 5% slippage (from plan)
        priorityFeeSol: 0.0005, // 0.0005 SOL priority fee (from plan)
      });

      logger.info('✅ PumpPortal transaction built successfully');

      // Sign the transaction
      if (unsignedTx instanceof VersionedTransaction) {
        unsignedTx.sign([this.authorityKeypair!]);
      } else {
        unsignedTx.sign(this.authorityKeypair!);
      }

      logger.info('✅ Transaction signed');

      // Send and confirm transaction
      let signature: string;
      if (unsignedTx instanceof VersionedTransaction) {
        signature = await this.connection.sendTransaction(unsignedTx, {
          skipPreflight: false, // Simulate first (from plan)
          maxRetries: 3,
        });
      } else {
        signature = await sendAndConfirmTransaction(
          this.connection,
          unsignedTx,
          [this.authorityKeypair!],
          {
            commitment: 'confirmed',
            skipPreflight: false,
          }
        );
      }

      logger.info(`✅ Pump.fun buy transaction confirmed: ${signature}`);

      // Wait a moment for the transaction to settle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check token balance to see how many tokens we received
      const tokenBalance = await getTokenBalance(
        this.connection,
        tokenMint,
        this.authorityKeypair!.publicKey
      );

      logger.info(`📊 Received ${tokenBalance} tokens from Pump.fun buy`);

      // Burn the tokens
      let burnSignature: string | undefined;
      if (tokenBalance > 0) {
        const burnResult = await burnTokens({
          connection: this.connection,
          payer: this.authorityKeypair!,
          tokenMint,
          amount: tokenBalance,
        });

        if (burnResult.success) {
          burnSignature = burnResult.signature;
          logger.info(`🔥 Successfully burned ${tokenBalance} tokens: ${burnSignature}`);
        } else {
          logger.error(`❌ Failed to burn tokens: ${burnResult.error}`);
          throw new Error(`Token burn failed: ${burnResult.error}`);
        }
      }

      // Log the successful buyback event
      await this.logBuybackEvent({
        sol_spent: spendAmount / 1e9,
        token_bought: tokenBalance,
        token_mint: tokenMint.toBase58(),
        transaction_signature: signature,
        status: 'success',
        error_message: null,
        pumpfun_buy_signature: signature,
        pumpfun_burn_signature: burnSignature,
      });

      await this.updateLastRunTime(buybackConfig.id);

      return {
        success: true,
        solSpent: spendAmount / 1e9,
        tokenBought: tokenBalance,
        transactionSignature: signature,
      };
    } catch (error) {
      logger.error('❌ Pump.fun buyback execution failed:', error);

      // Log the failed event
      await this.logBuybackEvent({
        sol_spent: 0,
        token_bought: 0,
        token_mint: buybackConfig.pumpfun_mint || buybackConfig.token_mint,
        transaction_signature: `error-${Date.now()}`,
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Log buyback event to database
   */
  private async logBuybackEvent(event: {
    sol_spent: number;
    token_bought: number;
    token_mint: string;
    transaction_signature: string;
    burn_signature?: string;
    status: string;
    error_message?: string | null;
    jupiter_quote_response?: any;
    jupiter_swap_response?: any;
    pumpfun_buy_signature?: string;
    pumpfun_burn_signature?: string;
  }): Promise<void> {
    const db = getDatabase();
    
    try {
      await db('buyback_events').insert({
        timestamp: new Date(),
        sol_spent: event.sol_spent.toString(),
        token_bought: event.token_bought.toString(),
        token_mint: event.token_mint,
        transaction_signature: event.transaction_signature,
        burn_signature: event.burn_signature || event.pumpfun_burn_signature || null,
        status: event.status,
        error_message: event.error_message || null,
        jupiter_quote_response: event.jupiter_quote_response || null,
        jupiter_swap_response: event.jupiter_swap_response || null,
      });
      
      logger.info(`Logged buyback event: ${event.transaction_signature}`);
    } catch (error) {
      logger.error('Failed to log buyback event:', error);
    }
  }

  /**
   * Update last run time for buyback config
   */
  private async updateLastRunTime(configId: number): Promise<void> {
    const db = getDatabase();
    
    try {
      await db('buyback_config')
        .where({ id: configId })
        .update({ 
          last_run_at: new Date(),
          updated_at: new Date(),
        });
    } catch (error) {
      logger.error('Failed to update last run time:', error);
    }
  }

  /**
   * Get buyback config
   */
  async getConfig(): Promise<BuybackConfig | null> {
    const db = getDatabase();
    
    try {
      const configs = await db<BuybackConfig>('buyback_config').select('*').limit(1);
      return configs.length > 0 ? configs[0] : null;
    } catch (error) {
      logger.error('Failed to get buyback config:', error);
      return null;
    }
  }

  /**
   * Update buyback config
   */
  async updateConfig(updates: Partial<BuybackConfig>): Promise<boolean> {
    const db = getDatabase();
    
    try {
      const config = await this.getConfig();
      if (!config) {
        logger.error('No buyback config found to update');
        return false;
      }
      
      await db('buyback_config')
        .where({ id: config.id })
        .update({
          ...updates,
          updated_at: new Date(),
        });
      
      logger.info('Buyback config updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update buyback config:', error);
      return false;
    }
  }

  /**
   * Get recent buyback events
   */
  async getRecentEvents(limit: number = 50): Promise<any[]> {
    const db = getDatabase();
    
    try {
      return await db('buyback_events')
        .select('*')
        .orderBy('timestamp', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('Failed to get buyback events:', error);
      return [];
    }
  }

  /**
   * Get buyback statistics
   */
  async getStatistics(): Promise<{
    totalSolSpent: number;
    totalTokensBought: number;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    lastRunAt: Date | null;
  }> {
    const db = getDatabase();
    
    try {
      const config = await this.getConfig();
      
      const stats = await db('buyback_events')
        .select(
          db.raw('SUM(CAST(sol_spent AS DECIMAL)) as total_sol_spent'),
          db.raw('SUM(CAST(token_bought AS DECIMAL)) as total_tokens_bought'),
          db.raw('COUNT(*) as total_events'),
          db.raw("SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_events"),
          db.raw("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_events")
        )
        .first();
      
      return {
        totalSolSpent: parseFloat(stats?.total_sol_spent || '0'),
        totalTokensBought: parseFloat(stats?.total_tokens_bought || '0'),
        totalEvents: parseInt(stats?.total_events || '0'),
        successfulEvents: parseInt(stats?.successful_events || '0'),
        failedEvents: parseInt(stats?.failed_events || '0'),
        lastRunAt: config?.last_run_at || null,
      };
    } catch (error) {
      logger.error('Failed to get buyback statistics:', error);
      return {
        totalSolSpent: 0,
        totalTokensBought: 0,
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        lastRunAt: null,
      };
    }
  }
}

// Singleton instance
let buybackService: BuybackService | null = null;

export const getBuybackService = (): BuybackService => {
  if (!buybackService) {
    buybackService = new BuybackService();
  }
  return buybackService;
};
