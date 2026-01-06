import { getDatabase } from '../database';
import { 
  cacheLeaderboard, 
  getCachedLeaderboard, 
  invalidateLeaderboardCache,
  LeaderboardEntry 
} from '../cache/redis';
import { logger } from '../utils/logger';

export interface GameResult {
  walletAddress: string;
  transactionSignature: string;
  gameType: string;
  betAmount: number;
  payoutAmount: number;
  isWin: boolean;
  playedAt: Date;
  gameData?: any;
}

export class LeaderboardService {
  /**
   * Record a game result and update leaderboard stats
   */
  async recordGameResult(result: GameResult): Promise<void> {
    const db = getDatabase();
    
    try {
      await db.transaction(async (trx) => {
        // Insert game result
        await trx('game_results').insert({
          transaction_signature: result.transactionSignature,
          wallet_address: result.walletAddress,
          game_type: result.gameType,
          bet_amount: result.betAmount,
          payout_amount: result.payoutAmount,
          is_win: result.isWin,
          game_data: result.gameData ? JSON.stringify(result.gameData) : null,
          played_at: result.playedAt,
        }).onConflict('transaction_signature').ignore(); // Prevent duplicates

        // Calculate net profit for this game
        const netProfit = result.payoutAmount - result.betAmount;

        // Update or insert player stats
        const existingStats = await trx('leaderboard_stats')
          .where({ wallet_address: result.walletAddress })
          .first();

        if (existingStats) {
          // Update existing stats
          await trx('leaderboard_stats')
            .where({ wallet_address: result.walletAddress })
            .update({
              total_bet_amount: trx.raw('total_bet_amount + ?', [result.betAmount]),
              total_payout_amount: trx.raw('total_payout_amount + ?', [result.payoutAmount]),
              net_profit: trx.raw('net_profit + ?', [netProfit]),
              total_games: trx.raw('total_games + 1'),
              total_wins: result.isWin ? trx.raw('total_wins + 1') : trx.raw('total_wins'),
              total_losses: !result.isWin ? trx.raw('total_losses + 1') : trx.raw('total_losses'),
              last_game_at: result.playedAt,
              updated_at: new Date(),
            });
        } else {
          // Create new stats entry
          await trx('leaderboard_stats').insert({
            wallet_address: result.walletAddress,
            total_bet_amount: result.betAmount,
            total_payout_amount: result.payoutAmount,
            net_profit: netProfit,
            total_games: 1,
            total_wins: result.isWin ? 1 : 0,
            total_losses: result.isWin ? 0 : 1,
            first_game_at: result.playedAt,
            last_game_at: result.playedAt,
          });
        }
      });

      // Invalidate cache so next fetch gets fresh data
      await invalidateLeaderboardCache();
      
      logger.info(`Recorded game result for ${result.walletAddress}: ${result.isWin ? 'WIN' : 'LOSS'} ${result.payoutAmount - result.betAmount} SOL`);
      
    } catch (error) {
      logger.error('Failed to record game result:', error);
      throw error;
    }
  }

