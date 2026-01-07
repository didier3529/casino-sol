# SOL VEGAS Launch Checklist

## Overview
This checklist tracks readiness for SOL VEGAS deployment from development through mainnet launch.

---

## Phase 1: Pre-Testnet (Devnet)

### Smart Contract
- [ ] All game logic tested locally with Anchor tests
- [ ] Casino initialization works correctly
- [ ] Coin flip bet placement and resolution verified
- [ ] VRF integration (Switchboard) configured and tested
- [ ] Vault deposits and withdrawals functional
- [ ] Edge cases handled (insufficient balance, max bet limits)

### Frontend
- [ ] Wallet connection works (Phantom, Solflare, etc.)
- [ ] All pages load without errors
- [ ] Casino initialization UI functional
- [ ] Game UI displays correct states (betting, waiting, result)
- [ ] Balance updates in real-time after transactions
- [ ] Error messages display correctly for failed transactions
- [ ] Mobile responsive design verified

### Developer Tools
- [ ] Transaction monitoring visible
- [ ] Vault/Treasury balances display correctly
- [ ] Leaderboard populates with test data

---

## Phase 2: Testnet Validation

### Functional Testing
- [ ] Complete game flow tested end-to-end
- [ ] Multiple concurrent users tested
- [ ] Win/loss payouts verified correct
- [ ] House edge calculations accurate
- [ ] VRF randomness verified (no patterns)

### Stress Testing
- [ ] High volume betting simulated
- [ ] Vault handles edge cases (near-empty, overflow)
- [ ] Transaction confirmation times acceptable

### Security Review
- [ ] Smart contract code reviewed for vulnerabilities
- [ ] No exposed private keys or secrets
- [ ] Rate limiting in place (if applicable)
- [ ] Admin functions properly gated

---

## Phase 3: Pre-Mainnet

### Smart Contract Deployment
- [ ] Program deployed to mainnet
- [ ] Program ID updated in frontend config
- [ ] Upgrade authority secured or revoked
- [ ] Initial vault funded with real SOL

### Token Launch (if applicable)
- [ ] Token contract deployed
- [ ] CA (Contract Address) published
- [ ] Initial liquidity provided
- [ ] Token verified on explorers

### Buyback & Burn
- [ ] Treasury wallet configured
- [ ] Buyback mechanism tested on devnet
- [ ] Burn address verified
- [ ] Automated buyback schedule set (if applicable)

### Frontend Production
- [ ] Environment variables set for mainnet
- [ ] API endpoints pointing to production
- [ ] Analytics/monitoring configured
- [ ] Error tracking enabled

---

## Phase 4: Mainnet Launch

### Go-Live Checklist
- [ ] Final smart contract audit complete
- [ ] All testnet issues resolved
- [ ] Marketing materials ready
- [ ] Social links active (X, GitHub, etc.)
- [ ] Support channels established

### Monitoring
- [ ] Real-time transaction monitoring active
- [ ] Vault balance alerts configured
- [ ] Error alerting enabled
- [ ] Leaderboard updating correctly

### Post-Launch (24-48 hours)
- [ ] No critical bugs reported
- [ ] Transactions processing normally
- [ ] Payouts verified correct
- [ ] Community feedback addressed

---

## Sign-Off

| Phase | Owner | Date | Status |
|-------|-------|------|--------|
| Pre-Testnet | | | Pending |
| Testnet Validation | | | Pending |
| Pre-Mainnet | | | Pending |
| Mainnet Launch | | | Pending |

---

## Notes
- Update this checklist as new requirements are identified
- Each phase must be signed off before proceeding to the next
- Document any issues in `errors-and-fixes.md`
