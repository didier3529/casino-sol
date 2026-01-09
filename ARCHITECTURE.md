# ARCHITECTURE

**Purpose:** Canonical architecture, build/deploy procedures, and operational commands for SOL VEGAS - Solana multi-game casino (CoinFlip, Dice, Slots).  
**Last Updated:** 2026-01-08

---

## Quick Reference

| Item | Value |
|------|-------|
| **Devnet Program ID** | `CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma` |
| **Localnet Program ID** | `AUqeYqxd7bAtrvyu7icRVgfLBa8i5jiS9QiHx6WfUhpf` |
| **Upgrade Authority** | `DJthn6e42u3biESRCVnkjNB6AGFbh8fzCKPabb1caJTf` |
| **Authority Keypair (WSL)** | `/home/etabox/.config/solana/id.json` |
| **Frontend Port** | 5000 (Replit) / 5173 (local) |
| **Backend Port** | 3000 |

---

## System Overview

**What this is:**
- **On-chain program (Anchor/Rust)**: Multi-game casino with shared treasury (Vault PDA), on-chain settlement, verifiable randomness
- **Frontend (React/Vite/TS)**: Dark casino theme, game lobby, betting modals, real-time results, live leaderboard, audio system
- **Backend (Node/Express/TS)**: Leaderboard API, PostgreSQL + Redis, WebSocket broadcasts, buyback service
- **Relayer (Node/TS)**: Background service that auto-settles pending bets using casino authority keypair (devnet)

**Key property:** All funds movement is on-chain and verifiable (bet, payout/refund, treasury balance).

---

## Program Structure

### Accounts & PDAs

| Account | Type | Purpose |
|---------|------|---------|
| **CasinoConfig** | PDA, singleton | Authority, bumps, min/max bet, counters, is_active, switchboard_function |
| **Vault** | PDA, SystemAccount | SOL liquidity for all games. Fixed 0.5 SOL reserve. |
| **TreasuryPDA** | SystemAccount | Excess profits for buyback & burn (~0.00089 SOL rent-exempt min) |
| **GameSession** | PDA, per bet | Player, game_id, game_type, bet, choice, status, result, timestamps |

### PDA Seeds
```
Casino:   ["casino"]
Vault:    ["vault", casino_pda]
Treasury: ["treasury", casino_pda]
Session:  ["session", player_pubkey, game_id_le_bytes]
```

### Games & Payouts

| Game | Multiplier | Win Rate | Choice Values |
|------|-----------|----------|---------------|
| **CoinFlip** | 1.96x | ~48% | 0=heads, 1=tails |
| **Dice** | 5.0x | ~2.78% | 2-12 (target number) |
| **Slots** | 10.0x | ~10% | any (3-of-a-kind wins) |

---

## Instructions

### `initialize(min_bet, max_bet, initial_vault_amount)`
Creates casino config + vault + treasury, transfers initial liquidity.

### `place_bet(game_type: GameType, choice: u8, bet_amount: u64)`
Atomic flow: validates game/choice/bet, transfers SOL player→vault, creates GameSession PDA.

**Liquidity rule:** `vault_balance >= potential_payout` checked before accepting bet.

### `fulfill_randomness(random_value: [u8; 32])`
Resolves session based on game_type, pays out immediately if win.

### `skim_excess_to_treasury(amount: u64, min_vault_reserve: u64)`
Authority-only. Safely transfers excess SOL from Vault to Treasury.

### `refund_expired()`
Refunds bet if session pending + expired. Closes session.

### `drain_vault(amount: u64)`
Authority-only dev tool. Transfers lamports Vault→authority wallet.

---

## Randomness & Settlement

### Devnet (Relayer-Based)
- Player signs `place_bet` only (no second popup)
- Relayer polls for pending sessions, calls `fulfill_randomness`
- Frontend polls session until resolved

### Mainnet (Future: Switchboard VRF)
- `place_bet` triggers randomness request
- Switchboard fulfills randomness
- Relayer or player calls `resolve_with_vrf`

---

## Frontend Architecture

```
app/src/
├── components/
│   ├── CasinoLobby.tsx        # Game selection with animated cards
│   ├── CoinFlip.tsx           # CoinFlip game + betting UI
│   ├── Dice.tsx               # Dice game + betting UI
│   ├── Slots.tsx              # Slots game + betting UI
│   ├── GameRoundModal.tsx     # Win/loss modal with money flow
│   ├── SessionList.tsx        # Session history
│   ├── Leaderboard.tsx        # Live profit leaderboard (Socket.IO)
│   ├── BuybackControlPanel.tsx # Buyback & burn controls (operator)
│   └── InitializeCasino.tsx   # Casino setup
├── games/
│   ├── coinflip/CoinFlipView.tsx
│   ├── dice/DiceView.tsx
│   └── slots/SlotsView.tsx
├── audio/audioManager.ts      # Howler.js singleton
├── hooks/
│   ├── useCasino.ts           # Program/PDA/fetch logic
│   ├── useBet.ts              # Place bet (all games)
│   └── useLeaderboard.ts      # Backend integration
└── utils/
    ├── constants.ts           # Program ID, network
    └── format.ts              # BN/lamports formatting
```

### Design System
- **Fonts**: Space Grotesk (display), Manrope (body), JetBrains Mono (code)
- **Colors**: #06060A (bg), #3AF3E0 (cyan accent), #F2B950 (gold)
- **Effects**: Glass morphism, backdrop blur, soft glows
- **Audio**: Howler.js with user-gesture unlock

---

## Backend Architecture

