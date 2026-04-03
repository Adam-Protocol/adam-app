import { useState } from "react";
import { useChain } from "@/contexts/ChainContext";
// The generic ChainContext executeIntent method handles the actual ABI bridging.

/**
 * Multi-chain swap token hook
 * Supports swapping tokens on both Starknet and Stacks
 */
export function useMultiChainSwap() {
    const { executeIntent, currentChain } = useChain();
    const [isExecuting, setIsExecuting] = useState(false);

    const executeSwap = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amountIn: bigint,
        tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        minAmountOut: bigint,
        nullifier: string,
        proof: string[],
        commitment: string,
    ): Promise<string> => {
        if (!executeIntent) {
            throw new Error("Wallet not connected");
        }

        setIsExecuting(true);
        try {
            const result = await executeIntent({
                action: "swap",
                tokenIn: tokenIn.toUpperCase(),
                amountIn,
                tokenOut: tokenOut.toUpperCase(),
                minAmountOut,
                nullifier,
                commitment,
            });

            return result.hash;
        } finally {
            setIsExecuting(false);
        }
    };

    return { executeSwap, isExecuting, currentChain };
}
