import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, Loader2, LockKeyhole, Package, Search, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dropshipping")({
  head: () => ({
    meta: [
      { title: "Dropshipping — Sellurway" },
      { name: "description", content: "Find products from dropshipping suppliers and import them into your Sellurway store." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DropshippingPage,
});

type SupplierProduct = {
  id: string;
  name: string;
  image: string | null;
  sellPrice: string;
  sku: string | null;
  inventory: number;
  category: string | null;
};

type SupplierVariant = {
  vid?: string;
  variantSku?: string;
  variantKey?: string;
  variantNameEn?: string;
  variantSellPrice?: number | string;
};

function lowestPrice(value: string) {
  const first = Number(String(value).split("-")[0]);
  return Number.isFinite(first) ? first : 0;
}

function DropshippingPage() {
  const { activeStore, isLifetime } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [markup, setMarkup] = useState("40");
  const [products, setProducts] = useState<SupplierProduct[]>([]);

  const connect = useMutation({
    mutationFn: async () => {
      if (!activeStore) throw new Error("Create a store first.");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dropshipping/cj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          action: "connect",
          apiKey: apiKey.trim(),
          storeId: activeStore.id,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not connect CJdropshipping.");
    },
    onSuccess: () => {
      setConnected(true);
      toast.success("CJdropshipping connected.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const search = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dropshipping/cj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ apiKey: apiKey.trim(), action: "search", keyword }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "CJ search failed.");
      return body.products as SupplierProduct[];
    },
    onSuccess: (rows) => {
      setProducts(rows ?? []);
      toast.success(`${rows?.length ?? 0} products found`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const importProduct = useMutation({
    mutationFn: async (product: SupplierProduct) => {
      if (!activeStore) throw new Error("Create a store first.");
      const cost = lowestPrice(product.sellPrice);
      const markupRate = Math.max(0, Number(markup) || 0) / 100;
      const price = Number((cost * (1 + markupRate)).toFixed(2));
      if (!cost || !price) throw new Error("CJ did not return a usable supplier price.");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error("Please sign in again.");
      const detailResponse = await fetch("/api/dropshipping/cj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ apiKey: apiKey.trim(), action: "detail", pid: product.id }),
      });
      const detailBody = await detailResponse.json().catch(() => ({}));
      if (!detailResponse.ok) throw new Error(detailBody.error || "Could not load the CJ product variants.");
      const rawVariants = Array.isArray(detailBody.product?.variants) ? detailBody.product.variants : [];
      const variant = (rawVariants[0] ?? null) as SupplierVariant | null;
      const supplierVariantId = variant?.vid ? String(variant.vid) : null;
      const supplierSku = variant?.variantSku ? String(variant.variantSku) : product.sku;

      const description = [
        "Imported from CJdropshipping.",
        product.category ? `Supplier category: ${product.category}` : "",
        "",
        `<!--SELLURWAY_DROPSHIP:${encodeURIComponent(JSON.stringify({
          supplier: "cjdropshipping",
          supplier_product_id: product.id,
          supplier_variant_id: supplierVariantId,
          supplier_sku: supplierSku,
          supplier_cost: cost,
          markup_percent: Number(markup) || 0,
          sync_enabled: false,
        }))}-->`,
      ].filter(Boolean).join("\n");

      const { data: created, error } = await supabase
        .from("products")
        .insert({
          store_id: activeStore.id,
          name: product.name,
          description,
          price,
          compare_at_price: null,
          sku: supplierSku,
          stock_quantity: Math.max(0, product.inventory),
          track_stock: product.inventory > 0,
          status: "active",
          featured: false,
          category_id: null,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (product.image) {
        const { error: imageError } = await supabase.from("product_images").insert({
          product_id: created.id,
          store_id: activeStore.id,
          url: product.image,
          position: 0,
        });
        if (imageError) throw imageError;
      }
    },
    onSuccess: () => toast.success("Product imported into your store."),
    onError: (error: Error) => toast.error(error.message),
  });

  if (!activeStore) return <DashboardShell title="Dropshipping"><NoStore /></DashboardShell>;

  if (!isLifetime) {
    return (
      <DashboardShell
        title="Dropshipping"
        description="Source products from suppliers and import them into your SellUrWay store."
      >
        <div className="relative min-h-[680px] overflow-hidden rounded-2xl">
          <div aria-hidden className="pointer-events-none select-none blur-lg opacity-60">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-5">
                <section className="surface-card space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-primary/10 p-2"><Truck className="h-5 w-5" /></span>
                    <div><h2 className="font-display font-semibold">CJdropshipping</h2><p className="text-xs">Product sourcing + fulfilment API</p></div>
                    <Badge className="ml-auto">Connected</Badge>
                  </div>
                  <Input value="CJ API key ••••••••••••••••" readOnly />
                  <Button className="w-full">Connect CJdropshipping</Button>
                </section>
                <section className="surface-card space-y-4 p-5">
                  <h2 className="font-display font-semibold">Your selling price</h2>
                  <Input value="40%" readOnly />
                  <div className="rounded-lg bg-muted p-3 text-sm">Supplier cost $10 · Store price $14</div>
                </section>
              </div>
              <section className="space-y-4">
                <div className="surface-card flex gap-2 p-4"><Input value="Search CJ products" readOnly /><Button>Search</Button></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => (
                    <article key={item} className="surface-card overflow-hidden">
                      <div className="aspect-[4/3] bg-muted" />
                      <div className="space-y-3 p-4">
                        <div className="h-5 rounded bg-muted" /><div className="h-4 w-2/3 rounded bg-muted" />
                        <Button className="w-full">Import product</Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-background/35 p-6 backdrop-blur-[1px]">
            <section className="surface-card w-full max-w-md border-gold/40 bg-card/95 p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-soft">
                <LockKeyhole className="h-7 w-7 text-gold" />
              </div>
              <p className="mt-5 text-sm font-semibold tracking-wide text-gold">LIFETIME FEATURE</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Unlock Dropshipping</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Connect CJdropshipping, search supplier products and import them into your SellUrWay store.
              </p>
              <div className="mt-5 rounded-xl border bg-muted/50 p-4 text-left text-sm">
                <p className="font-semibold">$10 one-time payment</p>
                <p className="mt-1 text-muted-foreground">Pay once and keep Dropshipping unlocked for life.</p>
              </div>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link to="/upgrade">Unlock Dropshipping</Link>
              </Button>
            </section>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Dropshipping"
      description="Find supplier products, set your markup and import them into your store."
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <section className="surface-card space-y-4 p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-primary/10 p-2 text-primary"><Truck className="h-5 w-5" /></span>
              <div>
                <h2 className="font-display font-semibold">CJdropshipping</h2>
                <p className="text-xs text-muted-foreground">Product sourcing + fulfilment API</p>
              </div>
              <Badge className="ml-auto">{connected ? "Connected" : "Not connected"}</Badge>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cj-key">Your CJ API key</Label>
              <Input
                id="cj-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your CJ API key"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Your key is used to connect your own CJ account. It is stored for this store so future stock and order sync can run without asking again.
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!apiKey.trim() || connect.isPending}
              onClick={() => connect.mutate()}
            >
              {connect.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Truck className="mr-1.5 h-4 w-4" />}
              Connect CJdropshipping
            </Button>
            <a
              href="https://developers.cjdropshipping.com/en/api/start/token.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs font-medium text-primary hover:underline"
            >
              CJ API setup guide <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </section>

          <section className="surface-card space-y-4 p-5">
            <div>
              <h2 className="font-display font-semibold">Your selling price</h2>
              <p className="text-xs text-muted-foreground">Choose the markup SellUrWay applies when importing.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="markup">Markup percentage</Label>
              <Input id="markup" inputMode="decimal" value={markup} onChange={(e) => setMarkup(e.target.value)} />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              Example: a $10 supplier cost with 40% markup becomes <strong>$14</strong>.
            </div>
          </section>

          <section className="surface-card p-5">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">What's working now</p>
                <p className="text-xs text-muted-foreground">Search CJ, view products and import them as normal SellUrWay products.</p>
              </div>
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <div className="surface-card flex gap-2 p-4">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && apiKey && keyword) search.mutate(); }}
              placeholder="Search CJ products e.g. wireless headphones"
            />
            <Button disabled={!apiKey.trim() || !keyword.trim() || search.isPending} onClick={() => search.mutate()}>
              {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1.5">Search</span>
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Search for a supplier product</p>
              <p className="mt-1 text-sm text-muted-foreground">Results will appear here with supplier cost, stock and an import button.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => {
                const cost = lowestPrice(product.sellPrice);
                const price = cost * (1 + Math.max(0, Number(markup) || 0) / 100);
                return (
                  <article key={product.id} className="surface-card overflow-hidden">
                    <div className="aspect-[4/3] bg-muted">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="line-clamp-2 font-medium">{product.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Supplier cost {formatMoney(cost, "USD")} · Store price {formatMoney(price, "USD")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{product.inventory > 0 ? `${product.inventory} in stock` : "Stock unavailable"}</span>
                        {product.sku && <span className="truncate pl-2">SKU {product.sku}</span>}
                      </div>
                      <Button
                        className="w-full"
                        disabled={importProduct.isPending}
                        onClick={() => importProduct.mutate(product)}
                      >
                        {importProduct.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Package className="mr-1.5 h-4 w-4" />}
                        Import product
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
