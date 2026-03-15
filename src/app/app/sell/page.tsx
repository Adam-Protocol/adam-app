"use client";

import { motion } from "framer-motion";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useAccount } from "@starknet-react/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Info,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { hash } from "starknet";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { generateTransactionId, toWei } from "@/lib/utils";
import { useUserCommitments } from "@/hooks/useUserCommitments";
import { useCommitment } from "@/hooks/useCommitment";
import { CommitmentInfo } from "@/components/CommitmentInfo";
import { useBanks } from "@/hooks/useBanks";
import { useAccountVerification } from "@/hooks/useAccountVerification";
import { useState, useEffect } from "react";
import { BankSearchDropdown } from "@/components/ui/BankSearchDropdown";
import { useSellToken } from "@/hooks/useSellToken";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getTokenDecimals } from "@/lib/chains/config";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type SellForm = {
  token_in: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
  amount: string;
  currency: "NGN" | "USD" | "KES" | "GHS" | "ZAR";
  bank_account: string;
  bank_code: string;
};

export default function SellPage() {
  const { address, isConnected, currentChain } = useMultiChainWallet();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SellForm>({
    defaultValues: { token_in: "adngn", currency: "NGN" },
  });

  return (
    <WalletGuard>
      <SellPageContent
        address={address}
        isConnected={isConnected}
        currentChain={currentChain}
        register={register}
        handleSubmit={handleSubmit}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />
    </WalletGuard>
  );
}

// Currency to country mapping
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  NGN: "NG",
  USD: "US",
  KES: "KE",
  GHS: "GH",
  ZAR: "ZA",
};

// Token to currency mapping
const TOKEN_TO_CURRENCY: Record<string, string> = {
  adusd: "USD",
  adngn: "NGN",
  adkes: "KES",
  adghs: "GHS",
  adzar: "ZAR",
};

// Currency display info
const CURRENCY_INFO: Record<string, { flag: string; name: string }> = {
  NGN: { flag: "🇳🇬", name: "Nigerian Naira" },
  USD: { flag: "🇺🇸", name: "US Dollar" },
  KES: { flag: "🇰🇪", name: "Kenyan Shilling" },
  GHS: { flag: "🇬🇭", name: "Ghanaian Cedi" },
  ZAR: { flag: "🇿🇦", name: "South African Rand" },
};

