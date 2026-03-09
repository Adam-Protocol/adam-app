"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Menu, 
  X, 
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Activity
} from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/hooks/useWallet";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Buy", href: "/app/buy", icon: ShoppingCart },
  { label: "Sell", href: "/app/sell", icon: TrendingUp },
  { label: "Swap", href: "/app/swap", icon: RefreshCw },
  { label: "Activity", href: "/app/activity", icon: Activity },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { shortAddress, isConnected, connectWallet, disconnect, address } = useWallet();
  const isLandingPage = pathname === "/";

  // Redirect to dashboard after connecting wallet on landing page
  useEffect(() => {
    if (isConnected && isLandingPage) {
      router.push("/app");
    }
  }, [isConnected, isLandingPage, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  // Handle scroll for landing page
  useEffect(() => {
    if (!isLandingPage) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLandingPage]);

  return (
    <header 
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 transition-transform duration-300",
        isLandingPage && isScrolled && "-translate-y-full"
      )}
    >
      <div className={clsx(
        "border border-white/10 rounded-2xl shadow-xl",
        "md:glass-strong",
        "glass md:bg-[rgba(10,15,30,0.85)]"
      )}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex h-12 sm:h-16 items-center justify-between">
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
            {isConnected && NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    pathname === link.href
                      ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                      : "text-white/60 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet Button - Mobile & Desktop */}
          <div className="flex items-center gap-3">
            {isConnected && shortAddress ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => disconnect()}
                className="glass flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="pulse-dot" />
                <span className="hidden sm:inline">{shortAddress}</span>
                <span className="sm:hidden">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <ChevronDown size={14} className="opacity-50" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  await connectWallet();
                }}
                className="btn-neon flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-cyan text-white text-xs sm:text-sm font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all"
              >
                <Wallet size={15} />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
