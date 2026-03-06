import { useAccount } from '@starknet-react/core';
import { useState } from 'react';
import { CONTRACTS } from '@/lib/constants';
import { ensureTokenAllowance, checkTokenAllowance } from '@/lib/token';

export function useTokenApprove() {
  const { account, address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);

  /**
   * Check current allowance for a token
   */
  const checkAllowance = async (
    tokenAddress: string,
    spenderAddress: string
  ): Promise<bigint> => {
    if (!account || !address) {
      throw new Error('Wallet not connected');
    }

    setIsCheckingAllowance(true);
    try {
      return await checkTokenAllowance(tokenAddress, address, spenderAddress, account as any);
    } finally {
      setIsCheckingAllowance(false);
    }
  };

  /**
   * Approve token spending, only if current allowance is insufficient
   */
  const approveToken = async (
    tokenAddress: string,
    spenderAddress: string,
    amount: string | bigint
  ): Promise<string | null> => {
    if (!account || !address) {
      throw new Error('Wallet not connected');
    }

    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;

    setIsCheckingAllowance(true);
    try {
      const result = await ensureTokenAllowance(
        tokenAddress,
        address,
        spenderAddress,
        amountBigInt,
        account as any
      );

      if (!result.approved) {
        console.log(`Sufficient allowance: ${result.currentAllowance} >= ${amountBigInt}`);
        return null; // No approval needed
      }

      console.log(`Approval executed. Tx hash: ${result.txHash}`);
      return result.txHash;
    } finally {
      setIsCheckingAllowance(false);
    }
  };

  const approveUSDC = async (amount: string | bigint): Promise<string | null> => {
    setIsApproving(true);
    try {
      return await approveToken(CONTRACTS.USDC, CONTRACTS.ADAM_SWAP, amount);
    } finally {
      setIsApproving(false);
    }
  };

  return {
    approveToken,
    approveUSDC,
    checkAllowance,
    isApproving,
    isCheckingAllowance,
  };
}
