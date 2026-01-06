# BUILD_AND_DEPLOY (Canonical)

This is the **single source of truth** for how to **build + upgrade the Solana program on devnet** for this repo.

If you ever ask “build and deploy”, we follow **this file**.

---

## Toolchain (WSL/Ubuntu) — Known Good

This project is pinned to:
- **Anchor CLI**: `anchor-cli 0.28.0` (see `Anchor.toml`)
- **Solana CLI** (for building/upgrading): `v1.18.21`

Why: Anchor 0.28 expects older Solana build tooling. Newer Solana/Agave toolchains can break `anchor build`.

---

## One-time Setup (WSL)

### 1) Install Solana CLI 1.18.21 into `~/solana-install`

```bash
mkdir -p ~/solana-install && cd ~/solana-install
curl -L -o solana.tar.bz2 \
  https://github.com/solana-labs/solana/releases/download/v1.18.21/solana-release-x86_64-unknown-linux-gnu.tar.bz2
tar -xjf solana.tar.bz2
```

### 2) Ensure Anchor CLI 0.28.0 exists

Verify:

```bash
/home/etabox/.cargo/bin/anchor --version
```

Expected:
- `anchor-cli 0.28.0`

---

## Fast Path (Recommended): Run the script

From **Windows PowerShell** (workspace has spaces), run:

```powershell
wsl -d Ubuntu bash "/mnt/c/Users/Metabox/.cursor/casino solitaire - Copy (2)/casino-solitaire/build-and-deploy.sh"
```

What it does:
1. Sets PATH to use **Solana 1.18.21** + system dirs (so `bash` is always found)
2. Generates a Solana-compatible `Cargo.lock` for SBF builds
3. Runs `anchor build` to produce `target/deploy/casino.so`
4. Copies IDL to frontend: `target/idl/casino.json` → `app/src/idl/casino.json`
5. Writes a buffer on devnet
6. Upgrades the existing devnet program ID (`CasytXe4...`)

---

## Manual Build (If you want to run by hand)

In WSL:

```bash
export PATH=~/solana-install/solana-release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:~/.cargo/bin
cd "/mnt/c/Users/Metabox/.cursor/casino solitaire - Copy (2)/casino-solitaire"

# Generate lockfile for Solana SBF build tooling
cd programs/casino
cargo +solana generate-lockfile
cd ../..

# Build program
anchor build

# Sync IDL to frontend (mandatory)
cp target/idl/casino.json app/src/idl/casino.json
```

Upgrade the existing devnet program (buffer + upgrade):

```bash
export PATH=~/solana-install/solana-release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:~/.cargo/bin
cd "/mnt/c/Users/Metabox/.cursor/casino solitaire - Copy (2)/casino-solitaire"

# 1) Write buffer
solana program write-buffer target/deploy/casino.so --output json --url devnet --keypair ~/.config/solana/id.json
# -> {"buffer":"<BUFFER_PUBKEY>"}

# 2) Upgrade program (devnet)
solana program upgrade <BUFFER_PUBKEY> CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma \
  --upgrade-authority ~/.config/solana/id.json \
  --url https://api.devnet.solana.com
```

---

## Frontend Setup

### Prerequisites
- Node.js 18+
- pnpm/npm/yarn

### Installation

```bash
cd casino-solitaire/app

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_BACKEND_URL=http://localhost:3000
VITE_CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma
VITE_NETWORK=devnet
EOF

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## Backend Setup (Leaderboard & API)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Redis 6+ (or Docker)

### Quick Start with Docker

```bash
cd casino-solitaire/server

# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running
docker ps

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=casino_db
DB_USER=casino
DB_PASSWORD=casino_password
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_at_least_32_chars_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_at_least_32_chars_long

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com/
SOLANA_NETWORK=devnet
CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma

# CORS
CORS_ORIGIN=http://localhost:5173
EOF

# Start backend server
npm run dev
```

Backend will be available at: http://localhost:3000

### Database Tables

Tables are created automatically on first run:

**leaderboard_stats**:
- wallet_address (unique)
- total_bet_amount, total_payout_amount, net_profit
- total_games, total_wins, total_losses
- first_game_at, last_game_at

**game_results** (audit trail):
- transaction_signature (unique)
- wallet_address, game_type
- bet_amount, payout_amount, is_win
- game_data (JSONB), played_at

### Testing the Backend

```bash
# Health check
curl http://localhost:3000/health

# Get leaderboard
curl http://localhost:3000/api/leaderboard

# Test webhook (manual game result)
curl -X POST http://localhost:3000/api/webhooks/game-result \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "test-tx-123",
    "gameType": "coinflip",
    "betAmount": 0.5,
    "payoutAmount": 1.0,
    "isWin": true,
    "timestamp": 1703692800000
  }'
```

---

## Relayer Setup (Devnet Auto-Settlement)

The relayer automatically settles pending bets on devnet using the authority keypair.

```bash
cd casino-solitaire

# Start relayer (polls every 5 seconds)
npm run relayer:devnet
```

**Requires**: Authority keypair at `/home/etabox/.config/solana/id.json` (WSL)

---

## Full Development Workflow

### 1. Start Infrastructure (Backend + Database)

```bash
# Terminal 1: Start Docker services
cd casino-solitaire/server
docker-compose up

