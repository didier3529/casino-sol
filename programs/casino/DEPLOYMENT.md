# Casino Smart Contract Deployment Guide

## Overview
This package contains the Solana smart contract for the decentralized casino platform with atomic bet transfers, Treasury PDA escrow, and provably fair game settlement.

## Prerequisites

1. **Rust & Cargo** (Latest stable)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Solana CLI Tools** (v1.18.26 or later)
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
   ```

3. **Anchor Framework** (v0.29.0)
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli
   ```

## Project Structure
```
casino/
├── src/
│   ├── instructions/     # All instruction handlers
│   │   ├── start_spin.rs       # Atomic bet transfer to Treasury
│   │   ├── settle_spin.rs      # Game settlement with payout
│   │   ├── initialize_casino.rs
│   │   ├── initialize_player.rs
│   │   └── ... (other instructions)
│   ├── state/           # Account state structures
│   │   ├── casino.rs    # Main casino config
│   │   ├── game.rs      # Game session state
│   │   ├── player.rs    # Player profile & stats
│   │   └── tournament.rs
│   ├── errors.rs        # Custom error codes
│   ├── lib.rs          # Program entry point
│   └── utils/          # Helper functions
├── Cargo.toml          # Dependencies
└── DEPLOYMENT.md       # This file
```

## Quick Start Deployment

### Step 1: Build the Program
```bash
cd casino
anchor build
```

Or without Anchor:
```bash
cargo build-sbf
```

The compiled program will be in `target/deploy/casino.so`

### Step 2: Set Up Wallet

**Option A: Create New Wallet (Devnet)**
```bash
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json
solana config set --keypair ~/.config/solana/devnet-wallet.json
solana config set --url devnet
```

**Option B: Use Existing Wallet**
```bash
solana config set --keypair /path/to/your/wallet.json
solana config set --url devnet
```

### Step 3: Fund Wallet (Devnet Only)
```bash
solana airdrop 2
```

Or use the web faucet: https://faucet.solana.com

### Step 4: Deploy Program
```bash
solana program deploy target/deploy/casino.so
```

**Important:** Save the Program ID that's printed! You'll need it for frontend integration.

Example output:
```
Program Id: 9X7fAbc...xyz123
```

### Step 5: Update Program ID

Update `lib.rs` with your deployed program ID:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

Then rebuild and upgrade:
```bash
anchor build
solana program deploy --program-id YOUR_PROGRAM_ID target/deploy/casino.so
```

## Initialize Casino

After deployment, you must initialize the casino account:

```typescript
// Using Anchor client
import * as anchor from "@coral-xyz/anchor";

const provider = anchor.AnchorProvider.env();
const program = anchor.workspace.Casino;

await program.methods
  .initializeCasino(
    200,        // house_edge: 2% (200 basis points)
    10_000_000, // min_bet: 0.01 SOL
    10_000_000_000, // max_bet: 10 SOL
    500         // treasury_fee: 5% (500 basis points)
  )
  .accounts({
    authority: provider.wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();
```

## Frontend Integration

Update your frontend configuration with the deployed program ID:

**File: `src/utils/solana-casino.ts`**
```typescript
export const CASINO_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
```

## Key Features Implemented

### 1. Atomic Bet Transfers (`start_spin`)
- Transfers bet from player → Treasury PDA **BEFORE** game logic
- Validates player has sufficient balance
- Creates game ticket on-chain
- No possibility of bet manipulation

### 2. Instant Settlement (`settle_spin`)
- Oracle calls this instruction with provably fair server seed
- **Win:** Treasury transfers payout → player (instant)
- **Loss:** Bet stays in Treasury forever
- Updates player stats and Treasury contribution tracking

### 3. Provably Fair Randomness
- Client seed (provided by player)
- Server seed hash (committed before game)
- Server seed revealed after settlement
- Anyone can verify outcomes

### 4. Security Features
- PDA-controlled Treasury (no human access)
- Balance validation (on-chain + frontend)
- Emergency pause functionality
- Admin-only treasury withdrawals

## Account Structure

### Casino PDA
```
Seeds: ["casino"]
Stores: Configuration, stats, Treasury reference
```

### Treasury PDA
```
Seeds: ["treasury", casino_pubkey]
Holds: All player bets in escrow
```

### Player PDA
```
Seeds: ["player", wallet_pubkey]
Tracks: Lifetime stats, Treasury contributions
```

### Game PDA
```
Seeds: ["game", player_pubkey, session_id]
Stores: Bet details, provably fair data
```

## Testing

### Run Tests
```bash
anchor test
```

### Test on Devnet
1. Deploy program (see above)
2. Initialize casino
3. Use frontend to place test bets
4. Monitor with Solana Explorer: https://explorer.solana.com/?cluster=devnet

## Mainnet Deployment

**⚠️ CRITICAL: Mainnet requires additional steps!**

1. **Audit the code** - Get professional security audit
2. **Fund wallet** - Deployment costs ~5-10 SOL
3. **Set cluster to mainnet**:
   ```bash
   solana config set --url mainnet-beta
   ```
4. **Deploy**:
   ```bash
   solana program deploy target/deploy/casino.so
   ```
5. **Initialize casino** with production settings
6. **Test thoroughly** with small amounts first

## Cost Estimates

### Devnet (Free)
- Deployment: Free (using airdrop)
- Transactions: Free

### Mainnet-Beta
- Deployment: ~3-5 SOL (one-time)
- Initialize Casino: ~0.01 SOL
- Per Game Transaction: ~0.0005 SOL

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
cargo clean
anchor build
```

### Deployment Permission Denied
```bash
# Check wallet has enough SOL
solana balance

# Request airdrop (devnet only)
solana airdrop 2
```

### Program Already Deployed
```bash
# Upgrade existing program
solana program deploy --program-id YOUR_PROGRAM_ID target/deploy/casino.so
```

### Account Not Found
Make sure you've initialized the casino account after deployment (see Step 5).

## Support & Resources

- **Solana Docs:** https://docs.solana.com
- **Anchor Docs:** https://www.anchor-lang.com
- **Solana Explorer (Devnet):** https://explorer.solana.com/?cluster=devnet
- **Solana Explorer (Mainnet):** https://explorer.solana.com
- **Devnet Faucet:** https://faucet.solana.com

## Security Checklist

Before mainnet deployment:

- [ ] Professional security audit completed
- [ ] All admin functions tested
- [ ] Emergency pause mechanism verified
- [ ] Treasury PDA controls validated
- [ ] Provably fair system verified
- [ ] Rate limiting implemented (if needed)
- [ ] Multi-sig authority considered
- [ ] Insurance fund allocated
- [ ] Legal compliance reviewed
- [ ] Bug bounty program established

## License

MIT License - See LICENSE file for details

---

**Built with:** Rust, Anchor Framework, Solana
**Version:** 0.1.0
**Status:** Ready for Devnet Testing
