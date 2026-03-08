import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@starknet-react/core";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type UserCommitment = {
  id: string;
  commitment: string;
  token_out: string;
  created_at: string;
  status: string;
};

/**
 * Fetch all buy commitments for the connected wallet.
 * These represent tokens the user has purchased and can now sell.
 */
export function useUserCommitments(tokenType?: "adusd" | "adngn") {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["user-commitments", address, tokenType],
    queryFn: async () => {
      if (!address) return [];

      const response = await axios.get<UserCommitment[]>(
        `${API}/token/commitments/${address}`,
        { params: tokenType ? { token: tokenType } : {} },
      );

      return response.data;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
  });
}
