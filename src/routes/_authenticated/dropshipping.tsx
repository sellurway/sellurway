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

  if (importsLocked) {
    return (
      <DashboardShell
        title="Dropshipping"
        description="You have used your 2 free product imports."
      >
        <section className="surface-card mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-soft">
            <LockKeyhole className="h-7 w-7 text-gold" />
          </div>
          <p className="mt-5 text-sm font-semibold tracking-wide text-gold">2 FREE IMPORTS USED</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Unlock more dropshipping</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            You can import 2 products for free. Unlock Dropshipping to import unlimited products and keep using CJdropshipping.
          </p>
          <div className="mt-5 rounded-xl border bg-muted/50 p-4 text-left text-sm">
            <p className="font-semibold">$10 one-time payment</p>
            <p className="mt-1 text-muted-foreground">Pay once and keep Dropshipping unlocked for life.</p>
          </div>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link to="/upgrade">Unlock Dropshipping</Link>
          </Button>
        </section>
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
