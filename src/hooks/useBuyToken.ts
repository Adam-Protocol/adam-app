import { useState } from "react";
import { useAccount, useContract } from "@starknet-react/core";
import { Contract, uint256 } from "starknet";
import { CONTRACTS } from "@/lib/constants";

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
  const { account } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeBuy = async (
    amountIn: bigint,
    tokenOut: "adusd" | "adngn",
    commitment: string,
  ): Promise<string> => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    setIsExecuting(true);
    try {
      const tokenOutAddress =
        tokenOut === "adusd" ? CONTRACTS.ADUSD : CONTRACTS.ADNGN;
      const amountU256 = uint256.bnToUint256(amountIn);

      // Create contract instance
      const swapContract = new Contract({ abi: SWAP_ABI, address: CONTRACTS.ADAM_SWAP, providerOrAccount: account });

      // Execute buy transaction
      const result = await swapContract.buy(
        CONTRACTS.USDC,
        amountU256,
        tokenOutAddress,
        commitment,
      );

      // Wait for transaction to be accepted
      await account.waitForTransaction(result.transaction_hash);

      return result.transaction_hash;
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeBuy, isExecuting };
}
