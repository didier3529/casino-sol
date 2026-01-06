/**
 * Oracle Service - Settles casino games and tracks leaderboard data
 * 
 * This service:
 * 1. Listens for start_spin transactions
 * 2. Generates provably fair server seed
 * 3. Calls settle_spin to resolve games instantly
 * 4. Broadcasts bet data to leaderboard via WebSocket
 */

import { 
  Connection, 
  PublicKey, 
  Keypair,
  Transaction,
} from '@solana/web3.js';
import { WebSocketServer } from 'ws';
import crypto from 'crypto';

// Configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || ''; // Store securely
const CASINO_PROGRAM_ID = new PublicKey('CasinoProgram11111111111111111111111111111');
const WS_PORT = 8080;

// Leaderboard data structure
interface BetRecord {
  wallet: string;
  timestamp: number;
  betAmount: number;
  won: boolean;
  payout: number;
  treasuryContribution: number; // Amount lost (if loss)
  gameType: string;
  signature: string;
}

interface PlayerLeaderboard {
  wallet: string;
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  treasuryContribution: number; // Lifetime losses
  lastBetTimestamp: number;
}

class OracleService {
  private connection: Connection;
  private oracleKeypair: Keypair;
  private wss: WebSocketServer;
  private leaderboard: Map<string, PlayerLeaderboard> = new Map();
  private recentBets: BetRecord[] = [];

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    // Initialize oracle keypair (in production, load from secure storage)
    if (ORACLE_PRIVATE_KEY) {
      const privateKeyBuffer = Buffer.from(ORACLE_PRIVATE_KEY, 'base64');
      this.oracleKeypair = Keypair.fromSecretKey(privateKeyBuffer);
    } else {
      this.oracleKeypair = Keypair.generate();
      console.warn('⚠️  Using generated oracle keypair (not persisted)');
      console.log('Oracle Public Key:', this.oracleKeypair.publicKey.toString());
    }

