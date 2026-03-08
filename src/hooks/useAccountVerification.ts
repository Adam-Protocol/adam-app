import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type AccountVerificationResult = {
  account_number: string;
  account_name: string;
};

/**
 * Verify bank account and retrieve account holder name
 */
export function useAccountVerification() {
  return useMutation({
    mutationFn: async (params: {
      account_number: string;
      bank_code: string;
    }) => {
      const response = await axios.post<AccountVerificationResult>(
        `${API}/offramp/verify-account`,
        params,
      );
      return response.data;
    },
  });
}
