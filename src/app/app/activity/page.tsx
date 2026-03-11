"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ExternalLink,
  X,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { clsx } from "clsx";
import { WalletGuard } from "@/components/auth/WalletGuard";

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

function TxRowDesktop({ tx, onClick }: { tx: any; onClick: () => void }) {
  const status = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
  const type = TYPE_CONFIG[tx.type] ?? {
    icon: Activity,
    label: tx.type,
    color: "text-white",
  };
  const TypeIcon = type.icon;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${type.color}`}
          >
            <TypeIcon size={16} />
          </div>
          <span className="font-medium text-white text-sm capitalize">
            {type.label}
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-white/50 text-sm">
        {tx.token_in} → {tx.token_out}
      </td>
      <td className="px-5 py-4">
        <span className={`token-badge ${status.bg} ${status.color} text-xs`}>
          {tx.status}
        </span>
      </td>
      <td className="px-5 py-4 text-white/40 text-xs">
        {new Date(tx.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="px-5 py-4">
        {tx.tx_hash && (
          <a
            href={`https://sepolia.voyager.online/tx/${tx.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </td>
    </motion.tr>
  );
}

function TxCardMobile({ tx, onClick }: { tx: any; onClick: () => void }) {
  const status = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
  const type = TYPE_CONFIG[tx.type] ?? {
    icon: Activity,
    label: tx.type,
    color: "text-white",
  };
  const TypeIcon = type.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className="glass-strong rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
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
            onClick={(e) => e.stopPropagation()}
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

function TxDrawer({ tx, onClose }: { tx: any; onClose: () => void }) {
  const status = STATUS_CONFIG[tx?.status] ?? STATUS_CONFIG.pending;
  return (
    <AnimatePresence>
      {tx && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md glass-strong border-l border-white/10 z-50 p-5 sm:p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Transaction Details
              </h2>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-2 -mr-2 active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                ["Type", tx.type?.toUpperCase()],
                ["Status", tx.status],
                ["Token In", tx.token_in],
                ["Token Out", tx.token_out],
                ["Reference", tx.reference_id ?? "—"],
                ["Currency", tx.currency ?? "—"],
                ["Created", new Date(tx.created_at).toLocaleString()],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-3 border-b border-white/5"
                >
                  <span className="text-white/40 text-sm">{label}</span>
                  <span
                    className={`text-sm font-medium ${label === "Status" ? `${status.color}` : "text-white"} break-all text-right ml-4`}
                  >
                    {value}
                  </span>
                </div>
              ))}
              {tx.tx_hash && (
                <a
                  href={`https://sepolia.voyager.online/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm mt-4 active:scale-98 transition-transform"
                >
                  <ExternalLink size={14} /> View on Explorer
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ActivityPage() {
  const { address, isConnected } = useMultiChainWallet();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  return (
    <WalletGuard>
      <ActivityPageContent
        address={address}
        isConnected={isConnected}
        page={page}
        setPage={setPage}
        filter={filter}
        setFilter={setFilter}
        selected={selected}
        setSelected={setSelected}
      />
    </WalletGuard>
  );
}

function ActivityPageContent({
  address,
  isConnected,
  page,
  setPage,
  filter,
  setFilter,
  selected,
  setSelected,
}: any) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity", address, page, filter],
    queryFn: () =>
      axios
        .get(`${API}/activity/${address}`, {
          params: { page, limit: 15, type: filter },
        })
        .then((r) => r.data),
    enabled: !!address,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-green to-brand-500 flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Activity</h1>
            <p className="text-white/40 text-sm">All your transactions</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter size={14} className="text-white/40 shrink-0" />
          {["all", "buy", "sell", "swap"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setFilter(t);
                setPage(1);
              }}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap",
                filter === t
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                  : "text-white/40 hover:text-white hover:bg-white/5",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!isConnected ? (
        <div className="gradient-border rounded-2xl py-20 text-center">
          <Activity size={40} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/40">Connect your wallet to view activity</p>
        </div>
      ) : (
        <div className="gradient-border overflow-hidden rounded-2xl">
          {isLoading ? (
            <div className="py-20 text-center text-white/30">Loading...</div>
          ) : data?.data?.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30">
                      <th className="text-left px-5 py-3.5 font-medium">
                        Type
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium">
                        Tokens
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium">
                        Status
                      </th>
                      <th className="text-left px-5 py-3.5 font-medium">
                        Date
                      </th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((tx: any) => (
                      <TxRowDesktop
                        key={tx.id}
                        tx={tx}
                        onClick={() => setSelected(tx)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden p-3 space-y-3">
                {data.data.map((tx: any) => (
                  <TxCardMobile
                    key={tx.id}
                    tx={tx}
                    onClick={() => setSelected(tx)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.meta.total_pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 px-4 py-3">
                  <p className="text-white/30 text-xs">
                    {data.meta.total} transactions
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p: number) => p - 1)}
                      className="px-3 py-1.5 glass rounded-lg text-xs text-white/60 hover:text-white disabled:opacity-30 transition-all"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1.5 text-xs text-white/40">
                      {page} / {data.meta.total_pages}
                    </span>
                    <button
                      disabled={page >= data.meta.total_pages}
                      onClick={() => setPage((p: number) => p + 1)}
                      className="px-3 py-1.5 glass rounded-lg text-xs text-white/60 hover:text-white disabled:opacity-30 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-white/30">
              <Activity size={36} className="mx-auto mb-3 opacity-30" />
              <p>No {filter === "all" ? "" : filter} transactions yet</p>
            </div>
          )}
        </div>
      )}

      <TxDrawer tx={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
