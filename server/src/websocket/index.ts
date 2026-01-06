import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { LeaderboardEntry } from '../cache/redis';

let io: SocketIOServer;

export const setupWebSocket = (socketServer: SocketIOServer): void => {
  io = socketServer;

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle client joining leaderboard room
    socket.on('subscribe:leaderboard', () => {
      socket.join('leaderboard');
      logger.debug(`Client ${socket.id} subscribed to leaderboard updates`);
      
      socket.emit('subscribed', {
        room: 'leaderboard',
        message: 'Successfully subscribed to live leaderboard updates',
      });
    });

    // Handle client leaving leaderboard room
    socket.on('unsubscribe:leaderboard', () => {
      socket.leave('leaderboard');
      logger.debug(`Client ${socket.id} unsubscribed from leaderboard updates`);
    });

    // Handle client requesting current leaderboard
    socket.on('request:leaderboard', async () => {
      try {
        const { leaderboardService } = await import('../services/leaderboardService');
        const leaderboard = await leaderboardService.getLeaderboard(100);
        
        socket.emit('leaderboard:data', {
          data: leaderboard,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to fetch leaderboard for socket request:', error);
        socket.emit('error', {
          message: 'Failed to fetch leaderboard',
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('WebSocket server initialized');
};

/**
 * Broadcast leaderboard update to all subscribed clients
 */
export const broadcastLeaderboardUpdate = (leaderboard: LeaderboardEntry[]): void => {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket server not initialized');
    return;
  }

  io.to('leaderboard').emit('leaderboard:update', {
    data: leaderboard,
    timestamp: new Date().toISOString(),
  });

  logger.debug(`Broadcasted leaderboard update to clients in room 'leaderboard'`);
};

/**
 * Broadcast individual player stat update
 */
export const broadcastPlayerUpdate = (walletAddress: string, stats: any): void => {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket server not initialized');
    return;
  }

  io.to('leaderboard').emit('player:update', {
    walletAddress,
    stats,
    timestamp: new Date().toISOString(),
  });

  logger.debug(`Broadcasted player update for ${walletAddress}`);
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
};

