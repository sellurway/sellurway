import candle from "@/assets/demo-candle.jpg";
import mug from "@/assets/demo-mug.jpg";
import tote from "@/assets/demo-tote.jpg";
import throwBlanket from "@/assets/demo-throw.jpg";
import jewel from "@/assets/demo-jewel.jpg";
import food from "@/assets/demo-food.jpg";
import sneaker from "@/assets/demo-sneaker.jpg";
import skincare from "@/assets/demo-skincare.jpg";
import flowers from "@/assets/demo-flowers.jpg";
import type { StoreTheme } from "@/lib/themes";

/** Photo set per template so the mock-up matches the kind of shop it suits. */
const PHOTOS: Record<StoreTheme["photoSet"], string[]> = {
  home: [candle, mug, throwBlanket, tote],
  fashion: [tote, throwBlanket, candle, mug],
  food: [food, mug, candle, throwBlanket],
  jewel: [jewel, candle, mug, throwBlanket],
  beauty: [skincare, candle, flowers, mug],
  tech: [sneaker, mug, tote, throwBlanket],
  flowers: [flowers, candle, skincare, mug],
};

/**
 * Miniature, non-interactive mock-up of a storefront rendered in the theme's
 * own palette, fonts and radii so merchants can see what they're picking.
 */
export function ThemePreview({ theme, className = "" }: { theme: StoreTheme; className?: string }) {
  const p = theme.palette;
  const shots = PHOTOS[theme.photoSet];
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
          <div className="col-span-3">{card(shots[0]!, 0, "aspect-[4/5]")}</div>
          <div className="col-span-2 space-y-2">
            <div className="h-2 w-full rounded-full" style={{ background: p.ink, opacity: 0.8 }} />
            <div className="h-1.5 w-2/3 rounded-full" style={{ background: p.muted, opacity: 0.6 }} />
            {card(shots[1]!, 1)}
          </div>
        </div>
      ) : theme.layout === "list" ? (
        <div className="space-y-1.5 p-3">
          <div className="mb-2 flex items-end justify-between">
            <div className="h-3 w-1/2 rounded-full" style={{ background: p.ink, opacity: 0.8 }} />
            <div className="h-1.5 w-1/5 rounded-full" style={{ background: p.accent, opacity: 0.9 }} />
          </div>
          {shots.slice(0, 3).map((src, i) => (
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
            <img src={shots[0]!} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
            <span
              className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[8px] font-semibold"
              style={{ background: p.accent, color: p.accentInk, borderRadius: theme.buttonRadius }}
            >
              Shop now
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">{shots.slice(1, 4).map((s, i) => card(s, i))}</div>
        </div>
      ) : theme.layout === "lookbook" ? (
        <div className="space-y-2 p-3">
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: theme.cardRadius, border: `1px solid ${p.border}` }}
          >
            <img src={shots[0]!} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end gap-1 p-2">
              <div className="h-2 w-1/2 rounded-full" style={{ background: p.accent, opacity: 0.9 }} />
              <div className="h-1.5 w-1/3 rounded-full" style={{ background: p.surface, opacity: 0.9 }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">{card(shots[1]!, 1, "aspect-[16/10]")}</div>
            <div className="space-y-2">
              {card(shots[2]!, 2, "aspect-square")}
              <span
                className="block px-2 py-0.5 text-center text-[7px] font-semibold"
                style={{ background: p.accent, color: p.accentInk, borderRadius: theme.buttonRadius }}
              >
                View all
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3">{shots.slice(0, 4).map((s, i) => card(s, i))}</div>
      )}
    </div>
  );
}
