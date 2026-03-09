"use client";

import { useEffect } from "react";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useRouter } from "next/navigation";

interface WalletGuardProps {
  children: React.ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const { isConnected } = useMultiChainWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  return <>{children}</>;
}
