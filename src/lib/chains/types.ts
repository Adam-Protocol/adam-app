// Chain types and interfaces for multi-chain support

export enum ChainType {
  STARKNET = "starknet",
  STACKS = "stacks",
}

export interface ChainConfig {
  id: ChainType;
  name: string;
  displayName: string;
  icon: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl?: string;
  explorerUrl: string;
}

export interface WalletAccount {
  address: string;
  publicKey?: string;
  chainType: ChainType;
}

export interface TransactionResult {
  hash: string;
  chainType: ChainType;
}

/**
 * Chain-agnostic description of what the user intends to do.
 * Each adapter translates this into chain-specific transaction params.
 */
export interface TransactionIntent {
  action: "buy" | "sell" | "swap";
  /** Canonical token symbol, e.g. 'USDC' */
  tokenIn: string;
  amountIn: bigint;
  /** Canonical token symbol, e.g. 'ADNGN' */
  tokenOut: string;
  commitment?: string;
  nullifier?: string;
  minAmountOut?: bigint;
}

export interface ChainAdapter {
  chainType: ChainType;
  connect(): Promise<WalletAccount | null>;
  disconnect(): Promise<void>;
  getAccount(): WalletAccount | null;
  isConnected(): boolean;
  executeTransaction(params: TransactionParams): Promise<TransactionResult>;
  getBalance(address: string, tokenAddress?: string): Promise<bigint>;
  approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint,
  ): Promise<TransactionResult>;
  /**
   * Convert a chain-agnostic TransactionIntent into chain-specific
   * TransactionParams. All encoding differences live here.
   */
  buildTransactionArgs(
    intent: TransactionIntent,
    contractAddress: string,
  ): TransactionParams;
  /**
   * Whether this chain requires an explicit token approval step
   * before executing a transaction (e.g. ERC20 approve on Starknet).
   */
  requiresApproval(intent: TransactionIntent): boolean;
}

export interface TransactionParams {
  contractAddress: string;
  functionName: string;
  args: any[];
  abi?: any[];
}

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number | {
    [ChainType.STARKNET]?: number;
    [ChainType.STACKS]?: number;
  };
  addresses: {
    [ChainType.STARKNET]?: string;
    [ChainType.STACKS]?: string;
  };
}

export interface ChainContextValue {
  currentChain: ChainType;
  setCurrentChain: (chain: ChainType) => void;
  adapter: ChainAdapter | null;
  account: WalletAccount | null;
  isConnected: boolean;
  connect: () => Promise<WalletAccount | null>;
  disconnect: () => Promise<void>;
  /** Execute a chain-agnostic intent: handles approval + signing + backend notification */
  executeIntent: (intent: TransactionIntent) => Promise<TransactionResult>;
}
