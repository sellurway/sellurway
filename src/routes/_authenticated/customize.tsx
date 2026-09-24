import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Columns3,
  Eye,
  Laptop,
  Palette,
  PanelLeft,
  PanelRight,
  Smartphone,
  Plus,
  Sparkles,
  Store,
  Type,
  Undo2,
  Redo2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { getTheme, THEMES, type ThemeSettings } from "@/lib/themes";
import { ProductForm, emptyDraft } from "@/components/ProductForm";
import { ImageUploader } from "@/components/ImageUploader";

export const Route = createFileRoute("/_authenticated/customize")({
  head: () => ({
    meta: [
      { title: "Customize Store — Sellurway" },
      { name: "description", content: "Customize your Sellurway storefront visually with live preview controls." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomizePage,
});

type SectionId = "hero" | "featured" | "categories" | "products";
type Device = "desktop" | "mobile";
type Panel = "sections" | "theme";

const sectionMeta: Record<SectionId, { label: string; description: string }> = {
  hero: { label: "Hero banner", description: "Announcement, headline and storefront introduction." },
  featured: { label: "Featured products", description: "Highlight selected products near the top of the page." },
  categories: { label: "Categories", description: "Give shoppers quick category navigation." },
  products: { label: "Product grid", description: "Control product columns and image proportions." },
};

const defaultSections: SectionId[] = ["hero", "featured", "categories", "products"];

function CustomizePage() {
  const { activeStore, isLifetime, user } = useAuth();
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<Panel>("sections");
  const [selectedSection, setSelectedSection] = useState<SectionId>("hero");
  const [device, setDevice] = useState<Device>("desktop");
  const [draft, setDraft] = useState<ThemeSettings>({});
  const [draftTheme, setDraftTheme] = useState<string>(THEMES[0]!.id);
  const [history, setHistory] = useState<ThemeSettings[]>([]);
  const [future, setFuture] = useState<ThemeSettings[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [currency, setCurrency] = useState("ZAR");

  const { data: store, isLoading } = useQuery({
    queryKey: ["customizer-store", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id,name,slug,theme,currency,theme_settings")
        .eq("id", activeStore!.id)
        .single();
      if (error) throw error;
      return data as { id: string; name: string; slug: string; theme: string; currency: string | null; theme_settings: ThemeSettings | null };
    },
  });

  useEffect(() => {
    if (!store) return;
    setDraft((store.theme_settings ?? {}) as ThemeSettings);
    setDraftTheme(store.theme || THEMES[0]!.id);
    setCurrency(store.currency || "ZAR");
    setHistory([]);
    setFuture([]);
  }, [store?.id, store?.theme, store?.theme_settings]);

  const sections = useMemo<SectionId[]>(() => {
    const saved = (draft.sectionOrder ?? []).filter((s): s is SectionId => defaultSections.includes(s as SectionId));
    return [...saved, ...defaultSections.filter((s) => !saved.includes(s))];
  }, [draft.sectionOrder]);

  const activeTheme = getTheme(draftTheme);

  const { data: editorProducts = [] } = useQuery({
    queryKey: ["customizer-products", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,price,compare_at_price,featured,status,product_images(url,position)")
        .eq("store_id", activeStore!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((product) => ({
        ...product,
        images: [...(product.product_images ?? [])]
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((image) => image.url),
      }));
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!activeStore) throw new Error("No active store");
      const { error } = await supabase
        .from("stores")
        .update({ theme: draftTheme, theme_settings: draft, currency } as never)
        .eq("id", activeStore.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customizer-store", activeStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["storefront"] });
      queryClient.invalidateQueries({ queryKey: ["store-theme", activeStore?.id] });
      toast.success("Changes saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!activeStore) return <NoStore />;

  function updateDraft(patch: Partial<ThemeSettings>) {
    setHistory((items) => [...items.slice(-19), draft]);
    setFuture([]);
    setDraft((current) => ({ ...current, ...patch }));
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [...items.slice(-19), draft]);
    setDraft(previous);
  }

  function redo() {
    const next = future.at(-1);
    if (!next) return;
    setFuture((items) => items.slice(0, -1));
    setHistory((items) => [...items.slice(-19), draft]);
    setDraft(next);
  }

  function moveSection(from: number, to: number) {
    if (to < 0 || to >= sections.length || from === to) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    updateDraft({ sectionOrder: next });
  }

  return (
    <DashboardShell
      title="Customize"
      description="Build your storefront visually — like a real theme editor."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={!history.length} aria-label="Undo">
            <Undo2 className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={!future.length} aria-label="Redo">
            <Redo2 className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Redo</span>
          </Button>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
            <Check className="mr-1.5 h-4 w-4" /> {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" aria-label="Back to themes">
              <Link to="/themes"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="hidden h-7 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <div className="min-w-0">
                <p className="max-w-[180px] truncate text-sm font-semibold sm:max-w-[260px]">{store?.name || activeStore.name}</p>
                <p className="text-[11px] text-muted-foreground">Storefront editor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
            <Button size="icon" variant={device === "desktop" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setDevice("desktop")} aria-label="Desktop preview"><Laptop className="h-4 w-4" /></Button>
            <Button size="icon" variant={device === "mobile" ? "secondary" : "ghost"} className="h-8 w-8" onClick={() => setDevice("mobile")} aria-label="Mobile preview"><Smartphone className="h-4 w-4" /></Button>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex" target="_blank">
            <Link to="/s/$slug" params={{ slug: activeStore.slug }}><Eye className="mr-1.5 h-4 w-4" /> Preview</Link>
          </Button>
        </div>

        <div className="grid min-h-[760px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b bg-muted/20 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-2 border-b">
              <button onClick={() => setPanel("sections")} className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${panel === "sections" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}><PanelLeft className="h-4 w-4" /> Sections</button>
              <button onClick={() => setPanel("theme")} className={`flex items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${panel === "theme" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}><PanelRight className="h-4 w-4" /> Theme</button>
            </div>

            {panel === "sections" ? (
              <div className="p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div><p className="text-sm font-semibold">Homepage sections</p><p className="text-xs text-muted-foreground">Drag, reorder and customize.</p></div>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="mb-4 rounded-xl border bg-background p-3">
                  <p className="text-sm font-semibold">Products & photos</p>
                  <p className="mt-1 text-xs text-muted-foreground">Create products and upload up to 5 product photos without leaving your store builder.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setShowAddProduct(true)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Add product
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/products">Manage products</Link>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div
                      key={section}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => { if (dragIndex === null) return; moveSection(dragIndex, index); setDragIndex(null); }}
                      className={`rounded-xl border bg-background transition ${selectedSection === section ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/40"}`}
                    >
                      <div className="flex items-center gap-2 p-2.5">
                        <div className="cursor-grab px-1 text-muted-foreground" title="Drag to reorder">⋮⋮</div>
                        <button className="min-w-0 flex-1 text-left" onClick={() => setSelectedSection(section)}>
                          <p className="truncate text-sm font-medium">{sectionMeta[section].label}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{sectionMeta[section].description}</p>
                        </button>
                        <button onClick={() => moveSection(index, index - 1)} disabled={index === 0} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move section up"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveSection(index, index + 1)} disabled={index === sections.length - 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30" aria-label="Move section down"><ArrowDown className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t pt-5">
                  <SectionSettingsPanel section={selectedSection} draft={draft} userId={user?.id ?? ""} products={editorProducts} onUpdate={updateDraft} />
                </div>
              </div>
            ) : (
              <ThemeSettingsPanel isLifetime={isLifetime} draft={draft} draftTheme={draftTheme} currency={currency} userId={user?.id ?? ""} onTheme={setDraftTheme} onCurrency={setCurrency} onUpdate={updateDraft} />
            )}
          </aside>

          <section className="min-w-0 bg-muted/30 p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div><p className="text-sm font-semibold">{panel === "theme" ? "Theme settings" : sectionMeta[selectedSection].label}</p><p className="text-xs text-muted-foreground">Changes appear in the preview instantly.</p></div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Columns3 className="h-4 w-4" /> {device === "desktop" ? "Desktop" : "Mobile"}</div>
            </div>
            <div className="flex justify-center overflow-auto rounded-2xl border bg-neutral-200/70 p-3 sm:p-5">
              <div className={`overflow-hidden rounded-xl border bg-white shadow-xl transition-all ${device === "mobile" ? "w-[390px] max-w-full" : "w-full max-w-[1160px]"}`}>
                <StorePreview storeName={store?.name || activeStore.name} theme={activeTheme} settings={draft} sections={sections} products={editorProducts} currency={currency} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border bg-background px-3 py-2.5 text-xs text-muted-foreground">
              <span>Previewing {activeTheme.name}</span>
              <span>{draftTheme === store?.theme ? "Current theme" : "Unsaved theme change"}</span>
            </div>
          </section>
        </div>
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Add product">
          <div className="my-4 w-full max-w-6xl rounded-2xl border bg-background shadow-2xl sm:my-8">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b bg-background/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-lg font-semibold">Add product</p>
                <p className="text-xs text-muted-foreground">It goes live in your store as soon as you save it.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddProduct(false)}>Cancel</Button>
            </div>
            <div className="p-4 sm:p-6">
              <ProductForm initial={emptyDraft} storeId={activeStore.id} onSaved={() => setShowAddProduct(false)} />
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function SectionSettingsPanel({ section, draft, userId, products, onUpdate }: { section: SectionId; draft: ThemeSettings; userId: string; products: EditorProduct[]; onUpdate: (patch: Partial<ThemeSettings>) => void }) {
  if (section === "hero") {
    return <div className="space-y-4">
      <div><p className="text-sm font-semibold">Hero banner</p><p className="mt-1 text-xs text-muted-foreground">Edit the first thing shoppers see.</p></div>
      <ToggleRow label="Show hero" checked={draft.showHero !== false} onCheckedChange={(value) => onUpdate({ showHero: value })} />
      <div><Label className="text-xs">Announcement bar</Label><Input className="mt-1.5" value={draft.announcementText ?? ""} placeholder="Free delivery on selected orders" onChange={(e) => onUpdate({ announcementText: e.target.value })} /></div>
      <div><Label className="text-xs">Headline</Label><Input className="mt-1.5" value={draft.heroHeadline ?? ""} placeholder="Welcome to your store" onChange={(e) => onUpdate({ heroHeadline: e.target.value })} /></div>
      <div><Label className="text-xs">Subheadline</Label><Input className="mt-1.5" value={draft.heroSubline ?? ""} placeholder="Tell customers what makes your store special" onChange={(e) => onUpdate({ heroSubline: e.target.value })} /></div>
      <ImageUploader value={draft.heroImages ?? []} onChange={(urls) => onUpdate({ heroImages: urls, heroImageUrl: urls[0] })} userId={userId} folder="theme/hero" max={5} label="Hero / banner photos" hint="Upload up to 5 photos. They will appear as a swipeable banner on your storefront." aspect="wide" />
    </div>;
  }

  if (section === "featured") {
    return <div className="space-y-4">
      <div><p className="text-sm font-semibold">Featured products</p><p className="mt-1 text-xs text-muted-foreground">Add your own heading, words and featured image above the product cards.</p></div>
      <ToggleRow label="Show featured products" checked={draft.showFeatured !== false} onCheckedChange={(value) => onUpdate({ showFeatured: value })} />
      <div><Label className="text-xs">Featured heading</Label><Input className="mt-1.5" value={draft.featuredHeading ?? ""} placeholder="Featured products" onChange={(e) => onUpdate({ featuredHeading: e.target.value })} /></div>
      <div><Label className="text-xs">Featured subheadline</Label><Input className="mt-1.5" value={draft.featuredSubline ?? ""} placeholder="Shop our most-loved products" onChange={(e) => onUpdate({ featuredSubline: e.target.value })} /></div>
      <ImageUploader value={draft.featuredImageUrl ? [draft.featuredImageUrl] : []} onChange={(urls) => onUpdate({ featuredImageUrl: urls[0] || undefined })} userId={userId} folder="theme/featured" max={1} label="Featured section picture" hint="Upload one picture to display above your featured products." aspect="wide" />
      <div className="space-y-2">
        <Label className="text-xs">Featured products</Label>
        <p className="text-[11px] text-muted-foreground">Choose as many products as you want. These choices override the product Featured switches for this section.</p>
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border p-2">
          {products.length === 0 ? <p className="p-2 text-xs text-muted-foreground">Add products first.</p> : products.map((product) => {
            const selected = (draft.selectedProductIds ?? []).includes(product.id);
            return <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted">
              <input type="checkbox" checked={selected} onChange={(e) => {
                const current = draft.selectedProductIds ?? [];
                onUpdate({ selectedProductIds: e.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id) });
              }} />
              {product.images[0] ? <img src={product.images[0]} alt="" className="h-10 w-10 rounded-md object-cover" /> : <div className="h-10 w-10 rounded-md bg-muted" />}
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{product.name}</span>
              <span className="text-xs text-muted-foreground">{new Intl.NumberFormat(undefined, { style: "currency", currency: "ZAR" }).format(product.price)}</span>
            </label>;
          })}
        </div>
      </div>
    </div>;
  }

  if (section === "categories") {
    const labels = (draft.categoryLabels ?? ["New", "Popular", "Sale"]).join(", ");
    return <div className="space-y-4">
      <div><p className="text-sm font-semibold">Categories</p><p className="mt-1 text-xs text-muted-foreground">Control category navigation shown on the storefront.</p></div>
      <ToggleRow label="Show categories" checked={draft.showCategories !== false} onCheckedChange={(value) => onUpdate({ showCategories: value })} />
      <div><Label className="text-xs">Category labels</Label><Input className="mt-1.5" value={labels} placeholder="New, Popular, Sale" onChange={(e) => onUpdate({ categoryLabels: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /><p className="mt-1 text-[11px] text-muted-foreground">Separate labels with commas.</p></div>
    </div>;
  }

  return <div className="space-y-4">
    <div><p className="text-sm font-semibold">Product grid</p><p className="mt-1 text-xs text-muted-foreground">Set how products are displayed.</p></div>
    <div><Label className="text-xs">Products per row</Label><select value={draft.productColumns ?? 0} onChange={(e) => onUpdate({ productColumns: e.target.value === "0" ? undefined : Number(e.target.value) as 2 | 3 | 4 })} className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"><option value={0}>Theme default</option><option value={2}>2 products</option><option value={3}>3 products</option><option value={4}>4 products</option></select></div>
    <div><Label className="text-xs">Image ratio</Label><div className="mt-2 grid grid-cols-3 gap-2">{(["square", "portrait", "landscape"] as const).map((ratio) => <button key={ratio} onClick={() => onUpdate({ productImageRatio: ratio })} className={`rounded-lg border p-2 text-xs capitalize ${draft.productImageRatio === ratio || (!draft.productImageRatio && ratio === "square") ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}>{ratio}<span className="mt-1 block text-[10px] text-muted-foreground">{ratio === "square" ? "1:1" : ratio === "portrait" ? "4:5" : "4:3"}</span></button>)}</div></div>
  </div>;
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3"><span className="text-sm font-medium">{label}</span><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}

function ThemeSettingsPanel({ isLifetime, draft, draftTheme, currency, userId, onTheme, onCurrency, onUpdate }: { isLifetime: boolean; draft: ThemeSettings; draftTheme: string; currency: string; userId: string; onTheme: (theme: string) => void; onCurrency: (currency: string) => void; onUpdate: (patch: Partial<ThemeSettings>) => void }) {
  return <div className="max-h-[700px] overflow-y-auto p-4"><div className="space-y-6">
    <div>
      <p className="text-sm font-semibold">Theme</p>
      <p className="mt-1 text-xs text-muted-foreground">Choose the storefront foundation.</p>
      <div className="mt-3 grid gap-2">
        {THEMES.map((theme) => { const locked = theme.premium && !isLifetime; return <button key={theme.id} disabled={locked} onClick={() => onTheme(theme.id)} className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${draftTheme === theme.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted"} ${locked ? "cursor-not-allowed opacity-55" : ""}`}><div className="h-10 w-10 shrink-0 rounded-lg border" style={{ background: theme.palette.bg }}><div className="m-2 h-3 w-3 rounded-full" style={{ background: theme.palette.accent }} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{theme.name}</p><p className="truncate text-[11px] text-muted-foreground">{theme.bestFor}</p></div>{theme.premium && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">Premium</span>}</button>; })}
      </div>
    </div>
    <div className="border-t pt-5">
      <div className="flex items-center gap-2"><span className="text-sm">💰</span><p className="text-sm font-semibold">Store currency</p></div>
      <p className="mt-1 text-xs text-muted-foreground">Choose the currency customers will see for product prices.</p>
      <select value={currency} onChange={(e) => onCurrency(e.target.value)} className="mt-3 h-10 w-full rounded-md border bg-background px-3 text-sm">
        <option value="ZAR">South African Rand (ZAR — R)</option>
        <option value="USD">US Dollar (USD — $)</option>
        <option value="EUR">Euro (EUR — €)</option>
        <option value="GBP">British Pound (GBP — £)</option>
        <option value="AUD">Australian Dollar (AUD — A$)</option>
        <option value="CAD">Canadian Dollar (CAD — C$)</option>
        <option value="NZD">New Zealand Dollar (NZD — NZ$)</option>
        <option value="JPY">Japanese Yen (JPY — ¥)</option>
        <option value="CNY">Chinese Yuan (CNY — ¥)</option>
        <option value="INR">Indian Rupee (INR — ₹)</option>
        <option value="NGN">Nigerian Naira (NGN — ₦)</option>
        <option value="KES">Kenyan Shilling (KES — KSh)</option>
        <option value="GHS">Ghanaian Cedi (GHS — GH₵)</option>
        <option value="AED">UAE Dirham (AED — د.إ)</option>
        <option value="CHF">Swiss Franc (CHF — CHF)</option>
        <option value="BRL">Brazilian Real (BRL — R$)</option>
      </select>
      <p className="mt-1 text-[11px] text-muted-foreground">Click Save at the top of the editor to publish the currency.</p>
    </div>
    <div className="border-t pt-5"><div className="flex items-center gap-2"><Palette className="h-4 w-4" /><p className="text-sm font-semibold">Colors</p></div><div className="mt-3 grid gap-3"> <ColorField label="Accent" value={draft.accent || ""} fallback={getTheme(draftTheme).palette.accent} onChange={(value) => onUpdate({ accent: value })} /><ColorField label="Page background" value={draft.bg || ""} fallback={getTheme(draftTheme).palette.bg} onChange={(value) => onUpdate({ bg: value })} /><ColorField label="Text" value={draft.ink || ""} fallback={getTheme(draftTheme).palette.ink} onChange={(value) => onUpdate({ ink: value })} /></div></div>
    <div className="border-t pt-5"><div className="flex items-center gap-2"><Type className="h-4 w-4" /><p className="text-sm font-semibold">Typography</p></div><Label className="mt-3 block text-xs">Heading font</Label><select value={draft.headingFont || ""} onChange={(e) => onUpdate({ headingFont: e.target.value || undefined })} className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Theme default</option><option value="'Sora', sans-serif">Sora</option><option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option><option value="Georgia, serif">Georgia</option><option value="system-ui, sans-serif">System</option></select></div>
    <div className="border-t pt-5"><p className="text-sm font-semibold">Buttons</p><div className="mt-3 grid grid-cols-3 gap-2">{(["rounded", "pill", "square"] as const).map((style) => <button key={style} onClick={() => onUpdate({ buttonStyle: style })} className={`rounded-lg border px-2 py-2 text-xs capitalize ${draft.buttonStyle === style ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}>{style}</button>)}</div></div>
  </div></div>;
}

function ColorField({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (value: string) => void }) {
  return <div><Label className="text-xs">{label}</Label><div className="mt-1.5 flex items-center gap-2"><input aria-label={`${label} color`} type="color" value={value || fallback} onChange={(event) => onChange(event.target.value)} className="h-10 w-11 cursor-pointer rounded-md border bg-background p-1" /><Input value={value || fallback} onChange={(event) => onChange(event.target.value)} className="h-10 text-xs" /></div></div>;
}

type EditorProduct = { id: string; name: string; price: number; compare_at_price: number | null; featured: boolean; images: string[] };

function StorePreview({ storeName, theme, settings, sections, products, currency }: { storeName: string; theme: ReturnType<typeof getTheme>; settings: ThemeSettings; sections: SectionId[]; products: EditorProduct[]; currency: string }) {
  const money = (amount: number) => new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  const bg = settings.bg || theme.palette.bg;
  const ink = settings.ink || theme.palette.ink;
  const accent = settings.accent || theme.palette.accent;
  const muted = theme.palette.muted;
  const radius = settings.buttonStyle === "pill" ? "999px" : settings.buttonStyle === "square" ? "4px" : "12px";
  const cardRadius = theme.cardRadius;
  const font = settings.headingFont || theme.heading;
  const featuredIds = settings.selectedProductIds ?? [];
  const featuredProducts = featuredIds.length ? products.filter((p) => featuredIds.includes(p.id)) : products.filter((p) => p.featured).slice(0, 3);

  return <div style={{ background: bg, color: ink } as CSSProperties} className="min-h-[640px]" aria-label="Storefront preview">
    <div className="border-b px-4 py-2 text-center text-[11px]" style={{ borderColor: theme.palette.border, color: muted }}>{settings.announcementText || "Free delivery on selected orders"}</div>
    <header className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${theme.palette.border}` }}>
      <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg" style={{ background: accent }} /><span className="font-semibold" style={{ fontFamily: font }}>{storeName}</span></div>
      <div className="hidden gap-5 text-xs sm:flex" style={{ color: muted }}><span>Shop</span><span>Collections</span><span>About</span></div>
      <div className="h-8 w-8 rounded-full border" style={{ borderColor: theme.palette.border }} />
    </header>
    <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-10">
      {sections.map((section) => {
        if (section === "hero" && settings.showHero !== false) return <section key={section} className="grid gap-5 py-4 sm:grid-cols-[1.1fr_0.9fr] sm:items-center"><div><div className="mb-3 inline-flex rounded-full border px-3 py-1 text-[10px]" style={{ borderColor: theme.palette.border, color: muted }}>New collection</div><h1 className="text-3xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: font }}>{settings.heroHeadline || `Welcome to ${storeName}`}</h1><p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: muted }}>{settings.heroSubline || "A beautiful storefront that is ready for your products and customers."}</p><button className="mt-5 px-5 py-3 text-xs font-semibold text-white" style={{ background: accent, borderRadius: radius }}>Shop now</button></div><div className="min-h-[210px] rounded-2xl border" style={{ borderColor: theme.palette.border, background: theme.palette.surface, borderRadius: cardRadius }}><div className="h-full min-h-[210px] rounded-2xl" style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }} /></div></section>;
        if (section === "featured" && settings.showFeatured !== false) return <section key={section} className="mt-9">
          {settings.featuredImageUrl && <img src={settings.featuredImageUrl} alt="" className="mb-4 h-28 w-full object-cover sm:h-40" style={{ borderRadius: cardRadius }} />}
          <div className="mb-3"><h2 className="text-lg font-bold" style={{ fontFamily: font }}>{settings.featuredHeading || "Featured products"}</h2><p className="mt-1 text-xs" style={{ color: muted }}>{settings.featuredSubline || "Shop our most-loved products."}</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{featuredProducts.map((product) => <PreviewCard key={product.id} product={product} accent={accent} theme={theme} cardRadius={cardRadius} />)}</div>
        </section>;
        if (section === "categories" && settings.showCategories !== false) return <section key={section} className="mt-9"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold" style={{ fontFamily: font }}>Shop by category</h2></div><div className="flex flex-wrap gap-2">{(settings.categoryLabels?.length ? settings.categoryLabels : ["New", "Popular", "Sale"]).map((label) => <span key={label} className="rounded-full border px-3 py-1.5 text-xs" style={{ borderColor: theme.palette.border }}>{label}</span>)}</div></section>;
        if (section === "products") { const columns = settings.productColumns || 4; const cls = columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"; const ratio = settings.productImageRatio === "portrait" ? "aspect-[4/5]" : settings.productImageRatio === "landscape" ? "aspect-[4/3]" : "aspect-square"; return <section key={section} className="mt-9"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold" style={{ fontFamily: font }}>All products</h2><span className="text-xs" style={{ color: muted }}>Sort</span></div><div className={`grid gap-3 ${cls}`}>{products.filter((product) => !(settings.showFeatured !== false && product.featured)).map((product) => <div key={product.id}><div className={`${ratio} overflow-hidden border`} style={{ borderColor: theme.palette.border, background: theme.palette.surface, borderRadius: cardRadius }}>{product.images[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${accent}28, transparent)` }} />}</div><p className="mt-2 text-xs font-medium">{product.name}</p><p className="text-[11px]" style={{ color: muted }}>{money(product.price)}</p></div>)}</div></section>; }
        return null;
      })}
    </div>
  </div>;
}

function PreviewCard({ product, accent, theme, cardRadius }: { product: EditorProduct; accent: string; theme: ReturnType<typeof getTheme>; cardRadius: string }) {
  return <div><div className="aspect-square overflow-hidden border" style={{ borderColor: theme.palette.border, background: theme.palette.surface, borderRadius: cardRadius }}>{product.images[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${accent}28, transparent)` }} />}</div><p className="mt-2 text-xs font-medium">{product.name}</p><p className="text-[11px]" style={{ color: theme.palette.muted }}>R{product.price.toFixed(2)}</p></div>;
}
