use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use crate::state::*;
use crate::errors::CasinoError;

#[derive(Accounts)]
pub struct FulfillRandomness<'info> {
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
    )]
    pub session: Account<'info, GameSession>,
    
    /// Vault PDA that pays out winnings
    /// CHECK: Vault PDA verified via seeds, used as signer for payouts
    #[account(
        mut,
        seeds = [VAULT_SEED, casino.key().as_ref()],
        bump = casino.vault_bump,
    )]
    pub vault: SystemAccount<'info>,
    
    /// Player receives payout if they win
    /// CHECK: Player pubkey verified against session
    #[account(
        mut,
        constraint = player.key() == session.player @ CasinoError::Unauthorized,
    )]
    pub player: SystemAccount<'info>,
    
    /// Authority or Switchboard oracle (depending on mock vs real VRF)
    pub caller: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<FulfillRandomness>,
    random_value: [u8; 32],
) -> Result<()> {
    let casino = &mut ctx.accounts.casino;
    let session = &mut ctx.accounts.session;
    let clock = &ctx.accounts.clock;
    
    // Check session not expired
    require!(
        !session.is_expired(clock.unix_timestamp),
        CasinoError::SessionExpired
    );
    
    // Verify caller is authority OR player
    let is_authority = ctx.accounts.caller.key() == casino.authority;
    let is_player = ctx.accounts.caller.key() == session.player;
    require!(is_authority || is_player, CasinoError::Unauthorized);
    
    #[cfg(feature = "mock-vrf")]
    require!(session.randomness_request.is_mock, CasinoError::InvalidRandomnessCallback);
    
    #[cfg(not(feature = "mock-vrf"))]
    require!(!session.randomness_request.is_mock, CasinoError::MockVRFNotAllowed);
    
    let (outcome, is_win, payout_multiplier) = match session.game_type {
        GameType::CoinFlip => {
            let o = if random_value[0] < 128 { 0 } else { 1 };
            let w = o == session.choice;
            (o, w, if w { PAYOUT_MULTIPLIER_BP } else { 0 })
        },
        GameType::Dice => {
            let r = (random_value[0] % 6) + 1 + (random_value[1] % 6) + 1;
            let w = r == session.choice;
            (r, w, if w { 50000 } else { 0 })
        },
        GameType::Slots => {
            let r1 = random_value[0] % 10;
            let r2 = random_value[1] % 10;
            let r3 = random_value[2] % 10;
            let o = ((r1 as u16 * 100 + r2 as u16 * 10 + r3 as u16) % 256) as u8;
            let w = r1 == r2 && r2 == r3;
            (o, w, if w { 100000 } else { 0 })
        },
    };
    
    msg!("Random value (first bytes): {:?}", &random_value[0..3]);
    msg!("Outcome: {}", outcome);
    msg!("Result: {}", if is_win { "WIN" } else { "LOSS" });
    
    // Calculate payout
    let payout = if payout_multiplier > 0 {
        session.bet_amount
            .checked_mul(payout_multiplier)
            .ok_or(CasinoError::Overflow)?
            .checked_div(BASIS_POINTS)
            .ok_or(CasinoError::Overflow)?
    } else {
        0
    };
    
    // Determine if payout should be transferred
    let should_transfer_payout = is_win && payout > 0;
    let payout_claimed: bool;
    
    if should_transfer_payout {
        // For WINS: Only transfer payout if PLAYER is the caller
        let is_player = ctx.accounts.caller.key() == session.player;
        
        if is_player {
            let casino_key = casino.key();
            let vault_seeds = &[VAULT_SEED, casino_key.as_ref(), &[casino.vault_bump]];
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
            system_program::transfer(cpi_ctx, payout)?;
            casino.total_payouts = casino.total_payouts
                .checked_add(payout)
                .ok_or(CasinoError::Overflow)?;
            payout_claimed = true;
        } else {
            payout_claimed = false;
        }
    } else {
        // Loss: no payout to transfer
        msg!("Loss - no payout");
        payout_claimed = true; // Nothing to claim
    }
    
    // Update session with result
    session.status = SessionStatus::Resolved;
    session.resolved_at = Some(clock.unix_timestamp);
    session.result = Some(GameResult {
        outcome,
        is_win,
        payout,
        payout_claimed,
    });
    
    msg!("Session resolved!");
    msg!("Final payout: {} lamports", payout);
    
    // NOTE: We intentionally keep the session account open so the frontend can poll and display
    // the result without requiring the player to sign a separate transaction.
    
    Ok(())
}

