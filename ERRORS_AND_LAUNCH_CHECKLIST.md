# ERRORS AND LAUNCH CHECKLIST

**Purpose:** Record of major errors, diagnoses, fixes, prevention strategies, and mainnet launch checklist.  
**Last Updated:** 2026-01-08

---

## Table of Contents
1. [Critical Errors (Resolved)](#critical-errors-resolved)
2. [Medium Priority Issues (Resolved)](#medium-priority-issues-resolved)
3. [Best Practices](#best-practices)
4. [Current Known Issues](#current-known-issues)
5. [Launch Checklist](#launch-checklist)

---

## Critical Errors (Resolved)

### 1. Program ID Mismatch (`DeclaredProgramIdMismatch`)
**Symptoms**: Transaction simulation fails, "Account does not exist" for PDAs  
**Root cause**: Program ID drift between `lib.rs`, `Anchor.toml`, frontend constants  
**Fix**: Enforced sync workflow: `anchor build` → `anchor keys sync` → update frontend  
**Prevention**: Treat Program ID sync as blocking gate

### 2. Anchor Version Mismatch (`InvalidAccountDiscriminator`)
**Symptoms**: "8 byte discriminator did not match"  
**Root cause**: Program built with Anchor 0.28.0, frontend using 0.29.0  
**Fix**: Downgraded frontend to Anchor 0.28.0 (exact match)  
**Prevention**: Pin exact Anchor versions; match program and client always

### 3. `toArrayLike is not a function` (BN Serialization)
**Symptoms**: Client-side TypeError when calling `placeBet`  
**Root cause**: Passing JS `number` to Anchor method expecting `BN` for `u64`  
**Fix**: Always use `BN` for Anchor `u64` arguments  
**Prevention**: Never pass raw JS numbers to Anchor methods

### 4. React "Objects are not valid as a React child"
**Symptoms**: React crash with "object with keys {negative, words, length, red}"  
**Root cause**: Anchor returns `u64` as `BN` objects; React cannot render  
**Fix**: Serialize all `BN` → strings, `PublicKey` → base58 at fetch boundary  
**Prevention**: Use `formatLamportsToSol()` and never render raw `BN`

### 5. Buffer Polyfills Missing
**Symptoms**: Blank page, "ReferenceError: Buffer is not defined"  
**Root cause**: Solana Web3.js uses Node.js `Buffer`; Vite doesn't include polyfills  
**Fix**: Added `vite-plugin-node-polyfills` with Buffer/process  
**Prevention**: Always set up Node polyfills for Solana dApps in Vite

### 6. Session Expiry Without Refund
**Symptoms**: `SessionExpired` error; bet stuck  
**Root cause**: Sessions expire after 1 hour; no refund mechanism  
**Fix**: Added `refund_expired` instruction  
**Prevention**: Always provide safety valves for time-sensitive operations

---

## Medium Priority Issues (Resolved)

### 7. "Insufficient vault liquidity. Max bet: 0.0000 SOL"
**Symptoms**: After draining vault, all bets rejected  
**Root cause**: `place_bet` checks `vault_balance >= potential_payout` before bet  
**Fix**: Added "Operator: Fund Vault" UI for authority to re-fund  
**Prevention**: Keep vault funded; show "out of liquidity" banner

### 8. Build Toolchain Mismatch (Anchor 0.28 vs Solana CLI 2.x)
**Symptoms**: `anchor build` fails with `error: no such command: build-bpf`  
**Root cause**: Anchor 0.28 expects Solana 1.18-era tooling  
**Fix**: Install Solana CLI 1.18.21 from GitHub release tarball  
**Prevention**: Pin toolchain versions; use documented WSL build recipe

### 9. IDL Mismatch (New Instructions Missing)
**Symptoms**: "method not found" errors at runtime  
**Root cause**: Added instructions but didn't sync IDL to frontend  
**Fix**: Copy `target/idl/casino.json` → `app/src/idl/casino.json`  
**Prevention**: Treat IDL sync as mandatory step in deployment

### 10. "Invalid bool: 5" / Infinite Polling
**Symptoms**: Bets stuck on "Flipping coin..." with console errors  
**Root cause**: Legacy session accounts from before multi-game upgrade  
**Fix**: Use `getProgramAccounts()` with per-account try/catch  
**Prevention**: Treat program upgrades as schema migrations

### 11. Wrong Discriminator / "Unknown account: gameSession"
**Symptoms**: All sessions fail to decode  
**Root cause**: Hardcoded discriminator was wrong; case-sensitivity  
**Fix**: Compute discriminator: `sha256("account:GameSession")[0..8]`  
**Prevention**: Never guess discriminators; use PascalCase for account names

### 12. Docker PostgreSQL Password Authentication
**Symptoms**: Backend crashes with "password authentication failed"  
**Root cause**: Docker Compose credentials didn't match backend `.env`  
**Fix**: Update `.env` to match Docker: `DB_USER=casino`, `DB_PASSWORD=casino_password`  
**Prevention**: Document database credentials in setup docs

### 13. Frontend File Duplication / Concatenation
**Symptoms**: Vite parse errors, multiple exports, orphaned JSX  
**Root cause**: Multiple editors or patch tools appending instead of replacing  
**Fix**: Created `dedupe-frontend.mjs` scanner/fixer  
**Prevention**: Single-writer rule; `npm run dedupe:check` in CI

---

## Best Practices

### Program ID Sync
1. Build: `anchor build`
2. Sync: `anchor keys sync`
3. Update frontend constants
4. Copy IDL: `cp target/idl/casino.json app/src/idl/casino.json`

### Anchor Version Matching
- Program and client must use **exact same Anchor version**
- Use `--save-exact` when installing Anchor packages

### BN/PublicKey Handling
- **Never render `BN` or `PublicKey` directly in JSX**
- Serialize at boundary: `BN.toString()`, `PublicKey.toBase58()`
- Use `BigInt` or `BN` for calculations, string for display

### Transaction Flow
1. Build transaction via Anchor methods
2. Simulate first (fail fast)
3. Send via wallet adapter
4. Confirm with blockhash
5. Log success/error with context

### Discriminator Computation
```javascript
// Correct way to compute discriminator
const crypto = require('crypto');
const discriminator = crypto
  .createHash('sha256')
  .update('account:GameSession')  // PascalCase!
  .digest()
  .slice(0, 8);
```

---

## Current Known Issues

- 🔄 Switchboard VRF integration incomplete (relayer works; VRF verification needed)
- ⚠️ Public RPC rate limiting (use private RPC for production)
- ⚠️ No retry logic with exponential backoff
- ⚠️ Security audit pending
- ⚠️ Audio files not included (optional, system works without them)
- ⚠️ Mainnet webhook integration needed (Helius/Shyft for leaderboard)

---

## Launch Checklist

### Pre-Launch (Testnet/Devnet)

#### Smart Contract
- [x] All 3 games (CoinFlip, Dice, Slots) functional
- [x] Atomic bet transfers working
- [x] Vault liquidity checks prevent insolvency
- [x] Session expiry with refund mechanism
- [x] TreasuryPDA for buyback separation
- [x] Authority-only admin functions
- [ ] Switchboard VRF integration deployed
- [ ] Security audit completed

#### Frontend
- [x] Game lobby with all games
- [x] Betting UI with validation
- [x] Real-time result polling
- [x] Win/loss modal with money flow
- [x] Session history display
- [x] Live leaderboard (WebSocket)
- [x] Wallet connection flow
- [x] Audio system with controls
- [x] Dark casino theme
- [x] Mobile responsive

#### Backend
- [x] PostgreSQL database with migrations
- [x] Redis caching for leaderboard
- [x] WebSocket broadcasting
- [x] Leaderboard API endpoints
- [x] Buyback service with dual-mode
- [x] Operator authentication middleware
- [x] Health check endpoints
- [ ] Rate limiting
- [ ] API authentication for public endpoints
- [ ] Helius/Shyft webhook integration

#### Buyback System
- [x] BuybackControlPanel UI (operator-only)
- [x] CA input and save functionality
- [x] Manual execute button
- [x] Pause/resume automation
- [x] Pump.fun mode (10s interval)
- [x] Jupiter mode (hourly cron)
- [x] Safety guards (spend cap, vault reserve)
- [x] Buyback history log
- [x] Dry run mode for testing
- [x] Production auth enforcement

### Mainnet Go-Live

#### Infrastructure
- [ ] Private RPC (Helius, QuickNode, or similar)
- [ ] Production PostgreSQL (managed service)
- [ ] Production Redis (managed service)
- [ ] SSL certificates
- [ ] CDN for static assets
- [ ] DDoS protection

#### Security
- [ ] Security audit report addressed
- [ ] Authority keypair in KMS (not env var)
- [ ] Rate limiting configured
- [ ] API authentication enabled
- [ ] CORS properly configured
- [ ] Operator wallet whitelist set

#### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (Datadog/Logflare)
- [ ] Uptime monitoring
- [ ] Vault balance alerts
- [ ] Buyback failure alerts
- [ ] RPC health monitoring

#### Operations
- [ ] Deployment runbook documented
- [ ] Rollback procedures tested
- [ ] Incident response plan
- [ ] Backup/recovery procedures
- [ ] On-call rotation established

#### Legal/Compliance
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] Gambling license (if required)
- [ ] Age verification (if required)
- [ ] Jurisdiction restrictions

### Post-Launch

#### Week 1
- [ ] Monitor vault balance hourly
- [ ] Check buyback execution daily
- [ ] Review error logs daily
- [ ] Respond to user issues

#### Month 1
- [ ] Analyze game statistics
- [ ] Review leaderboard data
- [ ] Assess buyback effectiveness
- [ ] Plan feature improvements

---

## Emergency Procedures

### Vault Depleted
1. Pause all games (set `is_active = false` on CasinoConfig)
2. Notify users via banner
3. Fund vault from authority wallet
4. Resume games

### Buyback Failure
1. Check backend logs for error
2. Verify vault/treasury balances
3. If API issue, pause automation
4. Run manual buyback once fixed

### Program Bug Discovered
1. If critical: drain vault to authority
2. Deploy fix via buffer + upgrade
3. Sync IDL to frontend
4. Test on devnet first
5. Re-fund vault and resume

---

**See also:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and build procedures
- [BUYBACK.md](BUYBACK.md) - Buyback & burn system details
- [APP_DESCRIPTION.md](APP_DESCRIPTION.md) - Product overview
