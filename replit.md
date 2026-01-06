# Solana Casino Coinflip (SOL VEGAS)

## Overview
A provably fair on-chain casino application built on Solana blockchain. Features casino games including coin flip, dice, and slots with verifiable randomness.

## Project Structure
- **app/**: React + Vite + TypeScript frontend
  - Uses Solana wallet adapter for wallet connection
  - Tailwind CSS for styling
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

## Recent Changes
- 2026-01-06: Configured for Replit environment
  - Updated Vite config to use port 5000 with allowedHosts: true
  - Set up Frontend workflow
