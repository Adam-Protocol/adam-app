# Adam Protocol

Privacy-first stablecoin system on Starknet using STARKs, zero-knowledge proofs, and confidential transactions.

## Vision

Financial privacy as a fundamental right. Private, compliant stablecoin transactions bridging crypto and traditional finance. We're building stablecoins you can confidently use anywhere - walk into a store, pay with Adam, knowing your funds are always redeemable instantly to cash.

## 🔒 Privacy Track Features

- **STARK-Based Zero-Knowledge Proofs**: Native Starknet STARK proving for transaction privacy
- **Pedersen Commitments**: Cryptographic commitments hide transaction amounts
- **Range Proofs**: Prove amounts are valid without revealing values
- **Stealth Addresses**: One-time addresses for recipient privacy
- **Confidential Transactions**: Complete transaction privacy with encrypted metadata
- **Nullifier System**: Prevent double-spending while maintaining privacy

## Problem

Blockchain transparency exposes sensitive financial data - balances, transaction amounts, and trading patterns are public. This creates privacy violations, regulatory friction, and adoption barriers.

Existing stablecoins lack reliable off-ramps. Users can't easily convert crypto to cash when needed, creating uncertainty and limiting real-world usability. Without guaranteed redemption, stablecoins remain trapped in the crypto ecosystem.

## Solution

- **Advanced Privacy**: STARK-based zero-knowledge proofs, Pedersen commitments, range proofs, and stealth addresses
- **Confidential Transactions**: Complete transaction privacy with encrypted metadata
- **Instant Off-Ramp**: Redeem stablecoins to fiat instantly via bank transfer
- **Backed Stablecoins**: Each stablecoin (ADUSD, ADNGN) is fully backed with guaranteed on/off-ramp
- **Multiple Exit Points**: Spend, swap, or cash out - users control how they use their funds
- **Real-World Ready**: Walk into a store and pay with Adam stablecoins, knowing you can always convert to cash
- **Live Rates**: Real-time exchange rates without exposing trade details
- **Compliance**: KYC/AML compatible while protecting transaction privacy

## Features

- **Buy**: USDC → ADUSD/ADNGN (private amounts)
- **Swap**: ADUSD ↔ ADNGN (hidden amounts)
- **Sell**: Instant off-ramp to bank account (any supported stablecoin)
- **Backed**: Every stablecoin is redeemable 1:1 for fiat
- **Flexible**: Multiple redemption options - spend, swap, or cash out anytime

## Quick Start

```bash
# 1. Backend
cd adam-backend
pnpm install && pnpm start:dev

# 2. Deploy contracts
cd adam-contract
./deploy.sh sepolia

# 3. Configure backend with contract addresses
# Edit adam-backend/.env

# 4. Grant permissions
cd adam-backend
pnpm run grant-rate-setter
```

## Project Structure

```
adam-protocol/
├── adam-app/          # Next.js frontend
├── adam-backend/      # NestJS API
└── adam-contract/     # Cairo contracts
```

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Scarb (Cairo)

## Documentation

- [PRIVACY_IMPLEMENTATION.md](PRIVACY_IMPLEMENTATION.md) - Privacy track implementation plan
- [PRIVACY_README.md](PRIVACY_README.md) - Privacy features guide and API reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture & detailed flows
- [QUICKSTART.md](QUICKSTART.md) - Step-by-step setup
- [adam-backend/API.md](adam-backend/API.md) - API reference
- [adam-contract/README.md](adam-contract/README.md) - Contract docs
