"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ConnectionStatus() {
  const [isVisible, setIsVisible] = useState(false);

  const {
    data: health,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["health"],
    queryFn: () => axios.get(`${API}/`).then((r) => r.data),
    refetchInterval: 10_000,
    retry: 2,
  });

  useEffect(() => {
    if (isError) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  if (isLoading) return null;

  const isConnected = !isError && health;

  return (
    <AnimatePresence>
      {(isVisible || isError) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-50"
        >
          <div
            className={`glass-strong rounded-xl px-4 py-2.5 flex items-center gap-2 border ${
              isConnected
                ? "border-accent-green/30 bg-accent-green/5"
                : "border-accent-red/30 bg-accent-red/5"
            }`}
          >
            {isConnected ? (
              <>
                <CheckCircle2 size={16} className="text-accent-green" />
                <span className="text-sm text-white/90">Backend Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-accent-red" />
                <span className="text-sm text-white/90">Backend Offline</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
