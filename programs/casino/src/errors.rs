use anchor_lang::prelude::*;

#[error_code]
pub enum CasinoError {
    #[msg("Casino is currently paused")]
    CasinoPaused,
    
    #[msg("Invalid bet amount - must be between min and max bet")]
    InvalidBetAmount,
    
    #[msg("Player has insufficient funds for this bet")]
    InsufficientPlayerFunds,
    
    #[msg("Vault has insufficient liquidity to cover potential payout")]
    InsufficientVaultLiquidity,
    
    #[msg("Unauthorized: only casino authority can perform this action")]
    Unauthorized,
    
    #[msg("Invalid randomness callback - verification failed")]
    InvalidRandomnessCallback,
    
    #[msg("Game session already resolved")]
    AlreadyResolved,
    
    #[msg("Numeric overflow occurred")]
    Overflow,
    
    #[msg("Game session expired")]
    SessionExpired,
    
    #[msg("Invalid choice - must be 0 (heads) or 1 (tails)")]
    InvalidChoice,
    
    #[msg("Mock VRF is only allowed on localnet")]
    MockVRFNotAllowed,
    
    #[msg("Session is not expired yet - cannot refund")]
    SessionNotExpiredYet,
    
    #[msg("Randomness has already been requested for this session")]
    RandomnessAlreadyRequested,
    
    #[msg("Session is not resolved yet")]
    NotResolved,
    
    #[msg("Nothing to claim - no payout or already claimed")]
    NothingToClaim,
    
    #[msg("Invalid skim amount - must be greater than zero")]
    InvalidSkimAmount,
}

    InvalidSkimAmount,
}
