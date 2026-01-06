# ERROR_HISTORY_AND_FIXES

**Purpose:** Record of major errors, diagnoses, fixes, and prevention.  
**Last Updated:** 2025-12-26 (Multi-Game Expansion)

---

## Critical Errors (Resolved)

### 1. Program ID Mismatch (`DeclaredProgramIdMismatch`)
**Symptoms**: Transaction simulation fails, "Account does not exist" for PDAs  
**Root cause**: Program ID drift between `lib.rs`, `Anchor.toml`, frontend constants  
**Fix**: Enforced sync workflow: `anchor build` → `anchor keys sync` → update frontend  
**Prevention**: Treat Program ID sync as blocking gate; add startup banner showing program ID + cluster

### 2. Anchor Version Mismatch (Error 6001: `InvalidAccountDiscriminator`)
**Symptoms**: "8 byte discriminator did not match"  
**Root cause**: Program built with Anchor 0.28.0, frontend using 0.29.0  
**Fix**: Downgraded frontend to Anchor 0.28.0 (exact match)  
**Prevention**: Pin exact Anchor versions in package.json; match program and client versions always

### 3. `toArrayLike is not a function` (BN Serialization)
**Symptoms**: Client-side TypeError when calling `placeBet`  
**Root cause**: Passing JS `number` to Anchor method expecting `BN` for `u64` arg  
**Fix**: 
- Modified `useBet.ts` to accept `betAmountLamports: BN` and pass directly to Anchor
- Modified `CoinFlip.tsx` to convert string input → `BN` representing lamports
**Prevention**: Always use `BN` for Anchor `u64` arguments; never pass raw JS numbers

### 4. React "Objects are not valid as a React child" (BN Rendering)
**Symptoms**: React crash showing "object with keys {negative, words, length, red}"  
**Root cause**: Anchor returns `u64` as `BN` objects; React cannot render objects directly  
**Fix**:
- Created `utils/format.ts` with safe formatting utilities
- Updated `fetchPlayerSessions()` to serialize all `BN` → strings, `PublicKey` → base58
- Updated all UI components to use `formatLamportsToSol()` and never render raw `BN`
**Prevention**: Serialize Anchor account data to UI-safe DTOs at the boundary (in hooks); use string formatting for all lamport amounts

### 5. Buffer Polyfills Missing
**Symptoms**: Blank page, "ReferenceError: Buffer is not defined"  
**Root cause**: Solana Web3.js uses Node.js `Buffer` API; Vite doesn't include polyfills by default  
**Fix**:
- Installed `buffer` package
- Added `vite-plugin-node-polyfills` with Buffer/process/util/stream/events
- Added global Buffer assignment in `main.tsx`
**Prevention**: Always set up Node polyfills for Solana dApps in Vite; test in browser immediately

### 6. Session Expiry Without Refund
**Symptoms**: `SessionExpired` error when trying to resolve; bet stuck  
**Root cause**: Sessions expire after 1 hour; no refund mechanism existed  
**Fix**: Added `refund_expired` instruction to refund bet from vault if session expired  
**Prevention**: Always provide safety valves for time-sensitive operations

---

## Medium Priority Issues (Resolved)

### 7. Transaction Construction ("Invalid arguments")
**Symptoms**: Simulation throws "Invalid arguments"  
**Root cause**: Malformed Transaction object; constructor misuse  
**Fix**: Use proper transaction building: `new Transaction()` → set `feePayer`, `recentBlockhash` → `add(instruction)`  
**Prevention**: Always simulate before signing; prefer Anchor `Program.methods.*` builders

### 9. "Insufficient vault liquidity. Max bet: 0.0000 SOL" after draining vault
**Symptoms**: After clicking **Drain All**, placing a bet shows “Insufficient vault liquidity” with max bet 0.  
**Root cause**: This is **expected**: `place_bet` checks `vault_balance >= potential_payout` *before* taking the bet, so an empty vault cannot accept any bet.  
**Fix**: Re-fund the vault (liquidity) from the authority wallet. We added an **Operator: Fund Vault** UI that transfers SOL from authority → Vault PDA.  
**Prevention**: Treat “Drain Vault” as a test-only action; always keep vault funded for gameplay. UI now shows **vault liquidity + max bet** and an “out of liquidity” banner when max bet is zero.

