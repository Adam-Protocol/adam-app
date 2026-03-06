'use client';

import { motion } from 'framer-motion';
import { useAccount } from '@starknet-react/core';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowUpRight, Info } from 'lucide-react';
import axios from 'axios';
import { hash } from 'starknet';
import { WalletGuard } from '@/components/auth/WalletGuard';
import { generateTransactionId } from '@/lib/utils';
import { useUserCommitments } from '@/hooks/useUserCommitments';
import { useCommitment } from '@/hooks/useCommitment';
import { CommitmentInfo } from '@/components/CommitmentInfo';
import { useBanks } from '@/hooks/useBanks';
import { useAccountVerification } from '@/hooks/useAccountVerification';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type SellForm = {
  token_in: 'adusd' | 'adngn';
  amount: string;
  currency: 'NGN' | 'USD';
  bank_account: string;
  bank_code: string;
};

export default function SellPage() {
  const { address, isConnected } = useAccount();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SellForm>({
    defaultValues: { token_in: 'adngn', currency: 'NGN' },
  });

  return (
    <WalletGuard>
      <SellPageContent 
        address={address}
        isConnected={isConnected}
        register={register}
        handleSubmit={handleSubmit}
        watch={watch}
        errors={errors}
      />
    </WalletGuard>
  );
}

