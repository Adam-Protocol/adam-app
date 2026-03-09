"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowDownRight, Info, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";
import axios from "axios";
import { hash } from "starknet";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { generateTransactionId, toWei } from "@/lib/utils";
import { useTokenApprove } from "@/hooks/useTokenApprove";
import { useBuyToken } from "@/hooks/useBuyToken";
import { useBuyRate } from "@/hooks/useBuyRate";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type BuyForm = {
  token_out: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
  amount_in: string;
};

export default function BuyPage() {
  const { address, isConnected } = useMultiChainWallet();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BuyForm>({
    defaultValues: { token_out: "adusd", amount_in: "" },
  });
  const tokenOut = watch("token_out");

  return (
    <WalletGuard>
      <BuyPageContent
        address={address}
        isConnected={isConnected}
        register={register}
        handleSubmit={handleSubmit}
        watch={watch}
        errors={errors}
        tokenOut={tokenOut}
      />
    </WalletGuard>
  );
}

// Token display info
const TOKEN_INFO: Record<string, { flag: string; name: string; currency: string }> = {
  adusd: { flag: "🇺🇸", name: "Adam USD", currency: "USD" },
  adngn: { flag: "🇳🇬", name: "Adam NGN", currency: "NGN" },
  adkes: { flag: "🇰🇪", name: "Adam KES", currency: "KES" },
  adghs: { flag: "🇬🇭", name: "Adam GHS", currency: "GHS" },
  adzar: { flag: "🇿🇦", name: "Adam ZAR", currency: "ZAR" },
};

