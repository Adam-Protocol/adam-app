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
  decimals: number;
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
}