### 10. "Fees popup should be after win/loss" (wallet popup ordering)
**Symptoms**: User wanted Phantom’s confirm/fees popup to appear *after* the UI shows WIN/LOSS.  
**Root cause**: Impossible in the player-signed model: Phantom must ask for confirmation **before** the resolve transaction can execute, and win/loss is only known **after** it executes on-chain.  
**Fix**: Implemented **relayer mode**: player signs only `place_bet`, and an authority relayer signs `fulfill_randomness`. Frontend polls the session and then shows WIN/LOSS with no second wallet popup for the player.  
**Note**: On a loss, wallet balance can still change slightly due to rent/refund mechanics (varies by how session closing is handled).

### 8. Duplicate Frontends (Config Drift)
**Symptoms**: Running wrong Vite app (`src/` vs `app/`); fixes applied to one but testing another  
**Root cause**: Two parallel frontends with different configs  
**Fix**: Archived old frontend; kept `app/` as single active frontend  
**Prevention**: One frontend entrypoint only

### 7. IDL Mismatch (New Instructions Missing from Frontend)
**Symptoms**: `program.methods.refundExpired()` call fails at runtime with "method not found"  
**Root cause**: Added new instructions (`refundExpired`, `resolveWithVrf`, `setRandomnessRequest`) to the program but didn't rebuild/redeploy and sync the IDL to the frontend  
**Fix**: 
- Manually added the new instructions to `app/src/idl/casino.json` to match the program structure
- (Proper fix: rebuild program with `anchor build` and copy `target/idl/casino.json` → `app/src/idl/casino.json`)
**Prevention**: Always rebuild and sync IDL after adding/modifying program instructions; treat IDL sync as mandatory step in deployment workflow

### 8. Devnet Program Not Upgraded (Refund/Drain failing with `Custom:101`)
**Symptoms**:
- Refund simulation failed with something like `InstructionError: [0, { Custom: 101 }]`
- Drain Vault failed with generic wallet send errors

**Root cause**:
- Frontend was calling `refundExpired` / `drainVault`, but the **deployed devnet program binary did not include those instructions yet** (classic “program upgraded locally but not on-chain”).

**Fix (the real fix)**:
- Build with a Solana/Anchor toolchain that actually works (see `ARCHITECTURE.md` build section)
- Upgrade the existing devnet program **in-place** via buffer+upgrade:
  - `solana program write-buffer target/deploy/casino.so --output json`
  - `solana program upgrade <BUFFER> CasytXe4c... --upgrade-authority ~/.config/solana/id.json`
- Then **sync IDL**: `cp target/idl/casino.json app/src/idl/casino.json`

**Prevention**:
- Treat **“program upgrade + IDL sync”** as one atomic release step.

### 9. Build Toolchain Mismatch (Anchor 0.28 vs Solana CLI 2.x)
**Symptoms**:
- `anchor build` fails with: `error: no such command: build-bpf`

**Root cause**:
- Anchor 0.28 expects `cargo-build-bpf` (Solana 1.18-era tooling).
- Solana CLI 2.x/Agave installs remove `build-bpf` and default to SBF-only tooling.

**Fix**:
- Install Solana CLI **1.18.21** from GitHub release tarball
- Build with a PATH override so Anchor uses that toolchain (documented in `ARCHITECTURE.md`).

**Prevention**:
- Pin toolchain versions per environment and keep a known-good “WSL build recipe”.

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
- Document Anchor version in deployment docs

### BN/PublicKey Handling
- **Never render `BN` or `PublicKey` directly in JSX**
- Serialize at the boundary: `BN.toString()`, `PublicKey.toBase58()`
- Use `BigInt` or `BN` for calculations, convert final result to string for display
- For lamports: always use string-based formatting to avoid JS number precision issues

### Transaction Flow
1. Build transaction via Anchor methods
2. Simulate first (fail fast, show logs)
3. Send via wallet adapter
4. Confirm with blockhash/lastValidBlockHeight
5. Log success/error with context

---

## 13. Multi-Game Program Upgrade (2025-12-26)

**Context:** Extending casino to support Dice and Slots alongside CoinFlip.

**Changes Made:**
- Added `GameType` enum (CoinFlip | Dice | Slots) to `GameSession`
- Updated `place_bet` instruction to accept `game_type` parameter
- Modified `fulfill_randomness` to handle game-specific outcome logic
- Updated relayer to log game types being resolved
- Created Dice.tsx and Slots.tsx UI components (placeholder UX, on-chain logic ready)
- Added game selector tabs to App.tsx

