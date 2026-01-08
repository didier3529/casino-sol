import knex, { Knex } from 'knex';
import { config } from '../config';
import { logger } from '../utils/logger';

let db: Knex;

export const setupDatabase = async (): Promise<Knex> => {
  try {
    db = knex({
      client: 'pg',
      connection: config.database.url,
      pool: config.database.pool,
      searchPath: ['public'],
    });

    await db.raw('SELECT 1');
    logger.info('Database connection established');

    await runMigrations();
    
    return db;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

export const getDatabase = (): Knex => {
  if (!db) {
    throw new Error('Database not initialized. Call setupDatabase first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
};

async function runMigrations(): Promise<void> {
  logger.info('Running database migrations...');
  
  try {
    await db.raw(`
      CREATE TABLE IF NOT EXISTS buyback_config (
        id SERIAL PRIMARY KEY,
        token_mint VARCHAR(64) NOT NULL DEFAULT '',
        treasury_address VARCHAR(64) NOT NULL DEFAULT '',
        min_vault_reserve DECIMAL(20, 9) NOT NULL DEFAULT 0.5,
        max_spend_per_interval DECIMAL(20, 9) NOT NULL DEFAULT 0.1,
        interval_seconds INTEGER NOT NULL DEFAULT 3600,
        slippage_bps INTEGER NOT NULL DEFAULT 500,
        is_active BOOLEAN NOT NULL DEFAULT false,
        dry_run BOOLEAN NOT NULL DEFAULT true,
        execution_mode VARCHAR(20) NOT NULL DEFAULT 'pumpfun',
        pumpfun_mint VARCHAR(64),
        pumpfun_enabled_until_migration BOOLEAN DEFAULT true,
        last_run_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.raw(`
      CREATE TABLE IF NOT EXISTS buyback_events (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sol_spent DECIMAL(20, 9) NOT NULL DEFAULT 0,
        token_bought DECIMAL(30, 0) NOT NULL DEFAULT 0,
        token_mint VARCHAR(64) NOT NULL,
        transaction_signature VARCHAR(128),
        burn_signature VARCHAR(128),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        jupiter_quote_response JSONB,
        jupiter_swap_response JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.raw(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(64) NOT NULL,
        game_type VARCHAR(20) NOT NULL,
        bet_amount DECIMAL(20, 9) NOT NULL,
        is_win BOOLEAN NOT NULL DEFAULT false,
        payout DECIMAL(20, 9) DEFAULT 0,
        signature VARCHAR(128),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.raw(`
      CREATE TABLE IF NOT EXISTS wallet_stats (
        wallet_address VARCHAR(64) PRIMARY KEY,
        total_games INTEGER NOT NULL DEFAULT 0,
        total_wins INTEGER NOT NULL DEFAULT 0,
        total_wagered DECIMAL(20, 9) NOT NULL DEFAULT 0,
        total_payout DECIMAL(20, 9) NOT NULL DEFAULT 0,
        net_profit DECIMAL(20, 9) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const configExists = await db('buyback_config').first();
    if (!configExists) {
      await db('buyback_config').insert({
        token_mint: '',
        treasury_address: '',
        min_vault_reserve: '0.5',
        max_spend_per_interval: '0.1',
        interval_seconds: 3600,
        slippage_bps: 500,
        is_active: false,
        dry_run: true,
        execution_mode: 'pumpfun',
      });
      logger.info('Created default buyback config');
    }

    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}
