'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnect, useDisconnect, useAccount } from '@starknet-react/core';
import { connect } from 'starknetkit';
import { Wallet, Menu, X, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@heroui/react';
import { clsx } from 'clsx';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/app' },
  { label: 'Buy', href: '/app/buy' },
  { label: 'Sell', href: '/app/sell' },
  { label: 'Swap', href: '/app/swap' },
  { label: 'Activity', href: '/app/activity' },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  async function handleConnect() {
    try {
      await connect({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark',
      });
    } catch (e) {
      console.error(e);
    }
  }

  const { disconnect } = useDisconnect();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Adam<span className="gradient-text">Protocol</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {isConnected && address ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => disconnect()}
                className="glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="pulse-dot" />
                {shortenAddress(address)}
                <ChevronDown size={14} className="opacity-50" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                className="btn-neon flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white text-sm font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all"
              >
                <Wallet size={15} />
                Connect Wallet
              </motion.button>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden glass p-2 rounded-lg text-white/70 hover:text-white border border-white/10"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 px-4 pb-4 pt-2 flex flex-col gap-1"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    pathname === link.href
                      ? 'bg-brand-500/15 text-brand-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
