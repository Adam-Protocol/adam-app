/**
 * Multi-Chain Context Provider
 * 
 * This context manages wallet connections across multiple blockchains with
 * complete separation of concerns. Each chain has its own isolated adapter
 * that handles wallet-specific logic without interfering with other chains.
 * 
 * Architecture:
 * - Starknet: Uses @starknet-react/core hooks + starknetkit for wallet UI
 * - Stacks: Uses @stacks/connect with localStorage session management
 * - Each adapter is completely independent with no shared state
 * 
 * Separation of Concerns:
 * 1. Starknet adapter is created via useMemo and depends on Starknet hooks
 * 2. Stacks adapter is created once on mount and manages its own state
 * 3. Only the active chain's adapter is used for operations
 * 4. Switching chains doesn't affect the other chain's connection state
 * 
 * Adding New Chains:
 * 1. Create a new adapter implementing ChainAdapter interface
 * 2. Add chain type to ChainType enum
 * 3. Initialize adapter in this provider
 * 4. Add to adapterRegistry
 * 
 * No business logic needs to change - the adapter pattern handles everything.
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useStarknetkitConnectModal, StarknetkitConnector } from "starknetkit";
import { Connector } from "@starknet-react/core";
import {
  ChainType,
  ChainAdapter,
  WalletAccount,
  ChainContextValue,
  TransactionIntent,
  TransactionResult,
} from "@/lib/chains/types";
import { StarknetAdapter } from "@/lib/chains/adapters/starknet";
import { StacksAdapter } from "@/lib/chains/adapters/stacks";
import { SWAP_CONTRACT_ADDRESSES } from "@/lib/chains/config";

const ChainContext = createContext<ChainContextValue | undefined>(undefined);

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [currentChain, setCurrentChain] = useState<ChainType>(
    ChainType.STARKNET,
  );
  
  // Stacks adapter state - completely isolated from Starknet
  const [stacksAdapter, setStacksAdapter] = useState<StacksAdapter | null>(null);
  const [stacksAccount, setStacksAccount] = useState<WalletAccount | null>(null);

  // Starknet hooks - only used when currentChain is STARKNET
  const starknetAccount = useAccount();
  const { connect: starknetConnect, connectors } = useConnect();
  const { disconnectAsync: starknetDisconnect } = useDisconnect();
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as unknown as StarknetkitConnector[],
  });

  // Initialize Stacks adapter once on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !stacksAdapter) {
      const adapter = new StacksAdapter();
      
      // Subscribe to account changes to trigger re-renders
      adapter.setAccountChangeListener((account) => {
        setStacksAccount(account);
      });

      // Check if there's an existing session
      const existingAccount = adapter.getAccount();
      if (existingAccount) {
        setStacksAccount(existingAccount);
      }
      
      setStacksAdapter(adapter);
    }
  }, [stacksAdapter]);

  // Create Starknet adapter - memoized to prevent unnecessary recreations
  const starknetAdapter = useMemo(() => {
    const connectFn = async () => {
      try {
        const { connector } = await starknetkitConnectModal();
        if (!connector) return null;
        await starknetConnect({ connector: connector as Connector });
        return connector;
      } catch (error) {
        console.error("Starknet connection error:", error);
        return null;
      }
    };

    return new StarknetAdapter(connectFn, starknetDisconnect, starknetAccount);
  }, [
    starknetkitConnectModal,
    starknetConnect,
    starknetDisconnect,
    starknetAccount,
  ]);

  /**
   * Adapter registry with complete separation of concerns:
   * - Each chain has its own isolated adapter instance
   * - Starknet uses React hooks from @starknet-react/core
   * - Stacks uses @stacks/connect with localStorage session management
   * - No cross-chain interference or shared state
   */
  const adapterRegistry = useMemo<Partial<Record<ChainType, ChainAdapter>>>(
    () => ({
      [ChainType.STARKNET]: starknetAdapter,
      [ChainType.STACKS]: stacksAdapter ?? undefined,
    }),
    [starknetAdapter, stacksAdapter],
  );

  // Get the active adapter based on current chain selection
  const adapter = adapterRegistry[currentChain] ?? null;
  const account = adapter?.getAccount() ?? null;
  const isConnected = adapter?.isConnected() ?? false;

  const connect = async (): Promise<WalletAccount | null> => {
    if (!adapter) return null;
    return adapter.connect();
  };

  const disconnect = async (): Promise<void> => {
    if (!adapter) return;
    await adapter.disconnect();
  };

  /**
   * Chain-agnostic transaction executor.
   * Handles the full flow: approval (if needed) → signing → result.
   * Components call this with a TransactionIntent and never touch chain logic.
   */
  const executeIntent = async (
    intent: TransactionIntent,
  ): Promise<TransactionResult> => {
    if (!adapter || !account) {
      throw new Error("Wallet not connected");
    }

    const contractAddress = SWAP_CONTRACT_ADDRESSES[currentChain];

    // Step 1: Approve token spend if the chain requires it (e.g. Starknet ERC-20)
    if (adapter.requiresApproval(intent)) {
      const tokenInAddress =
        (await import("@/lib/chains/config")).MULTI_CHAIN_TOKENS[
          intent.tokenIn.toUpperCase()
        ]?.addresses[currentChain] ?? "";

      await adapter.approveToken(tokenInAddress, contractAddress, intent.amountIn);
    }

    // Step 2: Build chain-specific params and execute
    const params = adapter.buildTransactionArgs(intent, contractAddress);
    return adapter.executeTransaction(params);
  };

  // Persist chain selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adam-selected-chain");
      if (saved && Object.values(ChainType).includes(saved as ChainType)) {
        setCurrentChain(saved as ChainType);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adam-selected-chain", currentChain);
    }
  }, [currentChain]);

  const value: ChainContextValue = {
    currentChain,
    setCurrentChain,
    adapter,
    account,
    isConnected,
    connect,
    disconnect,
    executeIntent,
  };

  return (
    <ChainContext.Provider value={value}>{children}</ChainContext.Provider>
  );
}

export function useChain() {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error("useChain must be used within a ChainProvider");
  }
  return context;
}
