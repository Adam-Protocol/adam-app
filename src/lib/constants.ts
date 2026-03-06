// Contract addresses from environment variables
export const CONTRACTS = {
  ADUSD: process.env.NEXT_PUBLIC_ADUSD_ADDRESS || '',
  ADNGN: process.env.NEXT_PUBLIC_ADNGN_ADDRESS || '',
  ADAM_SWAP: process.env.NEXT_PUBLIC_ADAM_SWAP_ADDRESS || '',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
} as const;

// Chain configuration
export const CHAIN_CONFIG = {
  CHAIN_ID: process.env.NEXT_PUBLIC_STARKNET_CHAIN_ID || 'SN_SEPOLIA',
  NETWORK: 'sepolia',
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  TIMEOUT: 30000,
} as const;

// Token metadata
export const TOKENS = {
  ADUSD: {
    symbol: 'ADUSD',
    name: 'Adam USD',
    decimals: 18,
    address: CONTRACTS.ADUSD,
  },
  ADNGN: {
    symbol: 'ADNGN',
    name: 'Adam NGN',
    decimals: 18,
    address: CONTRACTS.ADNGN,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: CONTRACTS.USDC,
  },
} as const;

// Supported currencies for offramp
export const CURRENCIES = {
  USD: 'USD',
  NGN: 'NGN',
} as const;

// Transaction types
export const TX_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
  SWAP: 'swap',
} as const;

// Validation
export const VALIDATION = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000000,
  SLIPPAGE_TOLERANCE: 0.005, // 0.5%
} as const;
