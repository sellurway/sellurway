import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [connectedLast4, setConnectedLast4] = useState("");
  const [keyword, setKeyword] = useState("");
  const [markup, setMarkup] = useState("40");
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const importLimit = 2;
  const importsLocked = importedCount >= importLimit && !isLifetime;

  useEffect(() => {
    if (!activeStore) return;
    let cancelled = false;
    const loadConnection = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.access_token) return;
        const response = await fetch("/api/dropshipping/cj", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ action: "status", storeId: activeStore.id }),
        });
        const body = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && body.connected) {
          setConnected(true);
          setConnectedLast4(String(body.last4 || ""));
        }
      } catch {
        // Keep the page usable if Cloudflare is temporarily unavailable.
      }
    };
    void loadConnection();
    return () => { cancelled = true; };
  }, [activeStore?.id, isLifetime]);

  useEffect(() => {
    if (!activeStore) return;
    let cancelled = false;
    const loadImportedCount = async () => {
      const { data } = await supabase
        .from("products")
        .select("id,description")
        .eq("store_id", activeStore.id);
      const count = (data ?? []).filter((product) =>
        typeof product.description === "string" &&
        product.description.includes("SELLURWAY_DROPSHIP:")
      ).length;
      if (!cancelled) setImportedCount(count);
    };
    void loadImportedCount();
    return () => { cancelled = true; };
  }, [activeStore?.id]);

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
      setConnectedLast4(apiKey.trim().slice(-4));
      setApiKey("");
      toast.success("CJdropshipping connected and saved to Cloudflare.");
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
        body: JSON.stringify({ action: "search", keyword, storeId: activeStore?.id }),
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
        body: JSON.stringify({ action: "detail", pid: product.id, storeId: activeStore.id }),
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
    onSuccess: () => {
      setImportedCount((count) => count + 1);
      toast.success("Product imported into your store.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!activeStore) return <DashboardShell title="Dropshipping"><NoStore /></DashboardShell>;

  if (!isLifetime) {
    return (
      <DashboardShell
        title="Dropshipping"
        description="Unlock supplier sourcing and product importing with SellUrWay Lifetime."
      >
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm sm:p-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] md:items-center">
              <div>
                <Badge className="mb-4"><LockKeyhole className="mr-1.5 h-3.5 w-3.5" /> SELLURWAY LIFETIME</Badge>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Your next winning product starts here</p>
                <h2 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight sm:text-5xl">Stop searching everywhere. Find products to sell in one place.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                  Connect your CJdropshipping account, discover products, set your own markup and bring products into your SellUrWay store—all from your dashboard.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to="/upgrade">Unlock Dropshipping <ExternalLink className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <Link to="/upgrade">See Lifetime benefits</Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">One-time Lifetime offer · No recurring SellUrWay subscription for these Lifetime features</p>
              </div>
              <div className="relative rounded-2xl border bg-background/90 p-5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Truck className="h-6 w-6 text-primary" /></div>
                    <div><p className="font-semibold">Dropshipping toolkit</p><p className="text-xs text-muted-foreground">Included with Lifetime</p></div>
                  </div>
                  <LockKeyhole className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-4 py-5">
                  {[
                    { title: "Connect your supplier", detail: "Save your CJdropshipping connection securely." },
                    { title: "Discover products", detail: "Search supplier products from your dashboard." },
                    { title: "Set your selling price", detail: "Choose your markup before importing." },
                    { title: "Build your catalogue", detail: "Bring products and images into your store." },
                  ].map((item, index) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</div>
                      <div><p className="text-sm font-semibold">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.detail}</p></div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lifetime access</p>
                  <p className="mt-1 text-lg font-bold">Unlock the full workflow</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Supplier search, connection and importing stay locked until you unlock Lifetime.</p>
                </div>
              </div>
            </div>
          </section>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4"><Package className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Less manual work</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Keep product sourcing and your store workflow together.</p></div>
            <div className="rounded-2xl border bg-background p-4"><Search className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Research before you import</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Review supplier products and your planned selling price.</p></div>
            <div className="rounded-2xl border bg-background p-4"><ShoppingBag className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Grow your catalogue</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Import products into your own SellUrWay storefront.</p></div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Dropshipping"
      description="Find products, set your markup, and import them into your store."
    >
      <div className="space-y-6">
        <section className="surface-card space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-muted p-3"><Truck className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">CJdropshipping connection</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your supplier account. Your API key is stored securely in Cloudflare.
              </p>
            </div>
            {connected && <Badge variant="secondary">Connected{connectedLast4 ? ` ····${connectedLast4}` : ""}</Badge>}
          </div>
          {!connected ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                connect.mutate();
              }}
            >
              <Label htmlFor="cj-api-key">CJdropshipping API key</Label>
              <Input
                id="cj-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Paste your CJ API key"
              />
              <Button type="submit" disabled={!apiKey.trim() || connect.isPending}>
                {connect.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting…</> : "Connect CJdropshipping"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your supplier account is connected. Search for products below to start importing.
            </p>
          )}
        </section>

        <section className="surface-card space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">Find products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {importedCount} of {isLifetime ? "unlimited" : importLimit} free product imports used.
            </p>
          </div>
          <form
            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              search.mutate();
            }}
          >
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search products, e.g. wireless headphones"
              aria-label="Search supplier products"
            />
            <div className="relative">
              <Label htmlFor="dropship-markup" className="sr-only">Markup percentage</Label>
              <Input
                id="dropship-markup"
                type="number"
                min="0"
                max="1000"
                value={markup}
                onChange={(event) => setMarkup(event.target.value)}
                placeholder="Markup %"
                aria-label="Markup percentage"
              />
            </div>
            <Button type="submit" disabled={!connected || !keyword.trim() || search.isPending}>
              {search.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </form>
          {!connected && <p className="text-sm text-muted-foreground">Connect CJdropshipping above before searching.</p>}
        </section>

        {search.isPending && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Searching supplier products…
          </div>
        )}

        {!search.isPending && products.length === 0 && (
          <div className="surface-card py-12 text-center">
            <Package className="mx-auto h-9 w-9 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">Your product results will appear here</h3>
            <p className="mt-1 text-sm text-muted-foreground">Search CJdropshipping to find products you can sell.</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const cost = lowestPrice(product.sellPrice);
              const sellPrice = cost * (1 + Math.max(0, Number(markup) || 0) / 100);
              return (
                <article key={product.id} className="surface-card overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted"><ShoppingBag className="h-10 w-10 text-muted-foreground" /></div>
                  )}
                  <div className="space-y-3 p-4">
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.category && <p className="text-xs text-muted-foreground">{product.category}</p>}
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Supplier: {formatMoney(cost)}</span>
                      <span className="font-semibold">Your price: {formatMoney(sellPrice)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.inventory > 0 ? `${product.inventory} in supplier stock` : "Supplier stock not available"}
                    </p>
                    <Button
                      className="w-full"
                      disabled={importsLocked || importProduct.isPending}
                      onClick={() => importProduct.mutate(product)}
                    >
                      {importProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                      Import product
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
