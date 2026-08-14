import { Crown } from "lucide-react";

export function CrownBadge({ label = "Lifetime", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink ${className}`}
    >
      <Crown className="h-3 w-3 text-gold" aria-hidden />
      {label}
    </span>
  );
}
