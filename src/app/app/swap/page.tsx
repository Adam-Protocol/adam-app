"use client";

import { motion } from "framer-motion";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { RefreshCw, ArrowLeftRight, Info, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import axios from "axios";
import { hash } from "starknet";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useState } from "react";
import { generateTransactionId, toWei } from "@/lib/utils";
import { useSwapToken } from "@/hooks/useSwapToken";
import { useTokenApprove } from "@/hooks/useTokenApprove";
import { CONTRACTS } from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type SwapForm = {
  token_in: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
  token_out: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
  amount_in: string;
};

// Token display info
const TOKEN_INFO: Record<
  string,
  { flag: string; name: string; currency: string }
> = {
  adusd: { flag: "🇺🇸", name: "Adam USD", currency: "USD" },
  adngn: { flag: "🇳🇬", name: "Adam NGN", currency: "NGN" },
  adkes: { flag: "🇰🇪", name: "Adam KES", currency: "KES" },
  adghs: { flag: "🇬🇭", name: "Adam GHS", currency: "GHS" },
  adzar: { flag: "🇿🇦", name: "Adam ZAR", currency: "ZAR" },
};

export default function SwapPage() {
  const { address, isConnected } = useMultiChainWallet();
  const { register, handleSubmit, watch, setValue } = useForm<SwapForm>({
    defaultValues: { token_in: "adusd", token_out: "adngn", amount_in: "" },
  });

  return (
    <WalletGuard>
      <SwapPageContent
        address={address}
        isConnected={isConnected}
        register={register}
        handleSubmit={handleSubmit}
        watch={watch}
        setValue={setValue}
      />
    </WalletGuard>
  );
}

