use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CasinoConfig {
    pub authority: Pubkey,
    pub vault_bump: u8,
    pub treasury_bump: u8,
    pub min_bet: u64,
    pub max_bet: u64,
    pub total_games: u64,
    pub total_volume: u64,
    pub total_payouts: u64,
    pub total_treasury_skimmed: u64,
    pub is_active: bool,
    pub switchboard_function: Option<Pubkey>,
}

impl CasinoConfig {
    pub fn is_operational(&self) -> bool {
        self.is_active
    }
    
    pub fn validate_bet_amount(&self, amount: u64) -> Result<()> {
        require!(
            amount >= self.min_bet && amount <= self.max_bet,
            crate::errors::CasinoError::InvalidBetAmount
        );
        Ok(())
    }
}
