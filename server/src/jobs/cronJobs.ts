import cron from 'node-cron';
import { logger } from '../utils/logger';
import { getBuybackService } from '../services/buybackService';

// Store interval handle for cleanup
let pumpfunInterval: NodeJS.Timeout | null = null;
let jupiterCron: cron.ScheduledTask | null = null;

/**
 * Setup buyback schedulers based on execution mode
 * - Pump.fun mode: Fast 10-second interval for continuous buyback
 * - Jupiter mode: Hourly cron job for batch buyback
 */
export const setupCronJobs = async (): Promise<void> => {
  logger.info('Setting up buyback schedulers...');
  
  try {
    const buybackService = getBuybackService();
    
    // Get current config to determine execution mode
    const config = await buybackService.getConfig();
    
    if (!config) {
      logger.warn('No buyback config found - schedulers will not start');
      return;
    }
    
    const executionMode = config.execution_mode || 'jupiter';
    logger.info(`Buyback execution mode: ${executionMode}`);
    logger.info(`Buyback active: ${config.is_active}`);
    
    if (executionMode === 'pumpfun' && config.is_active) {
      // ========== PUMP.FUN MODE: Continuous 10-second interval ==========
      logger.info('Starting Pump.fun continuous buyback scheduler (10 seconds)...');
      
      pumpfunInterval = setInterval(async () => {
        try {
          const result = await buybackService.executeBuyback();
          
          if (result.success) {
            logger.info(`✅ Pump.fun buyback executed: ${result.transactionSignature}`);
            logger.info(`  - SOL spent: ${result.solSpent}`);
            logger.info(`  - Tokens bought: ${result.tokenBought}`);
          } else {
            // Don't log every "not ready" message to avoid spam
            if (result.error && !result.error.includes('cooldown') && !result.error.includes('No excess')) {
              logger.debug(`Pump.fun buyback skipped: ${result.error}`);
            }
          }
        } catch (error) {
          logger.error('Pump.fun buyback scheduler error:', error);
        }
      }, 10000); // 10 seconds
      
      logger.info('✅ Pump.fun scheduler started (interval: 10s)');
      
    } else if (executionMode === 'jupiter' && config.is_active) {
      // ========== JUPITER MODE: Hourly cron job ==========
      logger.info('Starting Jupiter buyback scheduler (hourly)...');
      
      jupiterCron = cron.schedule('0 * * * *', async () => {
        try {
          logger.info('Jupiter buyback cron triggered...');
          const result = await buybackService.executeBuyback();
          
          if (result.success) {
            logger.info(`✅ Jupiter buyback executed: ${result.transactionSignature}`);
            logger.info(`  - SOL spent: ${result.solSpent}`);
            logger.info(`  - Tokens bought: ${result.tokenBought}`);
          } else {
            logger.info(`Jupiter buyback not executed: ${result.error}`);
          }
        } catch (error) {
          logger.error('Jupiter buyback cron error:', error);
        }
      });
      
      logger.info('✅ Jupiter scheduler started (cron: hourly)');
      
    } else {
      logger.info('Buyback is not active or no valid execution mode - schedulers not started');
    }
    
  } catch (error) {
    logger.error('Failed to setup buyback schedulers:', error);
  }
};

/**
 * Cleanup schedulers on shutdown
 */
export const stopCronJobs = (): void => {
  logger.info('Stopping buyback schedulers...');
  
  if (pumpfunInterval) {
    clearInterval(pumpfunInterval);
    pumpfunInterval = null;
    logger.info('Pump.fun interval cleared');
  }
  
  if (jupiterCron) {
    jupiterCron.stop();
    jupiterCron = null;
    logger.info('Jupiter cron stopped');
  }
};

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - stopping schedulers...');
  stopCronJobs();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received - stopping schedulers...');
  stopCronJobs();
});
