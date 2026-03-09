"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  Coins,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BalanceModal } from "@/components/ui/BalanceModal";
import { useBalances } from "@/hooks/useBalances";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-border p-4 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-xs">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-black text-white truncate">{value}</p>
    </motion.div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: any) {
  return (
    <Link href={href} className="flex-1">
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center gap-2 cursor-pointer"
      >
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
        >
          <Icon size={24} className="text-white" />
        </div>
        <p className="font-medium text-white text-xs text-center">{label}</p>
      </motion.div>
    </Link>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  return (
    <WalletGuard>
      <DashboardPageContent address={address} isConnected={isConnected} />
    </WalletGuard>
  );
}

function DashboardPageContent({
  address,
  isConnected,
}: {
  address: string | undefined;
  isConnected: boolean | undefined;
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
  } = useBalances(address, isConnected);

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["activity", address],
    queryFn: () =>
      address
        ? axios
          .get(`${API}/activity/${address}`, { params: { limit: 5 } })
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
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
              {isBalanceHidden ? (
                "••••••"
              ) : balancesLoading ? (
                "..."
              ) : balancesError ? (
                "$0.00"
              ) : (
                currentBalance?.value || "$0.00"
              )}
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
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <p className="text-xs font-medium text-white text-center">Bills & Airtime</p>
              </button>

              <button
                onClick={() => toast.info("Coming soon!")}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full border border-accent-cyan/30 hover:border-accent-cyan/50 flex items-center justify-center transition-all backdrop-blur-sm"
                >
                  <svg className="w-7 h-7 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </motion.div>
                <p className="text-xs font-medium text-white text-center">Gift Cards</p>
              </button>

              <button
                onClick={() => toast.info("Coming soon!")}
                className="flex-shrink-0 flex flex-col items-center gap-2"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full border border-accent-orange/30 hover:border-accent-orange/50 flex items-center justify-center transition-all backdrop-blur-sm"
                >
                  <svg className="w-7 h-7 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </motion.div>
                <p className="text-xs font-medium text-white text-center">Invoice</p>
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
          <div className="gradient-border overflow-hidden rounded-2xl">
            {activityLoading ? (
              <div className="py-16 text-center">
                <LoadingSpinner
                  size="md"
                  className="mx-auto text-brand-400 mb-3"
                />
                <p className="text-white/30 text-sm">Loading activity...</p>
              </div>
            ) : activity?.data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40">
                      <th className="text-left px-5 py-3 font-medium">Type</th>
                      <th className="text-left px-5 py-3 font-medium">Token</th>
                      <th className="text-left px-5 py-3 font-medium">
                        Status
                      </th>
                      <th className="text-left px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.data.map((tx: any) => (
                      <tr
                        key={tx.id}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-white capitalize">
                          {tx.type}
                        </td>
                        <td className="px-5 py-3.5 text-white/60">
                          {tx.token_in} → {tx.token_out}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`token-badge ${tx.status === "completed"
                                ? "bg-accent-green/15 text-accent-green"
                                : tx.status === "failed"
                                  ? "bg-accent-red/15 text-accent-red"
                                  : "bg-accent-amber/15 text-accent-amber"
                              }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-white/40">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-white/30">
                <Coins size={32} className="mx-auto mb-3 opacity-30" />
                <p>No transactions yet</p>
              </div>
            )}
          </div>
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
