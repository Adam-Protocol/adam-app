import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useBalances(wallet: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["balances", wallet],
    queryFn: () =>
      wallet ? api.token.getBalances(wallet).then((r) => r.data) : null,
    enabled: enabled && !!wallet,
    refetchInterval: 15_000, // Refresh every 15 seconds
    retry: 2,
    staleTime: 10_000, // Consider data stale after 10 seconds
  });
}
