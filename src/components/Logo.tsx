import { Link } from "@tanstack/react-router";

export function Logo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="SellUrWay home">
      <img
        src="/sellurway-original-logo.svg"
        alt=""
        aria-hidden="true"
        className="h-9 w-9 shrink-0 object-contain"
      />
      <span className="font-display text-lg font-semibold tracking-tight">SellUrWay</span>
    </Link>
  );
}
