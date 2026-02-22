# Adam Protocol Frontend

Privacy-first stablecoin dApp on Starknet.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/app` | Dashboard — balances, live rate, quick actions |
| `/app/buy` | Mint ADUSD or ADNGN with USDC |
| `/app/sell` | Burn tokens and offramp to bank account |
| `/app/swap` | Swap ADUSD ↔ ADNGN at live rates |
| `/app/activity` | Full transaction history with filters |

## Tech Stack

- **Next.js 16.1.6** — App Router, Turbopack
- **@heroui/react** — UI components
- **framer-motion** — Animations
- **starknetkit** — Wallet connect (Argent X, Braavos)
- **@tanstack/react-query** — Data fetching
- **tailwindcss** — Styling
- **sonner** — Toasts

## Development

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Privacy

All transaction amounts are computed client-side using Pedersen hash. No amount ever leaves the browser or gets stored on-chain or in the backend.
