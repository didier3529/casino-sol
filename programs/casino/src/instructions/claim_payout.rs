use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use crate::state::*;
use crate::errors::CasinoError;

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
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
        constraint = session.status == SessionStatus::Resolved @ CasinoError::NotResolved,
    )]
    pub session: Account<'info, GameSession>,
    
    /// Vault PDA that pays out winnings
    /// CHECK: Vault PDA verified via seeds
    #[account(
        mut,
        seeds = [VAULT_SEED, casino.key().as_ref()],
        bump = casino.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    
    /// Player must sign to claim their winnings
    #[account(
        mut,
        constraint = player.key() == session.player @ CasinoError::Unauthorized,
    )]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimPayout>) -> Result<()> {
    let result = ctx.accounts.session.result.as_ref()
        .ok_or(CasinoError::NotResolved)?;
    
    require!(result.is_win && result.payout > 0 && !result.payout_claimed, CasinoError::NothingToClaim);
    
    let payout = result.payout;
    let casino_key = ctx.accounts.casino.key();
    
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.player.to_account_info(),
            },
            &[&[VAULT_SEED, casino_key.as_ref(), &[ctx.accounts.casino.vault_bump]]],
        ),
        payout
    )?;
    
    ctx.accounts.casino.total_payouts = ctx.accounts.casino.total_payouts
        .checked_add(payout)
        .ok_or(CasinoError::Overflow)?;
    
    ctx.accounts.session.result.as_mut().unwrap().payout_claimed = true;
    
    Ok(())
}

