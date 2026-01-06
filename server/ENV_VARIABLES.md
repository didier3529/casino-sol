# Environment Variables Configuration

This document describes all environment variables used by the casino backend server.

## Required Variables

### Server Configuration

```bash
NODE_ENV=development              # Environment: development | production | test
PORT=3000                          # Server port
```

### Database Configuration

```bash
DB_HOST=localhost                  # PostgreSQL host
DB_PORT=5432                       # PostgreSQL port
DB_NAME=casino_db                  # Database name
DB_USER=casino                     # Database user
DB_PASSWORD=casino_password        # Database password
DB_SSL=false                       # Enable SSL for database connection
```

### Redis Configuration

```bash
REDIS_HOST=localhost               # Redis host
REDIS_PORT=6379                    # Redis port
```

### JWT Configuration

```bash
JWT_SECRET=your_jwt_secret_key_at_least_32_chars        # JWT secret (32+ chars)
JWT_REFRESH_SECRET=your_jwt_refresh_secret_32_chars     # JWT refresh secret (32+ chars)
```

### CORS Configuration

```bash
CORS_ORIGIN=http://localhost:5173  # Allowed frontend origin
```

### Solana Configuration

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com           # Solana RPC URL
SOLANA_WS_URL=wss://api.devnet.solana.com/             # Solana WebSocket URL
SOLANA_NETWORK=devnet                                   # Network: mainnet-beta | devnet | testnet
CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma  # Casino program ID
```

### Rate Limiting

```bash
RATE_LIMIT_MAX=100                 # Max requests per 15 minutes per IP
```

## Buyback Configuration

### Authority Keypair (Required for real buybacks)

```bash
# Authority private key in JSON array format [123,45,67,...]
# This is used to sign transactions for skimming excess to treasury
# KEEP THIS SECRET! Never commit to git!
AUTHORITY_PRIVATE_KEY=[...]
```

### Buyback Parameters (Optional - can be managed via database)

These parameters can be set via environment variables OR via the `buyback_config` database table (recommended).
The database values take precedence if both are set.

```bash
# Token mint address for the token to buy back
BUYBACK_TOKEN_MINT=YOUR_TOKEN_MINT_ADDRESS

# Treasury PDA address (derived from casino program)
BUYBACK_TREASURY_ADDRESS=YOUR_TREASURY_PDA_ADDRESS

# Minimum vault reserve in SOL (never skim below this)
BUYBACK_MIN_VAULT_RESERVE=10.0

# Maximum SOL to spend per buyback interval
BUYBACK_MAX_SPEND_PER_INTERVAL=1.0

# Interval between buybacks in seconds (e.g., 3600 = 1 hour)
BUYBACK_INTERVAL_SECONDS=3600

# Slippage tolerance in basis points (e.g., 50 = 0.5%)
BUYBACK_SLIPPAGE_BPS=50

# Whether buyback is active (true/false)
BUYBACK_IS_ACTIVE=false

# Dry run mode - logs but doesn't execute (true/false)
BUYBACK_DRY_RUN=true
```

## Example .env File

Create a `.env` file in the `server/` directory with these values:

```bash
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=casino_db
DB_USER=casino
DB_PASSWORD=casino_password
DB_SSL=false

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret_key_at_least_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_at_least_32_chars

CORS_ORIGIN=http://localhost:5173

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com/
SOLANA_NETWORK=devnet
CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma

RATE_LIMIT_MAX=100

# Buyback - Authority keypair (JSON array)
AUTHORITY_PRIVATE_KEY=
```

## Generating Authority Keypair

To generate the authority keypair JSON for `AUTHORITY_PRIVATE_KEY`:

```bash
# Using Solana CLI
solana-keygen new --outfile authority.json
cat authority.json  # Copy the array and set as AUTHORITY_PRIVATE_KEY

# Or in Node.js
const { Keypair } = require('@solana/web3.js');
const keypair = Keypair.generate();
console.log(JSON.stringify(Array.from(keypair.secretKey)));
```

## Security Notes

1. **Never commit `.env` files to git** - they contain secrets!
2. **Use strong JWT secrets** (32+ random characters)
3. **Keep authority private keys secure** - they control treasury funds
4. **Use environment variables in production** - not `.env` files
5. **Enable SSL for database in production** - set `DB_SSL=true`
6. **Use private RPC endpoints in production** - not public ones
7. **Start with `BUYBACK_DRY_RUN=true`** until you're confident it works

## Managing Buyback Configuration

### Via Database (Recommended)

1. Start the server (it will create the `buyback_config` table with defaults)
2. Use the admin API endpoints to update configuration:

```bash
# Get current config
curl http://localhost:3000/api/admin/buyback/config

