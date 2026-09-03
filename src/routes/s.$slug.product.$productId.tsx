import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, MessageCircle, Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore, whatsappLink, productImages, type PublicProduct } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";
import { addToCart } from "@/lib/cart";

export const Route = createFileRoute("/s/$slug/product/$productId")({
  head: () => ({ meta: [{ title: "Product | Sellurway" }, { name: "description", content: "View this product on Sellurway." }] }),
  component: ProductPage,
});

function parseProductInfo(description: string | null) {
  const marker = "<!--SELLURWAY_PRODUCT_INFO:";
  if (!description?.includes(marker)) return { description: description ?? "", info: null as null | { brand?: string; key_features?: string; specifications?: string; in_the_box?: string } };
  const start = description.indexOf(marker);
  const end = description.indexOf("-->", start);
  if (end === -1) return { description, info: null };
  try {
    const raw = description.slice(start + marker.length, end);
    return {
      description: description.slice(0, start).trim(),
      info: JSON.parse(decodeURIComponent(raw)),
    };
  } catch {
    return { description: description.slice(0, start).trim(), info: null };
  }
}

const REVIEWS_API = "https://sellurway-reviews-api.sellurway.workers.dev";

type Review = { id: number; customer_name: string; rating: number; comment: string; created_at: string };

function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const loadReviews = async () => {
    const response = await fetch(REVIEWS_API + "?product_id=" + encodeURIComponent(productId));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Couldn't load reviews");
    setReviews(data.reviews || []);
    setAverage(Number(data.average || 0));
    setTotal(Number(data.total || 0));
  };

  useEffect(() => { loadReviews().catch(() => toast.error("Couldn't load reviews")); }, [productId]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) { toast.error("Please enter your name and review"); return; }
    setSending(true);
    try {
      const response = await fetch(REVIEWS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, customer_name: name.trim(), rating, comment: comment.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't post review");
      setName(""); setComment(""); setRating(5);
      await loadReviews();
      toast.success("Your review was posted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't post review");
    } finally { setSending(false); }
  }

  return <section className="mt-8 border-t pt-6" style={{ borderColor: "var(--sf-border)" }}>
    <h2 className="text-xl font-bold">Customer reviews</h2>
    <div className="mt-2 flex items-center gap-2">
      <div className="flex">{[1,2,3,4,5].map((n) => <Star key={n} className="h-4 w-4" fill={n <= Math.round(average) ? "currentColor" : "none"} style={{ color: "var(--sf-accent)" }} />)}</div>
      <span className="text-sm font-semibold">{average ? average + " / 5" : "No reviews yet"}</span>
      <span className="text-xs" style={{ color: "var(--sf-muted)" }}>({total})</span>
    </div>
    <form onSubmit={submitReview} className="mt-5 space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--sf-border)" }}>
      <h3 className="font-semibold">Write a review</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} required className="w-full rounded-md border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--sf-border)" }} />
      <div className="flex gap-1">{[1,2,3,4,5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} aria-label={n + " stars"}><Star className="h-6 w-6" fill={n <= rating ? "currentColor" : "none"} style={{ color: "var(--sf-accent)" }} /></button>)}</div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell other customers what you think..." maxLength={1000} required rows={4} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--sf-border)" }} />
      <button disabled={sending} className="w-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)", borderRadius: "var(--sf-btn-radius)" }}>{sending ? "Posting..." : "Post review"}</button>
    </form>
    <div className="mt-6 space-y-4">{reviews.length === 0 ? <p className="text-sm" style={{ color: "var(--sf-muted)" }}>Be the first customer to review this product.</p> : reviews.map((review) => <article key={review.id} className="border-b pb-4" style={{ borderColor: "var(--sf-border)" }}>
      <div className="flex items-center justify-between"><strong className="text-sm">{review.customer_name}</strong><span className="text-xs" style={{ color: "var(--sf-muted)" }}>{new Date(review.created_at + "Z").toLocaleDateString()}</span></div>
      <div className="mt-1 flex">{[1,2,3,4,5].map((n) => <Star key={n} className="h-4 w-4" fill={n <= review.rating ? "currentColor" : "none"} style={{ color: "var(--sf-accent)" }} />)}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm" style={{ color: "var(--sf-muted)" }}>{review.comment}</p>
    </article>)}</div>
  </section>;
}