  /**
   * Get top leaderboard entries (cached or fresh from DB)
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      // Try cache first
      const cached = await getCachedLeaderboard();
      if (cached) {
        logger.debug('Returning cached leaderboard');
        return cached.slice(0, limit);
      }

      // Fetch from database
      const db = getDatabase();
      const results = await db('leaderboard_stats')
        .select(
          'wallet_address',
          'net_profit',
          'total_games',
          'total_wins',
          'total_losses'
        )
        .orderBy('net_profit', 'desc')
        .limit(limit);

      const entries: LeaderboardEntry[] = results.map((row, index) => ({
        rank: index + 1,
        walletAddress: row.wallet_address,
        netProfit: parseFloat(row.net_profit),
        totalGames: row.total_games,
        totalWins: row.total_wins,
        winRate: row.total_games > 0 ? (row.total_wins / row.total_games) * 100 : 0,
      }));

      // Cache the results
      await cacheLeaderboard(entries);
      
      logger.debug(`Fetched leaderboard with ${entries.length} entries from database`);
      
      return entries;
      
    } catch (error) {
      logger.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get player stats by wallet address
   */
  async getPlayerStats(walletAddress: string): Promise<any> {
    try {
      const db = getDatabase();
      const stats = await db('leaderboard_stats')
        .where({ wallet_address: walletAddress })
        .first();

      if (!stats) {
        return null;
      }

      // Get player's rank
      const rank = await db('leaderboard_stats')
        .where('net_profit', '>', stats.net_profit)
        .count('* as count')
        .first();

      return {
        walletAddress: stats.wallet_address,
        rank: parseInt(rank?.count as string || '0') + 1,
        netProfit: parseFloat(stats.net_profit),
        totalBetAmount: parseFloat(stats.total_bet_amount),
        totalPayoutAmount: parseFloat(stats.total_payout_amount),
        totalGames: stats.total_games,
        totalWins: stats.total_wins,
        totalLosses: stats.total_losses,
        winRate: stats.total_games > 0 ? (stats.total_wins / stats.total_games) * 100 : 0,
        firstGameAt: stats.first_game_at,
        lastGameAt: stats.last_game_at,
      };
      
    } catch (error) {
      logger.error('Failed to get player stats:', error);
      throw error;
    }
  }

  /**
   * Get recent game results for a player
   */
  async getPlayerGameHistory(walletAddress: string, limit: number = 50): Promise<any[]> {
    try {
      const db = getDatabase();
      const results = await db('game_results')
        .where({ wallet_address: walletAddress })
        .orderBy('played_at', 'desc')
        .limit(limit)
        .select('*');

      return results.map((row) => ({
        transactionSignature: row.transaction_signature,
        gameType: row.game_type,
        betAmount: parseFloat(row.bet_amount),
        payoutAmount: parseFloat(row.payout_amount),
        netProfit: parseFloat(row.payout_amount) - parseFloat(row.bet_amount),
        isWin: row.is_win,
        playedAt: row.played_at,
        gameData: row.game_data,
      }));
      
    } catch (error) {
      logger.error('Failed to get player game history:', error);
      throw error;
    }
  }
}

export const leaderboardService = new LeaderboardService();






import { 
  cacheLeaderboard, 
  getCachedLeaderboard, 
  invalidateLeaderboardCache,
  LeaderboardEntry 
} from '../cache/redis';
import { logger } from '../utils/logger';

export interface GameResult {
  walletAddress: string;
  transactionSignature: string;
  gameType: string;
  betAmount: number;
  payoutAmount: number;
  isWin: boolean;
  playedAt: Date;
  gameData?: any;
}

export class LeaderboardService {
  /**
   * Record a game result and update leaderboard stats
   */
  async recordGameResult(result: GameResult): Promise<void> {
    const db = getDatabase();
    
    try {
      await db.transaction(async (trx) => {
        // Insert game result
        await trx('game_results').insert({
          transaction_signature: result.transactionSignature,
          wallet_address: result.walletAddress,
          game_type: result.gameType,
          bet_amount: result.betAmount,
          payout_amount: result.payoutAmount,
          is_win: result.isWin,
          game_data: result.gameData ? JSON.stringify(result.gameData) : null,
          played_at: result.playedAt,
        }).onConflict('transaction_signature').ignore(); // Prevent duplicates

        // Calculate net profit for this game
        const netProfit = result.payoutAmount - result.betAmount;

        // Update or insert player stats
        const existingStats = await trx('leaderboard_stats')
          .where({ wallet_address: result.walletAddress })
          .first();

        if (existingStats) {
          // Update existing stats
          await trx('leaderboard_stats')
            .where({ wallet_address: result.walletAddress })
            .update({
              total_bet_amount: trx.raw('total_bet_amount + ?', [result.betAmount]),
              total_payout_amount: trx.raw('total_payout_amount + ?', [result.payoutAmount]),
              net_profit: trx.raw('net_profit + ?', [netProfit]),
              total_games: trx.raw('total_games + 1'),
              total_wins: result.isWin ? trx.raw('total_wins + 1') : trx.raw('total_wins'),
              total_losses: !result.isWin ? trx.raw('total_losses + 1') : trx.raw('total_losses'),
              last_game_at: result.playedAt,
              updated_at: new Date(),
            });
        } else {
          // Create new stats entry
          await trx('leaderboard_stats').insert({
            wallet_address: result.walletAddress,
            total_bet_amount: result.betAmount,
            total_payout_amount: result.payoutAmount,
            net_profit: netProfit,
            total_games: 1,
            total_wins: result.isWin ? 1 : 0,
            total_losses: result.isWin ? 0 : 1,
            first_game_at: result.playedAt,
            last_game_at: result.playedAt,
          });
        }
      });

      // Invalidate cache so next fetch gets fresh data
      await invalidateLeaderboardCache();
      
      logger.info(`Recorded game result for ${result.walletAddress}: ${result.isWin ? 'WIN' : 'LOSS'} ${result.payoutAmount - result.betAmount} SOL`);
      
    } catch (error) {
      logger.error('Failed to record game result:', error);
      throw error;
    }
  }

