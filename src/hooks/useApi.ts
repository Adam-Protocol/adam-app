import axios, { AxiosError } from 'axios';
import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token ────────────────────────────────────────────────────────────────────

export type BuyPayload = {
  wallet: string;
  amount_in: string;
  token_out: 'adusd' | 'adngn';
  commitment: string;
};

export type SellPayload = {
  wallet: string;
  token_in: 'adusd' | 'adngn';
  amount: string;
  nullifier: string;
  commitment: string;
  currency: 'NGN' | 'USD';
  bank_account: string;
  bank_code: string;
};

export const useBuy = () =>
  useMutation({ mutationFn: (p: BuyPayload) => api.post('/token/buy', p).then(r => r.data) });

export const useSell = () =>
  useMutation({ mutationFn: (p: SellPayload) => api.post('/token/sell', p).then(r => r.data) });

// ─── Swap ──────────────────────────────────────────────────────────────────────

export type SwapPayload = {
  wallet: string;
  token_in: 'adusd' | 'adngn';
  amount_in: string;
  token_out: 'adusd' | 'adngn';
  min_amount_out: string;
  commitment: string;
};

export const useSwap = () =>
  useMutation({ mutationFn: (p: SwapPayload) => api.post('/swap', p).then(r => r.data) });

export const useRate = () =>
  useQuery({
    queryKey: ['rate'],
    queryFn: () => api.get('/swap/rate').then(r => r.data as { usd_ngn: number; updated_at: string }),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityParams = {
  wallet: string;
  page?: number;
  limit?: number;
  type?: 'buy' | 'sell' | 'swap' | 'all';
};

export const useActivity = ({ wallet, page = 1, limit = 20, type = 'all' }: ActivityParams) =>
  useQuery({
    queryKey: ['activity', wallet, page, limit, type],
    queryFn: () =>
      api.get(`/activity/${wallet}`, { params: { page, limit, type } }).then(r => r.data),
    enabled: !!wallet,
    staleTime: 10_000,
  });

// ─── Offramp ─────────────────────────────────────────────────────────────────

export const useOfframpStatus = (referenceId: string | null) =>
  useQuery({
    queryKey: ['offramp', referenceId],
    queryFn: () => api.get(`/offramp/status/${referenceId}`).then(r => r.data),
    enabled: !!referenceId,
    refetchInterval: 5_000,
  });
