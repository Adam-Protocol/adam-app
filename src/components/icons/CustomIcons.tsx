import React from 'react';

export const ShieldIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z"
      fill="url(#shield-gradient)"
      fillOpacity="0.2"
    />
    <path
      d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z"
      stroke="url(#shield-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12L11 14L15 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="shield-gradient" x1="4" y1="2" x2="20" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#5b6ff3" />
        <stop offset="1" stopColor="#7b94f8" />
      </linearGradient>
    </defs>
  </svg>
);

export const LightningIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      fill="url(#lightning-gradient)"
      fillOpacity="0.2"
    />
    <path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      stroke="url(#lightning-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="lightning-gradient" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06b6d4" />
        <stop offset="1" stopColor="#5b6ff3" />
      </linearGradient>
    </defs>
  </svg>
);

export const GlobeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#globe-gradient)" fillOpacity="0.2" />
    <circle cx="12" cy="12" r="10" stroke="url(#globe-gradient)" strokeWidth="2" />
    <path
      d="M2 12H22M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22M12 2C9.5 4.5 8 8 8 12C8 16 9.5 19.5 12 22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="globe-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

export const LockIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="11" rx="2" fill="url(#lock-gradient)" fillOpacity="0.2" />
    <rect x="5" y="11" width="14" height="11" rx="2" stroke="url(#lock-gradient)" strokeWidth="2" />
    <path
      d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    <defs>
      <linearGradient id="lock-gradient" x1="5" y1="3" x2="19" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22c55e" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

export const TrendingIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 17L9 11L13 15L21 7"
      stroke="url(#trending-gradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 7H21V12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="trending-gradient" x1="3" y1="17" x2="21" y2="7" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#22c55e" />
      </linearGradient>
    </defs>
  </svg>
);

export const NetworkIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill="url(#network-gradient)" />
    <circle cx="5" cy="5" r="2" fill="currentColor" fillOpacity="0.6" />
    <circle cx="19" cy="5" r="2" fill="currentColor" fillOpacity="0.6" />
    <circle cx="5" cy="19" r="2" fill="currentColor" fillOpacity="0.6" />
    <circle cx="19" cy="19" r="2" fill="currentColor" fillOpacity="0.6" />
    <path
      d="M6.5 6.5L9.5 9.5M14.5 9.5L17.5 6.5M6.5 17.5L9.5 14.5M14.5 14.5L17.5 17.5"
      stroke="url(#network-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="network-gradient" x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7b94f8" />
        <stop offset="1" stopColor="#a855f7" />
      </linearGradient>
    </defs>
  </svg>
);

export const CoinsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="7" fill="url(#coins-gradient-1)" fillOpacity="0.2" />
    <circle cx="9" cy="9" r="7" stroke="url(#coins-gradient-1)" strokeWidth="2" />
    <circle cx="15" cy="15" r="7" fill="url(#coins-gradient-2)" fillOpacity="0.2" />
    <circle cx="15" cy="15" r="7" stroke="url(#coins-gradient-2)" strokeWidth="2" />
    <path d="M9 6V12L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="coins-gradient-1" x1="2" y1="2" x2="16" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06b6d4" />
        <stop offset="1" stopColor="#5b6ff3" />
      </linearGradient>
      <linearGradient id="coins-gradient-2" x1="8" y1="8" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);
