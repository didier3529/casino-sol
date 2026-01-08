use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::CasinoError;

#[derive(Accounts)]
pub struct SkimExcessToTreasury<'info> {
    #[account(
        mut,
        seeds = [CASINO_SEED],
        bump,
        has_one = authority @ CasinoError::Unauthorized
    )]
    pub casino: Account<'info, CasinoConfig>,
    
    #[account(
        mut,
        seeds = [VAULT_SEED, casino.key().as_ref()],
        bump = casino.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    
    #[account(
        mut,
        seeds = [TREASURY_SEED, casino.key().as_ref()],
        bump = casino.treasury_bump
    )]
    pub treasury: SystemAccount<'info>,
    
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SkimExcessToTreasury>,
    amount: u64,
    min_vault_reserve: u64,
) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let treasury = &ctx.accounts.treasury;
    let casino = &mut ctx.accounts.casino;
    
    let vault_balance = vault.lamports();
    
    msg!("Skim request: {} lamports", amount);
    msg!("Current vault balance: {} lamports", vault_balance);
    msg!("Min vault reserve: {} lamports", min_vault_reserve);
    
    require!(amount > 0, CasinoError::InvalidSkimAmount);
    
    let required_balance = amount
        .checked_add(min_vault_reserve)
        .ok_or(CasinoError::Overflow)?;
    
    require!(
        vault_balance >= required_balance,
        CasinoError::InsufficientVaultLiquidity
    );
    
    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **treasury.to_account_info().try_borrow_mut_lamports()? += amount;
    
    casino.total_treasury_skimmed = casino
        .total_treasury_skimmed
        .checked_add(amount)
        .ok_or(CasinoError::Overflow)?;
    
    let vault_balance_after = vault.lamports();
    let treasury_balance_after = treasury.lamports();
    
    msg!("Skimmed {} lamports to treasury", amount);
    msg!("Vault balance after: {} lamports", vault_balance_after);
    msg!("Treasury balance after: {} lamports", treasury_balance_after);
    msg!("Total treasury skimmed (lifetime): {} lamports", casino.total_treasury_skimmed);
    
    emit!(TreasurySkimmed {
        amount,
        vault_balance_after,
        treasury_balance_after,
        min_vault_reserve,
    });
    
    Ok(())
}

#[event]
pub struct TreasurySkimmed {
    pub amount: u64,
    pub vault_balance_after: u64,
    pub treasury_balance_after: u64,
    pub min_vault_reserve: u64,
}
