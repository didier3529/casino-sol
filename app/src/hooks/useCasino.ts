import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PROGRAM_ID, CASINO_SEED, VAULT_SEED, SESSION_SEED } from '../utils/constants';
import type { Casino } from '../types/casino';
import IDL from '../idl/casino.json';

export function useCasino() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );

    return new Program(IDL as any, PROGRAM_ID, provider);
  }, [connection, wallet]);

  /**
   * Derive Casino PDA
   */
  const getCasinoPDA = useMemo(() => {
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [CASINO_SEED],
      PROGRAM_ID
    );
    return { pda, bump };
  }, []);

  /**
   * Derive Vault PDA
   */
  const getVaultPDA = useMemo(() => {
    const casinoPDA = getCasinoPDA.pda;
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, casinoPDA.toBuffer()],
      PROGRAM_ID
    );
    return { pda, bump };
  }, [getCasinoPDA.pda]);

  /**
   * Derive Session PDA for a player and game ID
   */
  const getSessionPDA = (player: PublicKey, gameId: number) => {
    // Browser-compatible: Convert number to 8-byte little-endian Uint8Array
    const gameIdBuffer = new Uint8Array(8);
    const view = new DataView(gameIdBuffer.buffer);
    view.setBigUint64(0, BigInt(gameId), true); // true = little-endian
    
    const [pda, bump] = PublicKey.findProgramAddressSync(
      [SESSION_SEED, player.toBuffer(), gameIdBuffer],
      PROGRAM_ID
    );
    return { pda, bump };
  };

  /**
   * Fetch casino config account
   */
  const fetchCasino = async () => {
    if (!program) return null;
    try {
      const casinoAccount = await program.account.casinoConfig.fetch(getCasinoPDA.pda);
      return casinoAccount;
    } catch (error) {
      console.error('Error fetching casino:', error);
      return null;
    }
  };

  /**
   * Fetch vault balance
   */
  const fetchVaultBalance = async (): Promise<number> => {
    try {
      const balance = await connection.getBalance(getVaultPDA.pda);
      return balance;
    } catch (error) {
      console.error('Error fetching vault balance:', error);
      return 0;
    }
  };

  /**
   * Fetch all sessions for a player
   * Returns UI-safe objects with BN/PublicKey converted to strings
   * 
   * IMPORTANT: Uses getProgramAccounts + per-account decode to gracefully skip legacy sessions
   * that don't match the current GameSession struct layout (e.g., sessions created before
   * the multi-game upgrade that added `game_type` field).
   */
  const fetchPlayerSessions = async (player: PublicKey) => {
    if (!program) return [];
    
    try {
      // GameSession discriminator: sha256("account:GameSession")[0..8]
      const discriminator = Buffer.from([0x96, 0x74, 0x14, 0xc5, 0xcd, 0x79, 0xdc, 0xf0]);
      
      // Fetch all accounts for this player (we'll filter by discriminator locally).
      // Why local filter: Solana memcmp filter expects base58 bytes; avoiding extra deps and
      // avoiding passing unsupported fields like `encoding`.
      const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 8, // After 8-byte discriminator, first field is player: Pubkey (32 bytes)
              bytes: player.toBase58(),
            },
          },
        ],
      });
      
      console.log(`Found ${rawAccounts.length} account(s) for player (pre-discriminator filter)`);
      
      // Decode each account individually, skipping legacy/incompatible ones
      const decoded: any[] = [];
      let nonGameSessionCount = 0;
      let skippedCount = 0;
      let decodeErrorCount = 0;
      
      for (const { pubkey, account } of rawAccounts) {
        // Filter to GameSession accounts by discriminator
        const disc = account.data.subarray(0, 8);
        if (!Buffer.from(disc).equals(discriminator)) {
          nonGameSessionCount++;
          continue;
        }

        try {
          // IMPORTANT: IDL account name is "GameSession" (PascalCase), not "gameSession".
          const session = program.coder.accounts.decode('GameSession', account.data);
          
          // Successfully decoded - convert to UI-safe format
          decoded.push({
            publicKey: pubkey.toBase58(),
            account: {
              player: session.player.toBase58(),
              gameId: session.gameId.toString(),
              gameType: session.gameType, // May be undefined for legacy sessions, but decode won't fail
              betAmount: session.betAmount.toString(),
              choice: session.choice,
              status: session.status,
              createdAt: session.createdAt.toString(),
              resolvedAt: session.resolvedAt?.toString() || null,
              result: session.result ? {
                outcome: session.result.outcome,
                isWin: session.result.isWin,
                payout: session.result.payout.toString(),
              } : null,
              bump: session.bump,
            },
          });
        } catch (decodeError) {
          // Skip this account (likely a legacy session with incompatible layout)
          skippedCount++;
          decodeErrorCount++;
          if (decodeErrorCount <= 3) {
            console.warn(
              `Skipping legacy/incompatible GameSession ${pubkey.toBase58().slice(0, 8)}...:`,
              decodeError instanceof Error ? decodeError.message : decodeError
            );
          }
        }
      }
      
      if (nonGameSessionCount > 0) {
        console.log(`Ignored ${nonGameSessionCount} non-GameSession account(s) (discriminator mismatch)`);
      }
      if (skippedCount > 0) {
        console.warn(`Skipped ${skippedCount} legacy/incompatible GameSession account(s)`);
      }
      
      return decoded;
    } catch (error) {
      console.error('Error fetching player sessions:', error);
      return [];
    }
  };

  /**
   * Fetch a single session by pubkey (used for per-round polling so we don't scan everything).
   * Returns null if not found / discriminator mismatch / decode error.
   */
  const fetchSessionByPubkey = async (sessionPubkey: PublicKey) => {
    if (!program) return null;

    try {
      const info = await connection.getAccountInfo(sessionPubkey, { commitment: 'confirmed' });
      if (!info) return null;

      const discriminator = Buffer.from([0x96, 0x74, 0x14, 0xc5, 0xcd, 0x79, 0xdc, 0xf0]);
      const disc = info.data.subarray(0, 8);
      if (!Buffer.from(disc).equals(discriminator)) return null;

      const session: any = program.coder.accounts.decode('GameSession', info.data);
      return {
        publicKey: sessionPubkey.toBase58(),
        account: {
          player: session.player.toBase58(),
          gameId: session.gameId.toString(),
          gameType: session.gameType,
          betAmount: session.betAmount.toString(),
          choice: session.choice,
          status: session.status,
          createdAt: session.createdAt.toString(),
          resolvedAt: session.resolvedAt?.toString() || null,
          result: session.result
            ? {
                outcome: session.result.outcome,
                isWin: session.result.isWin,
                payout: session.result.payout.toString(),
              }
            : null,
          bump: session.bump,
        },
      };
    } catch {
      return null;
    }
  };

  return {
    program,
    getCasinoPDA,
    getVaultPDA,
    getSessionPDA,
    fetchCasino,
    fetchVaultBalance,
    fetchPlayerSessions,
    fetchSessionByPubkey,
  };
}

