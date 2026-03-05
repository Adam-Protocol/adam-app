'use client';

import { motion } from 'framer-motion';
import { useAccount } from '@starknet-react/core';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowUpRight, Info } from 'lucide-react';
import axios from 'axios';
import { hash } from 'starknet';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type SellForm = {
  token_in: 'adusd' | 'adngn';
  amount: string;
  commitment: string;
  secret: string;
  currency: 'NGN' | 'USD';
  bank_account: string;
  bank_code: string;
};

export default function SellPage() {
  const { address, isConnected } = useAccount();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SellForm>({
    defaultValues: { token_in: 'adngn', currency: 'NGN' },
  });

  const mutation = useMutation({
    mutationFn: async (data: SellForm) => {
      // Derive nullifier from secret
      const secret = BigInt(data.secret);
      const nullifierKey = BigInt(Math.floor(Math.random() * 1e15));
      const nullifier = hash.computePedersenHash(
        secret.toString(16),
        nullifierKey.toString(16),
      );

      return axios.post(`${API}/token/sell`, {
        wallet: address,
        token_in: data.token_in,
        amount: (BigInt(data.amount) * BigInt(1e18)).toString(), // 18 decimals
        nullifier,
        commitment: data.commitment,
        currency: data.currency,
        bank_account: data.bank_account,
        bank_code: data.bank_code,
      }).then(r => r.data);
    },
    onSuccess: (data) => {
      toast.success('Sell order submitted!', {
        description: `Job ID: ${data.job_id} — bank transfer will arrive shortly.`,
      });
    },
    onError: (err: any) => {
      toast.error('Sell failed', { description: err?.response?.data?.message ?? err.message });
    },
  });

  return (
    <div className="max-w-lg mx-auto px-2 sm:px-0">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-purple to-brand-500 flex items-center justify-center">
            <ArrowUpRight size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Sell Stablecoins</h1>
            <p className="text-white/40 text-xs sm:text-sm">Burn ADUSD/ADNGN and receive fiat to your bank</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div className="gradient-border rounded-2xl p-5 space-y-4">
            {/* Token */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Token to Sell</label>
              <div className="grid grid-cols-2 gap-3">
                {(['adusd', 'adngn'] as const).map((t) => (
                  <label key={t} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${watch('token_in') === t ? 'border-accent-purple bg-accent-purple/10' : 'border-white/10 bg-white/3'}`}>
                    <input type="radio" value={t} {...register('token_in')} className="sr-only" />
                    <span className="text-xl">{t === 'adusd' ? '🇺🇸' : '🇳🇬'}</span>
                    <p className="font-bold text-white text-sm uppercase">{t}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Amount to Sell</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="adam-input pr-20 text-xl font-bold"
                  {...register('amount', { required: 'Amount required' })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold uppercase">
                  {watch('token_in')}
                </span>
              </div>
            </div>

            {/* Commitment and secret */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Commitment Hash</label>
              <input type="text" placeholder="0x..." className="adam-input font-mono text-sm"
                {...register('commitment', { required: 'Commitment required' })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Secret (saved from buy)</label>
              <input type="password" placeholder="Your secret key" className="adam-input font-mono text-sm"
                {...register('secret', { required: 'Secret required' })} />
            </div>
          </div>

          {/* Bank details */}
          <div className="gradient-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-white">Bank Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${watch('currency') === 'NGN' ? 'border-brand-500 bg-brand-500/10' : 'border-white/10'}`}>
                <input type="radio" value="NGN" {...register('currency')} className="sr-only" />
                <span>🇳🇬</span><span className="text-sm font-medium text-white">NGN</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${watch('currency') === 'USD' ? 'border-brand-500 bg-brand-500/10' : 'border-white/10'}`}>
                <input type="radio" value="USD" {...register('currency')} className="sr-only" />
                <span>🇺🇸</span><span className="text-sm font-medium text-white">USD</span>
              </label>
            </div>
            <input type="text" placeholder="Account Number (10 digits)" className="adam-input" maxLength={10}
              {...register('bank_account', { required: true, minLength: 10, maxLength: 10 })} />
            <input type="text" placeholder="Bank Code (e.g. 044 for Access Bank)" className="adam-input"
              {...register('bank_code', { required: true })} />
          </div>

          <div className="flex items-start gap-2 sm:gap-3 glass px-3 sm:px-4 py-3 rounded-xl border border-accent-purple/20 text-xs sm:text-sm">
            <Info size={14} className="text-accent-purple mt-0.5 shrink-0 sm:w-4 sm:h-4" />
            <p className="text-white/50">Your bank details are processed once, never stored. Amount is hidden on-chain via nullifier.</p>
          </div>

          <button
            type="submit"
            disabled={!isConnected || mutation.isPending}
            className="btn-neon w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent-purple to-brand-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-accent-purple/30 disabled:opacity-50 transition-all active:scale-98"
          >
            {mutation.isPending ? 'Processing...' : !isConnected ? 'Connect Wallet First' : 'Sell & Offramp'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
