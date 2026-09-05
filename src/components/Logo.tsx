import { Link } from "@tanstack/react-router";

export function Logo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="Sellurway home">
      <img
        src="/favicon.svg"
        alt=""
        width={40}
        height={40}
        className="h-9 w-9 rounded-lg object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
      />
      <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">S</span>
      <span className="font-display text-lg font-semibold tracking-tight">Sellurway</span>
    </Link>
  );
}
