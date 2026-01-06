use anchor_lang::prelude::*;
use super::PlayerStats;

#[account]
pub struct Player {
    /// Player's wallet address
    pub authority: Pubkey,
    /// Player statistics
    pub stats: PlayerStats,
    /// Lifetime contribution to Treasury (total losses)
    pub treasury_contribution: u64,
    /// Total deposit amount
    pub total_deposited: u64,
    /// Total withdrawal amount
    pub total_withdrawn: u64,
    /// Is VIP player
    pub is_vip: bool,
    /// Referrer (if any)
    pub referrer: Option<Pubkey>,
    /// Referral rewards earned
    pub referral_rewards: u64,
    /// Last game timestamp
    pub last_game_at: Option<i64>,
    /// Created timestamp
    pub created_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl Player {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        (8 * 8 + 4 + 4) + // stats
        8 + // treasury_contribution
        8 + // total_deposited
        8 + // total_withdrawn
        1 + // is_vip
        1 + 32 + // referrer (optional)
        8 + // referral_rewards
        1 + 8 + // last_game_at (optional)
        8 + // created_at
        1 + // bump
        64; // padding

    pub fn update_after_game(&mut self, bet_amount: u64, payout: u64, won: bool) {
        self.stats.games_played += 1;
        self.stats.total_wagered += bet_amount;
        self.stats.total_won += payout;

        if won {
            self.stats.biggest_win = self.stats.biggest_win.max(payout);
            self.stats.current_streak = if self.stats.current_streak >= 0 {
                self.stats.current_streak + 1
            } else {
                1
            };
        } else {
            // Track Treasury contribution (losses)
            self.treasury_contribution += bet_amount;
            self.stats.current_streak = if self.stats.current_streak <= 0 {
                self.stats.current_streak - 1
            } else {
                -1
            };
        }

        self.stats.best_streak = self.stats.best_streak.max(self.stats.current_streak.abs());
        self.last_game_at = Some(Clock::get().unwrap().unix_timestamp);
    }
}