```
server/src/
├── database/index.ts          # PostgreSQL setup + migrations
├── cache/redis.ts             # Redis + leaderboard cache
├── services/
│   ├── leaderboardService.ts  # Leaderboard business logic
│   ├── buybackService.ts      # Buyback & burn automation
│   └── pumpPortalClient.ts    # Pump.fun API wrapper
├── routes/
│   ├── leaderboard.ts         # GET /api/leaderboard
│   ├── admin.ts               # Admin API (buyback control)
│   └── health.ts              # Health check
├── jobs/cronJobs.ts           # Buyback scheduler
├── middleware/auth.ts         # Operator authentication
└── websocket/index.ts         # Socket.IO broadcasting
```

### Database Schema (PostgreSQL)
- `leaderboard_stats`: Aggregated player stats
- `game_results`: Complete audit trail
- `buyback_config`: Buyback system configuration
- `buyback_events`: Buyback transaction audit trail

### API Endpoints
- `GET /api/leaderboard` - Top 100 by net profit
- `GET /api/leaderboard/player/:wallet` - Individual stats
- `POST /api/webhooks/game-result` - Record game result
- Admin routes: See [BUYBACK.md](BUYBACK.md)

---

## Build & Deploy

### Toolchain Requirements
- **Solana CLI**: v1.18.21 (for Anchor 0.28 compatibility)
- **Anchor CLI**: 0.28.0
- **Rust**: stable
- **Node.js**: 18+

### One-Time Setup (WSL)

```bash
# Install Solana 1.18.21
mkdir -p ~/solana-install && cd ~/solana-install
curl -L -o solana.tar.bz2 \
  https://github.com/solana-labs/solana/releases/download/v1.18.21/solana-release-x86_64-unknown-linux-gnu.tar.bz2
tar -xjf solana.tar.bz2

# Verify Anchor
anchor --version  # Should show 0.28.0
```

### Build Program (WSL)

```bash
export PATH=~/solana-install/solana-release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:~/.cargo/bin
cd "/path/to/casino-solitaire"

# Generate lockfile for SBF builds
cd programs/casino && cargo +solana generate-lockfile && cd ../..

# Build
anchor build

# Sync IDL to frontend (MANDATORY)
cp target/idl/casino.json app/src/idl/casino.json
```

### Deploy/Upgrade to Devnet

```bash
# Write buffer
solana program write-buffer target/deploy/casino.so --output json --url devnet

# Upgrade program
solana program upgrade <BUFFER_PUBKEY> CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma \
  --upgrade-authority ~/.config/solana/id.json \
  --url https://api.devnet.solana.com
```

### Frontend Setup

```bash
cd app
npm install
npm run dev  # Runs on port 5000 (Replit) or 5173 (local)
```

### Backend Setup

```bash
cd server

# Start Docker services (PostgreSQL + Redis)
docker-compose up -d

# Install and run
npm install
npm run dev  # Runs on port 3000
```

### Relayer (Devnet Auto-Settlement)

```bash
npm run relayer:devnet  # Polls every 5 seconds
```

---

## Environment Variables

### Frontend (`.env`)
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma
VITE_NETWORK=devnet
```

### Backend (`.env`)
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=casino_db
DB_USER=casino
DB_PASSWORD=casino_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma

# Buyback (see BUYBACK.md)
AUTHORITY_PRIVATE_KEY=[123,45,67,...]
OPERATOR_WALLETS=pubkey1,pubkey2
```

---

## Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: casino_db
      POSTGRES_USER: casino
      POSTGRES_PASSWORD: casino_password
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

volumes:
  redis_data:
  postgres_data:
```

---

## Security

### On-chain
- ✅ Atomic bet transfers (no escrow)
- ✅ Vault PDA signing (no private key)
- ✅ Liquidity checks (prevents insolvency)
- ✅ Input validation
- ✅ Overflow-safe math
- ✅ Access control (authority-gated admin)
- 🔄 VRF verification (Switchboard in progress)

### Backend
- ✅ Operator authentication middleware
- ✅ Production mode enforces wallet signatures
- ✅ Fixed vault reserve (0.5 SOL)
- ⚠️ Authority keypair in env (use KMS for production)

---

## Key Patterns

### BN/PublicKey Serialization
Anchor returns `u64` as `BN`, keys as `PublicKey`. React cannot render these directly.
```typescript
return sessions.map(s => ({
  publicKey: s.publicKey.toBase58(),
  account: {
    gameId: s.account.gameId.toString(),
    betAmount: s.account.betAmount.toString(),
  }
}));
```

### Legacy Account Handling
Program upgrades can leave incompatible accounts on-chain. Use try/catch per account:
```typescript
const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID);
for (const { pubkey, account } of rawAccounts) {
  try {
    const decoded = program.coder.accounts.decode('GameSession', account.data);
  } catch { /* skip legacy */ }
}
```

---

## Mainnet Readiness

### ✅ Complete
- Atomic bet transfers and session lifecycle
- Multi-game support (CoinFlip, Dice, Slots)
- BN/PublicKey serialization
- Expired session refunds
- Vault liquidity checks
- TreasuryPDA for buyback separation
- Dark casino theme with animations
- Live leaderboard with WebSocket
- Buyback control panel
- PostgreSQL + Redis setup
- Operator authentication

### 🔄 In Progress
- Switchboard VRF integration

### ❌ Missing for Production
- Security audit
- Private RPC configuration
- Helius/Shyft webhook integration
- Rate limiting + API authentication
- Monitoring and alerts
- Backup/recovery procedures
- Mainnet deployment runbook

---

**See also:**
- [APP_DESCRIPTION.md](APP_DESCRIPTION.md) - Product overview and features
- [BUYBACK.md](BUYBACK.md) - Buyback & burn system
- [ERRORS_AND_LAUNCH_CHECKLIST.md](ERRORS_AND_LAUNCH_CHECKLIST.md) - Error history and launch checklist