# Update config
curl -X PATCH http://localhost:3000/api/admin/buyback/config \
  -H "Content-Type: application/json" \
  -d '{
    "token_mint": "YourTokenMintAddress",
    "treasury_address": "YourTreasuryPDAAddress",
    "min_vault_reserve": "10.0",
    "max_spend_per_interval": "1.0",
    "interval_seconds": 3600,
    "slippage_bps": 50,
    "is_active": false,
    "dry_run": true
  }'

# Enable buyback
curl -X POST http://localhost:3000/api/admin/buyback/resume

# Manually trigger a buyback
curl -X POST http://localhost:3000/api/admin/buyback/run
```

### Via SQL (Direct Database Access)

```sql
-- View current config
SELECT * FROM buyback_config;

-- Update config
UPDATE buyback_config SET
  token_mint = 'YourTokenMintAddress',
  treasury_address = 'YourTreasuryPDAAddress',
  min_vault_reserve = 10.0,
  max_spend_per_interval = 1.0,
  interval_seconds = 3600,
  slippage_bps = 50,
  is_active = false,
  dry_run = true
WHERE id = 1;
```

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Create database: `createdb casino_db`

### "Redis connection failed"
- Check Redis is running: `redis-cli ping`
- Verify `REDIS_HOST` and `REDIS_PORT`

### "Authority keypair not available"
- Set `AUTHORITY_PRIVATE_KEY` in `.env`
- Ensure it's a valid JSON array of numbers
- Buyback will run in dry-run mode without it

### "Buyback not executing"
- Check `is_active` is `true` in config
- Check `dry_run` is `false` for real execution
- Check authority keypair is set
- Check logs for errors: `tail -f logs/combined.log`




This document describes all environment variables used by the casino backend server.

## Required Variables

### Server Configuration

```bash
NODE_ENV=development              # Environment: development | production | test
PORT=3000                          # Server port
```

### Database Configuration

```bash
DB_HOST=localhost                  # PostgreSQL host
DB_PORT=5432                       # PostgreSQL port
DB_NAME=casino_db                  # Database name
DB_USER=casino                     # Database user
DB_PASSWORD=casino_password        # Database password
DB_SSL=false                       # Enable SSL for database connection
```

### Redis Configuration

```bash
REDIS_HOST=localhost               # Redis host
REDIS_PORT=6379                    # Redis port
```

### JWT Configuration

```bash
JWT_SECRET=your_jwt_secret_key_at_least_32_chars        # JWT secret (32+ chars)
JWT_REFRESH_SECRET=your_jwt_refresh_secret_32_chars     # JWT refresh secret (32+ chars)
```

### CORS Configuration

```bash
CORS_ORIGIN=http://localhost:5173  # Allowed frontend origin
```

### Solana Configuration

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com           # Solana RPC URL
SOLANA_WS_URL=wss://api.devnet.solana.com/             # Solana WebSocket URL
SOLANA_NETWORK=devnet                                   # Network: mainnet-beta | devnet | testnet
CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma  # Casino program ID
```

### Rate Limiting

```bash
RATE_LIMIT_MAX=100                 # Max requests per 15 minutes per IP
```

## Buyback Configuration

### Authority Keypair (Required for real buybacks)

```bash
# Authority private key in JSON array format [123,45,67,...]
# This is used to sign transactions for skimming excess to treasury
# KEEP THIS SECRET! Never commit to git!
AUTHORITY_PRIVATE_KEY=[...]
```

### Buyback Parameters (Optional - can be managed via database)

These parameters can be set via environment variables OR via the `buyback_config` database table (recommended).
The database values take precedence if both are set.

