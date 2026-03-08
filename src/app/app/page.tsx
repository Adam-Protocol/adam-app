"use client";

import { motion } from "framer-motion";
import { useAccount } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  DollarSign,
  Coins,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { WalletGuard } from "@/components/auth/WalletGuard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useBalances } from "@/hooks/useBalances";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function StatCard({ label, value, icon: Icon, color, change }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="gradient-border p-5 sm:p-6 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-xs sm:text-sm">{label}</span>
        <div
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-white">{value}</p>
      {change && (
        <p className="text-xs text-accent-green flex items-center gap-1">
          <TrendingUp size={12} /> {change}
        </p>
      )}
    </motion.div>
  );
}

function QuickAction({ href, icon: Icon, label, desc, color }: any) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="glass-strong rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
      >
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}
        >
          <Icon size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
        </div>
        <p className="font-semibold text-white text-sm sm:text-base">{label}</p>
        <p className="text-xs text-white/40 mt-1 hidden sm:block">{desc}</p>
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Dashboard
          </h1>
          <p className="text-white/40 text-sm mt-1 break-all">
            {isConnected && address
              ? `${address.slice(0, 10)}...${address.slice(-6)}`
              : "Connect your wallet to get started"}
          </p>
        </div>
        {ratData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass px-4 py-2 rounded-xl border border-white/10 text-sm whitespace-nowrap"
          >
            <span className="text-white/40">1 USD = </span>
            <span className="font-bold text-white">
              ₦{ratData.usd_ngn?.toFixed(2)}
            </span>
          </motion.div>
        )}
        {rateLoading && (
          <div className="glass px-4 py-2 rounded-xl border border-white/10">
            <LoadingSpinner size="sm" className="text-brand-400" />
          </div>
        )}
        {rateError && (
          <div className="glass px-4 py-2 rounded-xl border border-accent-red/30 text-sm flex items-center gap-2">
            <AlertCircle size={14} className="text-accent-red" />
            <span className="text-white/60">Rate unavailable</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="USDC Balance"
          value={
            balancesLoading
              ? "..."
              : balancesError
                ? "$0.00"
                : balances
                  ? `$${balances.balances.usdc.formatted}`
                  : "$0.00"
          }
          icon={DollarSign}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          label="ADUSD Balance"
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
          label="ADNGN Balance"
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
          color="bg-gradient-to-br from-accent-purple to-brand-500"
        />
        <StatCard
          label="Live Rate"
          value={
            rateLoading
              ? "..."
              : rateError
                ? "N/A"
                : ratData
                  ? `₦${ratData.usd_ngn?.toFixed(0)}`
                  : "..."
          }
          icon={TrendingUp}
          color="bg-gradient-to-br from-accent-green to-accent-cyan"
          change={rateError ? "Offline" : "Updates every 5 min"}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <QuickAction
            href="/app/buy"
            icon={ArrowDownRight}
            label="Buy"
            desc="Mint with USDC"
            color="from-brand-500 to-accent-cyan"
          />
          <QuickAction
            href="/app/sell"
            icon={ArrowUpRight}
            label="Sell"
            desc="Offramp to bank"
            color="from-accent-purple to-brand-500"
          />
          <QuickAction
            href="/app/swap"
            icon={RefreshCw}
            label="Swap"
            desc="ADUSD ↔ ADNGN"
            color="from-accent-cyan to-accent-purple"
          />
          <QuickAction
            href="/app/activity"
            icon={TrendingUp}
            label="Activity"
            desc="View history"
            color="from-accent-green to-brand-500"
          />
        </div>
      </div>

      {/* Recent Activity */}
      {isConnected && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <Link
              href="/app/activity"
              className="text-brand-400 text-sm hover:underline"
            >
              View all
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
                            className={`token-badge ${
                              tx.status === "completed"
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
    </div>
  );
}
