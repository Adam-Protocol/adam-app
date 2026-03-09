import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { Contract, uint256 } from "starknet";
import { CONTRACTS } from "@/lib/constants";

// Minimal ABI for the sell function
const SWAP_ABI = [
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

export function useSellToken() {
  const { account } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeSell = async (
    tokenIn: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
    amount: bigint,
    nullifier: string,
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
      const amountU256 = uint256.bnToUint256(amount);

      // Create contract instance
      const swapContract = new Contract({ abi: SWAP_ABI, address: CONTRACTS.ADAM_SWAP, providerOrAccount: account });

      // Execute sell transaction
      const result = await swapContract.sell(
        tokenInAddress,
        amountU256,
        nullifier,
        commitment,
      );

      // Wait for transaction to be accepted
      await account.waitForTransaction(result.transaction_hash);

      return result.transaction_hash;
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeSell, isExecuting };
}
