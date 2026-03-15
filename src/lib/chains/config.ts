import { ChainConfig, ChainType, TokenInfo } from "./types";

export const CHAIN_CONFIGS: Record<ChainType, ChainConfig> = {
  [ChainType.STARKNET]: {
    id: ChainType.STARKNET,
    name: "starknet",
    displayName: "Starknet",
    icon: "⚡",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
    explorerUrl: "https://sepolia.voyager.online",
  },
  [ChainType.STACKS]: {
    id: ChainType.STACKS,
    name: "stacks",
    displayName: "Stacks",
    icon: "🔷",
    nativeCurrency: {
      name: "Stacks",
      symbol: "STX",
      decimals: 6,
    },
    explorerUrl: "https://explorer.hiro.so",
  },
};

// Token configurations with multi-chain addresses
export const MULTI_CHAIN_TOKENS: Record<string, TokenInfo> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addresses: {
      [ChainType.STARKNET]: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
      [ChainType.STACKS]: process.env.NEXT_PUBLIC_STACKS_USDCx_ADDRESS || "",
    },
  },
  ADUSD: {
    symbol: "ADUSD",
    name: "Adam USD",
    decimals: {
      [ChainType.STARKNET]: 18,
      [ChainType.STACKS]: 6,
    },
    addresses: {
      [ChainType.STARKNET]: process.env.NEXT_PUBLIC_ADUSD_ADDRESS || "",
      [ChainType.STACKS]: process.env.NEXT_PUBLIC_STACKS_ADUSD_ADDRESS || "",
    },
  },
  ADNGN: {
    symbol: "ADNGN",
    name: "Adam NGN",
    decimals: {
      [ChainType.STARKNET]: 18,
      [ChainType.STACKS]: 6,
    },
    addresses: {
      [ChainType.STARKNET]: process.env.NEXT_PUBLIC_ADNGN_ADDRESS || "",
      [ChainType.STACKS]: process.env.NEXT_PUBLIC_STACKS_ADNGN_ADDRESS || "",
    },
  },
  ADKES: {
    symbol: "ADKES",
    name: "Adam KES",
    decimals: {
      [ChainType.STARKNET]: 18,
      [ChainType.STACKS]: 6,
    },
    addresses: {
      [ChainType.STARKNET]: process.env.NEXT_PUBLIC_ADKES_ADDRESS || "",
      [ChainType.STACKS]: process.env.NEXT_PUBLIC_STACKS_ADKES_ADDRESS || "",
    },
  },
  ADGHS: {
    symbol: "ADGHS",
    name: "Adam GHS",
    decimals: {
      [ChainType.STARKNET]: 18,
      [ChainType.STACKS]: 6,
    },
    addresses: {
      [ChainType.STARKNET]: process.env.NEXT_PUBLIC_ADGHS_ADDRESS || "",
      [ChainType.STACKS]: process.env.NEXT_PUBLIC_STACKS_ADGHS_ADDRESS || "",
    },
  },
  ADZAR: {
    symbol: "ADZAR",
    name: "Adam ZAR",
    decimals: {
      [ChainType.STARKNET]: 18,
      [ChainType.STACKS]: 6,
    },
    addresses: {
      [ChainType.STARKNET]: process.env.NEXT_PUBLIC_ADZAR_ADDRESS || "",
      [ChainType.STACKS]: process.env.NEXT_PUBLIC_STACKS_ADZAR_ADDRESS || "",
    },
  },
};

// Contract addresses for each chain
export const SWAP_CONTRACT_ADDRESSES: Record<ChainType, string> = {
  [ChainType.STARKNET]: process.env.NEXT_PUBLIC_ADAM_SWAP_ADDRESS || "",
  [ChainType.STACKS]: process.env.NEXT_PUBLIC_STACKS_ADAM_SWAP_ADDRESS || "",
};

/**
 * Get the decimals for a token on a specific chain
 */
export function getTokenDecimals(tokenSymbol: string, chain: ChainType): number {
  const token = MULTI_CHAIN_TOKENS[tokenSymbol];
  if (!token) return 18; // default fallback
  
  if (typeof token.decimals === 'number') {
    return token.decimals;
  }
  
  return token.decimals[chain] || 18;
}
