import { useState } from "react";
import { useChain } from "@/contexts/ChainContext";
import { uint256 } from "starknet";
import {
    SWAP_CONTRACT_ADDRESSES,
    MULTI_CHAIN_TOKENS,
} from "@/lib/chains/config";
import { ChainType } from "@/lib/chains/types";

// Starknet ABI for sell function
const STARKNET_SELL_ABI = [
    {
        name: "sell",
        type: "function",
        inputs: [
            {
                name: "token_in",
                type: "core::starknet::contract_address::ContractAddress",
            },
            { name: "amount", type: "core::integer::u256" },
            { name: "nullifier", type: "core::felt252" },
            { name: "commitment", type: "core::felt252" },
        ],
        outputs: [],
        state_mutability: "external",
    },
];

/**
 * Multi-chain sell token hook
 * Supports selling tokens on both Starknet and Stacks
 */
export function useMultiChainSell() {
    const { adapter, currentChain, account } = useChain();
    const [isExecuting, setIsExecuting] = useState(false);

    const executeSell = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amount: bigint,
        nullifier: string,
        commitment: string,
    ): Promise<string> => {
        if (!adapter || !account) {
            throw new Error("Wallet not connected");
        }

        setIsExecuting(true);
        try {
            const swapContractAddress = SWAP_CONTRACT_ADDRESSES[currentChain];

            if (currentChain === ChainType.STARKNET) {
                return await executeStarknetSell(
                    tokenIn,
                    amount,
                    nullifier,
                    commitment,
                    swapContractAddress,
                );
            } else if (currentChain === ChainType.STACKS) {
                return await executeStacksSell(
                    tokenIn,
                    amount,
                    nullifier,
                    commitment,
                    swapContractAddress,
                );
            }

            throw new Error(`Unsupported chain: ${currentChain}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const executeStarknetSell = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amount: bigint,
        nullifier: string,
        commitment: string,
        swapContractAddress: string,
    ): Promise<string> => {
        if (!adapter) throw new Error("Adapter not available");

        const tokenInAddress =
            MULTI_CHAIN_TOKENS[tokenIn.toUpperCase()].addresses[ChainType.STARKNET];

        if (!tokenInAddress) {
            throw new Error("Token address not configured for Starknet");
        }

        const amountU256 = uint256.bnToUint256(amount);

        const result = await adapter.executeTransaction({
            contractAddress: swapContractAddress,
            functionName: "sell",
            args: [tokenInAddress, amountU256, nullifier, commitment],
            abi: STARKNET_SELL_ABI,
        });

        return result.hash;
    };

    const executeStacksSell = async (
        tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
        amount: bigint,
        nullifier: string,
        commitment: string,
        swapContractAddress: string,
    ): Promise<string> => {
        if (!adapter) throw new Error("Adapter not available");

        const tokenInAddress =
            MULTI_CHAIN_TOKENS[tokenIn.toUpperCase()].addresses[ChainType.STACKS];

        if (!tokenInAddress) {
            throw new Error("Token address not configured for Stacks");
        }

        if (!swapContractAddress) {
            throw new Error("Swap contract address not configured for Stacks");
        }

        // Stacks sell function signature: (sell (token-in principal) (amount uint))
        // Note: nullifier and commitment parameters are not used in the current Stacks contract
        const result = await adapter.executeTransaction({
            contractAddress: swapContractAddress,
            functionName: "sell",
            args: [tokenInAddress, amount],
        });

        return result.hash;
    };

    return { executeSell, isExecuting, currentChain };
}