# Terminal 2: Start backend
cd casino-solitaire/server
npm run dev
```

### 2. Start Frontend

```bash
# Terminal 3: Start frontend
cd casino-solitaire/app
npm run dev
```

### 3. Start Relayer (for devnet auto-settlement)

```bash
# Terminal 4: Start relayer
cd casino-solitaire
npm run relayer:devnet
```

### 4. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Backend Health: http://localhost:3000/health

---

## Troubleshooting

### "The token '&&' is not a valid statement separator…"
You're running multiple commands in **PowerShell**. Use:
- Separate lines, or
- This repo's `build-and-deploy.sh`, or
- `powershell -Command "cmd1; cmd2"`

### `target/deploy/casino.so` missing
`anchor build` failed. Re-run with the PATH from this doc and check the WSL output.

### "Program upgraded but frontend fails (method not found / Custom:101)"
You skipped the **IDL copy** step:

```bash
cp target/idl/casino.json app/src/idl/casino.json
```

### "Database connection failed"
1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Check credentials in `.env` match Docker Compose
3. Test connection: `psql -h localhost -U casino -d casino_db` (password: casino_password)

### "Redis connection failed"
1. Check Redis is running: `docker ps | grep redis`
2. Test connection: `redis-cli ping` (should return PONG)

### "CORS errors in browser"
Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL (default: `http://localhost:5173`)

### "Leaderboard not updating"
1. Check WebSocket connection in browser console (F12)
2. Ensure backend is running and accessible
3. Test webhook endpoint manually (see Testing the Backend section)




# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## Backend Setup (Leaderboard & API)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Redis 6+ (or Docker)

### Quick Start with Docker

```bash
cd casino-solitaire/server

# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running
docker ps

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=casino_db
DB_USER=casino
DB_PASSWORD=casino_password
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_at_least_32_chars_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_at_least_32_chars_long

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com/
SOLANA_NETWORK=devnet
CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma

# CORS
CORS_ORIGIN=http://localhost:5173
EOF

# Start backend server
npm run dev
```

Backend will be available at: http://localhost:3000

### Database Tables

Tables are created automatically on first run:

**leaderboard_stats**:
- wallet_address (unique)
- total_bet_amount, total_payout_amount, net_profit
- total_games, total_wins, total_losses
- first_game_at, last_game_at

**game_results** (audit trail):
- transaction_signature (unique)
- wallet_address, game_type
- bet_amount, payout_amount, is_win
- game_data (JSONB), played_at

### Testing the Backend

```bash
# Health check
curl http://localhost:3000/health

# Get leaderboard
curl http://localhost:3000/api/leaderboard

# Test webhook (manual game result)
curl -X POST http://localhost:3000/api/webhooks/game-result \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "test-tx-123",
    "gameType": "coinflip",
    "betAmount": 0.5,
    "payoutAmount": 1.0,
    "isWin": true,
    "timestamp": 1703692800000
  }'
```

---

## Relayer Setup (Devnet Auto-Settlement)

The relayer automatically settles pending bets on devnet using the authority keypair.

```bash
cd casino-solitaire

# Start relayer (polls every 5 seconds)
npm run relayer:devnet
```

**Requires**: Authority keypair at `/home/etabox/.config/solana/id.json` (WSL)

---

## Full Development Workflow

### 1. Start Infrastructure (Backend + Database)

```bash
# Terminal 1: Start Docker services
cd casino-solitaire/server
docker-compose up

# Terminal 2: Start backend
cd casino-solitaire/server
npm run dev
```

### 2. Start Frontend

```bash
# Terminal 3: Start frontend
cd casino-solitaire/app
npm run dev
```

### 3. Start Relayer (for devnet auto-settlement)

```bash
# Terminal 4: Start relayer
cd casino-solitaire
npm run relayer:devnet
```

### 4. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Backend Health: http://localhost:3000/health

---

## Troubleshooting

### "The token '&&' is not a valid statement separator…"
You're running multiple commands in **PowerShell**. Use:
- Separate lines, or
- This repo's `build-and-deploy.sh`, or
- `powershell -Command "cmd1; cmd2"`

### `target/deploy/casino.so` missing
`anchor build` failed. Re-run with the PATH from this doc and check the WSL output.

### "Program upgraded but frontend fails (method not found / Custom:101)"
You skipped the **IDL copy** step:

```bash
cp target/idl/casino.json app/src/idl/casino.json
```

### "Database connection failed"
1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Check credentials in `.env` match Docker Compose
3. Test connection: `psql -h localhost -U casino -d casino_db` (password: casino_password)

### "Redis connection failed"
1. Check Redis is running: `docker ps | grep redis`
2. Test connection: `redis-cli ping` (should return PONG)

### "CORS errors in browser"
Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL (default: `http://localhost:5173`)

### "Leaderboard not updating"
1. Check WebSocket connection in browser console (F12)
2. Ensure backend is running and accessible
3. Test webhook endpoint manually (see Testing the Backend section)