function SellPageContent({
  address,
  isConnected,
  currentChain,
  register,
  handleSubmit,
  watch,
  errors,
  setValue,
}: any) {
  const tokenType = watch("token_in");
  const currency = watch("currency");
  const accountNumber = watch("bank_account");
  const bankCode = watch("bank_code");
  const amount = watch("amount");

  const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(
    null,
  );
  const [txSuccess, setTxSuccess] = useState(false);

  const { data: commitments = [], isLoading: loadingCommitments } =
    useUserCommitments(tokenType);
  const { getSecret } = useCommitment();
  const { executeSell, isExecuting } = useSellToken();

  // Fetch all rates
  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ["rates"],
    queryFn: () => axios.get(`${API}/swap/rates`).then((r) => r.data),
    refetchInterval: 30_000,
    retry: 3,
  });

  // Calculate fiat amount user will receive
  const calculateFiatAmount = () => {
    if (!amount || !ratesData || parseFloat(amount) <= 0) return 0;

    const tokenCurrency = TOKEN_TO_CURRENCY[tokenType];

    // If selling the same currency (e.g., ADNGN -> NGN), it's 1:1
    if (tokenCurrency === currency) {
      return parseFloat(amount);
    }

    // If selling ADUSD to another currency
    if (tokenType === "adusd") {
      const rate = ratesData[currency]?.rate || 0;
      return parseFloat(amount) * rate;
    }

    // If selling another currency to USD
    if (currency === "USD") {
      const rate = ratesData[tokenCurrency]?.rate || 0;
      return rate > 0 ? parseFloat(amount) / rate : 0;
    }

    // Cross-currency conversion (e.g., ADNGN -> KES)
    const fromRate = ratesData[tokenCurrency]?.rate || 0;
    const toRate = ratesData[currency]?.rate || 0;

    if (fromRate > 0) {
      // Convert to USD first, then to target currency
      const usdAmount = parseFloat(amount) / fromRate;
      return usdAmount * toRate;
    }

    return 0;
  };

  const fiatAmount = calculateFiatAmount();

  // Fetch banks based on selected currency
  const country = CURRENCY_TO_COUNTRY[currency] || "NG";
  const {
    data: banks = [],
    isLoading: loadingBanks,
    error: banksError,
  } = useBanks(country);

  // Log for debugging
  useEffect(() => {
    console.log("Banks data:", { banks, loadingBanks, banksError, country });
  }, [banks, loadingBanks, banksError, country]);

  // Account verification mutation
  const verifyAccountMutation = useAccountVerification();

  // Auto-verify account when both account number and bank code are filled
  useEffect(() => {
    if (accountNumber?.length === 10 && bankCode) {
      setVerifiedAccountName(null);
      verifyAccountMutation.mutate(
        { account_number: accountNumber, bank_code: bankCode },
        {
          onSuccess: (data) => {
            setVerifiedAccountName(data.account_name);
            toast.success("Account verified!", {
              description: `Account holder: ${data.account_name}`,
            });
          },
          onError: (error: any) => {
            setVerifiedAccountName(null);
            toast.error("Account verification failed", {
              description:
                error?.response?.data?.message || "Invalid account details",
            });
          },
        },
      );
    }
  }, [accountNumber, bankCode]);

  const mutation = useMutation({
    mutationFn: async (data: SellForm) => {
      setTxSuccess(false);

      try {
        // Find the most recent commitment for this token type
        const availableCommitment = commitments.find(
          (c) => c.token_out.toLowerCase() === data.token_in.toLowerCase(),
        );

        if (!availableCommitment) {
          throw new Error(
            `No available ${data.token_in.toUpperCase()} commitment found. Please buy tokens first.`,
          );
        }

        // Retrieve secret from sessionStorage
        const secret = getSecret(availableCommitment.commitment);
        if (!secret) {
          throw new Error(
            "Secret not found. You may need to buy tokens again from this device.",
          );
        }

        // Derive nullifier from secret
        const nullifierKey = BigInt(Math.floor(Math.random() * 1e15));
        const nullifier = hash.computePedersenHash(
          "0x" + secret.toString(16),
          "0x" + nullifierKey.toString(16),
        );

        // Calculate amount in wei using chain-specific decimals
        const tokenDecimals = getTokenDecimals(data.token_in.toUpperCase(), currentChain);
        const amountInWei = toWei(data.amount, tokenDecimals);

        // Step 1: Execute sell transaction from user's wallet
        toast.info("Executing sell transaction...", { duration: 1000 });
        const sellTxHash = await executeSell(
          data.token_in,
          amountInWei,
          nullifier,
          availableCommitment.commitment,
        );
        console.log("Sell txHash", sellTxHash);

        toast.success("Sell transaction confirmed!", {
          description: `Tx: ${sellTxHash.slice(0, 10)}...`,
        });

        // Step 2: Notify backend to track the transaction and initiate bank transfer
        const transactionId = generateTransactionId("sell");
        toast.info("Processing bank transfer...", { duration: 1000 });

        return axios
          .post(`${API}/token/sell`, {
            wallet: address,
            token_in: data.token_in,
            amount: amountInWei.toString(),
            nullifier,
            commitment: availableCommitment.commitment,
            currency: data.currency,
            bank_account: data.bank_account,
            bank_code: data.bank_code,
            transactionId,
            tx_hash: sellTxHash, // Include the transaction hash
          })
          .then((r) => ({ ...r.data, tx_hash: sellTxHash }));
      } catch (error: any) {
        console.error("Sell mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setTxSuccess(true);
      toast.success("Sell order submitted!", {
        description: `Transaction ID: ${data.transaction_id} — bank transfer will arrive shortly.`,
        duration: 5000,
      });
    },
    onError: (err: any) => {
      setTxSuccess(false);
      console.error("Sell error:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error occurred";
      toast.error("Sell failed", { description: errorMessage });
    },
  });

  return (
    <div className="max-w-lg mx-auto px-2 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-orange to-brand-500 flex items-center justify-center">
            <ArrowUpRight
              size={16}
              className="text-white sm:w-[18px] sm:h-[18px]"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Sell Stablecoins
            </h1>
            <p className="text-white/40 text-xs sm:text-sm">
              Burn ADUSD/ADNGN and receive fiat to your bank
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((d: SellForm) => mutation.mutate(d))}
          className="space-y-5"
        >
          <div className="gradient-border rounded-2xl p-5 space-y-4">
            {/* Token */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Token to Sell
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(["adusd", "adngn", "adkes", "adghs", "adzar"] as const).map(
                  (t) => {
                    const currencyCode = TOKEN_TO_CURRENCY[t];
                    const currencyInfo = CURRENCY_INFO[currencyCode];
                    return (
                      <label
                        key={t}
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${watch("token_in") === t ? "border-accent-orange bg-accent-orange/10" : "border-white/10 bg-white/3"}`}
                      >
                        <input
                          type="radio"
                          value={t}
                          {...register("token_in", {
                            onChange: (e: any) => {
                              // Auto-update currency when token changes
                              const newCurrency =
                                TOKEN_TO_CURRENCY[e.target.value];
                              setValue("currency", newCurrency as any);
                            },
                          })}
                          className="sr-only"
                        />
                        <span className="text-lg">{currencyInfo.flag}</span>
                        <p className="font-bold text-white text-xs uppercase">
                          {t}
                        </p>
                      </label>
                    );
                  },
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Amount to Sell
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="adam-input pr-20 text-xl font-bold"
                  {...register("amount", { required: "Amount required" })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold uppercase">
                  {watch("token_in")}
                </span>
              </div>

              {/* Fiat Amount Display */}
              {amount && parseFloat(amount) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-xl bg-gradient-to-r from-accent-green/10 to-brand-500/10 border border-accent-green/20"
                >
                  {ratesLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-xs text-white/50">
                        Calculating amount...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">
                        You will receive:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent-green">
                          {CURRENCY_INFO[currency]?.flag}{" "}
                          {fiatAmount.toFixed(2)}
                        </span>
                        <span className="text-sm font-semibold text-white/70">
                          {currency}
                        </span>
                      </div>
                    </div>
                  )}
                  {!ratesLoading &&
                    TOKEN_TO_CURRENCY[tokenType] !== currency && (
                      <div className="mt-1 text-[10px] text-white/30 text-right">
                        Rate: 1 {tokenType.toUpperCase()} ≈{" "}
                        {(fiatAmount / parseFloat(amount)).toFixed(4)}{" "}
                        {currency}
                      </div>
                    )}
                </motion.div>
              )}

              {loadingCommitments && (
                <div className="text-xs text-white/40 mt-1 flex items-center gap-1">
                  <LoadingSpinner size="sm" />
                  Loading available balance...
                </div>
              )}
              {!loadingCommitments && commitments.length === 0 && (
                <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  No {tokenType.toUpperCase()} purchased yet. Buy tokens first.
                </div>
              )}
              {!loadingCommitments && commitments.length > 0 && (
                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={14} /> {commitments.length} commitment(s)
                  available
                </div>
              )}
            </div>
          </div>

          {/* Bank details */}
          <div className="gradient-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-white">Bank Details</h3>

            {/* Currency Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(["NGN", "USD", "KES", "GHS", "ZAR"] as const).map((curr) => {
                const info = CURRENCY_INFO[curr];
                return (
                  <label
                    key={curr}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${currency === curr ? "border-brand-500 bg-brand-500/10" : "border-white/10"}`}
                  >
                    <input
                      type="radio"
                      value={curr}
                      {...register("currency")}
                      className="sr-only"
                    />
                    <span className="text-base">{info.flag}</span>
                    <span className="text-xs font-medium text-white">
                      {curr}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Bank Selection */}
            <div className="relative z-10">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Select Bank {banks.length > 0 && `(${banks.length} available)`}
              </label>
              <BankSearchDropdown
                banks={banks}
                value={bankCode}
                onChange={(code) =>
                  setValue("bank_code", code, { shouldValidate: true })
                }
                disabled={loadingBanks}
                loading={loadingBanks}
                error={errors.bank_code?.message}
              />
              {banksError && (
                <p className="text-accent-red text-xs mt-1">
                  Failed to load banks: {String(banksError)}
                </p>
              )}
              {!loadingBanks && banks.length === 0 && !banksError && (
                <p className="text-yellow-400 text-xs mt-1">
                  No banks found for {country}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div className="relative z-0">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Account Number
              </label>
              <input
                type="text"
                placeholder="0123456789"
                className="adam-input"
                maxLength={10}
                {...register("bank_account", {
                  required: "Account number required",
                  minLength: { value: 10, message: "Must be 10 digits" },
                  maxLength: { value: 10, message: "Must be 10 digits" },
                  pattern: { value: /^\d+$/, message: "Only numbers allowed" },
                })}
              />
              {errors.bank_account && (
                <p className="text-accent-red text-xs mt-1">
                  {errors.bank_account.message}
                </p>
              )}

              {/* Account Verification Status */}
              {verifyAccountMutation.isPending && (
                <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                  <LoadingSpinner size="sm" /> Verifying account...
                </div>
              )}
              {verifiedAccountName && (
                <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={14} />{" "}
                  <span className="font-semibold">{verifiedAccountName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 glass px-3 sm:px-4 py-3 rounded-xl border border-accent-orange/20 text-xs sm:text-sm">
            <Sparkles
              size={14}
              className="text-accent-orange mt-0.5 shrink-0 sm:w-4 sm:h-4"
            />
            <p className="text-white/50">
              Your bank details are processed once, never stored. Amount is
              hidden on-chain via nullifier.
            </p>
          </div>

          <CommitmentInfo
            commitmentCount={commitments.length}
            tokenType={tokenType}
            isLoading={loadingCommitments}
          />

          <button
            type="submit"
            disabled={
              !isConnected ||
              mutation.isPending ||
              isExecuting ||
              !verifiedAccountName ||
              commitments.length === 0
            }
            className="btn-neon w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent-orange to-brand-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-accent-orange/30 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-accent-orange/50 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {mutation.isPending || isExecuting ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>{isExecuting ? "Executing..." : "Processing..."}</span>
              </>
            ) : txSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>Success!</span>
              </>
            ) : !isConnected ? (
              "Connect Wallet First"
            ) : commitments.length === 0 ? (
              "No Commitments Available"
            ) : !verifiedAccountName ? (
              "Verify Account First"
            ) : (
              "Sell & Offramp"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
