import { Link } from "@tanstack/react-router";

export function Logo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="Sellurway home">
      <img src="/sellurway-logo.svg" alt="Sellurway" width={40} height={40} className="h-9 w-9 object-contain" />
      <span className="font-display text-lg font-semibold tracking-tight">Sellurway</span>
    </Link>
  );
}
