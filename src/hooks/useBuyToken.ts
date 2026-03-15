import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Contract, uint256, CallData } from "starknet";
import { CONTRACTS } from "@/lib/constants";
import { checkTokenAllowance } from "@/lib/token";

// Minimal ABI for the buy function
const SWAP_ABI = [
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

export function useBuyToken() {
  const { account, address } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeBuy = async (
    amountIn: bigint,
    tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    commitment: string,
  ): Promise<string> => {
    if (!account || !address) {
      throw new Error("Wallet not connected");
    }

    setIsExecuting(true);
    try {
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

      const amountU256 = uint256.bnToUint256(amountIn);

      // Check current allowance
      const currentAllowance = await checkTokenAllowance(
        CONTRACTS.USDC,
        address,
        CONTRACTS.ADAM_SWAP,
        account as any,
      );

      // Build call list — prepend approve only if allowance is insufficient
      const calls = [];

      if (currentAllowance < amountIn) {
        calls.push({
          contractAddress: CONTRACTS.USDC,
          entrypoint: "approve",
          calldata: CallData.compile({
            spender: CONTRACTS.ADAM_SWAP,
            amount: amountU256,
          }),
        });
      }

      calls.push({
        contractAddress: CONTRACTS.ADAM_SWAP,
        entrypoint: "buy",
        calldata: CallData.compile({
          token_in: CONTRACTS.USDC,
          amount_in: amountU256,
          token_out: tokenOutAddress,
          commitment,
        }),
      });

      // Single signature for approve + buy (or just buy if allowance is sufficient)
      const result = await account.execute(calls);
      await account.waitForTransaction(result.transaction_hash);

      return result.transaction_hash;
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeBuy, isExecuting };
}
