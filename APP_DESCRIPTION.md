# SOL VEGAS - Provably Fair On-Chain Casino

**A decentralized gambling platform built on Solana blockchain**  
**Last Updated:** 2026-01-08

---

## Overview

SOL VEGAS is a fully decentralized casino application on Solana featuring provably fair games with instant payouts. Every bet, win, and payout is transparent and recorded on-chain—no house can cheat.

### What Makes Us Different

| Feature | Description |
|---------|-------------|
| **Instant Payouts** | Winnings sent to your wallet immediately after each game |
| **Provably Fair** | All random outcomes generated and verified on-chain |
| **Token Buyback & Burn** | Casino profits automatically buy back and burn tokens |
| **Low House Edge** | Transparent rules with fair odds |
| **No Registration** | Just connect your Solana wallet and play |
| **Live Leaderboard** | Compete with other players in real-time |

---

## Games

### CoinFlip
Classic heads or tails with **1.96x multiplier**.
- Win probability: ~48%
- House edge: ~2%
- Choice: Heads (0) or Tails (1)

### Dice
Roll 2d6 and match your target (2-12) for **5x multiplier**.
- Win probability: ~2.78% (1/36)
- Choice: Target number 2-12

### Slots
3-reel slot machine with **10x multiplier** for 3-of-a-kind.
- Win probability: ~10%
- Auto-spin with animated reels

---

## Buyback & Burn System

Casino house profits are automatically used to buy back and burn the project token, reducing supply and supporting long-term value.

### Dual-Mode Execution
- **Pump.fun Mode**: During token launch (bonding curve phase), continuous buybacks every 10-15 seconds
- **Jupiter Mode**: After DEX migration, hourly buybacks aggregated across multiple DEXes

All buyback transactions are logged, transparent, and auditable on-chain.

---

## Quick Start

### For Players
1. Visit the casino website
2. Connect your Phantom wallet
3. Choose a game from the lobby
4. Place your bet and play!
5. Winnings are paid instantly to your wallet

### For Developers

#### Prerequisites
- Node.js 18+
- Phantom wallet (browser extension)

#### Run Frontend (Replit)
```bash
cd app && npm run dev  # Runs on port 5000
```

#### Run Frontend (Local)
```bash
cd app
npm install
npm run dev  # Runs on port 5173
```

#### Run Backend
```bash
cd server
docker-compose up -d  # Start PostgreSQL + Redis
npm install
npm run dev  # Runs on port 3000
```

---

## Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Wallet**: Solana Wallet Adapter (Phantom, Solflare, etc.)
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Audio**: Howler.js
- **Real-time**: Socket.IO for leaderboard

### Backend
- **Server**: Express.js + TypeScript
- **Database**: PostgreSQL 14
- **Cache**: Redis 7
- **WebSocket**: Socket.IO

### Blockchain
- **Network**: Solana (Devnet/Mainnet)
- **Framework**: Anchor 0.28.0
- **Randomness**: Switchboard VRF (planned)

---

## Design System

### Typography
- **Display**: Space Grotesk (headings, buttons) - weights 500-700
- **Body**: Manrope (paragraphs) - weights 400-600
- **Monospace**: JetBrains Mono (addresses, numbers)

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Background | #06060A | Obsidian base |
| Secondary BG | #0C0C12 | Cards, panels |
| Cyan Accent | #3AF3E0 | Primary interactive |
| Gold | #F2B950 | Rewards, secondary accent |
| Success | #34D399 | Wins |
| Error | #F87171 | Losses |
| Text Primary | #FAFAFA | Main text |
| Text Secondary | #A0A0A8 | Muted text |

### Visual Effects
- Glass morphism with backdrop blur
- Soft glows using accent colors
- Smooth animations and transitions

---

## Security Features

- ✅ **Atomic transactions** - All-or-nothing bet placement
- ✅ **PDA-controlled vault** - Program signs for payouts (no private keys)
- ✅ **Input validation** - Bet bounds and choice validation
- ✅ **Overflow protection** - Checked arithmetic
- ✅ **Session expiration** - 1-hour timeout with refund
- ✅ **Liquidity checks** - Vault must cover worst-case payout

---

## Project Structure

```
casino-solitaire/
├── app/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── games/          # Game-specific views
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Helpers and constants
│   └── public/             # Static assets
├── server/                 # Express.js backend
│   └── src/
│       ├── routes/         # API endpoints
│       ├── services/       # Business logic
│       └── database/       # PostgreSQL setup
├── programs/               # Anchor smart contracts
│   └── casino/
│       └── src/            # Rust program code
└── scripts/                # Utility scripts
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, build/deploy, technical details |
| [BUYBACK.md](BUYBACK.md) | Token buyback & burn system |
| [ERRORS_AND_LAUNCH_CHECKLIST.md](ERRORS_AND_LAUNCH_CHECKLIST.md) | Error history and mainnet checklist |

---

## Current Status

**Version:** 2.0 (Complete Rebuild)  
**Network:** Devnet (Mainnet-ready pending audit)

### ✅ Complete
- All 3 games fully functional
- Instant payouts working
- Live leaderboard
- Buyback control panel
- Operator authentication
- Professional casino UI

### 🔄 In Progress
- Switchboard VRF integration for mainnet

### ❌ Before Mainnet
- Security audit
- Private RPC setup
- Monitoring infrastructure

---

Play responsibly and enjoy the future of decentralized gaming!

**Built with:** Anchor • Solana • React • Vite • Socket.IO
