import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format wallet address to short form
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number | string, currency = 'USD'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return `${currency} 0.00`;
  
  const decimals = currency === 'NGN' ? 2 : 2;
  return `${currency} ${formatNumber(n, decimals)}`;
}

/**
 * Convert wei to token amount
 */
export function fromWei(wei: string | bigint, decimals = 6): string {
  const weiStr = typeof wei === 'bigint' ? wei.toString() : wei;
  const divisor = BigInt(10 ** decimals);
  const amount = BigInt(weiStr) / divisor;
  const remainder = BigInt(weiStr) % divisor;
  
  if (remainder === 0n) {
    return amount.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  return `${amount}.${remainderStr}`;
}

/**
 * Convert token amount to wei
 */
export function toWei(amount: string | number, decimals = 6): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  const [whole, fraction = ''] = amountStr.split('.');
  const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + fractionPadded);
}

/**
 * Validate Starknet address
 */
export function isValidStarknetAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{1,64}$/.test(address);
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate slippage amount
 */
export function calculateMinAmount(amount: string, slippageTolerance = 0.005): string {
  const amountNum = parseFloat(amount);
  const minAmount = amountNum * (1 - slippageTolerance);
  return minAmount.toFixed(6);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique transaction ID
 * @param type - Transaction type prefix (buy, sell, swap)
 * @returns A unique transaction ID string
 */
export function generateTransactionId(type: 'buy' | 'sell' | 'swap'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${type}_${timestamp}_${randomStr}`;
}
