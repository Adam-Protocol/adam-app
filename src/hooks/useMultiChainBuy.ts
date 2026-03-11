import { useState } from "react";
import { useChain } from "@/contexts/ChainContext";
import { uint256 } from "starknet";
import {
  SWAP_CONTRACT_ADDRESSES,
  MULTI_CHAIN_TOKENS,
} from "@/lib/chains/config";
import { ChainType } from "@/lib/chains/types";

// Starknet ABI for buy function
const STARKNET_BUY_ABI = [
  {
    name: "buy",
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
      { name: "commitment", type: "core::felt252" },
    ],
    outputs: [],
    state_mutability: "external",
  },
];

/**
 * Multi-chain buy token hook
 * Supports buying tokens on both Starknet and Stacks
 */
export function useMultiChainBuy() {
  const { adapter, currentChain, account } = useChain();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeBuy = async (
    amountIn: bigint,
    tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    commitment: string,
  ): Promise<string> => {
    if (!adapter || !account) {
      throw new Error("Wallet not connected");
    }

    setIsExecuting(true);
    try {
      const swapContractAddress = SWAP_CONTRACT_ADDRESSES[currentChain];

      if (currentChain === ChainType.STARKNET) {
        return await executeStarknetBuy(
          amountIn,
          tokenOut,
          commitment,
          swapContractAddress,
        );
      } else if (currentChain === ChainType.STACKS) {
        return await executeStacksBuy(
          amountIn,
          tokenOut,
          commitment,
          swapContractAddress,
        );
      }

      throw new Error(`Unsupported chain: ${currentChain}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeStarknetBuy = async (
    amountIn: bigint,
    tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    commitment: string,
    swapContractAddress: string,
  ): Promise<string> => {
    if (!adapter) throw new Error("Adapter not available");

    const tokenOutAddress =
      MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()].addresses[ChainType.STARKNET];
    const usdcAddress = MULTI_CHAIN_TOKENS.USDC.addresses[ChainType.STARKNET];

    if (!tokenOutAddress || !usdcAddress) {
      throw new Error("Token address not configured for Starknet");
    }

    const amountU256 = uint256.bnToUint256(amountIn);

    const result = await adapter.executeTransaction({
      contractAddress: swapContractAddress,
      functionName: "buy",
      args: [usdcAddress, amountU256, tokenOutAddress, commitment],
      abi: STARKNET_BUY_ABI,
    });

    return result.hash;
  };

  const executeStacksBuy = async (
    amountIn: bigint,
    tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    commitment: string,
    swapContractAddress: string,
  ): Promise<string> => {
    if (!adapter) throw new Error("Adapter not available");

    const tokenOutAddress =
      MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()].addresses[ChainType.STACKS];
    const usdcAddress = MULTI_CHAIN_TOKENS.USDC.addresses[ChainType.STACKS];

    if (!tokenOutAddress || !usdcAddress) {
      throw new Error("Token address not configured for Stacks");
    }

    // Stacks uses Clarity values, convert accordingly
    const result = await adapter.executeTransaction({
      contractAddress: swapContractAddress,
      functionName: "buy",
      args: [usdcAddress, amountIn.toString(), tokenOutAddress, commitment],
    });

    return result.hash;
  };

  return { executeBuy, isExecuting, currentChain };
}
