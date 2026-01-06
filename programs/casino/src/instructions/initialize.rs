use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, CreateAccount};
use crate::state::*;
use crate::errors::CasinoError;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CasinoConfig::INIT_SPACE,
        seeds = [CASINO_SEED],
        bump
    )]
    pub casino: Account<'info, CasinoConfig>,
    
    /// Vault PDA (SystemAccount) that holds all bets
    /// CHECK: Vault PDA is created and validated via seeds
    #[account(
        mut,
        seeds = [VAULT_SEED, casino.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    
    /// Treasury PDA (SystemAccount) that holds excess profits for buyback
    /// CHECK: Treasury PDA is created and validated via seeds
    #[account(
        mut,
        seeds = [TREASURY_SEED, casino.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    min_bet: u64,
    max_bet: u64,
    initial_vault_amount: u64,
) -> Result<()> {
    // Validate config
    require!(min_bet > 0, CasinoError::InvalidBetAmount);
    require!(max_bet >= min_bet, CasinoError::InvalidBetAmount);
    require!(
        max_bet <= initial_vault_amount / 2, // Max bet should be at most half vault balance
        CasinoError::InvalidBetAmount
    );
    
    let casino = &mut ctx.accounts.casino;
    let vault_bump = *ctx.bumps.get("vault").unwrap();
    let treasury_bump = *ctx.bumps.get("treasury").unwrap();
    
    // Initialize casino config
    casino.authority = ctx.accounts.authority.key();
    casino.vault_bump = vault_bump;
    casino.treasury_bump = treasury_bump;
    casino.min_bet = min_bet;
    casino.max_bet = max_bet;
    casino.total_games = 0;
    casino.total_volume = 0;
    casino.total_payouts = 0;
    casino.total_treasury_skimmed = 0;
    casino.is_active = true;
    casino.switchboard_function = None;
    
    // Transfer initial liquidity to vault if amount specified
    if initial_vault_amount > 0 {
        let transfer_cpi = system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_cpi,
        );
        system_program::transfer(cpi_ctx, initial_vault_amount)?;
    }
    
    msg!("Casino initialized!");
    msg!("Authority: {}", casino.authority);
    msg!("Min bet: {} lamports", casino.min_bet);
    msg!("Max bet: {} lamports", casino.max_bet);
    msg!("Initial vault balance: {} lamports", initial_vault_amount);
    
    Ok(())
}


    }
    
    msg!("Casino initialized!");
    msg!("Authority: {}", casino.authority);
    msg!("Min bet: {} lamports", casino.min_bet);
    msg!("Max bet: {} lamports", casino.max_bet);
    msg!("Initial vault balance: {} lamports", initial_vault_amount);
    
    Ok(())
}