    // Initialize WebSocket server for real-time leaderboard
    this.wss = new WebSocketServer({ port: WS_PORT });
    this.setupWebSocket();
  }

  /**
   * Setup WebSocket for broadcasting leaderboard updates
   */
  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('📡 Client connected to leaderboard feed');

      // Send current leaderboard on connect
      ws.send(JSON.stringify({
        type: 'leaderboard',
        data: this.getLeaderboardData(),
      }));

      ws.on('close', () => {
        console.log('📡 Client disconnected');
      });
    });

    console.log(`✅ WebSocket server running on port ${WS_PORT}`);
  }

  /**
   * Broadcast leaderboard update to all connected clients
   */
  private broadcast(data: any) {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }

  /**
   * Get leaderboard data ranked by Treasury contribution (biggest losers)
   */
  private getLeaderboardData() {
    const players = Array.from(this.leaderboard.values())
      .sort((a, b) => b.treasuryContribution - a.treasuryContribution) // Biggest losers first
      .slice(0, 100); // Top 100

    return {
      players,
      recentBets: this.recentBets.slice(0, 50), // Last 50 bets
      totalBets: this.recentBets.length,
    };
  }

  /**
   * Generate provably fair server seed
   */
  private generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash server seed for provable fairness
   */
  private hashServerSeed(serverSeed: string): string {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  /**
   * Listen for start_spin transactions and settle them
   */
  async startListening() {
    console.log('🎰 Oracle service starting...');
    console.log('Listening for start_spin transactions on', SOLANA_RPC_URL);

    // Subscribe to program account changes
    this.connection.onProgramAccountChange(
      CASINO_PROGRAM_ID,
      async (accountInfo, context) => {
        try {
          // Parse account data to detect new games
          // In production, use proper Anchor deserialization
          console.log('📊 Program account changed:', context.slot);

          // TODO: Parse game account data and settle
          // For now, we'll use a polling approach
        } catch (error) {
          console.error('Error handling account change:', error);
        }
      },
      'confirmed'
    );

    // Alternative: Poll for unsettled games periodically
    this.pollForGames();
  }

  /**
   * Poll for unsettled games and settle them
   * (Simplified approach for demo)
   */
  private async pollForGames() {
    setInterval(async () => {
      // In production:
      // 1. Query all game accounts with status = Active
      // 2. For each game, call settle_spin with provably fair seed
      // 3. Track results for leaderboard

      console.log('🔍 Polling for unsettled games...');
    }, 5000); // Every 5 seconds
  }

  /**
   * Settle a game by calling settle_spin instruction
   */
  private async settleGame(
    gamePubkey: PublicKey,
    playerWallet: PublicKey
  ): Promise<BetRecord | null> {
    try {
      const serverSeed = this.generateServerSeed();

      // Build settle_spin transaction
      // (Using simplified approach - in production use createSettleSpinInstruction)
      const instruction = await this.createSettleSpinInstruction(
        gamePubkey,
        playerWallet,
        serverSeed
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: this.oracleKeypair.publicKey,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight,
      }).add(instruction);

      // Sign and send
      transaction.sign(this.oracleKeypair);
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize()
      );

      await this.connection.confirmTransaction(signature, 'confirmed');

      console.log('✅ Game settled:', signature);

      // Parse game result and create bet record
      const betRecord: BetRecord = {
        wallet: playerWallet.toString(),
        timestamp: Date.now(),
        betAmount: 0, // Parse from game account
        won: false, // Parse from settlement result
        payout: 0, // Parse from settlement result
        treasuryContribution: 0, // betAmount if lost
        gameType: 'coinflip', // Parse from game account
        signature,
      };

      // Update leaderboard
      this.updateLeaderboard(betRecord);

      // Broadcast to clients
      this.broadcast({
        type: 'new_bet',
        data: betRecord,
      });

      this.broadcast({
        type: 'leaderboard',
        data: this.getLeaderboardData(),
      });

      return betRecord;
    } catch (error) {
      console.error('Error settling game:', error);
      return null;
    }
  }

  /**
   * Update leaderboard with new bet
   */
  private updateLeaderboard(bet: BetRecord) {
    const wallet = bet.wallet;
    let player = this.leaderboard.get(wallet);

    if (!player) {
      player = {
        wallet,
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        treasuryContribution: 0,
        lastBetTimestamp: 0,
      };
    }

    player.totalBets += 1;
    player.totalWagered += bet.betAmount;
    player.totalWon += bet.payout;
    player.lastBetTimestamp = bet.timestamp;

    // Track Treasury contribution (losses only)
    if (!bet.won) {
      player.treasuryContribution += bet.betAmount;
      bet.treasuryContribution = bet.betAmount;
    }

    this.leaderboard.set(wallet, player);
    this.recentBets.unshift(bet);

    // Keep only last 1000 bets
    if (this.recentBets.length > 1000) {
      this.recentBets = this.recentBets.slice(0, 1000);
    }
  }

  /**
   * Create settle_spin instruction
   * (Simplified - in production use proper Anchor instruction builder)
   */
  private async createSettleSpinInstruction(
    gamePubkey: PublicKey,
    playerWallet: PublicKey,
    serverSeed: string
  ) {
    // Import the utility function
    const { createSettleSpinInstruction } = await import('../src/utils/solana-casino');
    
    return createSettleSpinInstruction(
      playerWallet,
      gamePubkey,
      serverSeed,
      this.oracleKeypair.publicKey
    );
  }

  /**
   * Get leaderboard (API endpoint)
   */
  getLeaderboard() {
    return this.getLeaderboardData();
  }
}

// Start oracle service
if (require.main === module) {
  const oracle = new OracleService();
  oracle.startListening();

  console.log('🚀 Oracle service running');
  console.log('Press Ctrl+C to stop');
}

export default OracleService;