**Build/Deploy:**
```bash
anchor build  # Binary: 302,960 bytes (fits in devnet allocation)
solana program write-buffer ... && solana program upgrade ...
cp target/idl/casino.json app/src/idl/casino.json
```

**Status:** ✅ Program upgraded successfully. CoinFlip fully functional. Dice/Slots UI placeholders ready.

---

## 14. Dice + Slots Full UI Integration (2025-12-26)

**Context:** Complete Dice and Slots UI integration to make all 3 games fully playable.

**Changes Made:**
- Updated `useBet.ts` to accept `gameType` parameter ('coinflip' | 'dice' | 'slots')
- Converted gameType string to Anchor enum format for program calls
- Rewrote `Dice.tsx` with full betting flow (validation, modal, polling)
- Rewrote `Slots.tsx` with full betting flow (validation, modal, polling)
- Updated `GameRoundModal.tsx` to support all 3 game types:
  - Added game-specific icons, messages, and outcome displays
  - Dice shows rolled number vs target
  - Slots decodes packed outcome into 3 reels
- Updated all game components to pass `gameType` prop to modal

**Testing:** All 3 games now use the same proven flow: player signs bet → relayer settles → UI polls and displays result.

**Status:** ✅ All 3 games fully functional on devnet. Ready for E2E testing.

---

## 15. "Invalid bool: 5" / Infinite Polling Loop (2025-12-26)

**Context:** After deploying the multi-game upgrade (adding `game_type` to `GameSession`), players reported bets getting stuck on "Flipping coin..." with infinite polling and console errors showing `Invalid bool: 5`.

**Root Cause:**
- **Legacy session accounts**: Devnet had `GameSession` accounts created *before* the multi-game upgrade that added the `game_type` field.
- **Hard decode failure**: Anchor's `program.account.gameSession.all()` attempts to decode *all* accounts and **hard-fails** when it hits a legacy account with an incompatible layout.
- **Looping**: Frontend/relayer polling repeatedly called `fetchPlayerSessions()` → decode error → no result → modal stuck.

**Fix:**
- Updated [`casino-solitaire/app/src/hooks/useCasino.ts`](casino-solitaire/app/src/hooks/useCasino.ts) `fetchPlayerSessions()` to use `connection.getProgramAccounts()` with per-account decode try/catch, **skipping legacy accounts gracefully**.
- Updated [`casino-solitaire/scripts/relayer-devnet.ts`](casino-solitaire/scripts/relayer-devnet.ts) to use the same tolerant session fetching pattern.
- Updated all game components (CoinFlip, Dice, Slots) to wrap polling fetch calls in try/catch and continue on transient errors.

**Prevention:**
- Treat program upgrades that change account layout as **schema migrations**.
- Use `getProgramAccounts` + per-account decode try/catch for any account fetching in production apps.
- Consider adding an account version field for future-proofing against layout changes.

---

## 16. Wrong Discriminator / "Unknown account: gameSession" (2025-12-26)

**Context:** After attempting to fix the legacy session issue by removing the discriminator filter entirely, ALL sessions failed to decode with "Unknown account: gameSession" errors.

**Root Cause:**
- **Incorrect discriminator**: The hardcoded discriminator `[0xd5, 0x7f, 0x8f, 0x3e, 0x7c, 0x4a, 0x8e, 0x3b]` was completely wrong
- **Removed filter was too broad**: Without any discriminator filter, `getProgramAccounts` was returning non-GameSession accounts that happened to have the player pubkey at offset 8
- **Anchor error messaging**: "Unknown account: gameSession" means the account's discriminator doesn't match what Anchor expects for that account type

**Correct Discriminator:**
- GameSession discriminator = `sha256("account:GameSession")[0..8]`
- Bytes: `[0x96, 0x74, 0x14, 0xc5, 0xcd, 0x79, 0xdc, 0xf0]`
- Base64: `lnQUxc153PA=`

**Fix:**
1. **Computed correct discriminator** using Node.js crypto: `crypto.createHash('sha256').update('account:GameSession').digest().slice(0, 8)`
2. **Added discriminator filter back** to `useCasino.ts` with the correct bytes
3. **Added detailed logging** to show actual decode errors instead of generic "skipped legacy" messages
4. **Reduced polling interval** from 1.5s → **500ms** to catch sessions before relayer settles them

