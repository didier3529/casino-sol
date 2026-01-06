use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use crate::state::*;
use crate::errors::CasinoError;

#[derive(Accounts)]
pub struct RefundExpired<'info> {
    #[account(
        mut,
        seeds = [CASINO_SEED],
        bump,
    )]
    pub casino: Account<'info, CasinoConfig>,
    
    #[account(
        mut,
        seeds = [
            SESSION_SEED,
            session.player.as_ref(),
            &session.game_id.to_le_bytes()
        ],
        bump = session.bump,
        constraint = session.status == SessionStatus::Pending @ CasinoError::AlreadyResolved,
        close = player, // Close session and refund rent to player
    )]
    pub session: Account<'info, GameSession>,
    
    /// Vault PDA that refunds the bet
    /// CHECK: Vault PDA verified via seeds, used as signer for refunds
    #[account(
        mut,
        seeds = [VAULT_SEED, casino.key().as_ref()],
        bump = casino.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    
    /// Player receives bet refund
    /// CHECK: Player pubkey verified against session
    #[account(
        mut,
        constraint = player.key() == session.player @ CasinoError::Unauthorized,
    )]
    pub player: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<RefundExpired>) -> Result<()> {
    let session = &mut ctx.accounts.session;
    let clock = &ctx.accounts.clock;
    let casino = &ctx.accounts.casino;
    
    // Session MUST be expired to refund
    require!(
        session.is_expired(clock.unix_timestamp),
        CasinoError::SessionNotExpiredYet
    );
    
    msg!("Session expired. Refunding bet to player.");
    msg!("Session created at: {}", session.created_at);
    msg!("Current time: {}", clock.unix_timestamp);
    msg!("Expired: {} seconds ago", clock.unix_timestamp - session.created_at - SESSION_EXPIRY_SECONDS);
    
    // Refund the original bet from vault to player
    let bet_amount = session.bet_amount;
    
    // Vault must sign for the transfer using PDA seeds
    let casino_key = casino.key();
    let vault_seeds = &[
        VAULT_SEED,
        casino_key.as_ref(),
        &[casino.vault_bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];
    
    let transfer_cpi = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.player.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        transfer_cpi,
        signer_seeds,
    );
    system_program::transfer(cpi_ctx, bet_amount)?;
    
    msg!("Bet refunded: {} lamports", bet_amount);
    
    // Mark session as expired (for record keeping before close)
    session.status = SessionStatus::Expired;
    session.resolved_at = Some(clock.unix_timestamp);
    
    msg!("Session marked as expired and closed. Rent refunded to player.");
    
    // Session account will be closed automatically by close constraint
    // Rent will be refunded to player
    
    Ok(())
}

