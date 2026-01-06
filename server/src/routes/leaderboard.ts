import { Router, Request, Response } from 'express';
import { leaderboardService } from '../services/leaderboardService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/leaderboard
 * Get top players by net profit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    
    const leaderboard = await leaderboardService.getLeaderboard(limit);
    
    res.status(200).json({
      success: true,
      data: leaderboard,
      count: leaderboard.length,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    logger.error('Failed to fetch leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message,
    });
  }
});

/**
 * GET /api/leaderboard/player/:walletAddress
 * Get stats for a specific player
 */
router.get('/player/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress || walletAddress.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }
    
    const stats = await leaderboardService.getPlayerStats(walletAddress);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
        message: 'This wallet has no game history',
      });
    }
    
    res.status(200).json({
      success: true,
      data: stats,
    });
    
  } catch (error: any) {
    logger.error('Failed to fetch player stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player stats',
      message: error.message,
    });
  }
});

/**
 * GET /api/leaderboard/player/:walletAddress/history
 * Get game history for a specific player
 */
router.get('/player/:walletAddress/history', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    
    if (!walletAddress || walletAddress.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }
    
    const history = await leaderboardService.getPlayerGameHistory(walletAddress, limit);
    
    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
    
  } catch (error: any) {
    logger.error('Failed to fetch player history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player history',
      message: error.message,
    });
  }
});

export default router;






import { leaderboardService } from '../services/leaderboardService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/leaderboard
 * Get top players by net profit
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    
    const leaderboard = await leaderboardService.getLeaderboard(limit);
    
    res.status(200).json({
      success: true,
      data: leaderboard,
      count: leaderboard.length,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    logger.error('Failed to fetch leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message,
    });
  }
});

/**
 * GET /api/leaderboard/player/:walletAddress
 * Get stats for a specific player
 */
router.get('/player/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress || walletAddress.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }
    
    const stats = await leaderboardService.getPlayerStats(walletAddress);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
        message: 'This wallet has no game history',
      });
    }
    
    res.status(200).json({
      success: true,
      data: stats,
    });
    
  } catch (error: any) {
    logger.error('Failed to fetch player stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player stats',
      message: error.message,
    });
  }
});

/**
 * GET /api/leaderboard/player/:walletAddress/history
 * Get game history for a specific player
 */
router.get('/player/:walletAddress/history', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    
    if (!walletAddress || walletAddress.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }
    
    const history = await leaderboardService.getPlayerGameHistory(walletAddress, limit);
    
    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
    
  } catch (error: any) {
    logger.error('Failed to fetch player history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player history',
      message: error.message,
    });
  }
});

export default router;



















