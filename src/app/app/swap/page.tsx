"use client";

import { motion } from "framer-motion";
import { useAccount } from "@starknet-react/core";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { RefreshCw, ArrowLeftRight, Info, CheckCircle2 } from "lucide-react";
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
  token_in: "adusd" | "adngn";
  amount_in: string;
};

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { register, handleSubmit, watch, setValue } = useForm<SwapForm>({
    defaultValues: { token_in: "adusd", amount_in: "" },
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
  const tokenOut = tokenIn === "adusd" ? "adngn" : "adusd";
  const amountIn = parseFloat(watch("amount_in") || "0");
  const { executeSwap, isExecuting } = useSwapToken();
  const { approveToken, isApproving } = useTokenApprove();

  const { data: rateData, isLoading: rateLoading } = useQuery({
    queryKey: ["rate"],
    queryFn: () => axios.get(`${API}/swap/rate`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const rate = rateData?.usd_ngn ?? 0;
  const estimatedOut =
    tokenIn === "adusd"
      ? amountIn * rate * 0.997 // 0.3% fee
      : (amountIn / rate) * 0.997;

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
        data.token_in === "adusd" ? CONTRACTS.ADUSD : CONTRACTS.ADNGN;
      try {
        await approveToken(tokenInAddress, CONTRACTS.ADAM_SWAP, amountWei);
      } catch (err: any) {
        throw new Error(`Approval failed: ${err.message}`, { cause: err });
      }

      // Step 2: Execute swap on-chain (frontend signing)
      const txHash = await executeSwap(
        data.token_in,
        amountWei,
        tokenOut as "adusd" | "adngn",
        minOut,
        commitment,
      );

      // Step 3: Record transaction in backend
      return axios
        .post(`${API}/swap`, {
          wallet: address,
          token_in: data.token_in,
          amount_in: amountWei.toString(),
          token_out: tokenOut,
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
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <RefreshCw
              size={16}
              className="text-white sm:w-[18px] sm:h-[18px]"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Swap</h1>
            <p className="text-white/40 text-xs sm:text-sm">
              ADUSD ↔ ADNGN at live rates
            </p>
          </div>
        </div>

        {/* Rate display */}
        {rateLoading ? (
          <div className="gradient-border rounded-xl p-4 mb-5 flex items-center justify-center">
            <LoadingSpinner size="sm" className="text-brand-400 mr-2" />
            <span className="text-white/50 text-sm">Loading rate...</span>
          </div>
        ) : rate > 0 ? (
          <div className="gradient-border rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40">Current Rate</p>
              <p className="font-bold text-white text-sm">
                1 ADUSD = {rate.toFixed(2)} ADNGN
              </p>
            </div>
            <div className="text-xs text-white/40 text-right">
              <p>1 ADNGN = {(1 / rate).toFixed(6)} ADUSD</p>
              <p className="text-accent-green mt-0.5">Updated 5m ago</p>
            </div>
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 glass px-3 py-2.5 rounded-xl border border-white/10 min-w-[110px]">
                <span>{tokenIn === "adusd" ? "🇺🇸" : "🇳🇬"}</span>
                <span className="font-bold text-white text-sm uppercase">
                  {tokenIn}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="adam-input text-2xl font-black flex-1 bg-transparent border-none focus:ring-0 px-0 text-right"
                {...register("amount_in")}
              />
            </div>
          </div>

          {/* Swap icon */}
          <div className="flex justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              onClick={() => setValue("token_in", tokenOut as any)}
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 glass px-3 py-2.5 rounded-xl border border-white/10 min-w-[110px]">
                <span>{tokenOut === "adusd" ? "🇺🇸" : "🇳🇬"}</span>
                <span className="font-bold text-white text-sm uppercase">
                  {tokenOut}
                </span>
              </div>
              <div className="flex-1 text-right text-2xl font-black text-white/60 px-4 py-3">
                {estimatedOut > 0 ? estimatedOut.toFixed(4) : "0.00"}
              </div>
            </div>
          </div>

          {amountIn > 0 && (
            <div className="flex items-center justify-between text-xs text-white/40 px-1">
              <span>Fee: 0.3%</span>
              <span>Slippage: 1%</span>
            </div>
          )}

          <div className="flex items-start gap-2 sm:gap-3 glass px-3 sm:px-4 py-3 rounded-xl border border-accent-cyan/20 text-xs sm:text-sm">
            <Info
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
            disabled={!isConnected || mutation.isPending || !watch("amount_in")}
            className="btn-neon w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-bold text-base sm:text-lg shadow-lg shadow-accent-cyan/30 disabled:opacity-50 transition-all active:scale-98 flex items-center justify-center gap-2"
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
            ) : (
              `Swap ${tokenIn.toUpperCase()} → ${tokenOut.toUpperCase()}`
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
