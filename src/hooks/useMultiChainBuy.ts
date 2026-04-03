import { useState } from "react";
import { useChain } from "@/contexts/ChainContext";
// The generic ChainContext executeIntent method handles the actual ABI bridging.

/**
 * Multi-chain buy token hook
 * Supports buying tokens on both Starknet and Stacks
 */
export function useMultiChainBuy() {
  const { executeIntent, currentChain } = useChain();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeBuy = async (
    amountIn: bigint,
    tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    commitment: string,
  ): Promise<string> => {
    if (!executeIntent) {
      throw new Error("Wallet not connected");
    }

    setIsExecuting(true);
    try {
      const result = await executeIntent({
        action: "buy",
        tokenIn: "USDC",
        amountIn,
        tokenOut: tokenOut.toUpperCase(),
        commitment,
      });

      return result.hash;
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeBuy, isExecuting, currentChain };
}
