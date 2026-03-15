"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DollarSign,
  Coins,
  ChevronDown,
  Eye,
  EyeOff,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BalanceModal } from "@/components/ui/BalanceModal";
import { useBalances } from "@/hooks/useBalances";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  completed: { color: "text-accent-green", bg: "bg-accent-green/15" },
  failed: { color: "text-accent-red", bg: "bg-accent-red/15" },
  pending: { color: "text-accent-amber", bg: "bg-accent-amber/15" },
  processing: { color: "text-accent-cyan", bg: "bg-accent-cyan/15" },
};

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> =
  {
    buy: { icon: ShoppingCart, label: "Buy", color: "text-brand-400" },
    sell: { icon: TrendingUp, label: "Sell", color: "text-accent-orange" },
    swap: { icon: RefreshCw, label: "Swap", color: "text-accent-cyan" },
  };

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-border p-4 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-xs">{label}</span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-black text-white truncate">
        {value}
      </p>
    </motion.div>
  );
}

function TxCard({ tx }: { tx: any }) {
  const status = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
  const type = TYPE_CONFIG[tx.type] ?? {
    icon: ShoppingCart,
    label: tx.type,
    color: "text-white",
  };
  const TypeIcon = type.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-strong rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${type.color} shrink-0`}
          >
            <TypeIcon size={18} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm capitalize">
              {type.label}
            </p>
            <p className="text-xs text-white/40">
              {tx.token_in} → {tx.token_out}
            </p>
          </div>
        </div>
        <span className={`token-badge ${status.bg} ${status.color} text-xs`}>
          {tx.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40">
          {new Date(tx.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {tx.tx_hash && (
          <a
            href={`https://sepolia.voyager.online/tx/${tx.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
          >
            <ExternalLink size={12} />
            <span>View</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { address, isConnected, currentChain } = useMultiChainWallet();

  return (
    <WalletGuard>
      <DashboardPageContent
        address={address}
        isConnected={isConnected}
        currentChain={currentChain}
      />
    </WalletGuard>
  );
}

