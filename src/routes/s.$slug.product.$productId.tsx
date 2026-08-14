import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2, MessageCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore, whatsappLink, type PublicProduct } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";
import { addToCart } from "@/lib/cart";

export const Route = createFileRoute("/s/$slug/product/$productId")({
  component: ProductPage,
});

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
    () => [...(product?.product_images ?? [])].sort((a, b) => a.position - b.position),
    [product],
  );

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
            className="overflow-hidden border"
            style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)" }}
          >
            {images[activeImage] ? (
              <img src={images[activeImage]!.url} alt={product.name} className="aspect-square w-full object-cover" />
            ) : (
              <div
                className="flex aspect-square w-full items-center justify-center text-sm"
                style={{ color: "var(--sf-muted)" }}
              >
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setActiveImage(i)}
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

          {product.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed" style={{ color: "var(--sf-muted)" }}>
              {product.description}
            </p>
          )}

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
