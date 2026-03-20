import {
  ChainAdapter,
  ChainType,
  WalletAccount,
  TransactionParams,
  TransactionResult,
  TransactionIntent,
} from "../types";
import { MULTI_CHAIN_TOKENS } from "../config";

/* eslint-disable @typescript-eslint/no-explicit-any */

const STACKS_SESSION_KEY = "adam-stacks-session";

interface StacksSession {
  address: string;
  publicKey: string;
  timestamp: number;
}

export class StacksAdapter implements ChainAdapter {
  chainType = ChainType.STACKS;
  private currentAccount: WalletAccount | null = null;
  private onAccountChangeCallback: ((account: WalletAccount | null) => void) | null = null;
  private isInitialized = false;

  constructor() {
    // Restore session on initialization
    this.restoreSession();
  }

  setAccountChangeListener(callback: (account: WalletAccount | null) => void) {
    this.onAccountChangeCallback = callback;
  }

  private notifyAccountChange() {
    if (this.onAccountChangeCallback) {
      this.onAccountChangeCallback(this.currentAccount);
    }
  }

  /**
   * Restore Stacks session from localStorage if available
   * This ensures the adapter state is consistent across page reloads
   */
  private restoreSession() {
    if (typeof window === "undefined") return;

    try {
      const sessionData = localStorage.getItem(STACKS_SESSION_KEY);
      if (sessionData) {
        const session: StacksSession = JSON.parse(sessionData);
        // Session expires after 24 hours
        const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000;

        if (!isExpired) {
          this.currentAccount = {
            address: session.address,
            publicKey: session.publicKey,
            chainType: ChainType.STACKS,
          };
          this.isInitialized = true;
        } else {
          // Clear expired session
          localStorage.removeItem(STACKS_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to restore Stacks session:", error);
      localStorage.removeItem(STACKS_SESSION_KEY);
    }
  }

  /**
   * Persist Stacks session to localStorage
   */
  private persistSession(account: WalletAccount) {
    if (typeof window === "undefined") return;

    try {
      const session: StacksSession = {
        address: account.address,
        publicKey: account.publicKey || "",
        timestamp: Date.now(),
      };
      localStorage.setItem(STACKS_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Failed to persist Stacks session:", error);
    }
  }

  /**
   * Clear Stacks session from localStorage
   */
  private clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STACKS_SESSION_KEY);
  }

  async connect(): Promise<WalletAccount | null> {
    if (typeof window === "undefined") {
      throw new Error("Stacks Connect only works in browser");
    }

    try {
      // Dynamic import with proper typing
      const stacksConnectModule = await import("@stacks/connect");
      const stacksConnect: any = stacksConnectModule;

      const connect = stacksConnect.connect;
      const isConnected = stacksConnect.isConnected;
      const request = stacksConnect.request;
      const getLocalStorage = stacksConnect.getLocalStorage;

      // Check if already connected using the new API
      if (isConnected()) {
        try {
          // Try to get existing account data from local storage first
          const userData = getLocalStorage();
          if (userData?.addresses?.stx?.[0]) {
            const stxAddress = userData.addresses.stx[0];
            this.currentAccount = {
              address: stxAddress.address,
              publicKey: stxAddress.publicKey || "",
              chainType: ChainType.STACKS,
            };
            this.persistSession(this.currentAccount);
            this.notifyAccountChange();
            return this.currentAccount;
          }

          // Fallback to request if localStorage doesn't have data
          const accounts = await request('stx_getAccounts');
          if (accounts?.addresses?.[0]) {
            const account = accounts.addresses[0];
            this.currentAccount = {
              address: account.address,
              publicKey: account.publicKey || "",
              chainType: ChainType.STACKS,
            };
            this.persistSession(this.currentAccount);
            this.notifyAccountChange();
            return this.currentAccount;
          }
        } catch (error) {
          console.log("Could not get existing accounts, prompting connection:", error);
        }
      }

      // Initiate new connection with wallet selection
      const response = await connect({
        appDetails: {
          name: "Adam Protocol",
          icon: `${window.location.origin}/fav-mobile-icon.png`,
        },
      });

      if (response?.addresses?.stx?.[0]) {
        const stxAddress = response.addresses.stx[0];
        this.currentAccount = {
          address: stxAddress.address,
          publicKey: stxAddress.publicKey || "",
          chainType: ChainType.STACKS,
        };
        this.persistSession(this.currentAccount);
        this.notifyAccountChange();
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
      const stacksConnectModule = await import("@stacks/connect");
      const stacksConnect: any = stacksConnectModule;
      const disconnect = stacksConnect.disconnect;

      disconnect();
      this.currentAccount = null;
      this.clearSession();
      this.notifyAccountChange();
    } catch (error) {
      console.error("Stacks disconnect failed:", error);
    }
  }

  getAccount(): WalletAccount | null {
    if (typeof window === "undefined") return null;

    // If not initialized yet, try to restore session
    if (!this.isInitialized) {
      this.restoreSession();
      this.isInitialized = true;
    }

    return this.currentAccount;
  }

  isConnected(): boolean {
    if (typeof window === "undefined") return false;

    // Ensure session is restored before checking connection
    if (!this.isInitialized) {
      this.restoreSession();
      this.isInitialized = true;
    }

    return this.currentAccount !== null;
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
      const stacksConnectModule = await import("@stacks/connect");
      const stacksConnect: any = stacksConnectModule;
      const request = stacksConnect.request;

      const { Cl } = await import("@stacks/transactions");

      console.log('Raw transaction params:', {
        contractAddress: params.contractAddress,
        functionName: params.functionName,
        args: params.args,
        argsTypes: params.args.map(arg => typeof arg),
      });

      // Convert args to Clarity values based on type
      const clarityArgs = params.args.map((arg: any, index: number) => {
        console.log(`Processing arg ${index}:`, { value: arg, type: typeof arg });

        if (typeof arg === "string") {
          // Check if it's a principal (standard or contract address)
          if (arg.startsWith("ST") || arg.startsWith("SP")) {
            console.log(`Converting to principal: ${arg}`);
            return Cl.principal(arg); // Auto-detects standard vs contract principal
          }
          // Otherwise treat as string/buffer
          console.log(`Converting to stringUtf8: ${arg}`);
          return Cl.stringUtf8(arg);
        }
        if (typeof arg === "bigint") {
          console.log(`Converting bigint to uint: ${arg.toString()}`);
          return Cl.uint(arg);
        }
        if (typeof arg === "number") {
          console.log(`Converting number to uint: ${arg}`);
          return Cl.uint(arg);
        }
        if (arg === null || arg === undefined) {
          console.log(`Converting null/undefined to none`);
          return Cl.none();
        }
        console.log(`Using arg as-is (already Clarity value)`);
        return arg; // Already a Clarity value
      });

      console.log('Stacks transaction params:', {
        contract: params.contractAddress,
        functionName: params.functionName,
        functionArgs: clarityArgs,
        functionArgsCount: clarityArgs.length,
      });

      // Get network from environment
      const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';

      console.log('Attempting stx_callContract with request API...');

      // Build post-conditions if provided
      const postConditions = params.postConditions || [];

      // Use the new request API
      const response = await request("stx_callContract", {
        contract: params.contractAddress,
        functionName: params.functionName,
        functionArgs: clarityArgs,
        network: network,
        postConditions: postConditions.length > 0 ? postConditions : undefined,
        postConditionMode: postConditions.length > 0 ? undefined : 'allow',
      });

      return {
        hash: response.txid,
        chainType: ChainType.STACKS,
      };
    } catch (error) {
      console.error("Stacks transaction failed:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        data: (error as any)?.data,
      });

      // Check if it's an InvalidParams error
      if ((error as any)?.code === -32602) {
        console.error("InvalidParams error - this usually means:");
        console.error("1. Wrong number of arguments");
        console.error("2. Wrong argument types");
        console.error("3. Invalid Clarity value format");
        console.error("4. Contract or function doesn't exist");
      }

      throw error;
    }
  }

  async getBalance(address: string, tokenAddress?: string): Promise<bigint> {
    if (!tokenAddress) {
      // Get native STX balance from API
      try {
        const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
          ? "mainnet"
          : "testnet";
        const apiUrl = network === "mainnet"
          ? "https://api.hiro.so"
          : "https://api.testnet.hiro.so";

        const response = await fetch(
          `${apiUrl}/extended/v1/address/${address}/balances`,
        );
        const data = await response.json();
        return BigInt(data.stx.balance || "0");
      } catch (error) {
        console.error("Failed to fetch STX balance:", error);
        return BigInt(0);
      }
    }

    // Get SIP-010 token balance using read-only function call
    try {
      const stacksConnectModule = await import("@stacks/connect");
      const stacksConnect: any = stacksConnectModule;
      const request = stacksConnect.request;

      const { Cl, cvToJSON } = await import("@stacks/transactions");

      const [contractAddress, contractName] = tokenAddress.split(".");

      const result = await request("stx_callReadOnly", {
        contractAddress,
        contractName,
        functionName: "get-balance",
        functionArgs: [Cl.standardPrincipal(address)],
      });

      // SIP-10 get-balance returns response(uint)
      if (result?.value) {
        const jsonResult = cvToJSON(result.value);
        if (jsonResult.success && jsonResult.value) {
          return BigInt(jsonResult.value.value || "0");
        }
      }
      return BigInt(0);
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

  async buildTransactionArgs(
    intent: TransactionIntent,
    contractAddress: string,
  ): Promise<TransactionParams> {
    const tokenIn =
      MULTI_CHAIN_TOKENS[intent.tokenIn.toUpperCase()]?.addresses[
      ChainType.STACKS
      ] ?? "";
    const tokenOut =
      MULTI_CHAIN_TOKENS[intent.tokenOut.toUpperCase()]?.addresses[
      ChainType.STACKS
      ] ?? "";

    console.log('Building Stacks transaction args:', {
      action: intent.action,
      tokenIn,
      tokenOut,
      amountIn: intent.amountIn.toString(),
      userAddress: this.currentAccount?.address,
    });

    // Import Pc for post-conditions
    const { Pc } = await import("@stacks/transactions");

    if (intent.action === "buy") {
      // For buy: user sends tokenIn (USDCX), receives tokenOut (ADUSD)
      // Use the actual fungible token identifier "usdcx" (not the contract name "usdcx-v3")
      // The ft identifier is defined in the contract as (define-fungible-token usdcx ...)
      const tokenIdentifier = "usdcx";

      console.log('Creating post-condition for buy:', {
        principal: this.currentAccount?.address,
        amount: intent.amountIn.toString(),
        tokenContract: tokenIn,
        tokenIdentifier,
      });

      const postConditions = [
        // User will send exactly the input amount of USDCX
        Pc.principal(this.currentAccount?.address || "")
          .willSendEq(intent.amountIn)
          .ft(tokenIn as `${string}.${string}`, tokenIdentifier),
      ];

      return {
        contractAddress,
        functionName: "buy",
        // Pass amountIn as bigint so it converts to Cl.uint correctly
        args: [intent.amountIn, tokenOut],
        postConditions,
      };
    }

    if (intent.action === "swap") {
      const minAmount = intent.minAmountOut ?? 0n;

      // For swap: user burns tokenIn, receives tokenOut
      // Map token addresses to their actual fungible token identifiers
      // All Adam tokens use their base name (e.g., "adam-token-adusd" not "adam-token-adusd-v2")
      const getTokenIdentifier = (tokenAddress: string): string => {
        if (tokenAddress.includes('usdcx')) return 'usdcx';
        if (tokenAddress.includes('adusd')) return 'adam-token-adusd';
        if (tokenAddress.includes('adngn')) return 'adam-token-adngn';
        if (tokenAddress.includes('adkes')) return 'adam-token-adkes';
        if (tokenAddress.includes('adghs')) return 'adam-token-adghs';
        if (tokenAddress.includes('adzar')) return 'adam-token-adzar';
        // Fallback to extracting from contract name
        return tokenAddress.split('.').pop() || "";
      };

      const tokenInIdentifier = getTokenIdentifier(tokenIn);

      const postConditions = [
        // User will send/burn the input amount
        Pc.principal(this.currentAccount?.address || "")
          .willSendEq(intent.amountIn)
          .ft(tokenIn as `${string}.${string}`, tokenInIdentifier),
      ];

      return {
        contractAddress,
        functionName: "swap",
        // Pass bigints so they convert to Cl.uint correctly
        args: [tokenIn, intent.amountIn, tokenOut, minAmount],
        postConditions,
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