function BuyPageContent({
  address,
  isConnected,
  register,
  handleSubmit,
  watch,
  errors,
  tokenOut,
}: any) {
  const [txSuccess, setTxSuccess] = useState(false);
  const { approveUSDC, isApproving } = useTokenApprove();
  const { executeBuy, isExecuting } = useBuyToken();

  // Watch amount input for real-time calculation
  const amountIn = watch("amount_in");
  const {
    rate,
    feeBps,
    outputAmount,
    isLoading: isLoadingRate,
  } = useBuyRate(tokenOut, amountIn);

  const mutation = useMutation({
    mutationFn: async (data: BuyForm) => {
      setTxSuccess(false);

      try {
        // Calculate amount in USDC (6 decimals) using toWei utility
        const amountInWei = toWei(data.amount_in, 6);

        // Step 1: Check and approve USDC spend if needed
        toast.info("Checking USDC allowance...", { duration: 1000 });
        const approveTxHash = await approveUSDC(amountInWei);
        console.log("Approval txHash", approveTxHash);

        if (approveTxHash) {
          // Approval was needed, executed, and confirmed
          toast.success("USDC approved and confirmed!", {
            description: `Tx: ${approveTxHash.slice(0, 10)}...`,
          });
        } else {
          // Sufficient allowance already exists
          toast.info("Sufficient USDC allowance detected", {
            description: "Proceeding with buy...",
          });
        }

        // Step 2: Generate commitment client-side
        const secret = BigInt(Math.floor(Math.random() * 1e15));
        // Use the wei amount for commitment (not the decimal input)
        const commitment = hash.computePedersenHash(
          "0x" + amountInWei.toString(16),
          "0x" + secret.toString(16),
        );

        // Store secret locally (user must save this)
        const secretKey = `adam_secret_${commitment}`;
        sessionStorage.setItem(secretKey, secret.toString());

        // Step 3: Execute buy transaction from user's wallet
        toast.info("Executing buy transaction...", { duration: 1000 });
        const buyTxHash = await executeBuy(
          amountInWei,
          data.token_out,
          commitment,
        );
        console.log("Buy txHash", buyTxHash);

        toast.success("Buy transaction confirmed!", {
          description: `Tx: ${buyTxHash.slice(0, 10)}...`,
        });

        // Step 4: Notify backend to track the transaction
        const transactionId = generateTransactionId("buy");
        toast.info("Recording transaction...", { duration: 1000 });

        return axios
          .post(`${API}/token/buy`, {
            wallet: address,
            amount_in: amountInWei.toString(),
            token_out: data.token_out,
            commitment,
            transactionId,
            tx_hash: buyTxHash, // Include the transaction hash
          })
          .then((r) => ({
            ...r.data,
            commitment,
            secret: secret.toString(),
            transactionId,
            tx_hash: buyTxHash,
          }));
      } catch (error: any) {
        console.error("Buy mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setTxSuccess(true);
      toast.success("Buy order submitted!", {
        description: `Transaction ID: ${data.transaction_id} — processing.`,
        duration: 5000,
      });
    },
    onError: (err: any) => {
      setTxSuccess(false);
      console.error("Buy error:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error occurred";
      toast.error("Buy failed", { description: errorMessage });
    },
  });

  return (
    <div className="max-w-lg mx-auto px-2 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center">
            <ArrowDownRight
              size={16}
              className="text-white sm:w-[18px] sm:h-[18px]"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Buy Stablecoins
            </h1>
            <p className="text-white/40 text-xs sm:text-sm">
              Deposit USDC, receive ADUSD or ADNGN
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((d: BuyForm) => mutation.mutate(d))}
          className="space-y-5"
        >
          {/* Token select */}
          <div className="gradient-border rounded-2xl p-5 space-y-4">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Receive Token
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(["adusd", "adngn", "adkes", "adghs", "adzar"] as const).map((t) => {
                const info = TOKEN_INFO[t];
                return (
                  <label
                    key={t}
                    className={`relative flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all ${
                      tokenOut === t
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-white/10 bg-white/3 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      value={t}
                      {...register("token_out")}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.flag}</span>
                      <p className="font-bold text-white text-xs uppercase">
                        {t}
                      </p>
                    </div>
                    <p className="text-[10px] text-white/40">
                      {info.name}
                    </p>
                    {tokenOut === t && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-400" />
                    )}
                  </label>
                );
              })}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                USDC Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  className="adam-input pr-16 text-xl font-bold"
                  {...register("amount_in", {
                    required: "Amount required",
                    min: { value: 1, message: "Min $1" },
                  })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold">
                  USDC
                </span>
              </div>
              {errors.amount_in && (
                <p className="text-accent-red text-xs mt-1">
                  {errors.amount_in.message}
                </p>
              )}
            </div>

            {/* Output Amount Display */}
            {amountIn && parseFloat(amountIn) > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">You will receive</span>
                  {isLoadingRate ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {outputAmount} {tokenOut.toUpperCase()}
                    </span>
                  )}
                </div>
                {rate !== null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Exchange rate</span>
                    <span className="text-white/60">
                      1 USDC = {rate.toFixed(6)} {tokenOut.toUpperCase()}
                    </span>
                  </div>
                )}
                {feeBps > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Fee</span>
                    <span className="text-white/60">
                      {(feeBps / 100).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy info */}
          <div className="flex items-start gap-2 sm:gap-3 glass px-3 sm:px-4 py-3 rounded-xl border border-brand-500/20 text-xs sm:text-sm">
            <Sparkles
              size={14}
              className="text-brand-400 mt-0.5 shrink-0 sm:w-4 sm:h-4"
            />
            <p className="text-white/50">
              Your commitment is generated{" "}
              <strong className="text-white/70">client-side</strong>. No amount
              is ever stored on-chain or sent to the server. Save your secret
              key to spend later.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              !isConnected || mutation.isPending || isApproving || isExecuting
            }
            className="btn-neon w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-bold text-base sm:text-lg shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-brand-500/50 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {mutation.isPending || isApproving || isExecuting ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>
                  {isApproving
                    ? "Approving..."
                    : isExecuting
                      ? "Executing..."
                      : "Processing..."}
                </span>
              </>
            ) : txSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>Success!</span>
              </>
            ) : !isConnected ? (
              "Connect Wallet First"
            ) : (
              `Buy ${tokenOut.toUpperCase()}`
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
