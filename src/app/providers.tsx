"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  StarknetConfig,
  jsonRpcProvider,
  voyager,
  Connector,
} from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { Toaster } from "sonner";
import { InjectedConnector } from "starknetkit/injected";
import { RpcProvider, constants } from "starknet";
import { ChainProvider } from "@/contexts/ChainContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const connectors = [
    new InjectedConnector({
      options: { id: "argentX", name: "Argent X" },
    }),
    new InjectedConnector({
      options: { id: "braavos", name: "Braavos" },
    }),
  ];

  // Use custom RPC provider with v0.10 support
  const rpcUrl =
    process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
    "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/5QQMV6kqa3iDaH_EbNhTw";

  const provider = jsonRpcProvider({
    rpc: () => ({
      nodeUrl: rpcUrl,
      // For v0.10, we need to specify the chain ID properly
      chainId: constants.StarknetChainId.SN_SEPOLIA,
    }),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={[sepolia, mainnet]}
        provider={provider}
        connectors={connectors as Connector[]}
        explorer={voyager}
        autoConnect
      >
        <ChainProvider>
          <HeroUIProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              forcedTheme="dark"
            >
              {children}
              <Toaster
                richColors
                position="top-right"
                toastOptions={{
                  style: {
                    background: "rgba(10, 15, 30, 0.95)",
                    border: "1px solid rgba(91, 111, 243, 0.3)",
                    color: "#e2e8f0",
                  },
                }}
              />
            </ThemeProvider>
          </HeroUIProvider>
        </ChainProvider>
      </StarknetConfig>
    </QueryClientProvider>
  );
}
