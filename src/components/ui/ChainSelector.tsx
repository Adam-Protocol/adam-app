"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useChain } from "@/contexts/ChainContext";
import { ChainType } from "@/lib/chains/types";
import { CHAIN_CONFIGS } from "@/lib/chains/config";

const CHAIN_LOGOS: Record<ChainType, string> = {
  [ChainType.STARKNET]: "/strk png/SN-Symbol-Gradient - On dark bg.png",
  [ChainType.STACKS]: "/stacks-stx-logo.svg",
};

export function ChainSelector() {
  const { currentChain, setCurrentChain, isConnected } = useChain();
  const [isOpen, setIsOpen] = useState(false);

  const chains = Object.values(CHAIN_CONFIGS);
  const selectedChain = CHAIN_CONFIGS[currentChain];

  const handleChainChange = async (chainType: ChainType) => {
    if (isConnected) {
      // Show warning if user is connected
      const confirmed = window.confirm(
        "Switching chains will disconnect your wallet. Continue?",
      );
      if (!confirmed) return;
    }

    setCurrentChain(chainType);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glass px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all inline-flex items-center gap-2 min-w-[120px] sm:min-w-[140px]"
      >
        <div className="relative w-5 h-5 flex-shrink-0">
          <Image
            src={CHAIN_LOGOS[currentChain]}
            alt={selectedChain.displayName}
            fill
            className="object-contain"
          />
        </div>
        <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">
          {selectedChain.displayName}
        </span>
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 z-50 bg-[rgba(10,15,30,0.95)] backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden min-w-[200px] shadow-2xl"
            >
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleChainChange(chain.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <Image
                      src={CHAIN_LOGOS[chain.id]}
                      alt={chain.displayName}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {chain.displayName}
                    </p>
                    <p className="text-xs text-white/40">
                      {chain.nativeCurrency.symbol}
                    </p>
                  </div>
                  {currentChain === chain.id && (
                    <Check size={16} className="text-brand-400" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
