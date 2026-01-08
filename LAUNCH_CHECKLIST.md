# SOL VEGAS Launch Checklist

## Overview
This checklist tracks readiness for SOL VEGAS deployment from development through mainnet launch.

**Last Updated:** 2026-01-08

---

## Phase 1: Pre-Testnet (Devnet)

### Smart Contract
> **Status:** BLOCKED - Requires local Anchor/Solana CLI environment

- [ ] All game logic tested locally with Anchor tests
  - *Code cleanup completed: Fixed 5 duplicate code blocks*
  - *Files cleaned: lib.rs, casino.rs, errors.rs, initialize.rs, skim_excess_to_treasury.rs*
  - *Removed orphaned game.rs file*
  - **BLOCKED:** Anchor/Solana CLI cannot be installed in Replit environment
  - **Action Required:** Run `anchor test` in local Ubuntu/Cursor environment
- [ ] Casino initialization works correctly
  - **BLOCKED:** Requires Anchor test environment
- [ ] Coin flip bet placement and resolution verified
  - **BLOCKED:** Requires Anchor test environment
- [ ] VRF integration (Switchboard) configured and tested
  - *Note: Mock VRF implemented for localnet, Switchboard for devnet/mainnet*
  - **BLOCKED:** Requires Anchor test environment
- [ ] Vault deposits and withdrawals functional
  - **BLOCKED:** Requires Anchor test environment
- [ ] Edge cases handled (insufficient balance, max bet limits)
  - *Implemented: Error codes in errors.rs*
  - **BLOCKED:** Requires Anchor test environment

### Frontend
> **Status:** UI renders, full testing requires wallet + backend

- [ ] Wallet connection works (Phantom, Solflare, etc.)
  - *UI verified: Select Wallet button present*
  - **Requires:** User testing with actual wallet browser extension
- [ ] All pages load without errors
  - *Partial: Landing page renders, navigation visible*
  - *Note: State-based navigation (not URL routes)*
  - **Requires:** Full navigation testing with wallet connected
- [ ] Casino initialization UI functional
  - *Partial: InitializeCasino component code exists*
  - **Requires:** Connected wallet + program initialization test
- [ ] Game UI displays correct states (betting, waiting, result)
  - **Requires:** Connected wallet + live game session
- [ ] Balance updates in real-time after transactions
  - **Requires:** Connected wallet + live transactions
- [ ] Error messages display correctly for failed transactions
  - *Implemented: react-hot-toast configured*
  - **Requires:** Live transaction failure test
- [ ] Mobile responsive design verified
  - **Requires:** Manual viewport testing

### Developer Tools
> **Status:** Dashboard accessible, live data requires wallet + backend

- [ ] Developer Dashboard renders without wallet
  - *Code updated: Removed blocking wallet guard*
  - *Added: Inline "Connect Wallet for Live Data" banner*
  - **Requires:** Visual confirmation with wallet connected
- [ ] Transaction monitoring visible
  - *Implemented: Recent Activity panel*
  - **Requires:** Backend server running + live transactions
- [ ] Vault/Treasury balances display correctly
  - *Implemented: Quick stat cards*
  - **Requires:** Connected wallet + initialized casino
- [ ] Leaderboard populates with test data
  - *Implemented: Wallet Leaderboard panel*
  - **Requires:** Backend server running

---

## Phase 2: Testnet Validation

### Functional Testing
- [ ] Complete game flow tested end-to-end
- [ ] Multiple concurrent users tested
- [ ] Win/loss payouts verified correct
- [ ] House edge calculations accurate
- [ ] VRF randomness verified (no patterns)

### Stress Testing
- [ ] High volume betting simulated
- [ ] Vault handles edge cases (near-empty, overflow)
- [ ] Transaction confirmation times acceptable

### Security Review
- [ ] Smart contract code reviewed for vulnerabilities
- [ ] No exposed private keys or secrets
- [ ] Rate limiting in place (if applicable)
- [ ] Admin functions properly gated

---

## Phase 3: Pre-Mainnet

### Smart Contract Deployment
- [ ] Program deployed to mainnet
- [ ] Program ID updated in frontend config
- [ ] Upgrade authority secured or revoked
- [ ] Initial vault funded with real SOL

### Token Launch (if applicable)
- [ ] Token contract deployed
- [ ] CA (Contract Address) published
- [ ] Initial liquidity provided
- [ ] Token verified on explorers

### Buyback & Burn
- [ ] Treasury wallet configured
- [ ] Buyback mechanism tested on devnet
- [ ] Burn address verified
- [ ] Automated buyback schedule set (if applicable)

### Frontend Production
- [ ] Environment variables set for mainnet
- [ ] API endpoints pointing to production
- [ ] Analytics/monitoring configured
- [ ] Error tracking enabled

---

## Phase 4: Mainnet Launch

### Go-Live Checklist
- [ ] Final smart contract audit complete
- [ ] All testnet issues resolved
- [ ] Marketing materials ready
- [ ] Social links active (X, GitHub, etc.)
- [ ] Support channels established

### Monitoring
- [ ] Real-time transaction monitoring active
- [ ] Vault balance alerts configured
- [ ] Error alerting enabled
- [ ] Leaderboard updating correctly

### Post-Launch (24-48 hours)
- [ ] No critical bugs reported
- [ ] Transactions processing normally
- [ ] Payouts verified correct
- [ ] Community feedback addressed

---

## Sign-Off

| Phase | Owner | Date | Status |
|-------|-------|------|--------|
| Pre-Testnet | | 2026-01-08 | In Progress (Blocked) |
| Testnet Validation | | | Pending |
| Pre-Mainnet | | | Pending |
| Mainnet Launch | | | Pending |

---

## Work Completed (2026-01-08)

### Smart Contract Code Cleanup
- Removed duplicate code blocks from 5 files
- Removed orphaned game.rs file
- Code ready for compilation in proper environment

### Frontend/Dashboard Fixes
- DeveloperPage: Removed wallet-gate blocking dashboard view
- Added inline "Connect Wallet for Live Data" banner
- GamesPage: Reordered layout (games first, activation below)
- InitializeCasino: Made more compact

### Environment Limitations
- **Solana/Anchor CLI:** Cannot be installed in Replit (SSL/network issues)
- **Smart contract testing:** Must be done in local Ubuntu/Cursor environment
- **Full frontend testing:** Requires wallet extension + backend server

---

## Notes
- Update this checklist as new requirements are identified
- Each phase must be signed off before proceeding to the next
- Document any issues in `errors-and-fixes.md`
