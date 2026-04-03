import { useState } from "react";
import { useChain } from "@/contexts/ChainContext";
// The generic ChainContext executeIntent method handles the actual ABI bridging.

/**
 * Multi-chain sell token hook
 * Supports selling tokens on both Starknet and Stacks
 */
export function useMultiChainSell() {
    const { executeIntent, currentChain } = useChain();
    const [isExecuting, setIsExecuting] = useState(false);

    const executeSell = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amount: bigint,
        nullifier: string,
        commitment: string,
    ): Promise<string> => {
        if (!executeIntent) {
            throw new Error("Wallet not connected");
        }

        setIsExecuting(true);
        try {
            const result = await executeIntent({
                action: "sell",
                tokenIn: tokenIn.toUpperCase(),
                amountIn: amount,
                tokenOut: "FIAT", // Logical representation
                nullifier,
                commitment,
            });

            return result.hash;
        } finally {
            setIsExecuting(false);
        }
    };

    return { executeSell, isExecuting, currentChain };
}
