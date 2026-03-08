import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ─── Token ────────────────────────────────────────────────────────────────────

export type BuyPayload = {
  wallet: string;
  amount_in: string;
  token_out: "adusd" | "adngn";
  commitment: string;
};

export type SellPayload = {
  wallet: string;
  token_in: "adusd" | "adngn";
  amount: string;
  nullifier: string;
  commitment: string;
  currency: "NGN" | "USD";
  bank_account: string;
  bank_code: string;
};

export const useBuy = () =>
  useMutation({
    mutationFn: (payload: BuyPayload) =>
      api.token.buy(payload).then((r) => r.data),
  });

export const useSell = () =>
  useMutation({
    mutationFn: (payload: SellPayload) =>
      api.token.sell(payload).then((r) => r.data),
  });

// ─── Swap ──────────────────────────────────────────────────────────────────────

export type SwapPayload = {
  wallet: string;
  token_in: "adusd" | "adngn";
  amount_in: string;
  token_out: "adusd" | "adngn";
  min_amount_out: string;
  commitment: string;
};

export const useSwap = () =>
  useMutation({
    mutationFn: (payload: SwapPayload) =>
      api.swap.execute(payload).then((r) => r.data),
  });

export const useRate = () =>
  useQuery({
    queryKey: ["rate"],
    queryFn: () => api.swap.getRate().then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityParams = {
  wallet: string;
  page?: number;
  limit?: number;
  type?: "buy" | "sell" | "swap" | "all";
};

export const useActivity = ({
  wallet,
  page = 1,
  limit = 20,
  type = "all",
}: ActivityParams) =>
  useQuery({
    queryKey: ["activity", wallet, page, limit, type],
    queryFn: () =>
      api.activity
        .getByWallet(wallet, { page, limit, type })
        .then((r) => r.data),
    enabled: !!wallet,
    staleTime: 10_000,
  });

// ─── Offramp ─────────────────────────────────────────────────────────────────

export const useOfframpStatus = (referenceId: string | null) =>
  useQuery({
    queryKey: ["offramp", referenceId],
    queryFn: () => api.offramp.getStatus(referenceId!).then((r) => r.data),
    enabled: !!referenceId,
    refetchInterval: 5_000,
  });
