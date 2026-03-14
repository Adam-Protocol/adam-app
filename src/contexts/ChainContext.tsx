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
  const [stacksAdapter, setStacksAdapter] = useState<StacksAdapter | null>(
    null,
  );

  // Starknet hooks
  const starknetAccount = useAccount();
  const { connect: starknetConnect, connectors } = useConnect();
  const { disconnectAsync: starknetDisconnect } = useDisconnect();
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
  });

  // Initialize Stacks adapter
  useEffect(() => {
    if (typeof window !== "undefined") {
      setStacksAdapter(new StacksAdapter());
    }
  }, []);

  // Create Starknet adapter
  const starknetAdapter = useMemo(() => {
    const connectFn = async () => {
      const { connector } = await starknetkitConnectModal();
      if (!connector) return null;
      await starknetConnect({ connector: connector as Connector });
      return connector;
    };

    return new StarknetAdapter(connectFn, starknetDisconnect, starknetAccount);
  }, [
    starknetkitConnectModal,
    starknetConnect,
    starknetDisconnect,
    starknetAccount,
  ]);

  /**
   * Registry map — adding a new chain is a one-line addition here.
   * No if/else chain checks anywhere in the business layer.
   */
  const adapterRegistry = useMemo<Partial<Record<ChainType, ChainAdapter>>>(
    () => ({
      [ChainType.STARKNET]: starknetAdapter,
      [ChainType.STACKS]: stacksAdapter ?? undefined,
    }),
    [starknetAdapter, stacksAdapter],
  );

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
