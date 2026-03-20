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

const RATE_PRECISION = BigInt("1000000000000000000"); // 1e18

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

        if (currentChain === ChainType.STARKNET && starknetProvider) {
          const contract = new Contract({
            abi: STARKNET_SWAP_ABI,
            address: swapAddress,
            providerOrAccount: starknetProvider,
          });

          const tokenOutAddress = MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()].addresses[ChainType.STARKNET];
          const usdcAddress = MULTI_CHAIN_TOKENS.USDC.addresses[ChainType.STARKNET];

          if (!tokenOutAddress || !usdcAddress) throw new Error("Missing Starknet token addresses");

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
          setRate(rateValue);

          const feeResult = await contract.call("get_fee_bps", []);
          setFeeBps(Number(feeResult.toString()));
        } 
        else if (currentChain === ChainType.STACKS) {
          const [contractAddress, contractName] = swapAddress.split(".");
          const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
          
          const tokenOutInfo = MULTI_CHAIN_TOKENS[tokenOut.toUpperCase()];
          const usdcInfo = MULTI_CHAIN_TOKENS.USDC;
          
          const usdcFullAddr = usdcInfo.addresses[ChainType.STACKS];
          const outFullAddr = tokenOutInfo.addresses[ChainType.STACKS];

          if (!usdcFullAddr || !outFullAddr) throw new Error("Missing token addresses");

          const usdcParts = usdcFullAddr.split(".");
          const outParts = outFullAddr.split(".");

          if (usdcParts.length < 2 || outParts.length < 2) throw new Error("Invalid token addresses");

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
          if (rateValue && 'value' in rateValue) {
            setRate(BigInt(rateValue.value));
          }

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
          if (feeValue && 'value' in feeValue) {
            setFeeBps(Number(feeValue.value));
          }
        }
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
    if (!rate || !amountIn || parseFloat(amountIn) <= 0) {
      setOutputAmount("0");
      return;
    }

    try {
      const amountInWei = toWei(amountIn, 6);
      const grossOut = (amountInWei * rate) / RATE_PRECISION;
      const feeAmount = (grossOut * BigInt(feeBps)) / BigInt(10000);
      const netOut = grossOut - feeAmount;

      // Professional dynamic scaling
      const decimalsOut = getTokenDecimals(tokenOut.toUpperCase(), currentChain);
      const formatted = (Number(netOut) / Math.pow(10, decimalsOut)).toFixed(3);
      setOutputAmount(formatted);
    } catch (error) {
      console.error("Error calculating output:", error);
      setOutputAmount("0");
    }
  }, [rate, amountIn, feeBps, currentChain, tokenOut]);

  // Calculate effective rate accounting for decimal differences
  const effectiveRate = (() => {
    if (!rate || feeBps === undefined) return null;
    
    const decimalsIn = 6;
    const decimalsOut = getTokenDecimals(tokenOut.toUpperCase(), currentChain);
    const decimalDifference = decimalsOut - decimalsIn;
    const decimalScale = Math.pow(10, -decimalDifference);
    
    return (Number(rate) / Number(RATE_PRECISION)) * (1 - feeBps / 10000) * decimalScale;
  })();

  return {
    rate: effectiveRate,
    feeBps,
    outputAmount,
    isLoading,
  };
}


