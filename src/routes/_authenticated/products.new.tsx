import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { ProductForm, emptyDraft } from "@/components/ProductForm";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/products/new")({
  head: () => ({
    meta: [
      { title: "Add product — Sellurway" },
      { name: "description", content: "Create a new product with photos, price, stock and options." },
      { property: "og:title", content: "Add product — Sellurway" },
      { property: "og:description", content: "Add a product to your Sellurway storefront." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewProduct,
});

function NewProduct() {
  const { activeStore } = useAuth();
  return (
    <DashboardShell title="Add product" description="It goes live in your store as soon as you save it.">
      {activeStore ? <ProductForm initial={emptyDraft} storeId={activeStore.id} /> : <NoStore />}
    </DashboardShell>
  );
}
