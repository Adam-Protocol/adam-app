import { useCallback } from 'react';
import { hash } from 'starknet';

export type Commitment = {
  commitment: string;
  secret: bigint;
};

/**
 * Generate a Pedersen commitment client-side.
 * commitment = pedersen(amount_felt, secret_felt)
 * The secret is stored in sessionStorage keyed by commitment hash.
 */
export function useCommitment() {
  const generate = useCallback((amountWei: bigint): Commitment => {
    const secret = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    const commitment = hash.computePedersenHash(
      amountWei.toString(16).padStart(64, '0'),
      secret.toString(16).padStart(64, '0'),
    );
    sessionStorage.setItem(`adam_secret_${commitment}`, secret.toString());
    return { commitment, secret };
  }, []);

  const getSecret = useCallback((commitment: string): bigint | null => {
    const raw = sessionStorage.getItem(`adam_secret_${commitment}`);
    return raw ? BigInt(raw) : null;
  }, []);

  /**
   * Derive nullifier from the original secret.
   * nullifier = pedersen(secret_felt, nullifier_key_felt)
   */
  const deriveNullifier = useCallback((secret: bigint): string => {
    const nullifierKey = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
    return hash.computePedersenHash(
      secret.toString(16).padStart(64, '0'),
      nullifierKey.toString(16).padStart(64, '0'),
    );
  }, []);

  return { generate, getSecret, deriveNullifier };
}
