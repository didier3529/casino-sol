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

## Recent Changes
- 2026-01-06: Final Polish Pass
  - StatusBar component: Live network badge, Vault/Treasury balances, Solscan link
  - CA badge on landing page (pump.fun style, shows "Coming Soon")
  - Social links (X, GitHub) in app footer
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
