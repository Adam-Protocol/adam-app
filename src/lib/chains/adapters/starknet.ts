import { Contract, uint256 } from "starknet";
import {
  ChainAdapter,
  ChainType,
  WalletAccount,
  TransactionParams,
  TransactionResult,
} from "../types";

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
}
