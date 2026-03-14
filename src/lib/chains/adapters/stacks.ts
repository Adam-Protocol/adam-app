import {
  ChainAdapter,
  ChainType,
  WalletAccount,
  TransactionParams,
  TransactionResult,
  TransactionIntent,
} from "../types";
import { MULTI_CHAIN_TOKENS } from "../config";

export class StacksAdapter implements ChainAdapter {
  chainType = ChainType.STACKS;
  private currentAccount: WalletAccount | null = null;

  async connect(): Promise<WalletAccount | null> {
    if (typeof window === "undefined") {
      throw new Error("Stacks Connect only works in browser");
    }

    try {
      const { request } = await import("@stacks/connect");

      // Use stx_getAddresses to trigger wallet connection
      // This will show the wallet selection popup
      const addressResponse = await request("stx_getAddresses", {});

      if (addressResponse?.addresses?.[0]?.address) {
        this.currentAccount = {
          address: addressResponse.addresses[0].address,
          publicKey: addressResponse.addresses[0].publicKey ?? "",
          chainType: ChainType.STACKS,
        };

        return this.currentAccount;
      }

      return null;
    } catch (error) {
      console.error("Stacks wallet connection failed:", error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const { disconnect } = await import("@stacks/connect");
      disconnect();
      this.currentAccount = null;
    } catch (error) {
      console.error("Stacks disconnect failed:", error);
    }
  }

  getAccount(): WalletAccount | null {
    // Check if user is already connected via localStorage
    if (!this.currentAccount && typeof window !== "undefined") {
      try {
        const getLocalStorage = async () => {
          const { getLocalStorage } = await import("@stacks/connect");
          return getLocalStorage();
        };

        getLocalStorage()
          .then((userData) => {
            if (userData?.addresses?.stx?.[0]?.address) {
              // Note: publicKey is not available in localStorage (stripped for security)
              this.currentAccount = {
                address: userData.addresses.stx[0].address,
                publicKey: "", // Not available from storage
                chainType: ChainType.STACKS,
              };
            }
          })
          .catch((error) => {
            console.error("Failed to get Stacks account from storage:", error);
          });
      } catch (error) {
        console.error("Failed to get Stacks account from storage:", error);
      }
    }

    return this.currentAccount;
  }

  isConnected(): boolean {
    if (typeof window === "undefined") return false;

    try {
      // Use dynamic import in an async context
      import("@stacks/connect")
        .then(({ isConnected }) => {
          return isConnected();
        })
        .catch(() => false);

      // For synchronous check, rely on currentAccount
      return this.currentAccount !== null;
    } catch {
      return false;
    }
  }

  async executeTransaction(
    params: TransactionParams,
  ): Promise<TransactionResult> {
    if (typeof window === "undefined") {
      throw new Error("Transactions only work in browser");
    }

    if (!this.currentAccount) {
      throw new Error("Wallet not connected");
    }

    try {
      const { request } = await import("@stacks/connect");

      // Build transaction options based on function name
      const txOptions = this.buildTransactionOptions(params);

      // Request transaction via Stacks Connect
      const response = await request("stx_callContract", txOptions);

      return {
        hash: response.txid || "",
        chainType: ChainType.STACKS,
      };
    } catch (error) {
      console.error("Stacks transaction failed:", error);
      throw error;
    }
  }

  private buildTransactionOptions(params: TransactionParams): any {
    // Parse contract address (format: address.contract-name)
    const [contractAddress, contractName] = params.contractAddress.split(".");

    return {
      contractAddress,
      contractName,
      functionName: params.functionName,
      functionArgs: params.args,
    };
  }

  async getBalance(address: string, tokenAddress?: string): Promise<bigint> {
    if (!tokenAddress) {
      // Get native STX balance
      try {
        const response = await fetch(
          `https://api.testnet.hiro.so/extended/v1/address/${address}/balances`,
        );
        const data = await response.json();
        return BigInt(data.stx.balance || "0");
      } catch (error) {
        console.error("Failed to fetch STX balance:", error);
        return BigInt(0);
      }
    }

    // Get SIP-010 token balance
    try {
      const [contractAddress, contractName] = tokenAddress.split(".");
      const response = await fetch(
        `https://api.testnet.hiro.so/v2/contracts/call-read/${contractAddress}/${contractName}/get-balance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: address,
            arguments: [`0x${Buffer.from(address).toString("hex")}`],
          }),
        },
      );

      const data = await response.json();
      return BigInt(data.result || "0");
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
      return BigInt(0);
    }
  }

  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint,
  ): Promise<TransactionResult> {
    // Stacks SIP-010 has no allowance model — this is a no-op.
    // The method exists only to satisfy ChainAdapter; requiresApproval() returns false.
    return this.executeTransaction({
      contractAddress: tokenAddress,
      functionName: "transfer",
      args: [
        amount.toString(),
        this.currentAccount?.address,
        spenderAddress,
        null,
      ],
    });
  }

  /**
   * All Stacks-specific encoding lives here:
   * - amounts are plain strings (Clarity uint)
   * - canonical token symbols → Stacks contract addresses (e.g. "ST1X.adam-token")
   * - no ABI needed — Stacks uses dynamic dispatch
   */
  buildTransactionArgs(
    intent: TransactionIntent,
    contractAddress: string,
  ): TransactionParams {
    const tokenIn =
      MULTI_CHAIN_TOKENS[intent.tokenIn.toUpperCase()]?.addresses[
        ChainType.STACKS
      ] ?? "";
    const tokenOut =
      MULTI_CHAIN_TOKENS[intent.tokenOut.toUpperCase()]?.addresses[
        ChainType.STACKS
      ] ?? "";
    // Clarity uint — plain string representation
    const amountStr = intent.amountIn.toString();

    if (intent.action === "buy") {
      return {
        contractAddress,
        functionName: "buy",
        args: [tokenIn, amountStr, tokenOut, intent.commitment ?? ""],
      };
    }

    if (intent.action === "swap") {
      const minAmountStr = (intent.minAmountOut ?? 0n).toString();
      return {
        contractAddress,
        functionName: "swap",
        args: [tokenIn, amountStr, tokenOut, minAmountStr, intent.commitment ?? ""],
      };
    }

    throw new Error(`Unsupported action '${intent.action}' on Stacks adapter`);
  }

  /**
   * Stacks SIP-010 tokens do NOT require a separate approve step —
   * the contract call itself handles transfers atomically.
   */
  requiresApproval(_intent: TransactionIntent): boolean {
    return false;
  }
}
