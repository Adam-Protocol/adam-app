# Multi-Chain Wallet Architecture

## Overview

This document explains the separation of concerns in the multi-chain wallet implementation for Adam Protocol, ensuring Stacks and Starknet wallet connections don't interfere with each other.

## Architecture Principles

### 1. Adapter Pattern
Each blockchain has its own adapter implementing the `ChainAdapter` interface. This ensures:
- Complete isolation between chains
- No shared state or dependencies
- Easy addition of new chains

### 2. Independent State Management
- **Starknet**: Uses React hooks from `@starknet-react/core`
- **Stacks**: Uses localStorage for session persistence
- Each adapter manages its own connection state

### 3. Single Active Chain
Only the currently selected chain's adapter is active at any time, preventing conflicts.

## File Structure

```
src/
├── lib/
│   ├── chains/
│   │   ├── adapters/
│   │   │   ├── starknet.ts      # Starknet wallet adapter
│   │   │   └── stacks.ts        # Stacks wallet adapter
│   │   ├── config.ts            # Chain configurations
│   │   └── types.ts             # Shared interfaces
│   └── stacks-provider-guard.ts # HMR protection for Stacks
├── contexts/
│   └── ChainContext.tsx         # Multi-chain context provider
└── hooks/
    └── useMultiChainWallet.ts   # Unified wallet hook
```

## Stacks Wallet Implementation

### Key Features

1. **Modern API Usage**
   - Uses `@stacks/connect` v8+ API
   - Methods: `connect()`, `request()`, `disconnect()`
   - No deprecated `openContractCall()` or network objects

2. **Session Management**
   - Sessions stored in localStorage under `adam-stacks-session`
   - Automatic restoration on page reload
   - 24-hour expiration for security

3. **HMR Protection**
   - Guard prevents "Cannot redefine property: StacksProvider" errors
   - Intercepts `Object.defineProperty` and `Object.defineProperties`
   - Initialized before React renders

### Connection Flow

```typescript
// 1. Check if already connected
if (isConnected()) {
  // Try to get cached data from localStorage
  const userData = getLocalStorage();
  if (userData?.addresses?.stx?.[0]) {
    return userData.addresses.stx[0];
  }
  
  // Fallback to request
  const accounts = await request('stx_getAccounts');
  return accounts.addresses[0];
}

// 2. Initiate new connection
const response = await connect({
  appDetails: {
    name: "Adam Protocol",
    icon: "/fav-mobile-icon.png",
  },
});

// 3. Persist session
persistSession(response.addresses.stx[0]);
```

### Transaction Execution

```typescript
// Convert args to Clarity values
const clarityArgs = params.args.map(arg => {
  if (typeof arg === "string") {
    if (arg.includes(".")) return Cl.contractPrincipal(addr, name);
    if (arg.startsWith("ST") || arg.startsWith("SP")) return Cl.standardPrincipal(arg);
    return Cl.stringUtf8(arg);
  }
  if (typeof arg === "bigint" || typeof arg === "number") return Cl.uint(arg);
  if (arg === null) return Cl.none();
  return arg;
});

// Execute via request API
const response = await request("stx_callContract", {
  contractAddress,
  contractName,
  functionName: params.functionName,
  functionArgs: clarityArgs,
});
```

## Starknet Wallet Implementation

### Key Features

1. **React Hooks Integration**
   - Uses `@starknet-react/core` hooks
   - `useAccount()`, `useConnect()`, `useDisconnect()`
   - State managed by React context

2. **Starknetkit UI**
   - Modal for wallet selection
   - Supports Argent X and Braavos
   - Auto-connect on page load

3. **No localStorage**
   - State managed entirely by React hooks
   - Connection persisted by wallet extension

### Connection Flow

```typescript
// 1. Open wallet selection modal
const { connector } = await starknetkitConnectModal();

// 2. Connect via Starknet React
await starknetConnect({ connector });

// 3. Account state automatically updated via useAccount()
```

## Separation of Concerns

### ChainContext Provider

```typescript
// Starknet: React hooks (always active for reactivity)
const starknetAccount = useAccount();
const { connect: starknetConnect } = useConnect();

// Stacks: Standalone adapter (initialized once)
const [stacksAdapter, setStacksAdapter] = useState<StacksAdapter | null>(null);

useEffect(() => {
  const adapter = new StacksAdapter();
  adapter.setAccountChangeListener(setStacksAccount);
  setStacksAdapter(adapter);
}, []);

// Registry: Only active chain's adapter is used
const adapter = adapterRegistry[currentChain];
```

### No Cross-Chain Interference

1. **Starknet hooks don't affect Stacks**
   - Hooks run but their state is ignored when Stacks is active
   - Only the active adapter's state is exposed

2. **Stacks localStorage doesn't affect Starknet**
   - Different storage keys
   - Starknet uses wallet extension storage

3. **Independent connection states**
   - Can be connected to both chains simultaneously
   - Switching chains doesn't disconnect the other

## HMR Protection

### The Problem

During Next.js hot module reloading:
1. Leather wallet extension injects `StacksProvider` on page load
2. HMR reloads without full page refresh
3. Extension tries to inject again
4. `Object.defineProperty` throws because property exists

### The Solution

```typescript
// Override Object.defineProperty
Object.defineProperty = function (obj, prop, descriptor) {
  if (obj === window && prop === 'StacksProvider') {
    if ('StacksProvider' in window) {
      console.log('Prevented redefinition');
      return obj;
    }
    descriptor.configurable = true; // Allow future changes
  }
  return originalDefineProperty.call(this, obj, prop, descriptor);
};

// Override Object.defineProperties (batch definitions)
Object.defineProperties = function (obj, props) {
  if (obj === window && props.StacksProvider) {
    if ('StacksProvider' in window) {
      const { StacksProvider, ...otherProps } = props;
      return originalDefineProperties.call(this, obj, otherProps);
    }
    props.StacksProvider.configurable = true;
  }
  return originalDefineProperties.call(this, obj, props);
};
```

## Adding New Chains

To add a new blockchain:

1. **Create adapter** implementing `ChainAdapter`
2. **Add to ChainType enum** in `types.ts`
3. **Initialize in ChainContext**
4. **Add to adapter registry**

No changes needed in business logic - the adapter pattern handles everything.

## Testing Checklist

- [ ] Connect Stacks wallet
- [ ] Switch to Starknet and connect
- [ ] Switch back to Stacks - should still be connected
- [ ] Reload page - both connections should persist
- [ ] Disconnect Stacks - Starknet should remain connected
- [ ] HMR should not throw StacksProvider errors
- [ ] Execute transaction on Stacks
- [ ] Execute transaction on Starknet
- [ ] Check balances on both chains

## References

- [Stacks Connect Docs](https://docs.stacks.co/build/stacks-connect/connect-wallet)
- [Stacks Connect API Reference](https://docs.stacks.co/reference/stacks.js/stacks-connect)
- [Starknet React Docs](https://starknet-react.com/)
- [Starknetkit Docs](https://www.starknetkit.com/)
