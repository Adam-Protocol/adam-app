import {
  AccountInterface,
  Contract,
  uint256,
  CallData,
  RpcProvider,
} from "starknet";

// Minimal ERC20 ABI for token operations
const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    inputs: [
      { name: "owner", type: "felt" },
      { name: "spender", type: "felt" },
    ],
    outputs: [{ name: "remaining", type: "Uint256" }],
    stateMutability: "view",
  },
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "felt" },
      { name: "amount", type: "Uint256" },
    ],
    outputs: [{ name: "success", type: "felt" }],
  },
];

/**
 * Check the current allowance for a token
 * @param tokenAddress - The token contract address
 * @param ownerAddress - The token owner's address
 * @param spenderAddress - The spender's address (usually the swap contract)
 * @param account - The Starknet account instance
 * @returns The current allowance as bigint
 */
export async function checkTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  account: AccountInterface,
): Promise<bigint> {
  try {
    const tokenContract = new Contract({
      abi: ERC20_ABI,
      address: tokenAddress,
      providerOrAccount: account,
    });

    // Call allowance with 'latest' block for v0.10 compatibility
    const result: any = await tokenContract.call(
      "allowance",
      [ownerAddress, spenderAddress],
      {
        blockIdentifier: "latest",
      },
    );

    // Handle u256 response
    const allowance = result.remaining || result;
    const low = BigInt(allowance.low || allowance[0] || 0);
    const high = BigInt(allowance.high || allowance[1] || 0);

    return low + (high << 128n);
  } catch (error) {
    console.error("Error checking token allowance:", error);
    throw error;
  }
}

/**
 * Approve token spending
 * @param tokenAddress - The token contract address
 * @param spenderAddress - The spender's address (usually the swap contract)
 * @param amount - The amount to approve
 * @param account - The Starknet account instance
 * @returns The transaction hash
 */
export async function approveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint,
  account: AccountInterface,
): Promise<string> {
  const amountU256 = uint256.bnToUint256(amount);

  const result = await account.execute([
    {
      contractAddress: tokenAddress,
      entrypoint: "approve",
      calldata: CallData.compile({
        spender: spenderAddress,
        amount: amountU256,
      }),
    },
  ]);

  // Wait for transaction to be accepted on L2
  console.log("Waiting for approval transaction to be accepted...");
  await account.waitForTransaction(result.transaction_hash);
  console.log("Approval transaction confirmed!");

  return result.transaction_hash;
}

/**
 * Check allowance and approve if needed
 * @param tokenAddress - The token contract address
 * @param ownerAddress - The token owner's address
 * @param spenderAddress - The spender's address (usually the swap contract)
 * @param amount - The amount needed
 * @param account - The Starknet account instance
 * @returns Object with approval status and transaction hash (if approval was needed)
 */
export async function ensureTokenAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  amount: bigint,
  account: AccountInterface,
): Promise<{
  approved: boolean;
  txHash: string | null;
  currentAllowance: bigint;
}> {
  // Check current allowance
  const currentAllowance = await checkTokenAllowance(
    tokenAddress,
    ownerAddress,
    spenderAddress,
    account,
  );

  // If allowance is sufficient, no need to approve
  if (currentAllowance >= amount) {
    console.log(`Sufficient allowance: ${currentAllowance} >= ${amount}`);
    return {
      approved: false,
      txHash: null,
      currentAllowance,
    };
  }

  console.log(
    `Insufficient allowance: ${currentAllowance} < ${amount}. Requesting approval...`,
  );

  // Approve the required amount
  const txHash = await approveToken(
    tokenAddress,
    spenderAddress,
    amount,
    account,
  );

  return {
    approved: true,
    txHash,
    currentAllowance,
  };
}

/**
 * Parse u256 response from contract calls
 * @param u256Value - The u256 value from contract response
 * @returns The value as bigint
 */
export function parseU256(u256Value: any): bigint {
  const low = BigInt(u256Value.low || u256Value[0] || 0);
  const high = BigInt(u256Value.high || u256Value[1] || 0);
  return low + (high << 128n);
}

/**
 * Convert bigint to u256 format
 * @param value - The bigint value
 * @returns Object with low and high parts
 */
export function toU256(value: bigint): { low: string; high: string } {
  const u256 = uint256.bnToUint256(value);
  return {
    low: u256.low.toString(),
    high: u256.high.toString(),
  };
}