function DashboardPageContent({
  address,
  isConnected,
  currentChain,
}: {
  address: string | undefined;
  isConnected: boolean | undefined;
  currentChain: any;
}) {
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState("usdc");
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const {
    data: ratData,
    isLoading: rateLoading,
    isError: rateError,
  } = useQuery({
    queryKey: ["rate"],
    queryFn: () => axios.get(`${API}/swap/rate`).then((r) => r.data),
    refetchInterval: 30_000,
    retry: 3,
  });

  const {
    data: balances,
    isLoading: balancesLoading,
    isError: balancesError,
  } = useBalances(address, currentChain, isConnected);

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["activity", address],
    queryFn: () =>
      address
        ? axios
            .get(`${API}/activity/${address}`, { params: { limit: 3 } })
            .then((r) => r.data)
        : null,
    enabled: !!address,
    retry: 2,
  });

  // Prepare balance data for modal
  const balanceOptions = balances
    ? [
        {
          id: "usdc",
          label: "USDC Balance",
          symbol: "USDC",
          value: balances.balances.usdc.formatted,
          icon: DollarSign,
          color: "from-blue-500 to-blue-600",
        },
        {
          id: "adusd",
          label: "ADUSD Balance",
          symbol: "ADUSD",
          value: balances.balances.adusd.formatted,
          icon: DollarSign,
          color: "from-accent-cyan to-brand-500",
        },
        {
          id: "adngn",
          label: "Nigerian Naira",
          symbol: "₦",
          value: `₦${balances.balances.adngn.formatted}`,
          icon: Coins,
          color: "from-accent-orange to-brand-500",
          flag: "🇳🇬",
        },
        {
          id: "adkes",
          label: "Kenyan Shilling",
          symbol: "KSh",
          value: `KSh${balances.balances.adkes.formatted}`,
          icon: Coins,
          color: "from-green-500 to-brand-500",
          flag: "🇰🇪",
        },
        {
          id: "adghs",
          label: "Ghanaian Cedi",
          symbol: "₵",
          value: `₵${balances.balances.adghs.formatted}`,
          icon: Coins,
          color: "from-yellow-500 to-brand-500",
          flag: "🇬🇭",
        },
        {
          id: "adzar",
          label: "South African Rand",
          symbol: "R",
          value: `R${balances.balances.adzar.formatted}`,
          icon: Coins,
          color: "from-blue-500 to-brand-500",
          flag: "🇿🇦",
        },
      ]
    : [];

  const currentBalance = balanceOptions.find((b) => b.id === selectedBalance);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Mobile Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-white">
              Dashboard
            </h1>
          </div>
          <button className="glass px-3 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white transition-colors md:hidden">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        </div>

        {/* Rate Display */}
        {/* {ratData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass px-4 py-2.5 rounded-xl border border-white/10 text-sm inline-flex items-center gap-2 w-fit"
          >
            <span className="text-white/40">1 USD = </span>
            <span className="font-bold text-white">
              ₦{ratData.usd_ngn?.toFixed(2)}
            </span>
          </motion.div>
        )} */}
        {/* {rateLoading && (
          <div className="glass px-4 py-2 rounded-xl border border-white/10 w-fit">
            <LoadingSpinner size="sm" className="text-brand-400" />
          </div>
        )} */}
        {/* {rateError && (
          <div className="glass px-4 py-2 rounded-xl border border-accent-red/30 text-sm flex items-center gap-2 w-fit">
            <AlertCircle size={14} className="text-accent-red" />
            <span className="text-white/60">Rate unavailable</span>
          </div>
        )} */}
      </div>

      {/* Primary Balance Card with Selector - Mobile Optimized */}
      <div className="flex flex-col space-y-3">
        {/* Currency Selector Button - Mobile Only */}
        <div className="md:hidden flex justify-center">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsBalanceModalOpen(true)}
            className="glass px-4 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 transition-all inline-flex items-center gap-2"
          >
            {currentBalance?.flag && (
              <span className="text-lg">{currentBalance.flag}</span>
            )}
            <span className="text-sm font-medium text-white">
              {currentBalance?.label || "Select Currency"}
            </span>
            <ChevronDown size={16} className="text-white/50" />
          </motion.button>
        </div>

        {/* Main Balance Card - Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden gradient-border p-5 flex flex-col gap-2"
        >
          <div className="flex items-center justify-center gap-3 min-h-[3rem] mb-2">
            <p className="text-3xl font-bold text-white break-all">
              {isBalanceHidden
                ? "••••••"
                : balancesLoading
                  ? "..."
                  : balancesError
                    ? "$0.00"
                    : currentBalance?.value || "$0.00"}
            </p>
            <button
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="text-white/50 hover:text-white transition-colors p-1 flex-shrink-0"
            >
              {isBalanceHidden ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div>
            <div className="flex gap-4 justify-center md:justify-start overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => toast.info("Coming soon!")}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full border border-blue-500/30 hover:border-blue-500/50 flex items-center justify-center transition-all backdrop-blur-sm"
                >
                  <svg
                    className="w-7 h-7 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </motion.div>
                <p className="text-xs font-medium text-white text-center">
                  Bills & Airtime
                </p>
              </button>

              <button
                onClick={() => toast.info("Coming soon!")}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full border border-accent-cyan/30 hover:border-accent-cyan/50 flex items-center justify-center transition-all backdrop-blur-sm"
                >
                  <svg
                    className="w-7 h-7 text-accent-cyan"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </motion.div>
                <p className="text-xs font-medium text-white text-center">
                  Gift Cards
                </p>
              </button>

              <button
                onClick={() => toast.info("Coming soon!")}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full border border-accent-orange/30 hover:border-accent-orange/50 flex items-center justify-center transition-all backdrop-blur-sm"
                >
                  <svg
                    className="w-7 h-7 text-accent-orange"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </motion.div>
                <p className="text-xs font-medium text-white text-center">
                  Invoice
                </p>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Desktop - All Balance Cards Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="USDC Balance"
            value={
              balancesLoading
                ? "..."
                : balancesError
                  ? "$0.00"
                  : balances
                    ? `${balances.balances.usdc.formatted}`
                    : "$0.00"
            }
            icon={DollarSign}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            label="ADUSD"
            value={
              balancesLoading
                ? "..."
                : balancesError
                  ? "Error"
                  : balances
                    ? `${balances.balances.adusd.formatted}`
                    : "—"
            }
            icon={DollarSign}
            color="bg-gradient-to-br from-accent-cyan to-brand-500"
          />
          <StatCard
            label="ADNGN"
            value={
              balancesLoading
                ? "..."
                : balancesError
                  ? "Error"
                  : balances
                    ? `₦${balances.balances.adngn.formatted}`
                    : "—"
            }
            icon={Coins}
            color="bg-gradient-to-br from-accent-orange to-brand-500"
          />
          <StatCard
            label="ADKES"
            value={
              balancesLoading
                ? "..."
                : balancesError
                  ? "Error"
                  : balances
                    ? `KSh${balances.balances.adkes.formatted}`
                    : "—"
            }
            icon={Coins}
            color="bg-gradient-to-br from-green-500 to-brand-500"
          />
          <StatCard
            label="ADGHS"
            value={
              balancesLoading
                ? "..."
                : balancesError
                  ? "Error"
                  : balances
                    ? `₵${balances.balances.adghs.formatted}`
                    : "—"
            }
            icon={Coins}
            color="bg-gradient-to-br from-yellow-500 to-brand-500"
          />
          <StatCard
            label="ADZAR"
            value={
              balancesLoading
                ? "..."
                : balancesError
                  ? "Error"
                  : balances
                    ? `R${balances.balances.adzar.formatted}`
                    : "—"
            }
            icon={Coins}
            color="bg-gradient-to-br from-blue-500 to-brand-500"
          />
        </div>

        {/* Desktop - Quick Action Buttons */}
        <div className="hidden md:flex gap-4 justify-center mt-6">
          <button
            onClick={() => toast.info("Coming soon!")}
            className="flex flex-col items-center gap-3 group"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-2xl border border-blue-500/30 hover:border-blue-500/50 flex items-center justify-center transition-all backdrop-blur-sm group-hover:bg-blue-500/5"
            >
              <svg
                className="w-9 h-9 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>
            <p className="text-sm font-medium text-white">Bills & Airtime</p>
          </button>

          <button
            onClick={() => toast.info("Coming soon!")}
            className="flex flex-col items-center gap-3 group"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-2xl border border-accent-cyan/30 hover:border-accent-cyan/50 flex items-center justify-center transition-all backdrop-blur-sm group-hover:bg-accent-cyan/5"
            >
              <svg
                className="w-9 h-9 text-accent-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </motion.div>
            <p className="text-sm font-medium text-white">Gift Cards</p>
          </button>

          <button
            onClick={() => toast.info("Coming soon!")}
            className="flex flex-col items-center gap-3 group"
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-2xl border border-accent-orange/30 hover:border-accent-orange/50 flex items-center justify-center transition-all backdrop-blur-sm group-hover:bg-accent-orange/5"
            >
              <svg
                className="w-9 h-9 text-accent-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </motion.div>
            <p className="text-sm font-medium text-white">Invoice</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {isConnected && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Recent transactions
            </h2>
            <Link
              href="/app/activity"
              className="text-brand-400 text-sm hover:underline"
            >
              See all
            </Link>
          </div>
          {activityLoading ? (
            <div className="gradient-border rounded-2xl py-16 text-center">
              <LoadingSpinner
                size="md"
                className="mx-auto text-brand-400 mb-3"
              />
              <p className="text-white/30 text-sm">Loading activity...</p>
            </div>
          ) : activity?.data?.length > 0 ? (
            <div className="space-y-3">
              {activity.data.map((tx: any) => (
                <TxCard key={tx.id} tx={tx} />
              ))}
            </div>
          ) : (
            <div className="gradient-border rounded-2xl py-16 text-center text-white/30">
              <Coins size={32} className="mx-auto mb-3 opacity-30" />
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      )}

      {/* Balance Modal - Mobile Only */}
      <BalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        balances={balanceOptions}
        selectedBalance={selectedBalance}
        onSelectBalance={setSelectedBalance}
      />
    </div>
  );
}
