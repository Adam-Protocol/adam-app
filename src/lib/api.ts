import axios, { AxiosInstance } from "axios";
import { ChainType } from "@/lib/chains/types";

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000, // 30 seconds
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add any auth tokens or custom headers here if needed
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle common errors
      if (error.response) {
        console.error("API Error:", error.response.data);
      } else if (error.request) {
        console.error("Network Error:", error.message);
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();

// API endpoints
export const api = {
  // Token endpoints
  token: {
    buy: (data: {
      wallet: string;
      amount_in: string;
      token_out: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
      commitment: string;
      tx_hash?: string;
      chain?: "STARKNET" | "STACKS";
      transactionId?: string;
    }) => apiClient.post("/token/buy", data),

    sell: (data: {
      wallet: string;
      token_in: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
      amount: string;
      nullifier: string;
      commitment: string;
      currency: "NGN" | "USD";
      bank_account: string;
      bank_code: string;
      chain?: "STARKNET" | "STACKS";
      transactionId?: string;
    }) => apiClient.post("/token/sell", data),

    getBalances: (wallet: string, chain: ChainType = ChainType.STARKNET) =>
      apiClient.get<{
        wallet: string;
        chain: string;
        balances: {
          adusd: { raw: string; formatted: string; decimals: number };
          adngn: { raw: string; formatted: string; decimals: number };
          adkes: { raw: string; formatted: string; decimals: number };
          adghs: { raw: string; formatted: string; decimals: number };
          adzar: { raw: string; formatted: string; decimals: number };
          usdc: { raw: string; formatted: string; decimals: number };
          stx?: { raw: string; formatted: string; decimals: number };
        };
      }>(`/token/balances/${wallet}`, {
        params: { chain: chain.toUpperCase() },
      }),
  },

  // Swap endpoints
  swap: {
    execute: (data: {
      wallet: string;
      token_in: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
      amount_in: string;
      token_out: "adusd" | "adngn" | "adkes" | "adghs" | "adzar";
      min_amount_out: string;
      commitment: string;
      chain?: "STARKNET" | "STACKS";
      transactionId?: string;
    }) => apiClient.post("/swap", data),

    getRate: () =>
      apiClient.get<{ usd_ngn: number; updated_at: string }>("/swap/rate"),
  },

  // Activity endpoints
  activity: {
    getByWallet: (
      wallet: string,
      params?: {
        page?: number;
        limit?: number;
        type?: "buy" | "sell" | "swap" | "all";
      },
    ) => apiClient.get(`/activity/${wallet}`, { params }),
  },

  // Offramp endpoints
  offramp: {
    getStatus: (referenceId: string) =>
      apiClient.get(`/offramp/status/${referenceId}`),
  },

  // Health check
  health: () => apiClient.get("/"),
};
