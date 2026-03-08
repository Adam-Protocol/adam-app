"use client";

import { useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { motion } from "framer-motion";
import { Wallet, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

interface WalletGuardProps {
  children: React.ReactNode;
  showAlert?: boolean;
}

export function WalletGuard({ children, showAlert = true }: WalletGuardProps) {
  const { isConnected } = useAccount();
  const { connectWallet } = useWallet();

  useEffect(() => {
    if (!isConnected && showAlert) {
      toast.error("Wallet Not Connected", {
        description: "Please connect your wallet to access this page",
        duration: 4000,
      });
    }
  }, [isConnected, showAlert]);

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-2 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-border rounded-2xl p-8 sm:p-12 text-center"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-red/20 to-accent-amber/20 flex items-center justify-center border border-accent-red/30">
            <AlertCircle
              size={32}
              className="text-accent-red sm:w-10 sm:h-10"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-3">
            Wallet Not Connected
          </h2>

          <p className="text-white/50 text-sm sm:text-base mb-6 max-w-md mx-auto">
            You need to connect your wallet to access this page. Connect your
            Argent X or Braavos wallet to continue.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={connectWallet}
            className="btn-neon inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all"
          >
            <Wallet size={18} />
            Connect Wallet
          </motion.button>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/30">
              Supported wallets: Argent X, Braavos
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
