import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ChainType } from "@/lib/chains/types";

export function useBalances(
  wallet: string | undefined,
  chain: ChainType,
  enabled = true,
) {
  return useQuery({
    queryKey: ["balances", wallet, chain],
    queryFn: () =>
      wallet ? api.token.getBalances(wallet, chain).then((r) => r.data) : null,
    enabled: enabled && !!wallet,
    refetchInterval: 15_000, // Refresh every 15 seconds
    retry: 2,
    staleTime: 10_000, // Consider data stale after 10 seconds
  });
}
