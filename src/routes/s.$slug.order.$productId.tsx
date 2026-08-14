import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore, type PublicProduct } from "@/lib/storefront";
import { CheckoutForm } from "@/components/CheckoutForm";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/s/$slug/order/$productId")({
  validateSearch: (search: Record<string, unknown>): { qty: number; variant?: string } => {
    const qty = Math.min(99, Math.max(1, Number(search["qty"]) || 1));
    const variant = search["variant"];
    return typeof variant === "string" && variant ? { qty, variant } : { qty };
  },
  component: DirectOrderPage,
});

function DirectOrderPage() {
  const { slug, productId } = useParams({ from: "/s/$slug/order/$productId" });
  const { qty, variant } = Route.useSearch();
  const store = useStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["storefront-product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,description,price,compare_at_price,featured,stock_quantity,track_stock,category_id,product_images(url,position)",
        )
        .eq("id", productId)
        .eq("store_id", store.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as PublicProduct) ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--sf-muted)" }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--sf-heading)" }}>
          Product not found
        </h1>
        <Link to="/s/$slug" params={{ slug }} className="mt-4 inline-block text-sm underline">
          Back to store
        </Link>
      </div>
    );
  }

  const image = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position)[0]?.url ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--sf-heading)" }}>
        Place your order
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--sf-muted)" }}>
        {product.name} · {qty} × {formatMoney(product.price, store.currency)}
      </p>
      <div className="mt-8">
        <CheckoutForm
          store={store}
          source="direct_order"
          lines={[
            {
              product_id: product.id,
              name: product.name,
              price: Number(product.price),
              image,
              quantity: qty,
              variant_label: variant ?? null,
            },
          ]}
          onPlaced={(result) => {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem(`sellurway.order.${result.order_number}`, JSON.stringify(result));
            }
          }}
        />
      </div>
    </main>
  );
}
