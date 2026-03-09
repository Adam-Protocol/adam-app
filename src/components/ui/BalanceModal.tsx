"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { clsx } from "clsx";

interface Balance {
  id: string;
  label: string;
  symbol: string;
  value: string;
  icon: any;
  color: string;
  flag?: string;
}

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Balance[];
  selectedBalance: string;
  onSelectBalance: (balanceId: string) => void;
}

export function BalanceModal({
  isOpen,
  onClose,
  balances,
  selectedBalance,
  onSelectBalance,
}: BalanceModalProps) {
  const handleSelect = (balanceId: string) => {
    onSelectBalance(balanceId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-xl font-bold text-white">Accounts</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Balance List */}
            <div className="px-4 pb-safe pb-6 overflow-y-auto max-h-[calc(85vh-70px)] custom-scrollbar">
              {/* FIAT Section */}
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-2 mb-3">
                  FIAT
                </p>
                <div className="space-y-2">
                  {balances
                    .filter((b) => b.id === "usdc")
                    .map((balance) => {
                      const Icon = balance.icon;
                      const isSelected = selectedBalance === balance.id;

                      return (
                        <motion.button
                          key={balance.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelect(balance.id)}
                          className={clsx(
                            "w-full rounded-2xl p-4 border transition-all text-left relative overflow-hidden",
                            isSelected
                              ? "border-brand-400/50 bg-brand-500/10"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${balance.color} flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon size={22} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white/50 mb-0.5">
                                {balance.label}
                              </p>
                              <p className="text-2xl font-bold text-white truncate">
                                {balance.value}
                              </p>
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-7 h-7 rounded-full bg-brand-400 flex items-center justify-center flex-shrink-0"
                              >
                                <Check size={16} className="text-white" strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              </div>

              {/* Stablecoins Section */}
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-2 mb-3">
                  Stablecoins
                </p>
                <div className="space-y-2">
                  {balances
                    .filter((b) => b.id !== "usdc")
                    .map((balance) => {
                      const Icon = balance.icon;
                      const isSelected = selectedBalance === balance.id;

                      return (
                        <motion.button
                          key={balance.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelect(balance.id)}
                          className={clsx(
                            "w-full rounded-2xl p-4 border transition-all text-left relative overflow-hidden",
                            isSelected
                              ? "border-brand-400/50 bg-brand-500/10"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${balance.color} flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon size={22} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white/50 mb-0.5">
                                {balance.label}
                              </p>
                              <p className="text-2xl font-bold text-white truncate">
                                {balance.value}
                              </p>
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-7 h-7 rounded-full bg-brand-400 flex items-center justify-center flex-shrink-0"
                              >
                                <Check size={16} className="text-white" strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
