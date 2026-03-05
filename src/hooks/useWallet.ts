import { useCallback } from 'react';
import { useAccount, useDisconnect } from '@starknet-react/core';
import { connect } from 'starknetkit';
import { InjectedConnector } from 'starknetkit/injected';
import { WebWalletConnector } from 'starknetkit/webwallet';

/**
 * Wrapper around starknetkit's connect() with recommended connectors.
 * Returns address, shortAddress, isConnected, connectWallet, disconnect.
 */
export function useWallet() {
  const { address, isConnected, status } = useAccount();
  const { disconnect } = useDisconnect();

  const connectWallet = useCallback(async () => {
    try {
      const { wallet } = await connect({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark',
        connectors: [
          new InjectedConnector({ options: { id: 'argentX', name: 'Argent X' } }),
          new InjectedConnector({ options: { id: 'braavos', name: 'Braavos' } }),
          new WebWalletConnector({ url: 'https://web.argent.xyz' }),
        ],
      });
      return wallet;
    } catch (err) {
      console.error('Wallet connect failed:', err);
      return null;
    }
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return {
    address,
    shortAddress,
    isConnected,
    status,
    connectWallet,
    disconnect,
  };
}
