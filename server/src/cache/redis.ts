import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisClient: Redis;

export const setupRedis = async (): Promise<Redis> => {
  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      lazyConnect: false,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedis = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call setupRedis first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

// Leaderboard cache utilities
export const LEADERBOARD_CACHE_KEY = 'leaderboard:top100';
export const LEADERBOARD_CACHE_TTL = 30; // 30 seconds

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  netProfit: number;
  totalGames: number;
  totalWins: number;
  winRate: number;
}

export const cacheLeaderboard = async (entries: LeaderboardEntry[]): Promise<void> => {
  try {
    const redis = getRedis();
    await redis.setex(
      LEADERBOARD_CACHE_KEY,
      LEADERBOARD_CACHE_TTL,
      JSON.stringify(entries)
    );
  } catch (error) {
    logger.error('Failed to cache leaderboard:', error);
  }
};

export const getCachedLeaderboard = async (): Promise<LeaderboardEntry[] | null> => {
  try {
    const redis = getRedis();
    const cached = await redis.get(LEADERBOARD_CACHE_KEY);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to get cached leaderboard:', error);
    return null;
  }
};

export const invalidateLeaderboardCache = async (): Promise<void> => {
  try {
    const redis = getRedis();
    await redis.del(LEADERBOARD_CACHE_KEY);
    logger.debug('Leaderboard cache invalidated');
  } catch (error) {
    logger.error('Failed to invalidate leaderboard cache:', error);
  }
};

