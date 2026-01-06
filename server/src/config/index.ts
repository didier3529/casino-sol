import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  
  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().default('casino_db'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('password'),
  DB_SSL: z.string().default('false').transform(val => val === 'true'),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().default('dev-secret-key-change-in-production-min32chars'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-key-change-in-prod-min32'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Solana
  SOLANA_RPC_URL: z.string().default('https://api.devnet.solana.com'),
  SOLANA_WS_URL: z.string().default('wss://api.devnet.solana.com'),
  SOLANA_NETWORK: z.enum(['mainnet-beta', 'testnet', 'devnet']).default('devnet'),
  CASINO_PROGRAM_ID: z.string().default('11111111111111111111111111111111'),
  CASINO_KEYPAIR_PATH: z.string().optional(),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  
  // External Services
  SWITCHBOARD_PROGRAM_ID: z.string().optional(),
  CHAINLINK_PROGRAM_ID: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(val => val ? Number(val) : undefined),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  
  // SMS
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  MIXPANEL_TOKEN: z.string().optional(),
  
  // Feature Flags
  ENABLE_TOURNAMENTS: z.string().default('true').transform(val => val === 'true'),
  ENABLE_REFERRALS: z.string().default('true').transform(val => val === 'true'),
  ENABLE_VIP_SYSTEM: z.string().default('true').transform(val => val === 'true'),
  ENABLE_RESPONSIBLE_GAMBLING: z.string().default('true').transform(val => val === 'true'),
  
  // Limits
  MAX_BET_AMOUNT: z.string().default('1000').transform(Number),
  MIN_BET_AMOUNT: z.string().default('0.01').transform(Number),
  MAX_DAILY_LOSS: z.string().default('10000').transform(Number),
  MAX_SESSION_TIME: z.string().default('14400').transform(Number), // 4 hours
  
  // Cache TTL (in seconds)
  CACHE_TTL_SHORT: z.string().default('300').transform(Number), // 5 minutes
  CACHE_TTL_MEDIUM: z.string().default('1800').transform(Number), // 30 minutes
  CACHE_TTL_LONG: z.string().default('3600').transform(Number), // 1 hour
});

// Validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  database: {
    url: env.DATABASE_URL || `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL,
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    }
  },
  
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  solana: {
    rpcUrl: env.SOLANA_RPC_URL,
    wsUrl: env.SOLANA_WS_URL,
    network: env.SOLANA_NETWORK,
    casinoProgram: env.CASINO_PROGRAM_ID,
    keypairPath: env.CASINO_KEYPAIR_PATH,
    commitment: 'confirmed' as const,
    confirmTransactionInitialTimeout: 60000,
  },
  
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.JWT_SECRET,
    cookieMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: true,
  },
  
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    datadogApiKey: env.DATADOG_API_KEY,
  },
  
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  },
  
  sms: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },
  
  storage: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucket: env.AWS_S3_BUCKET,
  },
  
  analytics: {
    googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
    mixpanelToken: env.MIXPANEL_TOKEN,
  },
  
  features: {
    tournaments: env.ENABLE_TOURNAMENTS,
    referrals: env.ENABLE_REFERRALS,
    vipSystem: env.ENABLE_VIP_SYSTEM,
    responsibleGambling: env.ENABLE_RESPONSIBLE_GAMBLING,
  },
  
  limits: {
    maxBetAmount: env.MAX_BET_AMOUNT,
    minBetAmount: env.MIN_BET_AMOUNT,
    maxDailyLoss: env.MAX_DAILY_LOSS,
    maxSessionTime: env.MAX_SESSION_TIME,
  },
  
  cache: {
    ttl: {
      short: env.CACHE_TTL_SHORT,
      medium: env.CACHE_TTL_MEDIUM,
      long: env.CACHE_TTL_LONG,
    }
  },
  
  // Game-specific configurations
  games: {
    coinflip: {
      houseEdge: 0.025, // 2.5%
      maxPayout: 1.95,
      minBet: 0.01,
      maxBet: 100,
    },
    dice: {
      houseEdge: 0.02, // 2%
      maxPayout: 9.8,
      minBet: 0.01,
      maxBet: 50,
    },
    slots: {
      houseEdge: 0.05, // 5%
      maxPayout: 25,
      minBet: 0.01,
      maxBet: 10,
    },
    blackjack: {
      houseEdge: 0.015, // 1.5%
      maxPayout: 2.5,
      minBet: 0.1,
      maxBet: 500,
    },
    roulette: {
      houseEdge: 0.027, // 2.7%
      maxPayout: 35,
      minBet: 0.01,
      maxBet: 100,
    }
  },
  
  // Tournament configurations
  tournaments: {
    maxPlayers: 1000,
    minEntryFee: 1,
    maxEntryFee: 1000,
    maxDuration: 7 * 24 * 60 * 60, // 7 days
    prizePoolPercentage: 0.9, // 90% of entry fees
  }
} as const;

export type Config = typeof config;
