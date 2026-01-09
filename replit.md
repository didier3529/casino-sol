# SOL VEGAS - Solana Casino

## Overview
A provably fair on-chain casino application built on Solana blockchain. Features casino games including coin flip, dice, and slots with verifiable randomness and automated token buyback & burn.

## Documentation

| File | Purpose |
|------|---------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System design, build/deploy, technical details |
| **[APP_DESCRIPTION.md](APP_DESCRIPTION.md)** | Product overview, features, quick start |
| **[BUYBACK.md](BUYBACK.md)** | Token buyback & burn system |
| **[ERRORS_AND_LAUNCH_CHECKLIST.md](ERRORS_AND_LAUNCH_CHECKLIST.md)** | Error history and mainnet checklist |

## Project Structure
- **app/**: React + Vite + TypeScript frontend
  - Uses Solana wallet adapter for wallet connection
  - Tailwind CSS for styling with custom design system
  - Communicates with Solana programs on-chain
- **server/**: Express.js backend server
  - Leaderboard API with WebSocket
  - Buyback service with automation
  - PostgreSQL + Redis
- **programs/**: Solana smart contracts (Anchor framework)

## Running Locally
- Frontend: `cd app && npm run dev` (runs on port 5000)
- Server: `cd server && npm run dev` (runs on port 3000)

## Key Dependencies
- Frontend: React 18, Vite, @solana/wallet-adapter, @coral-xyz/anchor
- Server: Express, Socket.io, PostgreSQL (via pg/knex)
- Programs: Anchor framework, Rust

## Configuration
- Frontend binds to `0.0.0.0:5000` with all hosts allowed for Replit proxy
- Backend binds to `localhost:3000`

## Design System

### Typography
- **Display Font**: Space Grotesk (headings, buttons, labels) - weights 500-700
- **Body Font**: Manrope (paragraphs, descriptions) - weights 400-600
- **Monospace Font**: JetBrains Mono (code, addresses, numbers)

### Color Palette
- **Background**: #06060A (obsidian base), #0C0C12 (secondary), #12121A (tertiary)
- **Accent**: #3AF3E0 (cyan-teal) - primary interactive color
- **Gold**: #F2B950 (warm gold) - secondary accent, rewards
- **Success**: #34D399, **Error**: #F87171, **Warning**: #FBBF24
- **Text**: #FAFAFA (primary), #A0A0A8 (secondary), #5C5C66 (muted)

### CSS Classes
- `.glass-card` - Glass morphism card with gradient background
- `.glass-nav` - Navigation bar with blur effect
- `.surface-elevated` - Elevated surface for nested elements
- `.btn-primary` - Cyan gradient button with glow
- `.btn-secondary` - Subtle glass button
- `.btn-gold` - Gold gradient button
- `.text-gradient` - Cyan-to-gold text gradient

## Footer Architecture
- **App pages** (Games, HowItWorks, Buyback, Developer): Share footer in `app/src/App.tsx`
- **Landing page**: Has separate footer in `app/src/pages/LandingPage.tsx`

## Buyback Control System

### Components
- **BuybackControlPanel.tsx**: Frontend UI for CA input, config, and execution
- **buybackService.ts**: Backend service for executing buybacks
- **pumpPortalClient.ts**: Pump.fun API integration
- **admin.ts**: API endpoints for buyback management
- **cronJobs.ts**: Automated scheduler

### API Endpoints
- `GET /api/admin/buyback/config` - Get current config
- `PATCH /api/admin/buyback/config` - Update config (CA, spend limits, etc.)
- `POST /api/admin/buyback/run` - Manual buyback trigger
- `POST /api/admin/buyback/pause` - Pause automation
- `POST /api/admin/buyback/resume` - Resume automation
- `GET /api/admin/buyback/events` - Get buyback history

### Security
- **Development mode**: Allows unauthenticated requests (logs warning)
- **Production mode**: Requires wallet signature authentication
- Set `OPERATOR_WALLETS=pubkey1,pubkey2` to whitelist operators

### Safety Features
- Dry run mode (simulates without executing)
- Max spend per interval cap
- Vault reserve protection (0.5 SOL minimum)
- Cooldown between runs
- Transaction simulation before execution

## Recent Changes

- 2026-01-08: Documentation Consolidation
  - Merged 9 markdown files into 4 canonical docs
  - ARCHITECTURE.md: System design + build/deploy
  - APP_DESCRIPTION.md: Product overview + quick start
  - BUYBACK.md: Token buyback system
  - ERRORS_AND_LAUNCH_CHECKLIST.md: Error history + launch checklist
  - Deleted redundant files (BUILD_AND_DEPLOY.md, README.md, archived stubs)

- 2026-01-08: Buyback Control System
  - Added BuybackControlPanel to Developer page
  - Created PostgreSQL database with buyback tables
  - Added operator authentication middleware
  - Production mode enforces strict wallet signature auth

- 2026-01-07: Visibility & Layout Fixes
  - Fixed DeveloperPage wallet-gate bug
  - Developer dashboard renders all panels without wallet
  - GamesPage: Moved games FIRST, InitializeCasino below

- 2026-01-07: Developer Dashboard & Launch Readiness
  - Expanded Developer page with stat cards, treasury panel, activity feed
  - Enhanced CasinoLobby game cards with glow effects
  - Added X/Twitter share button to game results

- 2026-01-06: Complete UI Redesign
  - Implemented sophisticated design system
  - Glass morphism effects throughout
  - Video background on landing page
  - Redesigned all pages with new styling