function SellPageContent({ address, isConnected, register, handleSubmit, watch, errors }: any) {
  const tokenType = watch('token_in');
  const currency = watch('currency');
  const accountNumber = watch('bank_account');
  const bankCode = watch('bank_code');
  
  const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(null);
  
  const { data: commitments = [], isLoading: loadingCommitments } = useUserCommitments(tokenType);
  const { getSecret } = useCommitment();
  
  // Fetch banks based on selected currency
  const country = currency === 'NGN' ? 'NG' : 'US';
  const { data: banks = [], isLoading: loadingBanks, error: banksError } = useBanks(country);
  
  // Log for debugging
  useEffect(() => {
    console.log('Banks data:', { banks, loadingBanks, banksError, country });
  }, [banks, loadingBanks, banksError, country]);
  
  // Account verification mutation
  const verifyAccountMutation = useAccountVerification();

  // Auto-verify account when both account number and bank code are filled
  useEffect(() => {
    if (accountNumber?.length === 10 && bankCode) {
      setVerifiedAccountName(null);
      verifyAccountMutation.mutate(
        { account_number: accountNumber, bank_code: bankCode },
        {
          onSuccess: (data) => {
            setVerifiedAccountName(data.account_name);
            toast.success('Account verified!', { 
              description: `Account holder: ${data.account_name}` 
            });
          },
          onError: (error: any) => {
            setVerifiedAccountName(null);
            toast.error('Account verification failed', { 
              description: error?.response?.data?.message || 'Invalid account details' 
            });
          },
        }
      );
    }
  }, [accountNumber, bankCode]);

  const mutation = useMutation({
    mutationFn: async (data: SellForm) => {
      // Find the most recent commitment for this token type
      const availableCommitment = commitments.find(c => 
        c.token_out.toLowerCase() === data.token_in.toLowerCase()
      );

      if (!availableCommitment) {
        throw new Error(`No available ${data.token_in.toUpperCase()} commitment found. Please buy tokens first.`);
      }

      // Retrieve secret from sessionStorage
      const secret = getSecret(availableCommitment.commitment);
      if (!secret) {
        throw new Error('Secret not found. You may need to buy tokens again from this device.');
      }

      // Derive nullifier from secret
      const nullifierKey = BigInt(Math.floor(Math.random() * 1e15));
      const nullifier = hash.computePedersenHash(
        '0x' + secret.toString(16),
        '0x' + nullifierKey.toString(16),
      );

      // Generate custom transaction ID
      const transactionId = generateTransactionId('sell');

      return axios.post(`${API}/token/sell`, {
        wallet: address,
        token_in: data.token_in,
        amount: (BigInt(data.amount) * BigInt(1e18)).toString(), // 18 decimals
        nullifier,
        commitment: availableCommitment.commitment,
        currency: data.currency,
        bank_account: data.bank_account,
        bank_code: data.bank_code,
        transactionId,
      }).then(r => r.data);
    },
    onSuccess: (data) => {
      toast.success('Sell order submitted!', {
        description: `Transaction ID: ${data.transaction_id} — bank transfer will arrive shortly.`,
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

        <form onSubmit={handleSubmit((d: SellForm) => mutation.mutate(d))} className="space-y-5">
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
              {loadingCommitments && (
                <p className="text-xs text-white/40 mt-1">Loading available balance...</p>
              )}
              {!loadingCommitments && commitments.length === 0 && (
                <p className="text-xs text-yellow-400 mt-1">No {tokenType.toUpperCase()} purchased yet. Buy tokens first.</p>
              )}
              {!loadingCommitments && commitments.length > 0 && (
                <p className="text-xs text-green-400 mt-1">✓ {commitments.length} commitment(s) available</p>
              )}
            </div>
          </div>

          {/* Bank details */}
          <div className="gradient-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-white">Bank Details</h3>
            
            {/* Currency Selection */}
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${currency === 'NGN' ? 'border-brand-500 bg-brand-500/10' : 'border-white/10'}`}>
                <input type="radio" value="NGN" {...register('currency')} className="sr-only" />
                <span>🇳🇬</span><span className="text-sm font-medium text-white">NGN</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${currency === 'USD' ? 'border-brand-500 bg-brand-500/10' : 'border-white/10'}`}>
                <input type="radio" value="USD" {...register('currency')} className="sr-only" />
                <span>🇺🇸</span><span className="text-sm font-medium text-white">USD</span>
              </label>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Select Bank {loadingBanks && '(Loading...)'} {banks.length > 0 && `(${banks.length} banks)`}
              </label>
              <select 
                className="adam-input text-sm"
                style={{ 
                  colorScheme: 'dark',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
                {...register('bank_code', { required: 'Bank selection required' })}
                disabled={loadingBanks}
              >
                <option value="">-- Select your bank --</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {errors.bank_code && (
                <p className="text-accent-red text-xs mt-1">{errors.bank_code.message}</p>
              )}
              {banksError && (
                <p className="text-accent-red text-xs mt-1">Failed to load banks: {String(banksError)}</p>
              )}
              {!loadingBanks && banks.length === 0 && !banksError && (
                <p className="text-yellow-400 text-xs mt-1">No banks found for {country}</p>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Account Number</label>
              <input 
                type="text" 
                placeholder="0123456789" 
                className="adam-input" 
                maxLength={10}
                {...register('bank_account', { 
                  required: 'Account number required', 
                  minLength: { value: 10, message: 'Must be 10 digits' },
                  maxLength: { value: 10, message: 'Must be 10 digits' },
                  pattern: { value: /^\d+$/, message: 'Only numbers allowed' }
                })} 
              />
              {errors.bank_account && (
                <p className="text-accent-red text-xs mt-1">{errors.bank_account.message}</p>
              )}
              
              {/* Account Verification Status */}
              {verifyAccountMutation.isPending && (
                <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                  <span className="animate-spin">⏳</span> Verifying account...
                </p>
              )}
              {verifiedAccountName && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  ✓ <span className="font-semibold">{verifiedAccountName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 glass px-3 sm:px-4 py-3 rounded-xl border border-accent-purple/20 text-xs sm:text-sm">
            <Info size={14} className="text-accent-purple mt-0.5 shrink-0 sm:w-4 sm:h-4" />
            <p className="text-white/50">Your bank details are processed once, never stored. Amount is hidden on-chain via nullifier.</p>
          </div>

          <CommitmentInfo 
            commitmentCount={commitments.length} 
            tokenType={tokenType} 
            isLoading={loadingCommitments} 
          />

          <button
            type="submit"
            disabled={!isConnected || mutation.isPending || !verifiedAccountName || commitments.length === 0}
            className="btn-neon w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent-purple to-brand-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-accent-purple/30 disabled:opacity-50 transition-all active:scale-98"
          >
            {mutation.isPending ? 'Processing...' : 
             !isConnected ? 'Connect Wallet First' : 
             commitments.length === 0 ? 'No Commitments Available' :
             !verifiedAccountName ? 'Verify Account First' : 
             'Sell & Offramp'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
