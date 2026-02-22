'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe, Lock, TrendingUp, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

const FEATURES = [
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Pedersen commitment scheme hides all amounts on-chain. Only you know what you transacted.',
    color: 'from-brand-500 to-brand-400',
  },
  {
    icon: Zap,
    title: 'Instant Minting',
    desc: 'Deposit USDC and receive ADUSD or ADNGN instantly. No KYC, no waiting.',
    color: 'from-accent-cyan to-brand-500',
  },
  {
    icon: Globe,
    title: 'Fiat Offramp',
    desc: 'Burn your ADNGN and receive local currency directly to your bank account.',
    color: 'from-accent-purple to-accent-cyan',
  },
  {
    icon: Lock,
    title: 'Non-Custodial',
    desc: 'Your keys, your tokens. The protocol never holds your funds.',
    color: 'from-accent-green to-accent-cyan',
  },
  {
    icon: TrendingUp,
    title: 'Live Rates',
    desc: 'Real-time USD/NGN rates from ExchangeRate-API, pushed on-chain every 5 minutes.',
    color: 'from-accent-amber to-accent-green',
  },
  {
    icon: Users,
    title: 'Built on Starknet',
    desc: 'Leverages Starknet's STARK proofs for cheap, fast, and verifiable transactions.',
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
      className="gradient-border p-6 hover:bg-white/[0.06] transition-all duration-300 group cursor-default"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} className="text-white" />
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-page min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500 rounded-full blur-[200px] opacity-10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-accent-cyan rounded-full blur-[150px] opacity-8 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-accent-purple rounded-full blur-[150px] opacity-8 pointer-events-none" />

        {/* Grid */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-white/70 mb-8 border border-white/10"
          >
            <span className="pulse-dot" />
            Built for Starknet Re{'{'}define{'}'} Hackathon · Privacy Track
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-none"
          >
            Private Money,{' '}
            <br />
            <span className="gradient-text">African Scale.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
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
            className="flex items-center justify-center gap-3 mb-10"
          >
            {TOKENS.map((t) => (
              <div
                key={t.symbol}
                className="token-badge glass border border-white/10 text-white"
                style={{ boxShadow: `0 0 20px ${t.color}20` }}
              >
                <span>{t.flag}</span>
                <span className="font-mono font-semibold" style={{ color: t.color }}>
                  {t.symbol}
                </span>
                <span className="text-white/40">{t.name}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/app/buy"
              className="btn-neon flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white font-bold text-lg shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 transition-all duration-200"
            >
              Get Started <ArrowRight size={18} />
            </Link>
            <Link
              href="/app"
              className="glass flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white/70 font-semibold text-lg hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200"
            >
              View Dashboard
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-20 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { value: '~0s', label: 'Settlement' },
              { value: '0%', label: 'Exposure' },
              { value: '$0', label: 'Custody' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 border border-white/5">
                <p className="text-2xl font-black gradient-text">{s.value}</p>
                <p className="text-xs text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black text-white mb-4">
              Why <span className="gradient-text">Adam Protocol</span>?
            </h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Built from the ground up for privacy, speed, and real-world utility.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 text-center text-white/30 text-sm">
        <p>Adam Protocol · Built on Starknet · Privacy Track · Starknet Re{'{'}define{'}'} 2026</p>
      </footer>
    </div>
  );
}
