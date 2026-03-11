"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useStarknetkitConnectModal, StarknetkitConnector } from "starknetkit";
import { Connector } from "@starknet-react/core";
import {
  ChainType,
  ChainAdapter,
  WalletAccount,
  ChainContextValue,
} from "@/lib/chains/types";
import { StarknetAdapter } from "@/lib/chains/adapters/starknet";
import { StacksAdapter } from "@/lib/chains/adapters/stacks";

const ChainContext = createContext<ChainContextValue | undefined>(undefined);

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [currentChain, setCurrentChain] = useState<ChainType>(ChainType.STARKNET);
  const [stacksAdapter, setStacksAdapter] = useState<StacksAdapter | null>(null);

  // Starknet hooks
  const starknetAccount = useAccount();
  const { connect: starknetConnect, connectors } = useConnect();
  const { disconnect: starknetDisconnect } = useDisconnect();
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

    return new StarknetAdapter(
      connectFn,
      starknetDisconnect,
      starknetAccount,
    );
  }, [starknetkitConnectModal, starknetConnect, starknetDisconnect, starknetAccount]);

  // Get current adapter based on selected chain
  const adapter = currentChain === ChainType.STARKNET ? starknetAdapter : stacksAdapter;

  // Get current account
  const account = adapter?.getAccount() || null;
  const isConnected = adapter?.isConnected() || false;

  // Connect function
  const connect = async (): Promise<WalletAccount | null> => {
    if (!adapter) return null;
    return adapter.connect();
  };

  // Disconnect function
  const disconnect = async (): Promise<void> => {
    if (!adapter) return;
    await adapter.disconnect();
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
  };

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

export function useChain() {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error("useChain must be used within a ChainProvider");
  }
  return context;
}