**Files Changed:**
- [`casino-solitaire/app/src/hooks/useCasino.ts`](casino-solitaire/app/src/hooks/useCasino.ts): Added correct discriminator filter + detailed error logging
- [`casino-solitaire/app/src/components/CoinFlip.tsx`](casino-solitaire/app/src/components/CoinFlip.tsx): 1500ms → 500ms polling, added poll logging
- [`casino-solitaire/app/src/components/Dice.tsx`](casino-solitaire/app/src/components/Dice.tsx): 2000ms → 500ms, 30 → 90 iterations, added logging
- [`casino-solitaire/app/src/components/Slots.tsx`](casino-solitaire/app/src/components/Slots.tsx): 2000ms → 500ms, 30 → 90 iterations, added logging

**Prevention:**
- **Never guess discriminators**: Always compute them from the account name using `sha256("account:AccountName")[0..8]`
- **Test discriminator filters**: Verify they match actual on-chain accounts by checking raw account data
- **Log actual error messages**: Always log the specific error, not generic "failed" messages
- **Keep discriminator filters**: They prevent fetching wrong account types and improve RPC efficiency

---

### 16. Relayer/Discriminator/IDL-Name Fixes (Dec 2025)
**Symptoms**: Relayer failed to find/resolve pending sessions, frontend stuck in "Rolling..." modal, infinite polling loops  
**Root cause**: Multiple issues:
1. Relayer used broken Anchor API (`accountDiscriminator('gameSession')`) that doesn't exist in Anchor 0.28.0
2. Relayer tried to use base64 memcmp encoding which has compatibility issues
3. Relayer decoded with wrong account name: `'gameSession'` instead of `'GameSession'` (case sensitivity!)
4. Frontend had same decoding bug

**Fix:**
1. **Relayer** ([`casino-solitaire/scripts/relayer-devnet.ts`](casino-solitaire/scripts/relayer-devnet.ts)):
   - Added `computeDiscriminator()` function using Node.js crypto: `sha256("account:GameSession")[0..8]`
   - Removed base64 memcmp filter, fetch ALL program accounts, filter discriminator **locally**
   - Changed decode from `'gameSession'` → `'GameSession'` (PascalCase!)
   - Added detailed logging for decode failures
