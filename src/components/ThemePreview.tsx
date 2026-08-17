import candle from "@/assets/demo-candle.jpg";
import mug from "@/assets/demo-mug.jpg";
import tote from "@/assets/demo-tote.jpg";
import throwBlanket from "@/assets/demo-throw.jpg";
import type { StoreTheme } from "@/lib/themes";

const SHOTS = [candle, mug, tote, throwBlanket];

/**
 * Miniature, non-interactive mock-up of a storefront rendered in the theme's
 * own palette, fonts and radii so merchants can see what they're picking.
 */
export function ThemePreview({ theme, className = "" }: { theme: StoreTheme; className?: string }) {
  const p = theme.palette;
  const card = (src: string, i: number, ratio = "aspect-[4/3]") => (
    <div
      key={i}
      className="overflow-hidden"
      style={{ background: p.surface, borderRadius: theme.cardRadius, border: `1px solid ${p.border}` }}
    >
      <img src={src} alt="" loading="lazy" className={`w-full ${ratio} object-cover`} />
      <div className="space-y-1 p-1.5">
        <div className="h-1.5 w-3/4 rounded-full" style={{ background: p.ink, opacity: 0.75 }} />
        <div className="h-1.5 w-1/3 rounded-full" style={{ background: p.muted, opacity: 0.6 }} />
      </div>
    </div>
  );

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ background: p.bg, color: p.ink, fontFamily: theme.body }}
      aria-hidden
    >
      {/* Store bar */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span style={{ fontFamily: theme.heading }} className="text-[11px] font-bold tracking-tight">
          {theme.name} Store
        </span>
        <span
          className="px-2 py-0.5 text-[8px] font-semibold"
          style={{ background: p.accent, color: p.accentInk, borderRadius: theme.buttonRadius }}
        >
          Cart
        </span>
      </div>

      {theme.layout === "editorial" ? (
        <div className="grid grid-cols-5 gap-2 p-3">
          <div className="col-span-3">{card(SHOTS[0]!, 0, "aspect-[4/5]")}</div>
          <div className="col-span-2 space-y-2">
            <div className="h-2 w-full rounded-full" style={{ background: p.ink, opacity: 0.8 }} />
            <div className="h-1.5 w-2/3 rounded-full" style={{ background: p.muted, opacity: 0.6 }} />
            {card(SHOTS[1]!, 1)}
          </div>
        </div>
      ) : theme.layout === "list" ? (
        <div className="space-y-1.5 p-3">
          {SHOTS.slice(0, 3).map((src, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-1.5"
              style={{ background: p.surface, borderRadius: theme.cardRadius, border: `1px solid ${p.border}` }}
            >
              <img src={src} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded object-cover" />
              <div className="flex-1 space-y-1">
                <div className="h-1.5 w-2/3 rounded-full" style={{ background: p.ink, opacity: 0.75 }} />
                <div className="h-1.5 w-1/4 rounded-full" style={{ background: p.muted, opacity: 0.6 }} />
              </div>
              <span
                className="px-1.5 py-0.5 text-[7px] font-semibold"
                style={{ background: p.accent, color: p.accentInk, borderRadius: theme.buttonRadius }}
              >
                Add
              </span>
            </div>
          ))}
        </div>
      ) : theme.layout === "showcase" ? (
        <div className="space-y-2 p-3">
          <div className="relative overflow-hidden" style={{ borderRadius: theme.cardRadius }}>
            <img src={SHOTS[3]!} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
            <span
              className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[8px] font-semibold"
              style={{ background: p.accent, color: p.accentInk, borderRadius: theme.buttonRadius }}
            >
              Shop now
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">{SHOTS.slice(0, 3).map((s, i) => card(s, i))}</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3">{SHOTS.slice(0, 4).map((s, i) => card(s, i))}</div>
      )}
    </div>
  );
}
