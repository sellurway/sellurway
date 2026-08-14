import { Link } from "@tanstack/react-router";
import logo from "@/assets/sellurway-logo.png.asset.json";

export function Logo({ className = "", to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 ${className}`} aria-label="Sellurway home">
      <img
        src={logo.url}
        alt="Sellurway"
        width={40}
        height={40}
        className="h-9 w-9 rounded-lg object-cover object-[50%_28%]"
      />
      <span className="font-display text-lg font-semibold tracking-tight">Sellurway</span>
    </Link>
  );
}
