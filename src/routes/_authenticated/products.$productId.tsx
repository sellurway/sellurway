import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { ProductForm, type ProductDraft } from "@/components/ProductForm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/products/$productId")({
  head: () => ({
    meta: [
      { title: "Edit product — Sellurway" },
      { name: "description", content: "Update photos, pricing, stock and options for this product." },
      { property: "og:title", content: "Edit product — Sellurway" },
      { property: "og:description", content: "Edit a product in your Sellurway storefront." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditProduct,
});

function EditProduct() {
  const { productId } = Route.useParams();
  const { activeStore } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,description,price,compare_at_price,sku,stock_quantity,track_stock,status,featured,category_id,product_images(url,position),product_variants(id,name,value,price_delta)",
        )
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!activeStore) {
    return (
      <DashboardShell title="Edit product">
        <NoStore />
      </DashboardShell>
    );
  }

  const draft: ProductDraft | null = data
    ? {
        id: data.id,
        name: data.name,
        description: data.description ?? "",
        price: String(data.price ?? ""),
        compare_at_price: data.compare_at_price == null ? "" : String(data.compare_at_price),
        sku: data.sku ?? "",
        stock_quantity: String(data.stock_quantity ?? 0),
        track_stock: data.track_stock,
        status: data.status,
        featured: data.featured,
        category_id: data.category_id,
        images: [...(data.product_images ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((i) => i.url),
        variants: (data.product_variants ?? []).map((v) => ({
          id: v.id,
          name: v.name,
          value: v.value,
          price_delta: String(v.price_delta ?? 0),
        })),
      }
    : null;

  return (
    <DashboardShell title="Edit product" description={data?.name ?? undefined}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading product…</p>
      ) : draft ? (
        <ProductForm initial={draft} storeId={activeStore.id} />
      ) : (
        <p className="text-sm text-muted-foreground">That product no longer exists.</p>
      )}
    </DashboardShell>
  );
}
