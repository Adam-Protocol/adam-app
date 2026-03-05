'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Menu, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useWallet } from '@/hooks/useWallet';
import { useEffect } from 'react';
import Image from 'next/image';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/app' },
  { label: 'Buy', href: '/app/buy' },
  { label: 'Sell', href: '/app/sell' },
  { label: 'Swap', href: '/app/swap' },
  { label: 'Activity', href: '/app/activity' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { shortAddress, isConnected, connectWallet, disconnect } = useWallet();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px- sm:px-6 py-3">
      <div className="glass-strong border border-white/10 rounded-2xl shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
              <Image
                src="/fav-mobile-icon.png"
                alt="Adam Protocol"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white md:block hidden group-hover:text-brand-400 transition-colors">
              Adam
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

          {/* Wallet - Desktop only */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected && shortAddress ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => disconnect()}
                className="glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="pulse-dot" />
                {shortAddress}
                <ChevronDown size={14} className="opacity-50" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connectWallet}
                className="btn-neon flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white text-sm font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all"
              >
                <Wallet size={15} />
                Connect Wallet
              </motion.button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden glass-strong p-2 rounded-lg text-white/70 hover:text-white border border-white/20 active:scale-95 transition-transform"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 px-3 pb-4 pt-2 flex flex-col gap-1 bg-[#0a0f1e]/80 backdrop-blur-xl"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'px-4 py-3 rounded-lg text-base font-medium transition-all active:scale-98',
                    pathname === link.href
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {/* Connect Wallet in Mobile Menu */}
              <div className="pt-3 border-t border-white/10 mt-2">
                {isConnected && shortAddress ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      disconnect();
                      setMobileOpen(false);
                    }}
                    className="w-full glass-strong flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/30 transition-all active:scale-98"
                  >
                    <div className="pulse-dot" />
                    {shortAddress}
                    <ChevronDown size={14} className="opacity-50" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      connectWallet();
                      setMobileOpen(false);
                    }}
                    className="w-full btn-neon flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white text-base font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all active:scale-98"
                  >
                    <Wallet size={15} />
                    Connect Wallet
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
