import { Router, Request, Response } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { getBuybackService } from '../services/buybackService';
import { logger } from '../utils/logger';
import { getDatabase } from '../database';
import { getRedis } from '../cache/redis';
import { config } from '../config';
import { operatorAuthMiddleware, developmentOnlyAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply operator authentication to all mutating endpoints
// Read-only endpoints use optional auth (work without auth but log operator if present)

/**
 * GET /api/admin/buyback/status
 * Get current buyback status
 */
router.get('/buyback/status', async (req: Request, res: Response) => {
  try {
    const buybackService = getBuybackService();
    const { should, reason, config } = await buybackService.shouldRunBuyback();
    const stats = await buybackService.getStatistics();
    
    res.json({
      success: true,
      data: {
        canRun: should,
        reason,
        config,
        stats,
      },
    });
  } catch (error) {
    logger.error('Error getting buyback status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/buyback/config
 * Get buyback configuration
 */
router.get('/buyback/config', async (req: Request, res: Response) => {
  try {
    const buybackService = getBuybackService();
    const config = await buybackService.getConfig();
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Buyback config not found',
      });
    }
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error('Error getting buyback config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/admin/buyback/config
 * Update buyback configuration (requires operator auth)
 */
router.patch('/buyback/config', developmentOnlyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const buybackService = getBuybackService();
    const updates = req.body;
    
    // Validate updates (basic validation)
    const allowedFields = [
      'token_mint',
      'treasury_address',
      'min_vault_reserve',
      'max_spend_per_interval',
      'interval_seconds',
      'slippage_bps',
      'is_active',
      'dry_run',
      'execution_mode',
      'pumpfun_mint',
      'pumpfun_enabled_until_migration',
    ];
    
    const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid fields: ${invalidFields.join(', ')}`,
      });
    }
    
    const success = await buybackService.updateConfig(updates);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update config',
      });
    }
    
    const updatedConfig = await buybackService.getConfig();
    
    res.json({
      success: true,
      data: updatedConfig,
    });
  } catch (error) {
    logger.error('Error updating buyback config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/buyback/run
 * Manually trigger a buyback (requires operator auth)
 */
router.post('/buyback/run', developmentOnlyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const buybackService = getBuybackService();
    logger.info('Manual buyback triggered via API');
    
    // Manual runs ignore the long cooldown but have 30s anti-spam protection
    const result = await buybackService.executeBuyback({
      ignoreCooldown: true,
      minManualSpacingSeconds: 30,
    });
    
    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error('Error running buyback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/buyback/pause
 * Pause buyback (requires operator auth)
 */
router.post('/buyback/pause', developmentOnlyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const buybackService = getBuybackService();
    const success = await buybackService.updateConfig({ is_active: false });
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to pause buyback',
      });
    }
    
    logger.info('Buyback paused via API');
    
    res.json({
      success: true,
      message: 'Buyback paused',
    });
  } catch (error) {
    logger.error('Error pausing buyback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/buyback/resume
 * Resume buyback (requires operator auth)
 */
router.post('/buyback/resume', developmentOnlyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const buybackService = getBuybackService();
    const success = await buybackService.updateConfig({ is_active: true });
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to resume buyback',
      });
    }
    
    logger.info('Buyback resumed via API');
    
    res.json({
      success: true,
      message: 'Buyback resumed',
    });
  } catch (error) {
    logger.error('Error resuming buyback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/buyback/events
 * Get recent buyback events
 */
router.get('/buyback/events', async (req: Request, res: Response) => {
  try {
    const buybackService = getBuybackService();
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await buybackService.getRecentEvents(limit);
    
    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    logger.error('Error getting buyback events:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/buyback/stats
 * Get buyback statistics
 */
router.get('/buyback/stats', async (req: Request, res: Response) => {
  try {
    const buybackService = getBuybackService();
    const stats = await buybackService.getStatistics();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting buyback stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/buyback/update-config
 * Update buyback configuration (requires operator auth)
 */
router.post('/buyback/update-config', developmentOnlyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { execution_mode, pumpfun_mint } = req.body;
    
    if (!execution_mode || !['pumpfun', 'jupiter'].includes(execution_mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid execution_mode. Must be "pumpfun" or "jupiter"',
      });
    }
    
    if (execution_mode === 'pumpfun' && !pumpfun_mint) {
      return res.status(400).json({
        success: false,
        error: 'pumpfun_mint is required when execution_mode is "pumpfun"',
      });
    }
    
    const buybackService = getBuybackService();
    await buybackService.updateConfig({ execution_mode, pumpfun_mint });
    
    res.json({
      success: true,
      message: 'Buyback config updated',
    });
  } catch (error) {
    logger.error('Error updating buyback config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/health/system
 * Get system health status including service checks and balances
 */
router.get('/health/system', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const uptime = process.uptime();
    
    // Initialize status object
    const health: any = {
      status: 'healthy',
      uptime: Math.floor(uptime),
      timestamp: new Date().toISOString(),
      services: {},
      errors: {
        last_hour: 0,
        last_24h: 0,
      },
      balances: {},
    };
    
    // Check database connection
    try {
      const db = getDatabase();
      await db.raw('SELECT 1');
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'degraded';
      logger.error('Database health check failed:', error);
    }
    
    // Check Redis connection
    try {
      const redis = getRedis();
      await redis.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'degraded';
      logger.error('Redis health check failed:', error);
    }
    
    // Check RPC connection
    try {
      const connection = new Connection(config.solana.rpcUrl, 'confirmed');
      await connection.getVersion();
      health.services.rpc = 'connected';
    } catch (error) {
      health.services.rpc = 'disconnected';
      health.status = 'degraded';
      logger.error('RPC health check failed:', error);
    }
    
    // Check buyback service status
    try {
      const buybackService = getBuybackService();
      const buybackConfig = await buybackService.getConfig();
      health.services.buyback = buybackConfig?.is_active ? 'active' : 'inactive';
      
      // Get vault and treasury balances using program-derived addresses
      if (config.solana.casinoProgram) {
        const connection = new Connection(config.solana.rpcUrl, 'confirmed');
        const programId = new PublicKey(config.solana.casinoProgram);
        const [casinoPDA] = PublicKey.findProgramAddressSync([Buffer.from('casino')], programId);
        const [vaultPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('vault'), casinoPDA.toBuffer()],
          programId
        );
        
        // Get vault balance
        try {
          const vaultBalance = await connection.getBalance(vaultPDA);
          health.balances.vault = (vaultBalance / 1e9).toFixed(4);
        } catch (error) {
          logger.warn('Could not fetch vault balance:', error);
          health.balances.vault = 'unknown';
        }
        
        // Get treasury balance (if configured)
        if (buybackConfig?.treasury_address) {
          try {
            const treasuryPubkey = new PublicKey(buybackConfig.treasury_address);
            const treasuryBalance = await connection.getBalance(treasuryPubkey);
            health.balances.treasury = (treasuryBalance / 1e9).toFixed(4);
          } catch (error) {
            logger.warn('Could not fetch treasury balance:', error);
            health.balances.treasury = 'unknown';
          }
        }
        
        health.balances.vault_reserve = '0.5'; // Fixed reserve
      }
      
      // Get last buyback timestamp
      const stats = await buybackService.getStatistics();
      health.lastBuybackAt = stats.lastRunAt;
      
    } catch (error) {
      health.services.buyback = 'error';
      logger.error('Buyback health check failed:', error);
    }
    
    // Query error logs from database (if available)
    try {
      const db = getDatabase();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Count failed buyback events in last hour
      const errorCount1h = await db('buyback_events')
        .where('status', 'failed')
        .where('timestamp', '>=', oneHourAgo)
        .count('* as count')
        .first();
      
      health.errors.last_hour = parseInt(String(errorCount1h?.count || '0'));
      
      // Count failed buyback events in last 24h
      const errorCount24h = await db('buyback_events')
        .where('status', 'failed')
        .where('timestamp', '>=', oneDayAgo)
        .count('* as count')
        .first();
      
      health.errors.last_24h = parseInt(String(errorCount24h?.count || '0'));
      
    } catch (error) {
      logger.warn('Could not query error logs:', error);
    }
    
    // Set overall status
    const hasDisconnectedService = Object.values(health.services).includes('disconnected');
    if (hasDisconnectedService) {
      health.status = 'degraded';
    }
    
    const responseTime = Date.now() - startTime;
    health.responseTime = `${responseTime}ms`;
    
    res.json(health);
    
  } catch (error) {
    logger.error('System health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
