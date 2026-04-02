import { useState } from "react";
import { useChain } from "@/contexts/ChainContext";
import { uint256 } from "starknet";
import {
    SWAP_CONTRACT_ADDRESSES,
    MULTI_CHAIN_TOKENS,
} from "@/lib/chains/config";
import { ChainType } from "@/lib/chains/types";

// Starknet ABI for swap function
const STARKNET_SWAP_ABI = [
    {
        name: "swap",
        type: "function",
        inputs: [
            {
                name: "token_in",
                type: "core::starknet::contract_address::ContractAddress",
            },
            { name: "amount_in", type: "core::integer::u256" },
            {
                name: "token_out",
                type: "core::starknet::contract_address::ContractAddress",
            },
            { name: "min_amount_out", type: "core::integer::u256" },
            { name: "commitment", type: "core::felt252" },
        ],
        outputs: [],
        state_mutability: "external",
    },
];

/**
 * Multi-chain swap token hook
 * Supports swapping tokens on both Starknet and Stacks
 */
export function useMultiChainSwap() {
    const { adapter, currentChain, account } = useChain();
    const [isExecuting, setIsExecuting] = useState(false);

    const executeSwap = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amountIn: bigint,
        tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        minAmountOut: bigint,
        commitment: string,
    ): Promise<string> => {
        if (!adapter || !account) {
            throw new Error("Wallet not connected");
        }

        setIsExecuting(true);
        try {
            const swapContractAddress = SWAP_CONTRACT_ADDRESSES[currentChain];

            if (currentChain === ChainType.STARKNET) {
                return await executeStarknetSwap(
                    tokenIn,
                    amountIn,
                    tokenOut,
                    minAmountOut,
                    commitment,
                    swapContractAddress,
                );
            } else if (currentChain === ChainType.STACKS) {
                return await executeStacksSwap(
                    tokenIn,
                    amountIn,
                    tokenOut,
                    minAmountOut,
                    commitment,
                    swapContractAddress,
                );
            }

            throw new Error(`Unsupported chain: ${currentChain}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const executeStarknetSwap = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amountIn: bigint,
        tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        minAmountOut: bigint,
        commitment: string,
        swapContractAddress: string,
    ): Promise<string> => {
        if (!adapter) throw new Error("Adapter not available");

        const tokenInAddress =
            MULTI_CHAIN_TOKENS[tokenIn.toUpperCase()].addresses[ChainType.STARKNET];
        const tokenOutAddress =
            MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()].addresses[ChainType.STARKNET];

        if (!tokenInAddress || !tokenOutAddress) {
            throw new Error("Token address not configured for Starknet");
        }

        // Approve token spending before swap
        await adapter.approveToken(tokenInAddress, swapContractAddress, amountIn);

        const amountInU256 = uint256.bnToUint256(amountIn);
        const minAmountOutU256 = uint256.bnToUint256(minAmountOut);

        const result = await adapter.executeTransaction({
            contractAddress: swapContractAddress,
            functionName: "swap",
            args: [
                tokenInAddress,
                amountInU256,
                tokenOutAddress,
                minAmountOutU256,
                commitment,
            ],
            abi: STARKNET_SWAP_ABI,
        });

        return result.hash;
    };

    const executeStacksSwap = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amountIn: bigint,
        tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        minAmountOut: bigint,
        commitment: string,
        swapContractAddress: string,
    ): Promise<string> => {
        if (!adapter) throw new Error("Adapter not available");

        const tokenInAddress =
            MULTI_CHAIN_TOKENS[tokenIn.toUpperCase()].addresses[ChainType.STACKS];
        const tokenOutAddress =
            MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()].addresses[ChainType.STACKS];

        if (!tokenInAddress || !tokenOutAddress) {
            throw new Error("Token address not configured for Stacks");
        }

        if (!swapContractAddress) {
            throw new Error("Swap contract address not configured for Stacks");
        }

        // Stacks swap function signature: (swap (token-in principal) (amount-in uint) (token-out principal) (min-amount-out uint))
        // Note: commitment parameter is not used in the current Stacks contract
        const result = await adapter.executeTransaction({
            contractAddress: swapContractAddress,
            functionName: "swap",
            args: [tokenInAddress, amountIn, tokenOutAddress, minAmountOut],
        });

        return result.hash;
    };

    return { executeSwap, isExecuting, currentChain };
}
