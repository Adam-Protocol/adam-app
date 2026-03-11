import { useEffect, useState } from "react";
import { useProvider } from "@starknet-react/core";
import { Contract } from "starknet";
import { CONTRACTS } from "@/lib/constants";
import { toWei } from "@/lib/utils";
import type { Abi } from "starknet";

const SWAP_ABI = [
  {
    type: "interface",
    name: "ISwap",
    items: [
      {
        type: "function",
        name: "get_rate",
        inputs: [
          {
            name: "token_from",
            type: "core::starknet::contract_address::ContractAddress",
          },
          {
            name: "token_to",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_fee_bps",
        inputs: [],
        outputs: [{ type: "core::integer::u16" }],
        state_mutability: "view",
      },
    ],
  },
] as const satisfies Abi;

const RATE_PRECISION = BigInt("1000000000000000000"); // 1e18

export function useBuyRate(
  tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
  amountIn: string,
) {
  const { provider } = useProvider();
  const [rate, setRate] = useState<bigint | null>(null);
  const [feeBps, setFeeBps] = useState<number>(0);
  const [outputAmount, setOutputAmount] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rate and fee from contract
  useEffect(() => {
    console.log("useBuyRate effect triggered");
    console.log("Provider:", provider ? "ready" : "not ready");
    console.log("Token out:", tokenOut);

    if (!provider) {
      console.log("useBuyRate: provider not ready");
      return;
    }

    const fetchRateAndFee = async () => {
      try {
        setIsLoading(true);

        console.log("Creating contract instance...");
        console.log("Swap address:", CONTRACTS.ADAM_SWAP);

        const contract = new Contract({
          abi: SWAP_ABI,
          address: CONTRACTS.ADAM_SWAP,
          providerOrAccount: provider,
        });

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

        console.log("Fetching rate from contract...");
        console.log("USDC:", CONTRACTS.USDC);
        console.log("Token Out:", tokenOutAddress);

        // Fetch rate
        console.log("Calling get_rate...");
        const rateResult = await contract.call(
          "get_rate",
          [CONTRACTS.USDC, tokenOutAddress],
          { blockIdentifier: "latest" },
        );
        console.log("Rate result:", rateResult);
        console.log("Rate result type:", typeof rateResult);
        console.log("Rate result keys:", Object.keys(rateResult || {}));

        // Handle u256 response (low, high)
        let rateValue: bigint;
        if (typeof rateResult === "object" && rateResult !== null) {
          if ("low" in rateResult && "high" in rateResult) {
            console.log("Rate low:", rateResult.low);
            console.log("Rate high:", rateResult.high);
            rateValue =
              BigInt(rateResult.low) + (BigInt(rateResult.high) << BigInt(128));
          } else if (Array.isArray(rateResult)) {
            console.log("Rate is array:", rateResult);
            rateValue =
              BigInt(rateResult[0]) +
              (BigInt(rateResult[1] || 0) << BigInt(128));
          } else {
            console.log("Rate object, converting to string");
            rateValue = BigInt(rateResult.toString());
          }
        } else {
          console.log("Rate is primitive, converting to string");
          rateValue = BigInt(rateResult.toString());
        }

        console.log("Rate value (bigint):", rateValue.toString());
        setRate(rateValue);

        // Fetch fee
        console.log("Calling get_fee_bps...");
        const feeResult = await contract.call("get_fee_bps", [], {
          blockIdentifier: "latest",
        });
        console.log("Fee result:", feeResult);
        const feeValue = Number(feeResult.toString());
        console.log("Fee value:", feeValue);
        setFeeBps(feeValue);
      } catch (error) {
        console.error("Error fetching rate:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setRate(null);
        setFeeBps(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRateAndFee();
  }, [provider, tokenOut]);

  // Calculate output amount whenever inputs change
  useEffect(() => {
    console.log("Calculating output...");
    console.log("Rate:", rate?.toString());
    console.log("Amount in:", amountIn);
    console.log("Fee BPS:", feeBps);

    if (!rate || !amountIn || parseFloat(amountIn) <= 0) {
      console.log("Skipping calculation - missing inputs");
      setOutputAmount("0");
      return;
    }

    try {
      // Convert USDC amount to base units (6 decimals) using toWei utility
      // Handle decimal inputs properly
      const amountNum = parseFloat(amountIn);
      if (isNaN(amountNum) || amountNum <= 0) {
        console.log("Invalid amount input");
        setOutputAmount("0");
        return;
      }

      // Use toWei to properly handle decimal conversion
      const amountInWei = toWei(amountIn, 6);
      console.log("Amount in wei:", amountInWei.toString());

      // Apply rate: (amount_in * rate) / RATE_PRECISION
      const grossOut = (amountInWei * rate) / RATE_PRECISION;
      console.log("Gross out:", grossOut.toString());

      // Apply fee: gross_out - (gross_out * fee_bps / 10000)
      const feeAmount = (grossOut * BigInt(feeBps)) / BigInt(10000);
      const netOut = grossOut - feeAmount;
      console.log("Fee amount:", feeAmount.toString());
      console.log("Net out:", netOut.toString());

      // Convert to human-readable format (18 decimals for ADUSD/ADNGN)
      const formatted = (Number(netOut) / 1e18).toFixed(6);
      console.log("Formatted output:", formatted);
      setOutputAmount(formatted);
    } catch (error) {
      console.error("Error calculating output:", error);
      setOutputAmount("0");
    }
  }, [rate, amountIn, feeBps]);

  // Calculate effective rate (accounting for fees)
  const effectiveRate =
    rate && feeBps !== undefined
      ? (Number(rate) / Number(RATE_PRECISION)) * (1 - feeBps / 10000)
      : null;

  return {
    rate: effectiveRate,
    feeBps,
    outputAmount,
    isLoading,
  };
}
