pub mod casino;
pub mod session;

pub use casino::*;
pub use session::*;

// PDA Seeds
pub const CASINO_SEED: &[u8] = b"casino";
pub const VAULT_SEED: &[u8] = b"vault";
pub const TREASURY_SEED: &[u8] = b"treasury";
pub const SESSION_SEED: &[u8] = b"session";

// Game constants
pub const BASIS_POINTS: u64 = 10000;
pub const WIN_PROBABILITY_BP: u64 = 4800; // 48%
pub const PAYOUT_MULTIPLIER_BP: u64 = 19600; // 1.96x
pub const SESSION_EXPIRY_SECONDS: i64 = 3600; // 1 hour
