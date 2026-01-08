# Solana Casino Coinflip (SOL VEGAS)

## Overview
A provably fair on-chain casino application built on Solana blockchain. Features casino games including coin flip, dice, and slots with verifiable randomness.

## Project Structure
- **app/**: React + Vite + TypeScript frontend
  - Uses Solana wallet adapter for wallet connection
  - Tailwind CSS for styling with custom design system
  - Communicates with Solana programs on-chain
- **server/**: Express.js backend server (optional - for analytics, leaderboards, etc.)
- **programs/**: Solana smart contracts written in Rust using Anchor framework

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

## Design System (2026-01-06)

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

### Components
- **Border Radius**: 6px (sm), 10px (md), 14px (lg), 20px (xl), 28px (2xl)
- **Glass Effects**: Translucent surfaces with backdrop blur
- **Shadows**: Soft glows using accent colors for emphasis

### CSS Classes
- `.glass-card` - Glass morphism card with gradient background
- `.glass-nav` - Navigation bar with blur effect
- `.surface-elevated` - Elevated surface for nested elements
- `.btn-primary` - Cyan gradient button with glow
- `.btn-secondary` - Subtle glass button
- `.btn-gold` - Gold gradient button
- `.text-gradient` - Cyan-to-gold text gradient
- `.font-display` / `.font-body` - Typography utilities

## Documentation
- **errors-and-fixes.md**: Log of issues encountered and their resolutions (workflow failures, caching, etc.)

## Footer Architecture
- **App pages** (Games, HowItWorks, Buyback, Developer): Share footer in `app/src/App.tsx`
- **Landing page**: Has separate footer in `app/src/pages/LandingPage.tsx`
- Both footers must be edited independently to stay in sync

## Buyback Control System (2026-01-08)

### Overview
Operator-only panel in Developer page for managing token buyback & burn automation via Pump.fun.

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
- Set `REQUIRE_OPERATOR_AUTH=true` for strict auth in dev

### Database Tables
- `buyback_config`: Stores CA, spend limits, interval, active status
- `buyback_events`: Logs all buyback transactions

### Safety Features
- Dry run mode (simulates without executing)
- Max spend per interval cap
- Vault reserve protection (0.5 SOL minimum)
- Cooldown between runs
- Transaction simulation before execution

## Recent Changes
- 2026-01-08: Buyback Control System
  - Added BuybackControlPanel to Developer page
  - Created PostgreSQL database with buyback tables
  - Fixed pumpPortalClient.ts duplicate code
  - Added operator authentication middleware
  - Production mode enforces strict wallet signature auth
  - Development mode allows testing with warnings
- 2026-01-07: Visibility & Layout Fixes
  - Fixed DeveloperPage wallet-gate bug: removed early `if (!publicKey) return` guard
  - Developer dashboard now renders all panels even without wallet connected
  - Added inline "Connect Wallet for Live Data" banner instead of blocking content
  - GamesPage: Moved games FIRST, InitializeCasino moved below (scroll down to access)
  - InitializeCasino: Made more compact (smaller padding, inline layout, tighter spacing)
- 2026-01-07: Developer Dashboard & Launch Readiness
  - Created comprehensive LAUNCH_CHECKLIST.md for testnet/mainnet deployment
  - Expanded Developer page with:
    - Quick stat cards (Vault, Treasury, Players, Total Games)
    - Treasury & Buyback panel with min/max bet display
    - Recent Activity feed showing live transactions
    - Wallet Leaderboard with ranking and profit tracking
    - System Health monitoring (existing)
  - Enhanced CasinoLobby game cards:
    - Larger icons (w-10 h-10), more dramatic glow effects
    - "Live" badge for active games, "Soon" badge for coming soon
    - Video trailer slot placeholder for future content
    - Premium gradient backgrounds and hover animations
  - Added X/Twitter share button to game results (tweet intent, no API)
- 2026-01-07: Casino Activation Redesign
  - Redesigned InitializeCasino component with casino-themed styling
  - New messaging: "Activate the Casino", "Light Up the Casino" button
  - Sparkles icon, gold glow effects, premium glass-card styling
  - Better visual states for loading, initialized, and not-initialized
- 2026-01-07: Footer Consistency Fix
  - Unified both footers (App.tsx and LandingPage.tsx) with identical styling
  - Updated copyright to 2026, added Mainnet indicator and Provably Fair badge
  - Increased Shield icon size from w-3 to w-3.5 for better visibility
  - Created errors-and-fixes.md to document debugging process
  - Added cache control headers to vite.config.ts to prevent stale content
- 2026-01-06: Social Links & Content Cleanup
  - Moved X and GitHub social buttons to top navigation (visible immediately)
  - Removed duplicate Buyback & Burn section from How It Works page
  - How It Works now focuses on Casino Flow and Key Terms only
- 2026-01-06: Final Polish Pass
  - StatusBar component: Live network badge, Vault/Treasury balances, Solscan link
  - CA badge on landing page (pump.fun style, shows "Coming Soon")
  - Game cards: larger icons, "Coming Soon" badges for Dice/Slots
  - Consistent headers: clean bold white text (removed gradients for consistency)
  - Fixed StatusBar error handling for wallet/program availability
- 2026-01-06: Complete UI Redesign
  - Implemented sophisticated design system with Space Grotesk/Manrope fonts
  - New color palette: obsidian backgrounds, cyan accent, warm gold
  - Glass morphism effects throughout the app
  - Video background on landing page (casino-bg.mp4)
  - Redesigned all pages: Landing, Games, HowItWorks, Buyback, Developer
  - Updated all shared components with new styling
  - Professional wallet button integration
- 2026-01-06: Configured for Replit environment
  - Updated Vite config to use port 5000 with allowedHosts: true
  - Set up Frontend workflow
  - Fixed wallet adapter duplicate package issue with npm dedupe
