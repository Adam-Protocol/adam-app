import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Contract, uint256 } from "starknet";
import { CONTRACTS } from "@/lib/constants";

// Minimal ABI for the swap function
const SWAP_ABI = [
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

export function useSwapToken() {
  const { account } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeSwap = async (
    tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    amountIn: bigint,
    tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    minAmountOut: bigint,
    commitment: string,
  ): Promise<string> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    setIsExecuting(true);
    try {
      const tokenInAddress =
        tokenIn === "adusd"
          ? CONTRACTS.ADUSD
          : tokenIn === "adngn"
            ? CONTRACTS.ADNGN
            : tokenIn === "adkes"
              ? CONTRACTS.ADKES
              : tokenIn === "adghs"
                ? CONTRACTS.ADGHS
                : CONTRACTS.ADZAR;
      const tokenOutAddress =
        tokenOut === "adusd"
          ? CONTRACTS.ADUSD
          : tokenOut === "adngn"
            ? CONTRACTS.ADNGN
            : tokenOut === "adkes"
              ? CONTRACTS.ADKES
              : tokenOut === "adghs"
                ? CONTRACTS.ADGHS
                : CONTRACTS.ADZAR;
      const amountInU256 = uint256.bnToUint256(amountIn);
      const minAmountOutU256 = uint256.bnToUint256(minAmountOut);

      // Create contract instance
      const swapContract = new Contract({ abi: SWAP_ABI, address: CONTRACTS.ADAM_SWAP, providerOrAccount: account });

      // Execute swap transaction
      const result = await swapContract.swap(
        tokenInAddress,
        amountInU256,
        tokenOutAddress,
        minAmountOutU256,
        commitment,
      );

      // Wait for transaction to be accepted
      await account.waitForTransaction(result.transaction_hash);

      return result.transaction_hash;
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeSwap, isExecuting };
}