```bash
# Token mint address for the token to buy back
BUYBACK_TOKEN_MINT=YOUR_TOKEN_MINT_ADDRESS

# Treasury PDA address (derived from casino program)
BUYBACK_TREASURY_ADDRESS=YOUR_TREASURY_PDA_ADDRESS

# Minimum vault reserve in SOL (never skim below this)
BUYBACK_MIN_VAULT_RESERVE=10.0

# Maximum SOL to spend per buyback interval
BUYBACK_MAX_SPEND_PER_INTERVAL=1.0

# Interval between buybacks in seconds (e.g., 3600 = 1 hour)
BUYBACK_INTERVAL_SECONDS=3600

# Slippage tolerance in basis points (e.g., 50 = 0.5%)
BUYBACK_SLIPPAGE_BPS=50

# Whether buyback is active (true/false)
BUYBACK_IS_ACTIVE=false

# Dry run mode - logs but doesn't execute (true/false)
BUYBACK_DRY_RUN=true
```

## Example .env File

Create a `.env` file in the `server/` directory with these values:

```bash
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=casino_db
DB_USER=casino
DB_PASSWORD=casino_password
DB_SSL=false

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret_key_at_least_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_at_least_32_chars

CORS_ORIGIN=http://localhost:5173

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com/
SOLANA_NETWORK=devnet
CASINO_PROGRAM_ID=CasytXe4cEiXJEcE3yZKxJtaHTDpZFkrVoe7ChJqY8ma

RATE_LIMIT_MAX=100

# Buyback - Authority keypair (JSON array)
AUTHORITY_PRIVATE_KEY=
```

## Generating Authority Keypair

To generate the authority keypair JSON for `AUTHORITY_PRIVATE_KEY`:

```bash
# Using Solana CLI
solana-keygen new --outfile authority.json
cat authority.json  # Copy the array and set as AUTHORITY_PRIVATE_KEY

# Or in Node.js
const { Keypair } = require('@solana/web3.js');
const keypair = Keypair.generate();
console.log(JSON.stringify(Array.from(keypair.secretKey)));
```

## Security Notes

1. **Never commit `.env` files to git** - they contain secrets!
2. **Use strong JWT secrets** (32+ random characters)
3. **Keep authority private keys secure** - they control treasury funds
4. **Use environment variables in production** - not `.env` files
5. **Enable SSL for database in production** - set `DB_SSL=true`
6. **Use private RPC endpoints in production** - not public ones
7. **Start with `BUYBACK_DRY_RUN=true`** until you're confident it works

## Managing Buyback Configuration

### Via Database (Recommended)

1. Start the server (it will create the `buyback_config` table with defaults)
2. Use the admin API endpoints to update configuration:

```bash
# Get current config
curl http://localhost:3000/api/admin/buyback/config

# Update config
curl -X PATCH http://localhost:3000/api/admin/buyback/config \
  -H "Content-Type: application/json" \
  -d '{
    "token_mint": "YourTokenMintAddress",
    "treasury_address": "YourTreasuryPDAAddress",
    "min_vault_reserve": "10.0",
    "max_spend_per_interval": "1.0",
    "interval_seconds": 3600,
    "slippage_bps": 50,
    "is_active": false,
    "dry_run": true
  }'

# Enable buyback
curl -X POST http://localhost:3000/api/admin/buyback/resume

# Manually trigger a buyback
curl -X POST http://localhost:3000/api/admin/buyback/run
```

### Via SQL (Direct Database Access)

```sql
-- View current config
SELECT * FROM buyback_config;

-- Update config
UPDATE buyback_config SET
  token_mint = 'YourTokenMintAddress',
  treasury_address = 'YourTreasuryPDAAddress',
  min_vault_reserve = 10.0,
  max_spend_per_interval = 1.0,
  interval_seconds = 3600,
  slippage_bps = 50,
  is_active = false,
  dry_run = true
WHERE id = 1;
```

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Create database: `createdb casino_db`

### "Redis connection failed"
- Check Redis is running: `redis-cli ping`
- Verify `REDIS_HOST` and `REDIS_PORT`

### "Authority keypair not available"
- Set `AUTHORITY_PRIVATE_KEY` in `.env`
- Ensure it's a valid JSON array of numbers
- Buyback will run in dry-run mode without it

### "Buyback not executing"
- Check `is_active` is `true` in config
- Check `dry_run` is `false` for real execution
- Check authority keypair is set
- Check logs for errors: `tail -f logs/combined.log`
