function SwapPageContent({
  address,
  isConnected,
  register,
  handleSubmit,
  watch,
  setValue,
}: any) {
  const [txSuccess, setTxSuccess] = useState(false);
  const tokenIn = watch("token_in");
  const tokenOut = watch("token_out");
  const amountIn = parseFloat(watch("amount_in") || "0");
  const { executeSwap, isExecuting } = useSwapToken();
  const { approveToken, isApproving } = useTokenApprove();

  // Fetch all rates
  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ["rates"],
    queryFn: () => axios.get(`${API}/swap/rates`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  // Calculate exchange rate between selected tokens
  const calculateRate = () => {
    if (!ratesData || tokenIn === tokenOut) return 0;
    
    // All rates are USD-based, so we need to convert
    // Example: ADNGN to ADKES = (1/NGN_rate) * KES_rate
    if (tokenIn === "adusd") {
      // ADUSD to other currency
      const currency = TOKEN_INFO[tokenOut].currency;
      return ratesData[currency]?.rate || 0;
    } else if (tokenOut === "adusd") {
      // Other currency to ADUSD
      const currency = TOKEN_INFO[tokenIn].currency;
      const rate = ratesData[currency]?.rate || 0;
      return rate > 0 ? 1 / rate : 0;
    } else {
      // Cross-currency swap (e.g., ADNGN to ADKES)
      const inCurrency = TOKEN_INFO[tokenIn].currency;
      const outCurrency = TOKEN_INFO[tokenOut].currency;
      const inRate = ratesData[inCurrency]?.rate || 0;
      const outRate = ratesData[outCurrency]?.rate || 0;
      return inRate > 0 ? outRate / inRate : 0;
    }
  };

  const rate = calculateRate();
  const estimatedOut = amountIn * rate * 0.997; // 0.3% fee

  const mutation = useMutation({
    mutationFn: async (data: SwapForm) => {
      setTxSuccess(false);
      const secret = BigInt(Math.floor(Math.random() * 1e15));
      
      // Convert amount to wei (18 decimals for ADUSD/ADNGN) using toWei utility
      const amountWei = toWei(data.amount_in, 18);
      const commitment = hash.computePedersenHash(
        "0x" + amountWei.toString(16),
        "0x" + secret.toString(16),
      );
      
      // Calculate minimum output with slippage protection using toWei
      const minOut = toWei((estimatedOut * 0.99).toString(), 18);

      // Generate custom transaction ID
      const transactionId = generateTransactionId("swap");

      sessionStorage.setItem(`adam_secret_${commitment}`, secret.toString());

      // Step 1: Check and approve token if needed
      const tokenInAddress =
        data.token_in === "adusd"
          ? CONTRACTS.ADUSD
          : data.token_in === "adngn"
            ? CONTRACTS.ADNGN
            : data.token_in === "adkes"
              ? CONTRACTS.ADKES
              : data.token_in === "adghs"
                ? CONTRACTS.ADGHS
                : CONTRACTS.ADZAR;
      try {
        await approveToken(tokenInAddress, CONTRACTS.ADAM_SWAP, amountWei);
      } catch (err: any) {
        throw new Error(`Approval failed: ${err.message}`, { cause: err });
      }

      // Step 2: Execute swap on-chain (frontend signing)
      const txHash = await executeSwap(
        data.token_in,
        amountWei,
        data.token_out,
        minOut,
        commitment,
      );

      // Step 3: Record transaction in backend
      return axios
        .post(`${API}/swap`, {
          wallet: address,
          token_in: data.token_in,
          amount_in: amountWei.toString(),
          token_out: data.token_out,
          min_amount_out: minOut.toString(),
          commitment,
          transactionId,
          tx_hash: txHash,
        })
        .then((r) => ({
          ...r.data,
          commitment,
          transactionId,
          tx_hash: txHash,
        }));
    },
    onSuccess: (data) => {
      setTxSuccess(true);
      toast.success("Swap completed!", {
        description: `Transaction: ${data.tx_hash?.slice(0, 10)}...`,
        duration: 5000,
      });
    },
    onError: (err: any) => {
      setTxSuccess(false);
      toast.error("Swap failed", {
        description: err?.response?.data?.message ?? err.message,
      });
    },
  });

  return (
    <div className="max-w-lg mx-auto px-2 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-orange flex items-center justify-center">
            <RefreshCw
              size={16}
              className="text-white sm:w-[18px] sm:h-[18px]"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Swap</h1>
            <p className="text-white/40 text-xs sm:text-sm">
              Exchange between any Adam stablecoins
            </p>
          </div>
        </div>

        {/* Rate display */}
        {ratesLoading ? (
          <div className="gradient-border rounded-xl p-4 mb-5 flex items-center justify-center">
            <LoadingSpinner size="sm" className="text-brand-400 mr-2" />
            <span className="text-white/50 text-sm">Loading rates...</span>
          </div>
        ) : rate > 0 && tokenIn !== tokenOut ? (
          <div className="gradient-border rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-accent-green" />
                <div>
                  <p className="text-xs text-white/40">Exchange Rate</p>
                  <p className="font-bold text-white text-sm">
                    1 {tokenIn.toUpperCase()} = {rate.toFixed(4)}{" "}
                    {tokenOut.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="text-xs text-white/40 text-right">
                <p>
                  1 {tokenOut.toUpperCase()} = {(1 / rate).toFixed(6)}{" "}
                  {tokenIn.toUpperCase()}
                </p>
                <p className="text-accent-green mt-0.5 flex items-center gap-1 justify-end">
                  <span className="pulse-dot" />
                  Live rate
                </p>
              </div>
            </div>
          </div>
        ) : tokenIn === tokenOut ? (
          <div className="gradient-border rounded-xl p-4 mb-5 flex items-center justify-center">
            <span className="text-yellow-400 text-sm">
              Please select different tokens
            </span>
          </div>
        ) : (
          <div className="gradient-border rounded-xl p-4 mb-5 flex items-center justify-center">
            <span className="text-white/40 text-sm">Rate unavailable</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit((d: SwapForm) => mutation.mutate(d))}
          className="space-y-4"
        >
          {/* From */}
          <div className="gradient-border rounded-2xl p-5 space-y-3">
            <label className="block text-sm text-white/50">You Pay</label>
            
            {/* Token selector */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {(["adusd", "adngn", "adkes", "adghs", "adzar"] as const).map(
                (t) => {
                  const info = TOKEN_INFO[t];
                  return (
                    <label
                      key={t}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-all ${
                        tokenIn === t
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-white/10 bg-white/3 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        value={t}
                        {...register("token_in")}
                        className="sr-only"
                      />
                      <span className="text-lg">{info.flag}</span>
                      <span className="text-[10px] font-bold text-white uppercase">
                        {t}
                      </span>
                    </label>
                  );
                },
              )}
            </div>

            {/* Amount input */}
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="adam-input text-2xl font-black w-full bg-transparent border border-white/10 rounded-xl px-4 py-3"
              {...register("amount_in")}
            />
          </div>

          {/* Swap icon */}
          <div className="flex justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={() => {
                const currentIn = watch("token_in");
                const currentOut = watch("token_out");
                setValue("token_in", currentOut);
                setValue("token_out", currentIn);
              }}
              className="w-10 h-10 glass rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeftRight size={16} />
            </motion.button>
          </div>

          {/* To */}
          <div className="gradient-border rounded-2xl p-5 space-y-3">
            <label className="block text-sm text-white/50">
              You Receive (est.)
            </label>
            
            {/* Token selector */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {(["adusd", "adngn", "adkes", "adghs", "adzar"] as const).map(
                (t) => {
                  const info = TOKEN_INFO[t];
                  return (
                    <label
                      key={t}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-all ${
                        tokenOut === t
                          ? "border-accent-cyan bg-accent-cyan/10"
                          : "border-white/10 bg-white/3 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        value={t}
                        {...register("token_out")}
                        className="sr-only"
                      />
                      <span className="text-lg">{info.flag}</span>
                      <span className="text-[10px] font-bold text-white uppercase">
                        {t}
                      </span>
                    </label>
                  );
                },
              )}
            </div>

            {/* Output amount */}
            <div className="text-2xl font-black text-white/60 px-4 py-3 bg-white/3 rounded-xl border border-white/10">
              {estimatedOut > 0 ? estimatedOut.toFixed(4) : "0.00"}
            </div>
          </div>

          {amountIn > 0 && (
            <div className="flex items-center justify-between text-xs text-white/40 px-1">
              <span>Fee: 0.3%</span>
              <span>Slippage: 1%</span>
            </div>
          )}

          <div className="flex items-start gap-2 sm:gap-3 glass px-3 sm:px-4 py-3 rounded-xl border border-accent-cyan/20 text-xs sm:text-sm">
            <Sparkles
              size={14}
              className="text-accent-cyan mt-0.5 shrink-0 sm:w-4 sm:h-4"
            />
            <p className="text-white/50">
              Swap amounts are hidden on-chain. A new commitment is generated
              client-side for the output token.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              !isConnected ||
              mutation.isPending ||
              !watch("amount_in") ||
              tokenIn === tokenOut
            }
            className="btn-neon w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-orange text-white font-bold text-base sm:text-lg shadow-lg shadow-accent-cyan/30 disabled:opacity-50 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {isApproving ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Approving...</span>
              </>
            ) : isExecuting ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Swapping...</span>
              </>
            ) : mutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Recording...</span>
              </>
            ) : txSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>Success!</span>
              </>
            ) : !isConnected ? (
              "Connect Wallet First"
            ) : tokenIn === tokenOut ? (
              "Select Different Tokens"
            ) : (
              `Swap ${tokenIn.toUpperCase()} → ${tokenOut.toUpperCase()}`
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
