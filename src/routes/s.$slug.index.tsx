import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Loader2, PackageOpen } from "lucide-react";
import { productImage, useStore, useStoreCategories, useStoreProducts } from "@/lib/storefront";
import { getTheme } from "@/lib/themes";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/s/$slug/")({
  head: () => ({ meta: [{ title: "Store | Sellurway" }, { name: "description", content: "Shop online with Sellurway." }] }),
  component: StorefrontHome,
});

function StorefrontHome() {
  const { slug } = useParams({ from: "/s/$slug/" });
  const store = useStore();
  const { data: products, isLoading } = useStoreProducts(store.id);
  const { data: categories } = useStoreCategories(store.id);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const theme = getTheme(store.theme);
  const settings = store.theme_settings ?? {};

  const list = useMemo(
    () => (products ?? []).filter((p) => !activeCategory || p.category_id === activeCategory),
    [products, activeCategory],
  );
  const featured = useMemo(() => (products ?? []).filter((p) => p.featured).slice(0, 3), [products]);

  const defaultGridClass =
    theme.layout === "list"
      ? "grid-cols-1 sm:grid-cols-2"
      : theme.layout === "editorial"
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";

  const gridClass =
    settings.productColumns === 2
      ? "grid-cols-2"
      : settings.productColumns === 3
        ? "grid-cols-2 lg:grid-cols-3"
        : settings.productColumns === 4
          ? "grid-cols-2 lg:grid-cols-4"
          : defaultGridClass;

  const imageRatio =
    settings.productImageRatio === "portrait"
      ? "aspect-[4/5]"
      : settings.productImageRatio === "landscape"
        ? "aspect-[4/3]"
        : "aspect-square";

  const sectionOrder = settings.sectionOrder?.length
    ? settings.sectionOrder
    : ["hero", "featured", "categories", "products"] as const;

  const sections: Record<string, ReactNode> = {
    hero: settings.showHero !== false ? (
      <section className={"py-10 md:py-14 " + (theme.layout === "showcase" ? "md:py-20" : theme.layout === "editorial" ? "md:py-24" : "")}>
        {(settings.heroImageUrl || store.banner_url) && (
          <div className={"mb-8 overflow-hidden " + (theme.layout === "editorial" ? "md:-mx-8" : theme.layout === "showcase" ? "shadow-2xl" : "")} style={{ borderRadius: "var(--sf-card-radius)" }}>
            <img src={settings.heroImageUrl || store.banner_url || ""} alt="" className={"w-full object-cover " + (theme.layout === "showcase" ? "h-56 sm:h-[28rem]" : theme.layout === "editorial" ? "h-64 sm:h-[32rem]" : "h-44 sm:h-64")} />
          </div>
        )}
        <h1 className={"max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl " + (theme.layout === "editorial" ? "sm:text-6xl" : theme.layout === "showcase" ? "sm:text-5xl" : "")} style={{ fontFamily: "var(--sf-heading)" }}>
          {settings.heroHeadline || store.name}
        </h1>
        <p className="mt-3 max-w-xl text-base" style={{ color: "var(--sf-muted)" }}>
          {settings.heroSubline || store.description || "Browse the collection below."}
        </p>
      </section>
    ) : null,

    featured: settings.showFeatured !== false && featured.length > 0 ? (
      <section className="pb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--sf-muted)" }}>Featured</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {featured.map((p) => <ProductCard key={p.id} slug={slug} product={p} currency={store.currency} large imageRatio={imageRatio} layout={theme.layout} />)}
        </div>
      </section>
    ) : null,

    categories: settings.showCategories !== false && (categories?.length ?? 0) > 0 ? (
      <div className="flex flex-wrap gap-2 pb-6">
        <button onClick={() => setActiveCategory(null)} className="rounded-full border px-3.5 py-1.5 text-sm transition"
          style={{ borderColor: "var(--sf-border)", background: activeCategory === null ? "var(--sf-accent)" : "transparent", color: activeCategory === null ? "var(--sf-accent-ink)" : "var(--sf-ink)" }}>All</button>
        {categories!.map((category) => (
          <button key={category.id} onClick={() => setActiveCategory(category.id)} className="rounded-full border px-3.5 py-1.5 text-sm transition"
            style={{ borderColor: "var(--sf-border)", background: activeCategory === category.id ? "var(--sf-accent)" : "transparent", color: activeCategory === category.id ? "var(--sf-accent-ink)" : "var(--sf-ink)" }}>{category.name}</button>
        ))}
      </div>
    ) : null,

    products: (
      <section className="pb-10">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--sf-muted)" }} /></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed py-20 text-center" style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)" }}>
            <PackageOpen className="h-6 w-6" style={{ color: "var(--sf-muted)" }} />
            <p className="mt-3 text-sm" style={{ color: "var(--sf-muted)" }}>No products here yet. Check back soon.</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${gridClass}`}>
            {list.map((p) => <ProductCard key={p.id} slug={slug} product={p} currency={store.currency} imageRatio={imageRatio} layout={theme.layout} />)}
          </div>
        )}
      </section>
    ),
  };

  return (
    <main className={"mx-auto w-full max-w-6xl px-4 " + (theme.layout === "editorial" ? "max-w-7xl" : theme.layout === "lookbook" ? "max-w-5xl" : "")}>
      {sectionOrder.map((section, index) => (
        <div key={`${section}-${index}`}>{sections[section]}</div>
      ))}
    </main>
  );
}

function ProductCard({
  slug,
  product,
  currency,
  large,
  imageRatio = "aspect-square",
  layout = "grid",
}: {
  slug: string;
  product: import("@/lib/storefront").PublicProduct;
  currency: string;
  large?: boolean;
  imageRatio?: string;
  layout?: "grid" | "editorial" | "list" | "showcase" | "lookbook";
}) {
  const img = productImage(product);
  const soldOut = product.track_stock && product.stock_quantity <= 0;
  return (
    <Link
      to="/s/$slug/product/$productId"
      params={{ slug, productId: product.id }}
      className={"group block overflow-hidden border transition hover:opacity-95 " + (layout === "editorial" ? "even:translate-y-8" : layout === "lookbook" ? "first:md:col-span-2" : layout === "showcase" ? "shadow-lg hover:-translate-y-1" : "")}
      style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)", background: "var(--sf-surface)" }}
    >
      <div className={`relative w-full overflow-hidden ${large ? (layout === "showcase" ? "aspect-[16/8]" : "aspect-[4/3]") : layout === "list" ? "aspect-[16/7]" : imageRatio}`}>
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: "var(--sf-muted)" }}>
            No image
          </div>
        )}
        {soldOut && (
          <span
            className="absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: "var(--sf-ink)", color: "var(--sf-bg)" }}
          >
            Sold out
          </span>
        )}
      </div>
      <div className={"p-3.5 " + (layout === "editorial" ? "py-5" : layout === "showcase" ? "p-5" : "")}>
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="mt-1 flex items-baseline gap-2 text-sm">
          <span className="font-semibold">{formatMoney(product.price, currency)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs line-through" style={{ color: "var(--sf-muted)" }}>
              {formatMoney(product.compare_at_price, currency)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
