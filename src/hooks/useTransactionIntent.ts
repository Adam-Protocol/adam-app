import { useState, useCallback } from "react";
import { useChain } from "@/contexts/ChainContext";
import { TransactionIntent, TransactionResult, ChainType } from "@/lib/chains/types";
import { api } from "@/lib/api";

/**
 * Hook for executing any on-chain transaction in a chain-agnostic way.
 *
 * Flow:
 *  1. adapter.requiresApproval()  → wallet signs approve tx (Starknet only)
 *  2. adapter.buildTransactionArgs() → chain-specific encoding
 *  3. adapter.executeTransaction() → wallet signs main tx
 *  4. notifyBackend() → records tx + triggers offramp if sell
 *
 * Components never switch on chain type. Zero if/else chain checks.
 */

export type TransactionStage =
  | "idle"
  | "approving"
  | "signing"
  | "confirming"
  | "done"
  | "error";

interface UseTransactionIntentResult {
  execute: (intent: TransactionIntent) => Promise<string>;
  stage: TransactionStage;
  error: string | null;
  reset: () => void;
}

export function useTransactionIntent(): UseTransactionIntentResult {
  const { executeIntent, account, currentChain } = useChain();
  const [stage, setStage] = useState<TransactionStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
  }, []);

  const execute = useCallback(
    async (intent: TransactionIntent): Promise<string> => {
      if (!account) {
        throw new Error("Wallet not connected");
      }

      setStage("approving");
      setError(null);

      let result: TransactionResult;
      try {
        // executeIntent handles: approval check → sign approve (if needed) → sign main tx
        // The approving → signing transition happens inside executeIntent, but we
        // advance the stage to `signing` right before the main call so the UI reflects it.

        // For Stacks (no approval), we skip straight to signing
        setStage("signing");
        result = await executeIntent(intent);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transaction failed";
        setError(message);
        setStage("error");
        throw err;
      }

      setStage("confirming");

      try {
        // Record the transaction in the backend
        await notifyBackend(intent, result.hash, account.address, currentChain);
      } catch (err) {
        // Backend notification failure is non-fatal (tx already on-chain)
        console.error("Failed to notify backend of transaction:", err);
      }

      setStage("done");
      return result.hash;
    },
    [executeIntent, account, currentChain],
  );

  return { execute, stage, error, reset };
}

/**
 * Notifies the backend after a successful on-chain transaction.
 * The backend records the tx for activity history and triggers offramp for sells.
 */
async function notifyBackend(
  intent: TransactionIntent,
  txHash: string,
  walletAddress: string,
  chain: ChainType,
): Promise<void> {
  const chainParam = chain.toUpperCase() as "STARKNET" | "STACKS";

  if (intent.action === "buy") {
    await api.token.buy({
      wallet: walletAddress,
      amount_in: intent.amountIn.toString(),
      token_out: intent.tokenOut.toLowerCase() as
        | "adusd"
        | "adngn"
        | "adkes"
        | "adghs"
        | "adzar",
      commitment: intent.commitment ?? "",
      tx_hash: txHash,
      chain: chainParam,
    });
  } else if (intent.action === "sell") {
    // Sell notification is handled separately via useSellToken
    // since it requires bank account details not present in TransactionIntent
  }
}