function ProductPage() {
  const { slug, productId } = useParams({ from: "/s/$slug/product/$productId" });
  const store = useStore();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["storefront-product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,description,price,compare_at_price,featured,stock_quantity,track_stock,category_id,product_images(url,position),product_variants(id,name,value,price_delta)",
        )
        .eq("id", productId)
        .eq("store_id", store.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as PublicProduct) ?? null;
    },
  });

  const images = useMemo(
    () => product ? productImages(product).map((url, position) => ({ url, position })) : [],
    [product],
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  function goToImage(index: number) {
    const el = scrollerRef.current;
    const count = images.length;
    if (!el || !count) return;
    const next = (index + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setActiveImage(next);
  }



  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--sf-muted)" }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--sf-heading)" }}>
          Product not found
        </h1>
        <Link to="/s/$slug" params={{ slug }} className="mt-4 inline-block text-sm underline">
          Back to store
        </Link>
      </div>
    );
  }

  const parsedProduct = parseProductInfo(product.description);
  const soldOut = product.track_stock && product.stock_quantity <= 0;
  const variantDelta = product.product_variants?.find((v) => v.id === variant)?.price_delta ?? 0;
  const unitPrice = Number(product.price) + Number(variantDelta);
  const variantLabel = (() => {
    const v = product.product_variants?.find((x) => x.id === variant);
    return v ? `${v.name}: ${v.value}` : null;
  })();

  const showCart = store.selling_mode === "full_checkout" || store.selling_mode === "multiple";
  const showDirect = store.selling_mode === "direct_order" || store.selling_mode === "multiple";
  const showWhats =
    (store.selling_mode === "whatsapp" || store.selling_mode === "multiple") && !!store.whatsapp_number;

  function handleAdd(goToCart: boolean) {
    if (!product) return;
    addToCart(slug, {
      product_id: product.id,
      name: product.name,
      price: unitPrice,
      image: images[0]?.url ?? null,
      quantity: qty,
      variant_label: variantLabel,
    });
    if (goToCart) navigate({ to: "/s/$slug/checkout", params: { slug } });
    else toast.success(`${product.name} added to your cart`);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        to="/s/$slug"
        params={{ slug }}
        className="inline-flex items-center gap-1 text-sm"
        style={{ color: "var(--sf-muted)" }}
      >
        <ChevronLeft className="h-4 w-4" /> All products
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <div
            className="relative overflow-hidden border"
            style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)" }}
          >
            {images.length ? (
              <div
                ref={scrollerRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const i = Math.round(el.scrollLeft / el.clientWidth);
                  if (i !== activeImage) setActiveImage(i);
                }}
                className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((img, i) => (
                  <img
                    key={img.url}
                    src={img.url}
                    alt={`${product.name} — photo ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="aspect-square w-full shrink-0 snap-center object-cover"
                  />
                ))}
              </div>
            ) : (
              <div
                className="flex aspect-square w-full items-center justify-center text-sm"
                style={{ color: "var(--sf-muted)" }}
              >
                No image
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => goToImage(activeImage - 1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 shadow-sm"
                  style={{ background: "var(--sf-bg)", color: "var(--sf-ink)" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToImage(activeImage + 1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 shadow-sm"
                  style={{ background: "var(--sf-bg)", color: "var(--sf-ink)" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {images.map((img, i) => (
                    <span
                      key={img.url}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === activeImage ? 16 : 6,
                        background: i === activeImage ? "var(--sf-accent)" : "var(--sf-border)",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <>
              <p className="mt-2 text-center text-xs sm:hidden" style={{ color: "var(--sf-muted)" }}>
                Swipe to see more photos ({activeImage + 1}/{images.length})
              </p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    onClick={() => goToImage(i)}
                    className="overflow-hidden border"
                    style={{
                      borderColor: i === activeImage ? "var(--sf-accent)" : "var(--sf-border)",
                      borderRadius: "calc(var(--sf-card-radius) / 2)",
                    }}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>


        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--sf-heading)" }}>
            {product.name}
          </h1>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatMoney(unitPrice, store.currency)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm line-through" style={{ color: "var(--sf-muted)" }}>
                {formatMoney(product.compare_at_price, store.currency)}
              </span>
            )}
          </p>

          {parsedProduct.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed" style={{ color: "var(--sf-muted)" }}>
              {parsedProduct.description}
            </p>
          )}

          {parsedProduct.info && (
            <div className="mt-6 space-y-4">
              {parsedProduct.info.brand && (
                <div className="border-t pt-4" style={{ borderColor: "var(--sf-border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--sf-muted)" }}>Brand</p>
                  <p className="mt-1 text-sm font-medium">{parsedProduct.info.brand}</p>
                </div>
              )}
              {parsedProduct.info.key_features && (
                <div className="border-t pt-4" style={{ borderColor: "var(--sf-border)" }}>
                  <h2 className="font-semibold">Key features</h2>
                  <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--sf-muted)" }}>
                    {parsedProduct.info.key_features.split("\n").filter(Boolean).map((feature) => (
                      <li key={feature} className="flex gap-2"><span style={{ color: "var(--sf-accent)" }}>✓</span>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              {parsedProduct.info.specifications && (
                <div className="border-t pt-4" style={{ borderColor: "var(--sf-border)" }}>
                  <h2 className="font-semibold">Specifications</h2>
                  <div className="mt-3 overflow-hidden rounded-lg border text-sm" style={{ borderColor: "var(--sf-border)" }}>
                    {parsedProduct.info.specifications.split("\n").filter(Boolean).map((spec) => {
                      const [label, ...rest] = spec.split(":");
                      return <div key={spec} className="grid grid-cols-2 border-b p-3 last:border-b-0" style={{ borderColor: "var(--sf-border)" }}><span className="font-medium">{label}</span><span style={{ color: "var(--sf-muted)" }}>{rest.join(":").trim() || spec}</span></div>;
                    })}
                  </div>
                </div>
              )}
              {parsedProduct.info.in_the_box && (
                <div className="border-t pt-4" style={{ borderColor: "var(--sf-border)" }}>
                  <h2 className="font-semibold">What's in the box</h2>
                  <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--sf-muted)" }}>
                    {parsedProduct.info.in_the_box.split("\n").filter(Boolean).map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <ProductReviews productId={product.id} />

          {(product.product_variants?.length ?? 0) > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">{product.product_variants![0]!.name}</p>
              <div className="flex flex-wrap gap-2">
                {product.product_variants!.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v.id)}
                    className="rounded-md border px-3 py-1.5 text-sm"
                    style={{
                      borderColor: variant === v.id ? "var(--sf-accent)" : "var(--sf-border)",
                      background: variant === v.id ? "var(--sf-accent)" : "transparent",
                      color: variant === v.id ? "var(--sf-accent-ink)" : "var(--sf-ink)",
                    }}
                  >
                    {v.value}
                    {Number(v.price_delta) !== 0 &&
                      ` (${Number(v.price_delta) > 0 ? "+" : ""}${formatMoney(v.price_delta, store.currency)})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-medium">Quantity</span>
            <div className="inline-flex items-center border" style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-btn-radius)" }}>
              <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-8 text-center text-sm">{qty}</span>
              <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Increase quantity">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {product.track_stock && (
              <span className="text-xs" style={{ color: "var(--sf-muted)" }}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
              </span>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-2.5">
            {soldOut ? (
              <div
                className="px-5 py-3 text-center text-sm"
                style={{ border: "1px solid var(--sf-border)", borderRadius: "var(--sf-btn-radius)", color: "var(--sf-muted)" }}
              >
                This item is sold out
              </div>
            ) : (
              <>
                {showCart && (
                  <>
                    <button
                      onClick={() => handleAdd(false)}
                      className="w-full px-5 py-3 text-sm font-semibold"
                      style={{
                        background: "var(--sf-accent)",
                        color: "var(--sf-accent-ink)",
                        borderRadius: "var(--sf-btn-radius)",
                      }}
                    >
                      Add to cart
                    </button>
                    <button
                      onClick={() => handleAdd(true)}
                      className="w-full border px-5 py-3 text-sm font-semibold"
                      style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-btn-radius)" }}
                    >
                      Buy now
                    </button>
                  </>
                )}
                {showDirect && (
                  <Link
                    to="/s/$slug/order/$productId"
                    params={{ slug, productId: product.id }}
                    search={variantLabel ? { qty, variant: variantLabel } : { qty }}
                    className="w-full px-5 py-3 text-center text-sm font-semibold"
                    style={{
                      background: showCart ? "transparent" : "var(--sf-accent)",
                      color: showCart ? "var(--sf-ink)" : "var(--sf-accent-ink)",
                      border: showCart ? "1px solid var(--sf-border)" : "none",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  >
                    Order now
                  </Link>
                )}
                {showWhats && (
                  <a
                    href={whatsappLink(
                      store,
                      `Hi ${store.name}, I'd like to order:\n\n${product.name}${variantLabel ? ` (${variantLabel})` : ""}\nQuantity: ${qty}\nPrice: ${formatMoney(unitPrice * qty, store.currency)}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                    style={{
                      background: showCart || showDirect ? "transparent" : "var(--sf-accent)",
                      color: showCart || showDirect ? "var(--sf-ink)" : "var(--sf-accent-ink)",
                      border: showCart || showDirect ? "1px solid var(--sf-border)" : "none",
                      borderRadius: "var(--sf-btn-radius)",
                    }}
                  >
                    <MessageCircle className="h-4 w-4" /> Order on WhatsApp
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
