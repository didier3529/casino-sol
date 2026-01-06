use anchor_lang::prelude::*;

// Program ID synced with target/deploy/casino-keypair.json
// Localnet: AUqeYqxd7bAtrvyu7icRVgfLBa8i5jiS9QiHx6WfUhpf (this keypair)
// Devnet: CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma (deployed)
// NOTE: For devnet upgrades, this MUST match the deployed devnet Program ID.
declare_id!("CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod casino {
    use super::*;

    /// Initialize the casino with configuration
    /// Creates CasinoConfig PDA and Vault PDA
    pub fn initialize(
        ctx: Context<Initialize>,
        min_bet: u64,
        max_bet: u64,
        initial_vault_amount: u64,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, min_bet, max_bet, initial_vault_amount)
    }

    /// Place a bet on any casino game
    /// Atomic: transfers SOL to vault, initializes session, requests randomness
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        game_type: state::GameType, // CoinFlip, Dice, or Slots
        choice: u8, // Game-specific: CoinFlip(0/1), Dice(2-12), Slots(unused)
        bet_amount: u64,
    ) -> Result<()> {
        instructions::place_bet::handler(ctx, game_type, choice, bet_amount)
    }

    /// Fulfill randomness and resolve game session
    /// Called by oracle (mock for localnet, Switchboard for devnet/mainnet)
    pub fn fulfill_randomness(
        ctx: Context<FulfillRandomness>,
        random_value: [u8; 32],
    ) -> Result<()> {
        instructions::fulfill_randomness::handler(ctx, random_value)
    }
    
    /// Claim payout after winning (player-signed)
    /// Transfers winnings from vault to player
    pub fn claim_payout(
        ctx: Context<ClaimPayout>,
    ) -> Result<()> {
        instructions::claim_payout::handler(ctx)
    }
    
    /// Refund expired session to player
    pub fn refund_expired(
        ctx: Context<RefundExpired>,
    ) -> Result<()> {
        instructions::refund_expired::handler(ctx)
    }
    
    /// Skim excess SOL from vault to treasury for buyback operations
    /// Authority-only, enforces minimum vault reserve
    pub fn skim_excess_to_treasury(
        ctx: Context<SkimExcessToTreasury>,
        amount: u64,
        min_vault_reserve: u64,
    ) -> Result<()> {
        instructions::skim_excess_to_treasury::handler(ctx, amount, min_vault_reserve)
    }
}

    /// Authority-only, enforces minimum vault reserve
    pub fn skim_excess_to_treasury(
        ctx: Context<SkimExcessToTreasury>,
        amount: u64,
        min_vault_reserve: u64,
    ) -> Result<()> {
        instructions::skim_excess_to_treasury::handler(ctx, amount, min_vault_reserve)
    }
}
