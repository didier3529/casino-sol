import { Router, Request, Response } from 'express';
import { leaderboardService } from '../services/leaderboardService';
import { logger } from '../utils/logger';
import { broadcastLeaderboardUpdate } from '../websocket';

const router = Router();

/**
 * Webhook endpoint to receive on-chain game results
 * This can be called by Helius, Shyft, or your own indexer
 * 
 * Expected payload format:
 * {
 *   walletAddress: string;
 *   transactionSignature: string;
 *   gameType: string;
 *   betAmount: number;
 *   payoutAmount: number;
 *   isWin: boolean;
 *   timestamp: number;
 *   gameData?: any;
 * }
 */
router.post('/game-result', async (req: Request, res: Response) => {
  try {
    const {
      walletAddress,
      transactionSignature,
      gameType,
      betAmount,
      payoutAmount,
      isWin,
      timestamp,
      gameData,
    } = req.body;

    // Validate required fields
    if (!walletAddress || !transactionSignature || !gameType || betAmount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['walletAddress', 'transactionSignature', 'gameType', 'betAmount'],
      });
    }

    // Validate wallet address format (Solana public key is 32-44 chars)
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
      });
    }

    // Record the game result
    await leaderboardService.recordGameResult({
      walletAddress,
      transactionSignature,
      gameType,
      betAmount: Number(betAmount),
      payoutAmount: Number(payoutAmount) || 0,
      isWin: Boolean(isWin),
      playedAt: timestamp ? new Date(timestamp) : new Date(),
      gameData: gameData || null,
    });

    // Broadcast updated leaderboard to all connected clients
    try {
      const updatedLeaderboard = await leaderboardService.getLeaderboard(100);
      broadcastLeaderboardUpdate(updatedLeaderboard);
    } catch (broadcastError) {
      logger.error('Failed to broadcast leaderboard update:', broadcastError);
      // Don't fail the webhook if broadcast fails
    }

    res.status(200).json({
      success: true,
      message: 'Game result recorded successfully',
    });

  } catch (error: any) {
    logger.error('Webhook error:', error);
    
    // Check if it's a duplicate transaction error
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return res.status(200).json({
        success: true,
        message: 'Game result already recorded',
      });
    }

    res.status(500).json({
      error: 'Failed to process game result',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint for webhook service
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'webhook',
    timestamp: new Date().toISOString(),
  });
});

export default router;






import { leaderboardService } from '../services/leaderboardService';
import { logger } from '../utils/logger';
import { broadcastLeaderboardUpdate } from '../websocket';

const router = Router();

/**
 * Webhook endpoint to receive on-chain game results
 * This can be called by Helius, Shyft, or your own indexer
 * 
 * Expected payload format:
 * {
 *   walletAddress: string;
 *   transactionSignature: string;
 *   gameType: string;
 *   betAmount: number;
 *   payoutAmount: number;
 *   isWin: boolean;
 *   timestamp: number;
 *   gameData?: any;
 * }
 */
router.post('/game-result', async (req: Request, res: Response) => {
  try {
    const {
      walletAddress,
      transactionSignature,
      gameType,
      betAmount,
      payoutAmount,
      isWin,
      timestamp,
      gameData,
    } = req.body;

    // Validate required fields
    if (!walletAddress || !transactionSignature || !gameType || betAmount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['walletAddress', 'transactionSignature', 'gameType', 'betAmount'],
      });
    }

    // Validate wallet address format (Solana public key is 32-44 chars)
    if (typeof walletAddress !== 'string' || walletAddress.length < 32 || walletAddress.length > 44) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
      });
    }

    // Record the game result
    await leaderboardService.recordGameResult({
      walletAddress,
      transactionSignature,
      gameType,
      betAmount: Number(betAmount),
      payoutAmount: Number(payoutAmount) || 0,
      isWin: Boolean(isWin),
      playedAt: timestamp ? new Date(timestamp) : new Date(),
      gameData: gameData || null,
    });

    // Broadcast updated leaderboard to all connected clients
    try {
      const updatedLeaderboard = await leaderboardService.getLeaderboard(100);
      broadcastLeaderboardUpdate(updatedLeaderboard);
    } catch (broadcastError) {
      logger.error('Failed to broadcast leaderboard update:', broadcastError);
      // Don't fail the webhook if broadcast fails
    }

    res.status(200).json({
      success: true,
      message: 'Game result recorded successfully',
    });

  } catch (error: any) {
    logger.error('Webhook error:', error);
    
    // Check if it's a duplicate transaction error
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return res.status(200).json({
        success: true,
        message: 'Game result already recorded',
      });
    }

    res.status(500).json({
      error: 'Failed to process game result',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint for webhook service
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'webhook',
    timestamp: new Date().toISOString(),
  });
});

export default router;



















