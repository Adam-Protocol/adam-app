import { useEffect, useState } from "react";
import { useProvider } from "@starknet-react/core";
import { Contract } from "starknet";
import { useChain } from "@/contexts/ChainContext";
import { ChainType } from "@/lib/chains/types";
import {
  getTokenDecimals,
  MULTI_CHAIN_TOKENS,
  SWAP_CONTRACT_ADDRESSES
} from "@/lib/chains/config";
import { toWei } from "@/lib/utils";
import type { Abi } from "starknet";
import {
  Cl,
  cvToValue,
  fetchCallReadOnlyFunction,
} from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";

const RATE_PRECISION = BigInt("1000000000000000000"); // 1e18 (matches contract)
const DECIMAL_ADJUSTMENT = BigInt("1000000000000"); // 1e12 (USDC 6 -> output token decimals)

const STARKNET_SWAP_ABI = [
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

// ============================================================================
// Starknet Implementation
// ============================================================================

async function fetchStarknetRateAndFee(
  starknetProvider: any,
  swapAddress: string,
  tokenOut: string,
): Promise<{ rate: bigint; feeBps: number }> {
  const contract = new Contract({
    abi: STARKNET_SWAP_ABI,
    address: swapAddress,
    providerOrAccount: starknetProvider,
  });

  const tokenOutAddress = MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()].addresses[ChainType.STARKNET];
  const usdcAddress = MULTI_CHAIN_TOKENS.USDC.addresses[ChainType.STARKNET];

  if (!tokenOutAddress || !usdcAddress) {
    throw new Error("Missing Starknet token addresses");
  }

  const rateResult = await contract.call("get_rate", [usdcAddress, tokenOutAddress]);

  let rateValue: bigint;
  if (typeof rateResult === "object" && rateResult !== null) {
    if ("low" in rateResult && "high" in rateResult) {
      rateValue = BigInt(rateResult.low) + (BigInt(rateResult.high) << BigInt(128));
    } else if (Array.isArray(rateResult)) {
      rateValue = BigInt(rateResult[0]) + (BigInt(rateResult[1] || 0) << BigInt(128));
    } else {
      rateValue = BigInt(rateResult.toString());
    }
  } else {
    rateValue = BigInt(rateResult.toString());
  }

  const feeResult = await contract.call("get_fee_bps", []);
  const feeBps = Number(feeResult.toString());

  return { rate: rateValue, feeBps };
}

// ============================================================================
// Stacks Implementation
// ============================================================================

async function fetchStacksRateAndFee(
  swapAddress: string,
  tokenOut: string,
): Promise<{ rate: bigint; feeBps: number }> {
  const [contractAddress, contractName] = swapAddress.split(".");
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;

  const tokenOutInfo = MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()];
  const usdcInfo = MULTI_CHAIN_TOKENS.USDC;

  const usdcFullAddr = usdcInfo.addresses[ChainType.STACKS];
  const outFullAddr = tokenOutInfo.addresses[ChainType.STACKS];

  if (!usdcFullAddr || !outFullAddr) {
    throw new Error("Missing token addresses");
  }

  const usdcParts = usdcFullAddr.split(".");
  const outParts = outFullAddr.split(".");

  if (usdcParts.length < 2 || outParts.length < 2) {
    throw new Error("Invalid token addresses");
  }

  const [usdcAddr, usdcName] = usdcParts;
  const [outAddr, outName] = outParts;

  // Fetch rate
  const rateResponse = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-rate",
    functionArgs: [
      Cl.contractPrincipal(usdcAddr, usdcName),
      Cl.contractPrincipal(outAddr, outName),
    ],
    network,
    senderAddress: outAddr,
  });
  const rateValue = cvToValue(rateResponse);
  if (!rateValue || !('value' in rateValue)) {
    throw new Error("Failed to fetch rate from Stacks");
  }
  const rate = BigInt(rateValue.value);

  // Fetch fee
  const feeResponse = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-fee-bps",
    functionArgs: [],
    network,
    senderAddress: outAddr,
  });
  const feeValue = cvToValue(feeResponse);
  if (!feeValue || !('value' in feeValue)) {
    throw new Error("Failed to fetch fee from Stacks");
  }
  const feeBps = Number(feeValue.value);

  return { rate, feeBps };
}

