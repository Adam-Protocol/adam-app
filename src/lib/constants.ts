// Contract addresses from environment variables
export const CONTRACTS = {
  ADUSD: process.env.NEXT_PUBLIC_ADUSD_ADDRESS || "",
  ADNGN: process.env.NEXT_PUBLIC_ADNGN_ADDRESS || "",
  ADKES: process.env.NEXT_PUBLIC_ADKES_ADDRESS || "",
  ADGHS: process.env.NEXT_PUBLIC_ADGHS_ADDRESS || "",
  ADZAR: process.env.NEXT_PUBLIC_ADZAR_ADDRESS || "",
  ADAM_SWAP: process.env.NEXT_PUBLIC_ADAM_SWAP_ADDRESS || "",
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
} as const;

// Chain configuration
export const CHAIN_CONFIG = {
  CHAIN_ID: process.env.NEXT_PUBLIC_STARKNET_CHAIN_ID || "SN_SEPOLIA",
  NETWORK: "sepolia",
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  TIMEOUT: 30000,
} as const;

// Token metadata
export const TOKENS = {
  ADUSD: {
    symbol: "ADUSD",
    name: "Adam USD",
    decimals: 18,
    address: CONTRACTS.ADUSD,
  },
  ADNGN: {
    symbol: "ADNGN",
    name: "Adam NGN",
    decimals: 18,
    address: CONTRACTS.ADNGN,
  },
  ADKES: {
    symbol: "ADKES",
    name: "Adam KES",
    decimals: 18,
    address: CONTRACTS.ADKES,
  },
  ADGHS: {
    symbol: "ADGHS",
    name: "Adam GHS",
    decimals: 18,
    address: CONTRACTS.ADGHS,
  },
  ADZAR: {
    symbol: "ADZAR",
    name: "Adam ZAR",
    decimals: 18,
    address: CONTRACTS.ADZAR,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: CONTRACTS.USDC,
  },
} as const;

// Supported currencies for offramp
export const CURRENCIES = {
  USD: "USD",
  NGN: "NGN",
  KES: "KES",
  GHS: "GHS",
  ZAR: "ZAR",
} as const;

// Transaction types
export const TX_TYPES = {
  BUY: "buy",
  SELL: "sell",
  SWAP: "swap",
} as const;

// Validation
export const VALIDATION = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000000,
  SLIPPAGE_TOLERANCE: 0.005, // 0.5%
} as const;
