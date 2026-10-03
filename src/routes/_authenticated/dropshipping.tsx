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

