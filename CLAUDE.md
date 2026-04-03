# adam-app — Claude Context

## What This Is

Next.js 16 frontend for Adam Protocol. Provides a unified UI for:
- **Buying** stablecoins (ADUSD / ADNGN) with USDC
- **Swapping** between ADUSD ↔ ADNGN
- **Selling** stablecoins for fiat (bank transfer via Flutterwave off-ramp)
- **Activity history** per wallet

Supports both **Starknet** (ArgentX / Braavos via starknetkit) and **Stacks** (Hiro wallet via @stacks/connect) through a chain-selector in the UI.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 16 + Turbopack | Framework & bundler |
| React 19 | UI |
| TypeScript 5 | Types |
| TailwindCSS 3 | Styling |
| HeroUI (`@heroui/react`) | Component library |
| Framer Motion | Animations |
| `@tanstack/react-query` 5 | Server state / caching |
| Axios | HTTP client |
| `react-hook-form` | Form state |
| starknet.js 9 + starknetkit 3 | Starknet wallet & contracts |
| `@stacks/connect` + `@stacks/transactions` | Stacks wallet & transactions |
| sonner | Toast notifications |
| Recharts | Charts (activity page) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (fonts, providers)
│   ├── providers.tsx       # QueryClient, theme, chain providers
│   ├── globals.css         # Tailwind base styles
│   ├── page.tsx            # Main dashboard / single-page app
│   └── app/               # Sub-routes (if any)
├── components/             # Reusable UI components
│   ├── ConnectionStatus    # Backend health display
│   ├── ErrorBoundary       # React error boundary
│   ├── LoadingSpinner      # Async state indicator
│   └── WalletGuard         # Auth gate (requires wallet connection)
├── contexts/               # React context providers
│   └── ChainContext        # Active chain (starknet | stacks)
├── hooks/                  # Data & business logic hooks
│   ├── useMultiChainBuy    # Buy flow (delegates to chain adapter)
│   ├── useMultiChainSell   # Sell flow
│   ├── useMultiChainSwap   # Swap flow
│   ├── useMultiChainWallet # Unified wallet state
│   ├── useBuyRate          # USDC → ADUSD rate + decimal scaling
│   ├── useCommitment       # Pedersen commitment generation (Starknet)
│   ├── useTransactionIntent# Pre-flight transaction preview
│   ├── useTokenApprove     # ERC20 approve before buy/swap
│   ├── useApi              # Configured Axios instance + React Query
│   ├── useBalances         # Token balances per chain
│   ├── useBanks            # Flutterwave bank list
│   └── useWallet           # Low-level wallet adapter
└── lib/
    ├── api.ts              # Axios base URL, interceptors
    ├── constants.ts        # Contract addresses, token configs
    ├── token.ts            # Token metadata, decimal helpers
    ├── utils.ts            # Format helpers (amounts, addresses)
    ├── stacks-provider-guard.ts  # Stacks wallet network validation
    └── chains/             # Chain-specific adapter implementations
```

---

## Key Conventions

### Decimal Handling
**All token amounts are in base units (scaled by 10^decimals).**

- `ADUSD` / `ADNGN` → **6 decimals** (`1 ADUSD = 1_000_000`)
- USDC on Starknet → **6 decimals**

Use helpers from `src/lib/token.ts` to scale/unscale. Never hard-code `1e18` or `1e6` inline — use the token's `decimals` config from `constants.ts`.

### Multi-Chain Pattern
Chain-specific logic lives in `src/lib/chains/`. The `useMultiChain*` hooks select the right implementation based on `ChainContext`. Follow this pattern when adding new chain operations:
1. Add a chain-specific function in `src/lib/chains/starknet.ts` or `src/lib/chains/stacks.ts`.
2. Wrap with a `useMultiChain*` hook that reads `ChainContext`.
3. Use the hook in components — never import chain SDKs directly in UI components.

### State Management
- All API/server state → **React Query** (`@tanstack/react-query`).
- Refetch intervals: `rate` (30 s), `health` (10 s), `activity` (on demand).
- Wallet/chain state → `ChainContext`.
- Form state → `react-hook-form`.

### Privacy (Starknet Only)
When processing a buy/swap on Starknet:
1. Generate a Pedersen commitment **client-side** via `useCommitment`.
2. Store the secret in `sessionStorage` (never in state or sent to the API).
3. Send only the `commitment` hash to the backend.

### Error Handling
- Use `sonner` toasts for user-facing errors.
- Wrap async mutations in try/catch and call `toast.error`.
- Fatal rendering errors → `ErrorBoundary` component (wraps page content).

---

## Dev Commands

```bash
pnpm dev        # Start with Turbopack on :3000
pnpm build      # Production build
pnpm lint       # ESLint
pnpm format     # Prettier
```

---

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STARKNET_ADUSD_ADDRESS=0x...
NEXT_PUBLIC_STARKNET_ADNGN_ADDRESS=0x...
NEXT_PUBLIC_STARKNET_SWAP_ADDRESS=0x...
NEXT_PUBLIC_STARKNET_USDC_ADDRESS=0x...
NEXT_PUBLIC_STACKS_ADUSD_ADDRESS=ST...
NEXT_PUBLIC_STACKS_SWAP_ADDRESS=ST...
```

All public vars must be prefixed `NEXT_PUBLIC_`. Never expose private keys here.

---

## Adding a New Feature Checklist

- [ ] Add logic to the appropriate chain adapter in `src/lib/chains/`
- [ ] Create or update the `useMultiChain*` hook
- [ ] If new API endpoint: add to `src/lib/api.ts` and wrap in a `useApi` query/mutation
- [ ] Handle loading + error states with spinner / toast
- [ ] Ensure decimal scaling is correct using `src/lib/token.ts` helpers
- [ ] Run `pnpm lint && pnpm format` before committing