// ============================================================================
// Shared Utilities
// ============================================================================

function calculateOutputAmount(
  amountIn: string,
  rate: bigint,
  feeBps: number,
  tokenOut: string,
  currentChain: ChainType,
): string {
  if (!rate || !amountIn || parseFloat(amountIn) <= 0) {
    return "0";
  }

  try {
    const amountInNum = parseFloat(amountIn);
    
    // Resolve baseline rate precision dependent on the chain
    let humanRateBeforeFee: number;
    if (currentChain === ChainType.STARKNET) {
      humanRateBeforeFee = Number(rate) / Number(RATE_PRECISION * DECIMAL_ADJUSTMENT);
    } else {
      humanRateBeforeFee = Number(rate) / 1000000;
    }

    const grossOutNum = amountInNum * humanRateBeforeFee;
    const netOutNum = grossOutNum * (1 - (Number(feeBps) || 0) / 10000);

    // Format with proper display decimals
    const displayDecimals = tokenOut.toLowerCase() === "adngn" ? 2 : 4;
    return netOutNum.toFixed(displayDecimals);
  } catch (error) {
    console.error("Error calculating output:", error);
    return "0";
  }
}

function calculateEffectiveRate(rate: bigint, feeBps: number, currentChain: ChainType): number {
  let humanRate: number;
  if (currentChain === ChainType.STARKNET) {
    // Rate from contract includes 1e18 precision + 1e12 decimal adjustment from backend
    humanRate = (Number(rate) / Number(RATE_PRECISION * DECIMAL_ADJUSTMENT)) * (1 - feeBps / 10000);
  } else {
    // Stacks rate from contract is scaled by 1e6
    humanRate = (Number(rate) / 1000000) * (1 - feeBps / 10000);
  }
  return humanRate;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useBuyRate(
  tokenOut: "adusd" | "adngn" | "adkes" | "adghs" | "adzar",
  amountIn: string,
) {
  const { currentChain } = useChain();
  const { provider: starknetProvider } = useProvider();
  const [rate, setRate] = useState<bigint | null>(null);
  const [feeBps, setFeeBps] = useState<number>(0);
  const [outputAmount, setOutputAmount] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rate and fee from contract
  useEffect(() => {
    const fetchRateAndFee = async () => {
      try {
        setIsLoading(true);
        const swapAddress = SWAP_CONTRACT_ADDRESSES[currentChain];
        if (!swapAddress) return;

        let result: { rate: bigint; feeBps: number };

        if (currentChain === ChainType.STARKNET && starknetProvider) {
          result = await fetchStarknetRateAndFee(starknetProvider, swapAddress, tokenOut);
        } else if (currentChain === ChainType.STACKS) {
          result = await fetchStacksRateAndFee(swapAddress, tokenOut);
        } else {
          throw new Error(`Unsupported chain: ${currentChain}`);
        }

        setRate(result.rate);
        setFeeBps(result.feeBps);
      } catch (error) {
        console.error("Error fetching rate:", error);
        setRate(null);
        setFeeBps(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRateAndFee();
  }, [currentChain, starknetProvider, tokenOut]);

  // Calculate output amount
  useEffect(() => {
    if (!rate) {
      setOutputAmount("0");
      return;
    }

    const output = calculateOutputAmount(amountIn, rate, feeBps, tokenOut, currentChain);
    setOutputAmount(output);
  }, [rate, amountIn, feeBps, currentChain, tokenOut]);

  // Calculate effective rate (human-readable)
  const effectiveRate = rate ? calculateEffectiveRate(rate, feeBps, currentChain) : null;

  return {
    rate: effectiveRate,
    feeBps,
    outputAmount,
    isLoading,
  };
}
