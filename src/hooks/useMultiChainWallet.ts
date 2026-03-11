import { useChain } from "@/contexts/ChainContext";
import { useMemo } from "react";

/**
 * Multi-chain wallet hook that provides a unified interface
 * for wallet operations across different blockchains.
 */
export function useMultiChainWallet() {
  const { currentChain, adapter, account, isConnected, connect, disconnect } =
    useChain();

  const shortAddress = useMemo(() => {
    if (!account?.address) return null;
    const addr = account.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [account]);

  return {
    // Chain info
    currentChain,
    chainType: currentChain,

    // Account info
    address: account?.address,
    shortAddress,
    account,

    // Connection state
    isConnected,

    // Actions
    connectWallet: connect,
    disconnect,

    // Adapter for advanced operations
    adapter,
  };
}
