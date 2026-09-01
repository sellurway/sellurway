import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Empty } from "@/components/Empty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/products/")({
  head: () => ({
    meta: [
      { title: "Products — Sellurway" },
      { name: "description", content: "Add, edit and organise the products in your Sellurway store." },
      { property: "og:title", content: "Products — Sellurway" },
      { property: "og:description", content: "Manage your catalogue: photos, prices, stock and options." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductsPage,
});

interface Row {
  id: string;
  name: string;
  price: number;
  status: string;
  featured: boolean;
  stock_quantity: number;
  track_stock: boolean;
  created_at: string;
  product_images: { url: string; position: number }[];
}

function ProductsPage() {
  const { activeStore, isLifetime } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,price,status,featured,stock_quantity,track_stock,created_at,product_images(url,position)")
        .eq("store_id", activeStore!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeStore?.id] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase
        .from("products")
        .update({ status: row.status === "active" ? "draft" : "active" })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products", activeStore?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!activeStore) {
    return (
      <DashboardShell title="Products">
        <NoStore />
      </DashboardShell>
    );
  }

  const all = products ?? [];
  const filtered = all.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      p.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const atLimit = !isLifetime && all.length >= 3;

  return (
    <DashboardShell
      title="Products"
      description={`${all.length} product${all.length === 1 ? "" : "s"}${isLifetime ? "" : " of 3 on the free plan"}`}
      actions={
        atLimit ? (
          <Button asChild>
            <Link to="/upgrade">Upgrade for unlimited products</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/products/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add product
            </Link>
          </Button>
        )
      }
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {atLimit && (
        <div className="mb-4 rounded-[var(--radius-xl)] border border-gold/40 bg-gold-soft/40 p-4 text-sm">
          You've hit the free plan's 3 product limit. One $10 payment unlocks unlimited products and premium themes.
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      ) : filtered.length === 0 ? (
        <Empty
          icon={Package}
          title={all.length === 0 ? "No products yet" : "Nothing matches that filter"}
          description={
            all.length === 0
              ? "Add your first product with photos, a price and stock, and it shows up in your store instantly."
              : "Try a different search or status."
          }
          action={
            all.length === 0 && !atLimit ? (
              <Button asChild>
                <Link to="/products/new">Add your first product</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-xl)] border">
          {filtered.map((p) => {
            const img = [...(p.product_images ?? [])].sort((a, b) => a.position - b.position)[0]?.url;
            return (
              <div key={p.id} className="flex items-center gap-4 border-b bg-card p-3 last:border-b-0">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {img ? (
                    <img src={img} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(p.price)}
                    {p.track_stock ? ` · ${p.stock_quantity} in stock` : ""}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  {p.featured && <Badge variant="secondary">Featured</Badge>}
                  <button onClick={() => toggle.mutate(p)} className="cursor-pointer">
                    <Badge variant={p.status === "active" ? "default" : "outline"}>
                      {p.status === "active" ? "Active" : "Draft"}
                    </Badge>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label="Edit product">
                    <Link to="/products/$productId" params={{ productId: p.id }}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete product"
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"? This can't be undone.`)) remove.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
