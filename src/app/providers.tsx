'use client';

import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StarknetConfig, publicProvider, voyager, Connector } from '@starknet-react/core';
import { sepolia, mainnet } from '@starknet-react/chains';
import { Toaster } from 'sonner';
import { InjectedConnector } from 'starknetkit/injected';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const connectors = [
    new InjectedConnector({
      options: { id: 'argentX', name: 'Argent X' },
    }),
    new InjectedConnector({
      options: { id: 'braavos', name: 'Braavos' },
    }),
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={[sepolia, mainnet]}
        provider={publicProvider()}
        connectors={connectors as Connector[]}
        explorer={voyager}
        autoConnect
      >
        <HeroUIProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
            {children}
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(10, 15, 30, 0.95)',
                  border: '1px solid rgba(91, 111, 243, 0.3)',
                  color: '#e2e8f0',
                },
              }}
            />
          </ThemeProvider>
        </HeroUIProvider>
      </StarknetConfig>
    </QueryClientProvider>
  );
}
