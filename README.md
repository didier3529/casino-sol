# ⚡ Solana CoinFlip Casino

A provably fair, on-chain coin flip casino built with Anchor, Solana, and React. Features atomic bet transfers, instant payouts, and comprehensive error handling.

## 🎯 Features

- ✅ **Single CoinFlip Game** - Simple, reliable, provably fair
- ✅ **Atomic Transactions** - Bet transfer + session creation + randomness request in one tx
- ✅ **Instant Payouts** - Automatic payout on win (1.96x multiplier)
- ✅ **Mock VRF for Localnet** - Test randomness without Switchboard infrastructure
- ✅ **Real VRF for Devnet/Mainnet** - Switchboard VRF integration ready
- ✅ **Comprehensive Error Handling** - Screenshot-friendly console logs
- ✅ **Rent Management** - Sessions closed after resolution, rent refunded
- ✅ **Zero Race Conditions** - Atomic game ID increment prevents PDA collisions
- ✅ **Full Test Coverage** - 12+ passing Anchor tests

## 📚 Documentation

This repo is intentionally kept tidy. **The 3 canonical docs are:**

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: system design + build/deploy/upgrade commands
- **[ERROR_HISTORY_AND_FIXES.md](ERROR_HISTORY_AND_FIXES.md)**: major failures + fixes + prevention
- **[PROJECT_STATUS_AND_GOALS.md](PROJECT_STATUS_AND_GOALS.md)**: current status + roadmap to mainnet

All older/auxiliary docs are archived under `docs/archive/`.

## 🏗️ Architecture

```
programs/casino/          # Anchor smart contract
├── src/
│   ├── lib.rs           # Program entry point
│   ├── errors.rs         # Error codes
│   ├── state/           # Account structures (InitSpace)
│   └── instructions/    # initialize, place_bet, fulfill_randomness
├── Cargo.toml           # Switchboard VRF dependency
└── tests/               # Anchor tests

app/                     # Vite + React frontend
├── src/
│   ├── components/      # CoinFlip, SessionList, WalletProvider
│   ├── hooks/           # useCasino, useBet, useFulfillRandomness
│   └── utils/           # constants, errors, PDA helpers
└── package.json

docs/                    # Additional documentation
├── OLD_FRONTEND_POSTMORTEM.md
└── archive/             # Archived docs

Anchor.toml              # Program config
BUILD_AND_DEPLOY.md     # Build and deploy guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js v20+
- Rust (WSL recommended)
- Solana CLI **1.18.x** for building Anchor 0.28 programs (details in `ARCHITECTURE.md`)
- Anchor CLI **0.28.0** (details in `ARCHITECTURE.md`)

### Installation

```bash
# 1. Install dependencies
cd app && npm install && cd ..

# 2. Start local validator
solana-test-validator --reset

# 3. Build and deploy (in another terminal)
anchor build
anchor keys sync
anchor deploy --provider.cluster localnet

# 4. Start frontend
cd app && npm run dev
```

### Usage

1. Open http://localhost:5173
2. Connect Phantom wallet
3. Airdrop SOL: `solana airdrop 5 YOUR_ADDRESS --url localhost`
4. Place a bet!
5. Open console (F12) for detailed logs

## 📊 Game Mechanics

- **Win Probability:** 48%
- **Payout Multiplier:** 1.96x
- **House Edge:** ~2%
- **Min Bet:** 0.01 SOL (configurable)
- **Max Bet:** 1 SOL (configurable)

## 🔐 Security Features

- ✅ Atomic bet transfers (no escrow vulnerabilities)
- ✅ PDA-controlled vault (program signs for payouts)
- ✅ Input validation (bet bounds, choice validation)
- ✅ Overflow protection (checked arithmetic)
- ✅ Access control (authority checks)
- ✅ Session expiration (1-hour timeout)

## 🧪 Testing

### Run Anchor Tests

```bash
# Start validator
solana-test-validator --reset

# Run tests (in another terminal)
anchor test --skip-local-validator
```

### Test Coverage

- Initialize casino
- Place bet (heads/tails)
- Fulfill randomness (win/loss)
- Concurrent bets
- Error cases (insufficient funds, invalid bet, invalid choice)
- PDA derivation consistency
- Rent refund verification

## 🐛 Debugging

All transactions log comprehensive details to console:

```
🚨 PLACE_BET TRANSACTION FAILED
================================================================================

📍 Context:
  Action: PLACE_BET
  Wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
  Cluster: localnet
  Bet Amount: 100000000 lamports (0.1 SOL)
  Choice: Heads (0)

🔑 PDAs:
  Casino PDA: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
  Vault PDA: 8Zjr6YvJDBs6u4Y4KZmzfHi7HKnpafaG3gPW9xvZj1Yp
  Session PDA: 3ViJ8Q8TZJTzJvQwz2yJwvQGN8fJY4QbZ2pxv7vYn9Rp

🔍 Diagnosis:
  ⚠️  INSUFFICIENT FUNDS
  💡 Solution: Player needs more SOL for bet + transaction fees + rent
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Canonical architecture (on-chain + frontend + ops)
- **[ERROR_HISTORY_AND_FIXES.md](./ERROR_HISTORY_AND_FIXES.md)** - Historical issues, fixes, and prevention
- **[PROJECT_STATUS_AND_GOALS.md](./PROJECT_STATUS_AND_GOALS.md)** - Current status + roadmap to mainnet

Legacy documentation has been archived under `docs/archive/`.

## 🔧 All Fixes Applied

This rebuild addresses 10+ critical issues from previous iterations:

1. ✅ **Session ID Race Condition** - Atomic increment before use
2. ✅ **Casino Stats Not Updating** - Added mut constraint
3. ✅ **Vault Bump Consistency** - Use stored bump everywhere
4. ✅ **Program ID Mismatch** - Automated sync process
5. ✅ **Transaction Constructor Misuse** - Correct API usage
6. ✅ **Manual Space Calculation** - InitSpace derive macro
7. ✅ **No Error Handling** - Comprehensive logging
8. ✅ **No Transaction Simulation** - Simulate before send
9. ✅ **Atomic Bet Transfer** - All-or-nothing transactions
10. ✅ **Rent Management** - Close sessions, refund rent

See [SETUP_GUIDE.md](./SETUP_GUIDE.md#all-fixes-applied) for details.

## 🚀 Deployment

### Localnet (Development)

```bash
anchor build && anchor keys sync && anchor deploy --provider.cluster localnet
```

### Devnet (Testing)

```bash
solana config set --url devnet
anchor build && anchor keys sync && anchor deploy --provider.cluster devnet
```

### Mainnet (Production)

⚠️ **Requires:**
- Security audit
- Real Switchboard VRF setup
- Vault funding
- Monitoring infrastructure

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the setup guide first.

## 📧 Support

- Open an issue for bugs
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for troubleshooting
- Review console logs for detailed error information

---

**Built with:** Anchor • Solana • Vite • React • Switchboard VRF  
**Version:** 2.0 (Complete Rebuild)  
**Status:** ✅ Production-Ready for Localnet/Devnet
