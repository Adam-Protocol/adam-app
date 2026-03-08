"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Building2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bank } from "@/hooks/useBanks";

interface BankSearchDropdownProps {
  banks: Bank[];
  value: string;
  onChange: (bankCode: string) => void;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
}

export function BankSearchDropdown({
  banks,
  value,
  onChange,
  disabled = false,
  error,
  loading = false,
}: BankSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedBank = banks.find((bank) => bank.code === value);

  // Filter banks based on search query
  const filteredBanks = banks.filter(
    (bank) =>
      bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (bankCode: string) => {
    onChange(bankCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          w-full adam-input text-left flex items-center justify-between gap-3
          transition-all duration-200
          ${isOpen ? "ring-2 ring-accent-purple/50 border-accent-purple/50" : ""}
          ${error ? "border-accent-red" : ""}
          ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-white/30 hover:bg-white/10"}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Building2
            size={20}
            className={`shrink-0 ${selectedBank ? "text-accent-purple" : "text-white/40"}`}
          />
          <span
            className={`truncate text-sm font-medium ${selectedBank ? "text-white" : "text-white/50"}`}
          >
            {loading
              ? "Loading banks..."
              : selectedBank
                ? selectedBank.name
                : "-- Select your bank --"}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent-purple" : "text-white/40"}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] w-full mt-2 glass-strong rounded-xl border border-white/20 shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-white/10 bg-white/5 sticky top-0 z-10">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search banks..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 text-sm font-medium"
                />
              </div>
            </div>

            {/* Banks List */}
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {filteredBanks.length === 0 ? (
                <div className="p-6 text-center text-white/40 text-sm">
                  No banks found
                </div>
              ) : (
                <div className="p-2">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => handleSelect(bank.code)}
                      className={`
                        w-full px-4 py-3 rounded-lg text-left flex items-center justify-between gap-3
                        transition-all duration-150
                        ${
                          bank.code === value
                            ? "bg-accent-purple/30 text-white border border-accent-purple/50"
                            : "text-white/80 hover:bg-white/10 hover:text-white border border-transparent"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Building2
                          size={18}
                          className={`shrink-0 ${bank.code === value ? "text-accent-purple" : "text-white/40"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {bank.name}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">
                            {bank.code}
                          </p>
                        </div>
                      </div>
                      {bank.code === value && (
                        <Check
                          size={18}
                          className="text-accent-purple shrink-0"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with count */}
            {filteredBanks.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/10 bg-white/5 sticky bottom-0">
                <p className="text-xs text-white/50 text-center font-medium">
                  {filteredBanks.length}{" "}
                  {filteredBanks.length === 1 ? "bank" : "banks"}
                  {searchQuery && " found"}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && <p className="text-accent-red text-xs mt-1">{error}</p>}
    </div>
  );
}
