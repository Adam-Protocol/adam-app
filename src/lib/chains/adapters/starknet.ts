import { Contract, uint256 } from "starknet";
import {
  ChainAdapter,
  ChainType,
  WalletAccount,
  TransactionParams,
  TransactionResult,
  TransactionIntent,
} from "../types";
import { MULTI_CHAIN_TOKENS } from "../config";

export class StarknetAdapter implements ChainAdapter {
  chainType = ChainType.STARKNET;
  private account: any = null;
  private connectFn: (() => Promise<any>) | null = null;
  private disconnectFn: (() => Promise<void>) | null = null;
  private accountData: any = null;

  constructor(
    connectFn: () => Promise<any>,
    disconnectFn: () => Promise<void>,
    accountData: any,
  ) {
    this.connectFn = connectFn;
    this.disconnectFn = disconnectFn;
    this.accountData = accountData;
    this.account = accountData?.account;
  }

  async connect(): Promise<WalletAccount | null> {
    if (!this.connectFn) return null;

    const connector = await this.connectFn();
    if (!connector || !this.accountData?.address) {
      return null;
    }

    return {
      address: this.accountData.address,
      chainType: ChainType.STARKNET,
    };
  }

  async disconnect(): Promise<void> {
    if (this.disconnectFn) {
      await this.disconnectFn();
    }
    this.account = null;
  }

  getAccount(): WalletAccount | null {
    if (!this.accountData?.address) return null;

    return {
      address: this.accountData.address,
      chainType: ChainType.STARKNET,
    };
  }

  isConnected(): boolean {
    return !!this.accountData?.isConnected;
  }

  async executeTransaction(
    params: TransactionParams,
  ): Promise<TransactionResult> {
    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    const contract = new Contract({
      abi: params.abi || [],
      address: params.contractAddress,
      providerOrAccount: this.account,
    });

    const result = await (contract as any)[params.functionName](...params.args);
    await this.account.waitForTransaction(result.transaction_hash);

    return {
      hash: result.transaction_hash,
      chainType: ChainType.STARKNET,
    };
  }

  async getBalance(address: string, tokenAddress?: string): Promise<bigint> {
    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    if (!tokenAddress) {
      // Get native ETH balance
      const balance = await this.account.getBalance();
      return BigInt(balance.toString());
    }

    // Get ERC20 token balance
    const tokenContract = new Contract({
      abi: [
        {
          name: "balanceOf",
          type: "function",
          inputs: [
            {
              name: "account",
              type: "core::starknet::contract_address::ContractAddress",
            },
          ],
          outputs: [{ type: "core::integer::u256" }],
          state_mutability: "view",
        },
      ],
      address: tokenAddress,
      providerOrAccount: this.account,
    });

    const balance = await tokenContract.balanceOf(address);
    return uint256.uint256ToBN(balance);
  }

  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint,
  ): Promise<TransactionResult> {
    if (!this.account) {
      throw new Error("Wallet not connected");
    }

    const tokenContract = new Contract({
      abi: [
        {
          name: "approve",
          type: "function",
          inputs: [
            {
              name: "spender",
              type: "core::starknet::contract_address::ContractAddress",
            },
            { name: "amount", type: "core::integer::u256" },
          ],
          outputs: [{ type: "core::bool" }],
          state_mutability: "external",
        },
      ],
      address: tokenAddress,
      providerOrAccount: this.account,
    });

    const amountU256 = uint256.bnToUint256(amount);
    const result = await tokenContract.approve(spenderAddress, amountU256);
    await this.account.waitForTransaction(result.transaction_hash);

    return {
      hash: result.transaction_hash,
      chainType: ChainType.STARKNET,
    };
  }

  /**
   * All Starknet-specific encoding lives here:
   * - amounts → uint256 struct
   * - canonical token symbols → Starknet contract addresses
   * - ABI embedded per function
   */
  buildTransactionArgs(
    intent: TransactionIntent,
    contractAddress: string,
  ): TransactionParams {
    const tokenIn =
      MULTI_CHAIN_TOKENS[intent.tokenIn.toUpperCase()]?.addresses[
        ChainType.STARKNET
      ] ?? "";
    const tokenOut =
      MULTI_CHAIN_TOKENS[intent.tokenOut.toUpperCase()]?.addresses[
        ChainType.STARKNET
      ] ?? "";
    const amountU256 = uint256.bnToUint256(intent.amountIn);

    if (intent.action === "buy") {
      return {
        contractAddress,
        functionName: "buy",
        args: [tokenIn, amountU256, tokenOut, intent.commitment ?? "0x0"],
        abi: [
          {
            name: "buy",
            type: "function",
            inputs: [
              { name: "token_in", type: "core::starknet::contract_address::ContractAddress" },
              { name: "amount_in", type: "core::integer::u256" },
              { name: "token_out", type: "core::starknet::contract_address::ContractAddress" },
              { name: "commitment", type: "core::felt252" },
            ],
            outputs: [],
            state_mutability: "external",
          },
        ],
      };
    }

    if (intent.action === "swap") {
      const minAmountU256 = uint256.bnToUint256(intent.minAmountOut ?? 0n);
      return {
        contractAddress,
        functionName: "swap",
        args: [tokenIn, amountU256, tokenOut, minAmountU256, intent.commitment ?? "0x0"],
        abi: [
          {
            name: "swap",
            type: "function",
            inputs: [
              { name: "token_in", type: "core::starknet::contract_address::ContractAddress" },
              { name: "amount_in", type: "core::integer::u256" },
              { name: "token_out", type: "core::starknet::contract_address::ContractAddress" },
              { name: "min_amount_out", type: "core::integer::u256" },
              { name: "commitment", type: "core::felt252" },
            ],
            outputs: [],
            state_mutability: "external",
          },
        ],
      };
    }

    throw new Error(`Unsupported action '${intent.action}' on Starknet adapter`);
  }

  /**
   * Starknet ERC-20 tokens require an explicit approve() before
   * the swap contract can pull funds.
   */
  requiresApproval(intent: TransactionIntent): boolean {
    return intent.action === "buy" || intent.action === "swap";
  }
}
