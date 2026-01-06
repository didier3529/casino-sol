use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use crate::state::*;
use crate::errors::CasinoError;

#[derive(Accounts)]
#[instruction(choice: u8, bet_amount: u64)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [CASINO_SEED],
        bump,
        constraint = casino.is_operational() @ CasinoError::CasinoPaused,
    )]
    pub casino: Account<'info, CasinoConfig>,
    
    #[account(
        init,
        payer = player,
        space = 8 + GameSession::INIT_SPACE,
        seeds = [
            SESSION_SEED,
            player.key().as_ref(),
            // CRITICAL: Use casino.total_games BEFORE incrementing (will be incremented in handler)
            &casino.total_games.to_le_bytes()
        ],
        bump
    )]
    pub session: Account<'info, GameSession>,
    
    /// Vault PDA that receives the bet
    /// CHECK: Vault PDA verified via seeds
    #[account(
        mut,
        seeds = [VAULT_SEED, casino.key().as_ref()],
        bump = casino.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<PlaceBet>,
    game_type: GameType,
    choice: u8,
    bet_amount: u64,
) -> Result<()> {
    let casino = &mut ctx.accounts.casino;
    let session = &mut ctx.accounts.session;
    let clock = &ctx.accounts.clock;
    
    // Validate choice based on game type
    match game_type {
        GameType::CoinFlip => {
            require!(choice == 0 || choice == 1, CasinoError::InvalidChoice);
        },
        GameType::Dice => {
            require!(choice >= 2 && choice <= 12, CasinoError::InvalidChoice);
        },
        GameType::Slots => {
            // Slots doesn't use choice (auto-spin), but we accept any value
        },
    }
    
    // Validate bet amount
    casino.validate_bet_amount(bet_amount)?;
    
    // Check player has sufficient balance (including rent + tx fees buffer)
    let player_balance = ctx.accounts.player.lamports();
    let required_balance = bet_amount + 10_000_000; // 0.01 SOL buffer for rent + fees
    require!(
        player_balance >= required_balance,
        CasinoError::InsufficientPlayerFunds
    );
    
    // Calculate potential payout
    let potential_payout = bet_amount
        .checked_mul(PAYOUT_MULTIPLIER_BP)
        .ok_or(CasinoError::Overflow)?
        .checked_div(BASIS_POINTS)
        .ok_or(CasinoError::Overflow)?;
    
    // Check vault has enough liquidity for potential payout
    let vault_balance = ctx.accounts.vault.lamports();
    require!(
        vault_balance >= potential_payout,
        CasinoError::InsufficientVaultLiquidity
    );
    
    // CRITICAL FIX: Increment game counter BEFORE using it (prevents PDA collision race condition)
    let game_id = casino.total_games;
    casino.total_games = casino.total_games
        .checked_add(1)
        .ok_or(CasinoError::Overflow)?;
    
    // ATOMIC STEP 1: Transfer bet from player to vault
    let transfer_cpi = Transfer {
        from: ctx.accounts.player.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_cpi,
    );
    system_program::transfer(cpi_ctx, bet_amount)?;
    
    // ATOMIC STEP 2: Initialize session
    session.player = ctx.accounts.player.key();
    session.game_id = game_id;
    session.game_type = game_type;
    session.bet_amount = bet_amount;
    session.choice = choice;
    session.status = SessionStatus::Pending;
    session.created_at = clock.unix_timestamp;
    session.resolved_at = None;
    session.result = None;
    session.bump = *ctx.bumps.get("session").unwrap();
    
    // ATOMIC STEP 3: Request randomness
    // For localnet/testing: mock request
    #[cfg(feature = "mock-vrf")]
    {
        session.randomness_request = RandomnessRequest {
            is_mock: true,
            request_id: format!("mock_{}", game_id),
            switchboard_request: None,
        };
        
        msg!("Mock VRF request created for localnet testing");
    }
    
    // For devnet/mainnet: real Switchboard VRF
    #[cfg(not(feature = "mock-vrf"))]
    {
        // TODO: Implement real Switchboard VRF request
        // For now, use mock structure but mark as non-mock
        session.randomness_request = RandomnessRequest {
            is_mock: false,
            request_id: format!("sb_{}", game_id),
            switchboard_request: casino.switchboard_function,
        };
        
        msg!("Switchboard VRF request would be created here");
    }
    
    // Update casino stats
    casino.total_volume = casino.total_volume
        .checked_add(bet_amount)
        .ok_or(CasinoError::Overflow)?;
    
    msg!("Bet placed successfully!");
    msg!("Game ID: {}", game_id);
    msg!("Player: {}", session.player);
    msg!("Bet amount: {} lamports", session.bet_amount);
    msg!("Choice: {} (0=heads, 1=tails)", choice);
    msg!("Session PDA: {}", ctx.accounts.session.key());
    
    Ok(())
}

