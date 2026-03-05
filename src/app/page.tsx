'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { ScrollIndicator } from '@/components/ui/ScrollIndicator';
import {
  ShieldIcon,
  LightningIcon,
  GlobeIcon,
  LockIcon,
  TrendingIcon,
  NetworkIcon,
} from '@/components/icons/CustomIcons';

const FEATURES = [
  {
    icon: ShieldIcon,
    title: 'Privacy First',
    desc: 'Pedersen commitment scheme hides all amounts on-chain. Only you know what you transacted.',
    color: 'from-brand-500 to-brand-400',
  },
  {
    icon: LightningIcon,
    title: 'Instant Minting',
    desc: 'Deposit USDC and receive ADUSD or ADNGN instantly. No KYC, no waiting.',
    color: 'from-accent-cyan to-brand-500',
  },
  {
    icon: GlobeIcon,
    title: 'Fiat Offramp',
    desc: 'Burn your ADNGN and receive local currency directly to your bank account.',
    color: 'from-accent-purple to-accent-cyan',
  },
  {
    icon: LockIcon,
    title: 'Non-Custodial',
    desc: 'Your keys, your tokens. The protocol never holds your funds.',
    color: 'from-accent-green to-accent-cyan',
  },
  {
    icon: TrendingIcon,
    title: 'Live Rates',
    desc: 'Real-time USD/NGN rates from ExchangeRate-API, pushed on-chain every 5 minutes.',
    color: 'from-accent-amber to-accent-green',
  },
  {
    icon: NetworkIcon,
    title: 'Built on Starknet',
    desc: 'Leverages Starknet\'s STARK proofs for cheap, fast, and verifiable transactions.',
    color: 'from-brand-400 to-accent-purple',
  },
];

const TOKENS = [
  { symbol: 'ADUSD', name: 'Adam USD', flag: '🇺🇸', color: '#06b6d4' },
  { symbol: 'ADNGN', name: 'Adam Naira', flag: '🇳🇬', color: '#a855f7' },
];

function FeatureCard({ icon: Icon, title, desc, color, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="gradient-border p-5 sm:p-6 hover:bg-white/[0.06] transition-all duration-300 group cursor-default relative overflow-hidden"
    >
      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      </div>
      <h3 className="relative font-semibold text-white mb-2 text-base sm:text-lg group-hover:text-brand-400 transition-colors">{title}</h3>
      <p className="relative text-sm text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-page min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-16 px-4">
        <AnimatedBackground />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm text-white/70 mb-6 sm:mb-8 border border-white/10"
          >
            <span className="pulse-dot" />
            <span className="hidden sm:inline">Built for Starknet Re{'{'}define{'}'} Hackathon · Privacy Track</span>
            <span className="sm:hidden">Starknet Re{'{'}define{'}'} · Privacy Track</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-4 sm:mb-6 leading-tight sm:leading-none px-2"
          >
            Private Money,{' '}
            <br />
            <span className="gradient-text">African Scale.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4"
          >
            Adam Protocol is a privacy-first stablecoin protocol on Starknet. Mint, swap,
            and offramp <strong className="text-white/80">ADUSD</strong> &{' '}
            <strong className="text-white/80">ADNGN</strong> with zero amount exposure on-chain.
          </motion.p>

          {/* Token badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-10 px-4"
          >
            {TOKENS.map((t, i) => (
              <motion.div
                key={t.symbol}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="token-badge glass border border-white/10 text-white w-full sm:w-auto justify-center cursor-pointer group relative overflow-hidden"
                style={{ boxShadow: `0 0 20px ${t.color}20` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: t.color }} />
                <span className="text-lg relative z-10">{t.flag}</span>
                <span className="font-mono font-semibold text-sm sm:text-base relative z-10" style={{ color: t.color }}>
                  {t.symbol}
                </span>
                <span className="text-white/40 text-xs sm:text-sm relative z-10">{t.name}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 px-4"
          >
            <Link
              href="/app/buy"
              className="btn-neon flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-bold text-base sm:text-lg shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 active:scale-98 transition-all duration-200"
            >
              Get Started <ArrowRight size={18} />
            </Link>
            <Link
              href="/app"
              className="glass flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-white/10 text-white/70 font-semibold text-base sm:text-lg hover:text-white hover:border-white/20 hover:bg-white/5 active:scale-98 transition-all duration-200"
            >
              View Dashboard
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-12 sm:mt-20 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto px-4"
          >
            {[
              { value: '~0s', label: 'Settlement', color: 'from-accent-cyan to-brand-500' },
              { value: '0%', label: 'Exposure', color: 'from-accent-purple to-accent-cyan' },
              { value: '$0', label: 'Custody', color: 'from-accent-green to-accent-cyan' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all cursor-default group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <p className="text-xl sm:text-2xl font-black gradient-text relative z-10">{s.value}</p>
                <p className="text-xs text-white/40 mt-1 relative z-10">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <ScrollIndicator />
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 sm:mb-4">
              Why <span className="gradient-text">Adam Protocol</span>?
            </h2>
            <p className="text-sm sm:text-base text-white/50 max-w-lg mx-auto px-4">
              Built from the ground up for privacy, speed, and real-world utility.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 sm:mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-sm sm:text-base text-white/50 max-w-lg mx-auto px-4">
              Three simple steps to private, instant stablecoin transactions.
            </p>
          </motion.div>

          <div className="space-y-6 sm:space-y-8">
            {[
              {
                step: '01',
                title: 'Connect & Deposit',
                desc: 'Connect your Starknet wallet and deposit USDC. Choose to receive ADUSD or ADNGN.',
                color: 'from-brand-500 to-accent-cyan',
              },
              {
                step: '02',
                title: 'Private Commitment',
                desc: 'Your amount is hidden using Pedersen commitments. Only you know the transaction value.',
                color: 'from-accent-cyan to-accent-purple',
              },
              {
                step: '03',
                title: 'Swap or Offramp',
                desc: 'Swap between ADUSD and ADNGN at live rates, or offramp directly to your bank account.',
                color: 'from-accent-purple to-brand-500',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex gap-4 sm:gap-6 items-start group"
              >
                <div className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center font-black text-white text-lg sm:text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.step}
                </div>
                <div className="flex-1 pt-1 sm:pt-2">
                  <h3 className="font-bold text-white text-base sm:text-lg mb-2 group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link
              href="/app"
              className="inline-flex items-center gap-2 btn-neon px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-semibold text-sm sm:text-base shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 active:scale-98 transition-all"
            >
              Try It Now <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 sm:py-10 px-4 text-center text-white/30 text-xs sm:text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="relative w-6 h-6 rounded-lg overflow-hidden">
            <Image
              src="/fav-mobile-icon.png"
              alt="Adam Protocol"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-semibold text-white/40">Adam Protocol</span>
        </div>
        <p>Built on Starknet · Privacy Track · Starknet Re{'{'}define{'}'} 2026</p>
      </footer>
    </div>
  );
}