2. **Frontend**:
   - Already fixed in previous error (#15)
   - Added `fetchSessionByPubkey()` in [`useCasino.ts`](casino-solitaire/app/src/hooks/useCasino.ts) for direct session lookup
   - All games poll by session PDA directly, not full scan
3. **UI Fallback**:
   - Added authority-only "Resolve now" button in [`GameRoundModal.tsx`](casino-solitaire/app/src/components/GameRoundModal.tsx)
   - Button only appears if connected wallet is casino authority
   - Provides manual override if relayer is down (triggers 2nd wallet popup for authority only)
   - Kept "Stop waiting" button for all users

**Lessons:**
- **IDL account names are PascalCase**: Always use `'GameSession'`, not `'gameSession'` when decoding
- **Discriminators must be computed correctly**: `sha256("account:GameSession")[0..8]`, never guess
- **Anchor APIs vary by version**: The `.accountDiscriminator()` API doesn't exist in Anchor 0.28.0
- **Base64 memcmp filters are fragile**: Prefer fetching and filtering locally for reliability
- **Always provide a fallback**: Authority-only manual resolve ensures system never gets stuck
- **Poll by PDA, not full scan**: Direct PDA lookup is faster and more reliable than filtering arrays

**Prevention:**
- Always test discriminators against actual on-chain accounts
- Use PascalCase for Anchor account names in coder.decode()
- Provide manual override UI for critical operations
- Log detailed error messages, not just "skipped" or "failed"

---

---

## 17. Docker PostgreSQL Password Authentication (Dec 2025)

**Symptoms**: Backend crashes with `password authentication failed for user "postgres"` when trying to connect to Docker PostgreSQL container

**Root Cause**:
- Docker Compose configured PostgreSQL with custom user/password (`casino`/`casino_password`)
- Backend `.env` file was using default PostgreSQL credentials (`postgres` user with no password)
- Mismatch between Docker container environment variables and backend connection string

**Fix**:
1. Inspected Docker container environment: `docker exec -it <container_id> env | grep POSTGRES`
2. Found: `POSTGRES_USER=casino`, `POSTGRES_PASSWORD=casino_password`
3. Updated backend `.env` to match:
   ```env
   DB_USER=casino
   DB_PASSWORD=casino_password
   DB_NAME=casino_db
   ```
4. Restarted backend server

**Prevention**:
- Always check Docker Compose environment variables before configuring backend `.env`
- Document database credentials in BUILD_AND_DEPLOY.md
- Use environment variable files for Docker Compose to share with backend

---

## 18. Solana Network Configuration Error (Dec 2025)

**Symptoms**: Backend crashes with `ZodError: "SOLANA_NETWORK" Invalid option: expected one of "mainnet-beta"|"testnet"|"devnet"`

**Root Cause**:
- Backend `.env` file had `SOLANA_NETWORK=localnet`
- Config validation schema (`envSchema` using Zod) only accepts: `mainnet-beta`, `testnet`, or `devnet`
- `localnet` is not a valid cluster name for Solana (it's a local test validator, not a network)

**Fix**:
Changed `.env` to: `SOLANA_NETWORK=devnet`

**Prevention**:
- Use Zod or similar validation for environment variables
- Document valid values in `.env.example` files
- Show clear error messages for invalid config values

---

## 19. Audio Files Not Loading (Dec 2025)

**Symptoms**: Console warnings "Audio file not found" when playing games, no sound effects

**Root Cause**:
- Audio manager references audio files in `app/public/assets/audio/`
- Audio files were not included in the repository (placeholders only)
- Howler.js logs warnings for missing files but doesn't crash

**Fix**:
Audio files are optional for development. System works without them, just no sound.

To add audio:
1. Place audio files in `app/public/assets/audio/`
2. Expected files: `click.mp3`, `spin-loop.mp3`, `spin-stop.mp3`, `win-small.mp3`, `win-big.mp3`, `win-jackpot.mp3`, `coin-drop.mp3`
3. Refresh page to load audio

**Prevention**:
- Add `.gitkeep` in audio directory with README explaining how to add audio files
- Make audio system fully optional with graceful degradation
- Log info-level messages, not warnings, for missing optional assets

---

## Current Known Issues

- 🔄 Switchboard VRF integration incomplete (manual resolve works; VRF callback verification needed)
- ⚠️ Public RPC rate limiting (use private RPC for production)
- ⚠️ No retry logic with exponential backoff
- ⚠️ Security audit pending
- ⚠️ Audio files not included (optional, system works without them)
- ⚠️ Mainnet webhook integration needed (Helius/Shyft for leaderboard)
- ⚠️ Buyback system not implemented

---

**See `ARCHITECTURE.md` for system design**  
**See `BUILD_AND_DEPLOY.md` for build/deploy procedures**  
**See `BETA_READINESS_AND_MISSING.md` for mainnet readiness checklist**

---

## 20. Frontend Source File Concatenation / Duplicate Blocks (Dec 2025)

**Symptoms**:
- Vite dev server shows hard parse errors like:
  - `Adjacent JSX elements must be wrapped in an enclosing tag`
  - `Unexpected "*"`
  - `Unterminated regular expression`
- TypeScript errors like:
  - `Multiple exports with the same name`
  - `Identifier ... has already been declared`
- Errors often point to a mid-file line number where the code *looks fine*, because the real issue is **an earlier premature component/function close** followed by orphaned/duplicated content.

**Root Cause**:
- Multiple source files under `casino-solitaire/app/src/**` were **duplicated/concatenated**: a valid file body was followed by a second copy of headers/imports/exports or partial comment fragments (lines beginning with `* ...` not inside `/** ... */`).
- Most likely causes (observed pattern):
  - Edits applied as **append** instead of **replace** (copy/paste at EOF, patch tooling writing to EOF).
  - Concurrent writers (same repo opened in multiple editors / Windows + WSL editing simultaneously / aggressive format-on-save) creating “merge-like” concatenation without conflict markers.

**Fix (safe + minimal)**:
- Did **not** rewrite logic; only removed the duplicated second block(s) per file.
- Implemented an automated scanner/fixer:
  - `casino-solitaire/app/scripts/dedupe-frontend.mjs`
  - Scans `casino-solitaire/app/src/**/*.{ts,tsx}` for conservative duplication signals:
    - repeated header/import signatures
    - repeated `export` declarations
    - orphaned comment fragments (`* ...` outside block comments)
    - misplaced imports (imports appearing after substantial code)
  - `--write` mode truncates the file at the start of the duplicated block and creates a `.bak` backup once per file.
- Added npm scripts:
  - `npm run dedupe:check`
  - `npm run dedupe:write`
- Added a guardrail:
  - `predev` runs the dedupe check so `npm run dev` fails fast if duplication is reintroduced.

**Files impacted in this incident (examples)**:
- `casino-solitaire/app/src/components/Dice.tsx` (premature `};` + orphaned JSX after close)
- `casino-solitaire/app/src/games/dice/DiceView.tsx` (duplicate exports + orphaned comment fragment)
- `casino-solitaire/app/src/utils/assets.ts` (duplicate exports + orphaned comment fragment)
- `casino-solitaire/app/src/utils/productionSafeLog.ts` (duplicate exports + orphaned comment fragment)
- Additional duplicates were found and cleaned in other frontend files during the same repair cycle.

**Prevention**:
- **Single-writer rule**: avoid editing the same repo from multiple environments at once (Windows + WSL), and avoid having multiple IDE instances open on the same workspace.
- **Prefer replace over append**: when applying large patches, ensure tools are doing targeted replacements rather than appending to EOF.
- **Fail-fast checks**:
  - Keep `predev` enabled.
  - Run `npm run dedupe:check` in CI (recommended) so duplication never reaches main.
- **Recovery**:
  - If a false positive ever happens, restore quickly from the `.bak` file next to the modified file.

---

## Documentation Management Rules

**Context:** Documentation drift and duplication is a common problem that leads to outdated, contradictory information across multiple files.

**Solution:** We maintain a canonical set of documentation files and archive redundant/historical docs.

### Canonical Documentation (Active Maintenance)

These are the **only** documentation files that should be actively updated:

1. **[APP_DESCRIPTION.md](APP_DESCRIPTION.md)** - Product/marketing overview
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design, architecture, operations
3. **[BUILD_AND_DEPLOY.md](BUILD_AND_DEPLOY.md)** - Build instructions, deployment workflows
4. **[ERROR_HISTORY_AND_FIXES.md](ERROR_HISTORY_AND_FIXES.md)** - This file: incident log, fixes, prevention
5. **[BUYBACK.md](BUYBACK.md)** - Buyback & burn system (single source of truth)

### Archived Documentation

All other documentation files have been archived to `docs/archive/` with pointer stubs at their original locations:

- `BETA_READINESS_AND_MISSING.md` → Archived
- `MAINNET_READINESS.md` → Archived
- `BUYBACK_DESIGN.md` → Consolidated into BUYBACK.md
- `BUYBACK_IMPLEMENTATION_STATUS.md` → Consolidated into BUYBACK.md
- `PUMPFUN_INTEGRATION_SUMMARY.md` → Consolidated into BUYBACK.md

### Prevention Rules

To prevent documentation drift and duplication:

1. **Single source of truth**: Each topic has ONE canonical location
2. **No duplicate information**: If information exists in a canonical doc, link to it—don't copy it
3. **Update canonical docs only**: When information changes, update the canonical doc, not archived docs
4. **Use pointer stubs**: Archived docs have short stub files (10-30 lines) that redirect to canonical docs
5. **Cross-link liberally**: Use markdown links to connect related topics across canonical docs
6. **Date updates**: Always update the "Last Updated" date when making changes

### When to Add New Documentation

**Don't create new docs unless:**
- The topic doesn't fit in any existing canonical doc
- The new doc will become part of the canonical set (discuss with team)
- It's a temporary reference (e.g., meeting notes, which go in `docs/archive/`)

**Never create:**
- Duplicate design docs
- Redundant status reports
- Overlapping architecture diagrams

### Recovery from Doc Drift

If documentation drift is detected:
1. Identify the canonical source of truth
2. Consolidate information into the canonical doc
3. Archive or delete redundant docs
4. Create pointer stubs with clear links
5. Update all references to point to canonical docs

---

**Last Updated:** 2025-12-31  
**Status:** Active maintenance document - keep updated with all major errors and fixes
