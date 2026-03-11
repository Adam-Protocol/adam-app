"use client";

import { useAccount } from "@starknet-react/core";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useChain } from "@/contexts/ChainContext";

/**
 * Temporary debug component to verify wallet connection state.
 * Add this to your page to see the wallet connection status.
 *
 * Usage:
 * import { WalletDebug } from '@/components/WalletDebug';
 *
 * <WalletDebug />
 */
export function WalletDebug() {
  const account = useAccount();
  const wallet = useMultiChainWallet();
  const { currentChain } = useChain();

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg border border-white/20 text-xs font-mono max-w-md z-50">
      <h3 className="font-bold mb-2 text-brand-400">Wallet Debug Info</h3>

      <div className="space-y-1">
        <div>
          <span className="text-white/50">Current Chain:</span>{" "}
          <span className="text-purple-400">{currentChain}</span>
        </div>

        <div className="pt-2 border-t border-white/10 mt-2">
          <span className="text-white/50">
            useAccount.isConnected (Starknet):
          </span>{" "}
          <span
            className={account.isConnected ? "text-green-400" : "text-red-400"}
          >
            {String(account.isConnected)}
          </span>
        </div>

        <div>
          <span className="text-white/50">useAccount.status:</span>{" "}
          <span className="text-yellow-400">{account.status}</span>
        </div>

        <div>
          <span className="text-white/50">useAccount.address:</span>{" "}
          <span className="text-blue-400 break-all">
            {account.address || "null"}
          </span>
        </div>

        <div className="pt-2 border-t border-white/10 mt-2">
          <span className="text-white/50">
            useMultiChainWallet.isConnected:
          </span>{" "}
          <span
            className={wallet.isConnected ? "text-green-400" : "text-red-400"}
          >
            {String(wallet.isConnected)}
          </span>
        </div>

        <div>
          <span className="text-white/50">useMultiChainWallet.address:</span>{" "}
          <span className="text-blue-400 break-all">
            {wallet.address || "null"}
          </span>
        </div>

        <div>
          <span className="text-white/50">
            useMultiChainWallet.shortAddress:
          </span>{" "}
          <span className="text-blue-400">{wallet.shortAddress || "null"}</span>
        </div>
      </div>

      <button
        onClick={() => wallet.connectWallet()}
        className="mt-3 px-3 py-1 bg-brand-500 rounded text-white text-xs hover:bg-brand-600 transition-colors"
      >
        Test Connect ({currentChain})
      </button>
    </div>
  );
}
