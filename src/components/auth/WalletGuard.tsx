"use client";

import { useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useRouter } from "next/navigation";

interface WalletGuardProps {
  children: React.ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const { isConnected } = useAccount();
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
