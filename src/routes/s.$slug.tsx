import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { Loader2, ShoppingBag, Store as StoreIcon } from "lucide-react";
import { StoreProvider, useStoreQuery } from "@/lib/storefront";
import { getTheme, resolveThemeVars } from "@/lib/themes";
import { cartCount, readCart, type CartLine } from "@/lib/cart";

export const Route = createFileRoute("/s/$slug")({
  component: StorefrontLayout,
});

function CartButton({ slug }: { slug: string }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    const sync = () => setLines(readCart(slug));
    sync();
    window.addEventListener("sellurway:cart", sync);
    return () => window.removeEventListener("sellurway:cart", sync);
  }, [slug]);
  const count = cartCount(lines);
  return (
    <Link
      to="/s/$slug/cart"
      params={{ slug }}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border"
      style={{ borderColor: "var(--sf-border)" }}
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <ShoppingBag className="h-4 w-4" />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
          style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function StoreLogo({ name, src }: { name: string; src: string | null }) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return showImage ? (
    <img src={src} alt="" onError={() => setFailed(true)} className="h-9 w-9 rounded-lg object-cover" />
  ) : (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
      style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function StorefrontLayout() {
  const { slug } = useParams({ from: "/s/$slug" });
  const { data: store, isLoading, isError } = useStoreQuery(slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <StoreIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Store not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This store doesn't exist, or the owner hasn't published it yet.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
            Go to Sellurway
          </Link>
        </div>
      </div>
    );
  }

  const theme = getTheme(store.theme);
  const vars = resolveThemeVars(theme, store.theme_settings ?? {});
  const showCart = store.selling_mode === "full_checkout" || store.selling_mode === "multiple";

  return (
    <StoreProvider value={store}>
      <div
        style={{ ...vars, background: "var(--sf-bg)", color: "var(--sf-ink)", fontFamily: "var(--sf-body)" }}
        className="min-h-screen"
      >
        <header
          className="sticky top-0 z-30 border-b backdrop-blur"
          style={{ borderColor: "var(--sf-border)", background: "color-mix(in oklab, var(--sf-bg) 88%, transparent)" }}
        >
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
            <Link to="/s/$slug" params={{ slug }} className="flex min-w-0 items-center gap-2.5">
              <StoreLogo name={store.name} src={store.logo_url} />
              <span
                className="truncate text-base font-semibold tracking-tight"
                style={{ fontFamily: "var(--sf-heading)" }}
              >
                {store.name}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              {store.contact_phone && (
                <a
                  href={`tel:${store.contact_phone}`}
                  className="hidden text-sm sm:inline"
                  style={{ color: "var(--sf-muted)" }}
                >
                  {store.contact_phone}
                </a>
              )}
              {showCart && <CartButton slug={slug} />}
            </div>
          </div>
        </header>

        <Outlet />

        <footer className="mt-16 border-t py-10" style={{ borderColor: "var(--sf-border)" }}>
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--sf-heading)" }}>
                {store.name}
              </p>
              {store.description && (
                <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--sf-muted)" }}>
                  {store.description}
                </p>
              )}
              <div className="mt-3 space-y-1 text-sm" style={{ color: "var(--sf-muted)" }}>
                {store.contact_email && <p>{store.contact_email}</p>}
                {store.contact_phone && <p>{store.contact_phone}</p>}
                {store.country && <p>{store.country}</p>}
              </div>
            </div>
            <div className="sm:text-right">
              {Object.entries(store.policies ?? {})
                .filter(([, v]) => !!v)
                .map(([k, v]) => (
                  <details key={k} className="mb-2 text-sm">
                    <summary className="cursor-pointer capitalize">{k.replace(/_/g, " ")}</summary>
                    <p className="mt-1 whitespace-pre-line text-left" style={{ color: "var(--sf-muted)" }}>
                      {v}
                    </p>
                  </details>
                ))}
              <p className="mt-4 text-xs" style={{ color: "var(--sf-muted)" }}>
                Powered by{" "}
                <Link to="/" className="underline">
                  Sellurway
                </Link>
              </p>
              <Link
                to="/report/$slug"
                params={{ slug }}
                className="mt-1 inline-block text-xs underline"
                style={{ color: "var(--sf-muted)" }}
              >
                Report this store
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </StoreProvider>
  );
}
