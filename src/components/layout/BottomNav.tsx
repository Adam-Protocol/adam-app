"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Activity,
} from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Buy", href: "/app/buy", icon: ShoppingCart },
  { label: "Sell", href: "/app/sell", icon: TrendingUp },
  { label: "Swap", href: "/app/swap", icon: RefreshCw },
  { label: "Activity", href: "/app/activity", icon: Activity },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-2 pb-safe pointer-events-none">
      <div className="glass-strong border border-white/10 rounded-2xl shadow-xl pointer-events-auto">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center py-2 relative"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={clsx(
                    "relative flex items-center justify-center w-11 h-11 rounded-xl transition-all",
                    isActive && "bg-brand-500/15"
                  )}
                >
                  <Icon
                    size={22}
                    className={clsx(
                      "transition-colors",
                      isActive ? "text-brand-400" : "text-white/50"
                    )}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
