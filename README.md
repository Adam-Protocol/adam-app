# Adam Protocol

Privacy-first multichain stablecoin system on Starknet and Stacks using STARKs, zero-knowledge proofs, and confidential transactions.

## Vision

Financial privacy as a fundamental right, with choice. We offer two paths:

- **Privacy-First (Starknet)**: Private, compliant stablecoin transactions using zero-knowledge proofs
- **Bitcoin-Secured (Stacks)**: Transparent stablecoins with Bitcoin's security and regulatory clarity

Both paths bridge crypto and traditional finance. We're building stablecoins you can confidently use anywhere - walk into a store, pay with Adam, knowing your funds are always redeemable instantly to cash.

## 🌐 Multichain Architecture

- **Starknet**: Privacy-first stablecoins with STARK-based zero-knowledge proofs
- **Stacks**: Bitcoin-secured transparent stablecoins with Clarity language
- **Unified Interface**: Seamless cross-chain experience with chain selector
- **Chain-Specific Adapters**: Optimized for each blockchain's unique features

## 🔒 Privacy Features (Starknet Only)

> [!NOTE]
> Privacy features are exclusive to Starknet. Stacks implementation provides transparent, Bitcoin-secured stablecoins without privacy layers.

- **STARK-Based Zero-Knowledge Proofs**: Native Starknet STARK proving for transaction privacy
- **Pedersen Commitments**: Cryptographic commitments hide transaction amounts
- **Range Proofs**: Prove amounts are valid without revealing values
- **Stealth Addresses**: One-time addresses for recipient privacy
- **Confidential Transactions**: Complete transaction privacy with encrypted metadata
- **Nullifier System**: Prevent double-spending while maintaining privacy

## 💰 Core Features (Both Chains)

- **Buy**: USDC → ADUSD/ADNGN
- **Swap**: ADUSD ↔ ADNGN with live exchange rates
- **Sell**: Instant off-ramp to bank account via Flutterwave
- **Backed**: Every stablecoin is redeemable 1:1 for fiat
- **Flexible**: Multiple redemption options - spend, swap, or cash out anytime

## Problem

Blockchain transparency exposes sensitive financial data - balances, transaction amounts, and trading patterns are public. This creates privacy violations, regulatory friction, and adoption barriers.

Existing stablecoins lack reliable off-ramps. Users can't easily convert crypto to cash when needed, creating uncertainty and limiting real-world usability. Without guaranteed redemption, stablecoins remain trapped in the crypto ecosystem.

## Solution

### Starknet (Privacy-First)
- **Advanced Privacy**: STARK-based zero-knowledge proofs, Pedersen commitments, range proofs, and stealth addresses
- **Confidential Transactions**: Complete transaction privacy with encrypted metadata
- **Live Rates**: Real-time exchange rates without exposing trade details
- **Compliance**: KYC/AML compatible while protecting transaction privacy

### Stacks (Bitcoin-Secured)
- **Bitcoin Security**: Leverages Bitcoin's security through Stacks blockchain
- **Transparent Transactions**: Standard blockchain transparency for regulatory clarity
- **Clarity Smart Contracts**: Decidable, secure smart contract language
- **No Privacy Overhead**: Lower gas costs without privacy computations

### Both Chains
- **Instant Off-Ramp**: Redeem stablecoins to fiat instantly via bank transfer
- **Backed Stablecoins**: Each stablecoin (ADUSD, ADNGN) is fully backed with guaranteed on/off-ramp
- **Multiple Exit Points**: Spend, swap, or cash out - users control how they use their funds
- **Real-World Ready**: Walk into a store and pay with Adam stablecoins, knowing you can always convert to cash

## Quick Start

```bash
# 1. Backend
cd adam-backend
pnpm install && pnpm start:dev

# 2. Deploy contracts (choose your chain)

# For Starknet:
cd adam-contract/starknet
./scripts/deploy.sh --usdc $USDC_ADDRESS --owner $DEPLOYER_ADDRESS --setup-roles

# For Stacks:
cd adam-contract/stacks
./scripts/deploy-complete.sh testnet
pnpm run init

# 3. Configure backend with contract addresses
# Edit adam-backend/.env with addresses for both chains

# 4. Frontend
cd adam-app
pnpm install && pnpm dev
# Use chain selector in UI to switch between Starknet and Stacks
```

## Project Structure

```
adam-protocol/
├── adam-app/              # Next.js frontend with multichain support
├── adam-backend/          # NestJS API with chain-agnostic endpoints
└── adam-contract/         # Smart contracts
    ├── starknet/          # Cairo contracts for Starknet
    └── stacks/            # Clarity contracts for Stacks
```

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Scarb (Cairo) - for Starknet contracts
- Clarinet 2.0+ - for Stacks contracts

## Documentation

- [MULTICHAIN_WALLET_ARCHITECTURE.md](MULTICHAIN_WALLET_ARCHITECTURE.md) - Multichain architecture overview
- [PRIVACY_README.md](../PRIVACY_README.md) - Privacy features guide (Starknet only)
- [PRIVACY_IMPLEMENTATION.md](../PRIVACY_IMPLEMENTATION.md) - Privacy implementation plan (Starknet only)
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture & detailed flows
- [adam-backend/README.md](../adam-backend/README.md) - Backend API documentation
- [adam-contract/starknet/README.md](../adam-contract/starknet/README.md) - Starknet contracts (with privacy)
- [adam-contract/stacks/README.md](../adam-contract/stacks/README.md) - Stacks contracts (transparent)
