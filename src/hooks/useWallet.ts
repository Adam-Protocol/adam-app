import { useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, Connector } from '@starknet-react/core';
import { useStarknetkitConnectModal, StarknetkitConnector } from 'starknetkit';

/**
 * Wrapper around starknetkit modal with @starknet-react/core integration.
 * Returns address, shortAddress, isConnected, connectWallet, disconnect.
 */
export function useWallet() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
  });

  const connectWallet = useCallback(async () => {
    try {
      const { connector } = await starknetkitConnectModal();
      if (!connector) {
        return null;
      }
      await connect({ connector: connector as Connector });
      return connector;
    } catch (err) {
      console.error('Wallet connect failed:', err);
      return null;
    }
  }, [starknetkitConnectModal, connect]);

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
