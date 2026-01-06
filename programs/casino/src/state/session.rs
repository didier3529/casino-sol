use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GameSession {
    /// Player's wallet pubkey
    pub player: Pubkey,
    
    /// Unique game ID (from casino.total_games at creation time)
    pub game_id: u64,
    
    /// Game type
    pub game_type: GameType,
    
    /// Bet amount in lamports
    pub bet_amount: u64,
    
    /// Player's choice/input (meaning depends on game_type)
    /// CoinFlip: 0 = heads, 1 = tails
    /// Dice: target number (2-12)
    /// Slots: bet lines (unused for now, default = 1)
    pub choice: u8,
    
    /// Session status
    pub status: SessionStatus,
    
    /// Randomness request data
    pub randomness_request: RandomnessRequest,
    
    /// Result (populated after resolution)
    pub result: Option<GameResult>,
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Resolution timestamp (if resolved)
    pub resolved_at: Option<i64>,
    
    /// PDA bump
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum GameType {
    CoinFlip,
    Dice,
    Slots,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum SessionStatus {
    /// Awaiting randomness fulfillment
    Pending,
    
    /// Resolved (win or loss)
    Resolved,
    
    /// Expired (not resolved within time limit)
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct RandomnessRequest {
    /// Whether this is a mock request (localnet only)
    pub is_mock: bool,
    
    /// Request signature or ID (for tracking)
    #[max_len(64)]
    pub request_id: String,
    
    /// Switchboard request account (if using real VRF)
    pub switchboard_request: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct GameResult {
    /// Game outcome (meaning depends on game_type)
    /// CoinFlip: 0 = heads, 1 = tails
    /// Dice: rolled number (2-12)
    /// Slots: packed result (3 reels, each 0-9)
    pub outcome: u8,
    
    /// Whether player won
    pub is_win: bool,
    
    /// Payout amount in lamports (0 if loss)
    pub payout: u64,
    
    /// Whether the payout has been claimed/transferred
    /// - For losses: always true (nothing to claim)
    /// - For wins: false until player claims
    pub payout_claimed: bool,
}

impl GameSession {
    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time - self.created_at > crate::state::SESSION_EXPIRY_SECONDS
    }
}

