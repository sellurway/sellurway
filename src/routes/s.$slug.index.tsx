import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, PackageOpen, Search, Star } from "lucide-react";
import { productImage, useStore, useStoreCategories, useStoreProducts } from "@/lib/storefront";
import { getTheme } from "@/lib/themes";
import { formatMoney } from "@/lib/format";

const REVIEWS_API = "https://sellurway-reviews-api.sellurway.workers.dev";
type RatingInfo = { average: number; count: number };

export const Route = createFileRoute("/s/$slug/")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | Sellurway Store` },
      { name: "description", content: `Shop ${params.slug} on Sellurway. Browse products and discover great deals online.` },
      { property: "og:title", content: `${params.slug} | Sellurway Store` },
      { property: "og:description", content: `Shop ${params.slug} on Sellurway.` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorefrontHome,
});

function StorefrontHome() {
  const { slug } = useParams({ from: "/s/$slug/" });
  const store = useStore();
  const { data: products, isLoading } = useStoreProducts(store.id);
  const { data: categories } = useStoreCategories(store.id);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const theme = getTheme(store.theme);
  const settings = store.theme_settings ?? {};

  useEffect(() => {
    const title = store.name ? ` | Sellurway` : "Sellurway Store";
    const description = store.description || `Shop  online on Sellurway.`;
    document.title = title;
    const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.content = content;
    };
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    if (store.banner_url) setMeta('meta[property="og:image"]', "property", "og:image", store.banner_url);
  }, [store.name, store.description, store.banner_url]);

  useEffect(() => {
    if (!products?.length) return;
    let cancelled = false;
    Promise.all(products.map(async (product) => {
      try {
        const response = await fetch(REVIEWS_API + "?product_id=" + encodeURIComponent(product.id));
        if (!response.ok) return [product.id, { average: 0, count: 0 }] as const;
        const data = await response.json();
        const reviews = data.reviews ?? [];
        const count = reviews.length;
        const average = count ? reviews.reduce((sum: number, review: { rating: number }) => sum + Number(review.rating || 0), 0) / count : 0;
        return [product.id, { average, count }] as const;
      } catch { return [product.id, { average: 0, count: 0 }] as const; }
    })).then((entries) => { if (!cancelled) setRatings(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [products]);

  const list = useMemo(() => {
    const filtered = (products ?? []).filter((p) => {
      const matchesCategory = !activeCategory || p.category_id === activeCategory;
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesMin = !minPrice || p.price >= Number(minPrice);
      const matchesMax = !maxPrice || p.price <= Number(maxPrice);
      return matchesCategory && matchesSearch && matchesMin && matchesMax;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rating") return (ratings[b.id]?.average ?? 0) - (ratings[a.id]?.average ?? 0);
      return Number(b.featured) - Number(a.featured);
    });
  }, [products, activeCategory, search, minPrice, maxPrice, sortBy, ratings]);
  const featured = useMemo(() => (products ?? []).filter((p) => p.featured).slice(0, 3), [products]);

  useEffect(() => {
    const id = "sellurway-store-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = id; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: store.name,
      description: store.description || undefined,
      url: window.location.href,
      image: store.banner_url || store.logo_url || undefined,
    });
    return () => script?.remove();
  }, [store.name, store.description, store.banner_url, store.logo_url]);


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
    : ["hero", "promo", "imageText", "featured", "categories", "products", "testimonials", "newsletter", "social"] as const;
  const enabledSections = settings.enabledSections ?? ["hero", "featured", "categories", "products"];

  const heroImages = settings.heroImages?.length
    ? settings.heroImages
    : [settings.heroImageUrl || store.banner_url].filter(Boolean) as string[];
  const [activeHero, setActiveHero] = useState(0);
  useEffect(() => {
    if (heroImages.length < 2) return;
    const timer = window.setInterval(() => setActiveHero((i) => (i + 1) % heroImages.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);


  const sections: Record<string, ReactNode> = {
    hero: settings.showHero !== false ? (
      <section className={"py-10 md:py-14 " + (theme.layout === "showcase" ? "md:py-20" : theme.layout === "editorial" ? "md:py-24" : "")}>
        {heroImages.length > 0 && (
          <div className={"relative mb-8 overflow-hidden " + (theme.layout === "editorial" ? "md:-mx-8" : theme.layout === "showcase" ? "shadow-2xl" : "")} style={{ borderRadius: "var(--sf-card-radius)" }}>
            <img src={heroImages[activeHero]} alt="" className={"w-full object-cover transition-opacity duration-500 " + (theme.layout === "showcase" ? "h-56 sm:h-[28rem]" : theme.layout === "editorial" ? "h-64 sm:h-[32rem]" : "h-44 sm:h-64")} />
            {heroImages.length > 1 && <>
              <button aria-label="Previous banner" onClick={() => setActiveHero((i) => (i - 1 + heroImages.length) % heroImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white">‹</button>
              <button aria-label="Next banner" onClick={() => setActiveHero((i) => (i + 1) % heroImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-white">›</button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">{heroImages.map((_, i) => <button key={i} aria-label={`Go to banner ${i + 1}`} onClick={() => setActiveHero(i)} className={"h-2.5 w-2.5 rounded-full " + (i === activeHero ? "bg-white" : "bg-white/50")} />)}</div>
            </>}
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
          {featured.map((p) => <ProductCard key={p.id} slug={slug} product={p} currency={store.currency} rating={ratings[p.id]} large imageRatio={imageRatio} layout={theme.layout} />)}
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
            {list.map((p) => <ProductCard key={p.id} slug={slug} product={p} currency={store.currency} rating={ratings[p.id]} imageRatio={imageRatio} layout={theme.layout} />)}
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
  rating,
  large,
  imageRatio = "aspect-square",
  layout = "grid",
}: {
  slug: string;
  product: import("@/lib/storefront").PublicProduct;
  currency: string;
  rating?: RatingInfo;
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
        <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--sf-accent)" }}>
          <Star className="h-3.5 w-3.5" fill={rating?.count ? "currentColor" : "none"} />
          <span>{rating?.count ? `${rating.average.toFixed(1)} (${rating.count} ${rating.count === 1 ? "review" : "reviews"})` : "No reviews yet"}</span>
        </div>
      </div>
    </Link>
  );
}
