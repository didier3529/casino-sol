use anchor_lang::prelude::*;

declare_id!("CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod casino {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        min_bet: u64,
        max_bet: u64,
        initial_vault_amount: u64,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, min_bet, max_bet, initial_vault_amount)
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        game_type: state::GameType,
        choice: u8,
        bet_amount: u64,
    ) -> Result<()> {
        instructions::place_bet::handler(ctx, game_type, choice, bet_amount)
    }

    pub fn fulfill_randomness(
        ctx: Context<FulfillRandomness>,
        random_value: [u8; 32],
    ) -> Result<()> {
        instructions::fulfill_randomness::handler(ctx, random_value)
    }
    
    pub fn claim_payout(
        ctx: Context<ClaimPayout>,
    ) -> Result<()> {
        instructions::claim_payout::handler(ctx)
    }
    
    pub fn refund_expired(
        ctx: Context<RefundExpired>,
    ) -> Result<()> {
        instructions::refund_expired::handler(ctx)
    }
    
    pub fn skim_excess_to_treasury(
        ctx: Context<SkimExcessToTreasury>,
        amount: u64,
        min_vault_reserve: u64,
    ) -> Result<()> {
        instructions::skim_excess_to_treasury::handler(ctx, amount, min_vault_reserve)
    }
}