  /**
   * Get top leaderboard entries (cached or fresh from DB)
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      // Try cache first
      const cached = await getCachedLeaderboard();
      if (cached) {
        logger.debug('Returning cached leaderboard');
        return cached.slice(0, limit);
      }

      // Fetch from database
      const db = getDatabase();
      const results = await db('leaderboard_stats')
        .select(
          'wallet_address',
          'net_profit',
          'total_games',
          'total_wins',
          'total_losses'
        )
        .orderBy('net_profit', 'desc')
        .limit(limit);

      const entries: LeaderboardEntry[] = results.map((row, index) => ({
        rank: index + 1,
        walletAddress: row.wallet_address,
        netProfit: parseFloat(row.net_profit),
        totalGames: row.total_games,
        totalWins: row.total_wins,
        winRate: row.total_games > 0 ? (row.total_wins / row.total_games) * 100 : 0,
      }));

      // Cache the results
      await cacheLeaderboard(entries);
      
      logger.debug(`Fetched leaderboard with ${entries.length} entries from database`);
      
      return entries;
      
    } catch (error) {
      logger.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get player stats by wallet address
   */
  async getPlayerStats(walletAddress: string): Promise<any> {
    try {
      const db = getDatabase();
      const stats = await db('leaderboard_stats')
        .where({ wallet_address: walletAddress })
        .first();

      if (!stats) {
        return null;
      }

      // Get player's rank
      const rank = await db('leaderboard_stats')
        .where('net_profit', '>', stats.net_profit)
        .count('* as count')
        .first();

      return {
        walletAddress: stats.wallet_address,
        rank: parseInt(rank?.count as string || '0') + 1,
        netProfit: parseFloat(stats.net_profit),
        totalBetAmount: parseFloat(stats.total_bet_amount),
        totalPayoutAmount: parseFloat(stats.total_payout_amount),
        totalGames: stats.total_games,
        totalWins: stats.total_wins,
        totalLosses: stats.total_losses,
        winRate: stats.total_games > 0 ? (stats.total_wins / stats.total_games) * 100 : 0,
        firstGameAt: stats.first_game_at,
        lastGameAt: stats.last_game_at,
      };
      
    } catch (error) {
      logger.error('Failed to get player stats:', error);
      throw error;
    }
  }

  /**
   * Get recent game results for a player
   */
  async getPlayerGameHistory(walletAddress: string, limit: number = 50): Promise<any[]> {
    try {
      const db = getDatabase();
      const results = await db('game_results')
        .where({ wallet_address: walletAddress })
        .orderBy('played_at', 'desc')
        .limit(limit)
        .select('*');

      return results.map((row) => ({
        transactionSignature: row.transaction_signature,
        gameType: row.game_type,
        betAmount: parseFloat(row.bet_amount),
        payoutAmount: parseFloat(row.payout_amount),
        netProfit: parseFloat(row.payout_amount) - parseFloat(row.bet_amount),
        isWin: row.is_win,
        playedAt: row.played_at,
        gameData: row.game_data,
      }));
      
    } catch (error) {
      logger.error('Failed to get player game history:', error);
      throw error;
    }
  }
}

export const leaderboardService = new LeaderboardService();



















