import { Link } from "@tanstack/react-router";

export function Logo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="Sellurway home">
      <svg
        viewBox="0 0 128 128"
        width="40"
        height="40"
        aria-hidden="true"
        className="h-9 w-9 shrink-0"
      >
        <defs>
          <linearGradient id="sellurway-logo-gradient" x1="16" y1="104" x2="112" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6D3DF5" />
            <stop offset="0.45" stopColor="#B83AF3" />
            <stop offset="0.72" stopColor="#20A8F5" />
            <stop offset="1" stopColor="#43C96B" />
          </linearGradient>
        </defs>
        <path d="M39 36v-8c0-14 11-25 25-25s25 11 25 25v8" fill="none" stroke="#22243A" strokeWidth="9" strokeLinecap="round" />
        <path d="M25 36h76l8 66c1 7-4 13-12 13H31c-8 0-13-6-12-13l8-66Z" fill="url(#sellurway-logo-gradient)" />
        <path d="M76 51c-7-5-14-7-22-7-13 0-22 6-22 17 0 9 6 14 21 17 10 2 15 4 15 9 0 5-5 8-12 8-9 0-15-3-23-9l-8 10c9 8 19 11 32 11 17 0 27-8 27-20 0-11-7-16-23-19-11-2-15-4-15-8 0-4 4-7 11-7 8 0 14 2 21 7l7-9Z" fill="#fff" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight">Sellurway</span>
    </Link>
  );
}
