use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CasinoConfig {
    /// Authority that can update config and withdraw from vault
    pub authority: Pubkey,
    
    /// Vault PDA bump (stored for CPI signing)
    pub vault_bump: u8,
    
    /// Treasury PDA bump (stored for treasury operations)
    pub treasury_bump: u8,
    
    /// Minimum bet amount in lamports
    pub min_bet: u64,
    
    /// Maximum bet amount in lamports
    pub max_bet: u64,
    
    /// Total number of games played (used for game_id generation)
    pub total_games: u64,
    
    /// Total volume wagered in lamports
    pub total_volume: u64,
    
    /// Total payouts made in lamports
    pub total_payouts: u64,
    
    /// Total lamports skimmed from vault to treasury
    pub total_treasury_skimmed: u64,
    
    /// Casino is active (can be paused for maintenance)
    pub is_active: bool,
    
    /// Switchboard function account (optional, for VRF requests)
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

            crate::errors::CasinoError::InvalidBetAmount
        );
        Ok(())
    }
}
