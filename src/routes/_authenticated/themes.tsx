import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Crown, Lock, Monitor, Smartphone, Settings2, LayoutTemplate, Eye, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { THEMES, type ThemeSettings } from "@/lib/themes";
import { ThemePreview } from "@/components/ThemePreview";


export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({
    meta: [
      { title: "Themes — Sellurway" },
      { name: "description", content: "Pick a storefront template and fine-tune colours, fonts and sections." },
      { property: "og:title", content: "Themes — Sellurway" },
      { property: "og:description", content: "Twelve storefront templates, nine of them exclusive to Lifetime." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThemesPage,
});

function ThemesPage() {
  const { activeStore, isLifetime } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [selectedSection, setSelectedSection] = useState<"hero" | "featured" | "categories" | "products">("hero");
  const [uploading, setUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const { data: store } = useQuery({
    queryKey: ["store-theme", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id,theme,theme_settings")
        .eq("id", activeStore!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const current = settings ?? ((store?.theme_settings ?? {}) as ThemeSettings);

  const save = useMutation({
    mutationFn: async (patch: { theme?: string; theme_settings?: ThemeSettings }) => {
      const { error } = await supabase.from("stores").update(patch as never).eq("id", activeStore!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-theme", activeStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["storefront"] });
      toast.success("Storefront updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!activeStore) {
    return (
      <DashboardShell title="Themes">
        <NoStore />
      </DashboardShell>
    );
  }

  function patchSettings(patch: Partial<ThemeSettings>) {
    setSettings({ ...current, ...patch });
  }

  async function uploadHeroImage(file: File) {
    if (!activeStore) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be smaller than 8MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${activeStore.id}/theme-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      patchSettings({ heroImageUrl: data.publicUrl });
      toast.success("Hero image added — remember to save changes");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Image upload failed"); } finally { setUploading(false); }
  }

  function editTemplate(themeId: string) {
    setSettings((store?.theme_settings ?? {}) as ThemeSettings);
    setEditorOpen(true);
    window.setTimeout(() => document.getElementById("theme-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    save.mutate({ theme: themeId });
  }

  return (
    <DashboardShell
      title="Themes"
      description="Choose from all available premium storefront templates and customize them."
      actions={
        !isLifetime ? (
          <Button asChild variant="outline">
            <Link to="/upgrade">
              <Crown className="mr-1.5 h-4 w-4 text-gold" /> Unlock premium templates
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div id="theme-editor" className="surface-card mb-6 overflow-hidden p-0 scroll-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            <div>
              <p className="font-display font-semibold">Theme editor</p>
              <p className="text-xs text-muted-foreground">Customize your store visually, section by section.</p>
            </div>
          </div>
          <Button onClick={() => setEditorOpen(!editorOpen)} variant={editorOpen ? "secondary" : "default"}>
            <Settings2 className="mr-2 h-4 w-4" /> {editorOpen ? "Close editor" : "Open editor"}
          </Button>
        </div>

        {editorOpen && (
          <div className="grid min-h-[620px] lg:grid-cols-[260px_1fr]">
            <aside className="border-b bg-muted/20 p-4 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sections</p>
              <div className="space-y-2">
                {(["hero", "featured", "categories", "products"] as const).map((section) => (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className={"flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition " + (selectedSection === section ? "border-primary bg-primary/10" : "hover:bg-muted")}
                  >
                    <span className="capitalize">{section === "hero" ? "Hero banner" : section}</span>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              <div className="mt-6 rounded-lg border bg-background p-3">
                <p className="text-sm font-medium">Editing: <span className="capitalize">{selectedSection === "hero" ? "Hero banner" : selectedSection}</span></p>
                <p className="mt-1 text-xs text-muted-foreground">Use the controls below to change this section and save when you're happy.</p>
              </div>
            </aside>

            <div className="bg-muted/30 p-4 sm:p-6">
              <div className="mb-4 rounded-xl border bg-background p-4">
                {selectedSection === "hero" && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Headline</Label><Input className="mt-1" value={current.heroHeadline ?? ""} placeholder={activeStore.name} onChange={(e) => patchSettings({ heroHeadline: e.target.value })} /></div><div><Label>Subheadline</Label><Input className="mt-1" value={current.heroSubline ?? ""} placeholder="Tell customers what makes your store special" onChange={(e) => patchSettings({ heroSubline: e.target.value })} /></div></div><div><Label>Hero photo</Label><div className="mt-2 flex flex-wrap gap-2"><input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHeroImage(file); e.currentTarget.value = ""; }} /><Button type="button" variant="outline" onClick={() => heroFileRef.current?.click()} disabled={uploading}><ImagePlus className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : current.heroImageUrl ? "Replace photo" : "Add photo"}</Button>{current.heroImageUrl && <Button type="button" variant="ghost" onClick={() => patchSettings({ heroImageUrl: undefined })}>Remove</Button>}</div>{current.heroImageUrl && <img src={current.heroImageUrl} alt="Hero preview" className="mt-3 h-32 w-full rounded-lg border object-cover" />}</div></div>}
                {selectedSection === "products" && <div className="grid gap-3 sm:grid-cols-2"><div><Label>Products per row</Label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={current.productColumns ?? 0} onChange={(e) => patchSettings({ productColumns: e.target.value === "0" ? undefined : Number(e.target.value) as 2 | 3 | 4 })}><option value={0}>Theme default</option><option value={2}>2 products</option><option value={3}>3 products</option><option value={4}>4 products</option></select></div><div><Label>Image shape</Label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={current.productImageRatio ?? "square"} onChange={(e) => patchSettings({ productImageRatio: e.target.value as "square" | "portrait" | "landscape" })}><option value="square">Square</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div></div>}
                {selectedSection === "featured" && <div className="flex items-center justify-between"><div><p className="font-medium">Featured products</p><p className="text-xs text-muted-foreground">Show highlighted products near the top.</p></div><Switch checked={current.showFeatured !== false} onCheckedChange={(v) => patchSettings({ showFeatured: v })} /></div>}
                {selectedSection === "categories" && <div className="flex items-center justify-between"><div><p className="font-medium">Categories</p><p className="text-xs text-muted-foreground">Show category navigation to shoppers.</p></div><Switch checked={current.showCategories !== false} onCheckedChange={(v) => patchSettings({ showCategories: v })} /></div>}
                <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => save.mutate({ theme_settings: current })} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save changes"}</Button><Button size="sm" variant="outline" onClick={() => setEditorOpen(false)}>Done</Button></div>
              </div>
              <div className="mb-4 flex items-center justify-center gap-2">
                <Button size="sm" variant={device === "desktop" ? "secondary" : "ghost"} onClick={() => setDevice("desktop")}><Monitor className="mr-1.5 h-4 w-4" />Desktop</Button>
                <Button size="sm" variant={device === "mobile" ? "secondary" : "ghost"} onClick={() => setDevice("mobile")}><Smartphone className="mr-1.5 h-4 w-4" />Mobile</Button>
              </div>

              <div className={"mx-auto overflow-hidden border bg-background shadow-xl transition-all " + (device === "mobile" ? "max-w-[390px] rounded-[28px]" : "max-w-5xl rounded-xl")}>
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <span className="font-semibold">{activeStore.name}</span>
                  <span className="text-xs text-muted-foreground">Shop</span>
                </div>
                {current.showHero !== false && (
                  <section className={"border-b p-6 " + (selectedSection === "hero" ? "ring-2 ring-inset ring-primary" : "")}>
                    {current.heroImageUrl ? <img src={current.heroImageUrl} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" /> : <div className="mb-3 h-28 rounded-lg bg-muted" />}
                    <h2 className="text-2xl font-bold">{current.heroHeadline || activeStore.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{current.heroSubline || "Your store, your style. Discover the latest collection."}</p>
                    <button className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: current.accent || "#111318" }}>Shop now</button>
                  </section>
                )}
                {current.showFeatured !== false && (
                  <section className={"p-5 " + (selectedSection === "featured" ? "ring-2 ring-inset ring-primary" : "")}>
                    <h3 className="mb-3 font-semibold">Featured products</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[1,2,3].map((n) => <div key={n} className="space-y-2"><div className="aspect-square rounded-md bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /></div>)}
                    </div>
                  </section>
                )}
                {current.showCategories !== false && (
                  <section className={"border-t p-5 " + (selectedSection === "categories" ? "ring-2 ring-inset ring-primary" : "")}>
                    <div className="flex gap-2 overflow-hidden">{["New", "Popular", "Sale"].map(x => <span key={x} className="rounded-full border px-3 py-1 text-xs">{x}</span>)}</div>
                  </section>
                )}
                <section className={"border-t p-5 " + (selectedSection === "products" ? "ring-2 ring-inset ring-primary" : "")}>
                  <h3 className="mb-3 font-semibold">Products</h3>
                  <div className={"grid gap-3 " + (current.productColumns === 2 ? "grid-cols-2" : current.productColumns === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
                    {[1,2,3,4].map(n => <div key={n}><div className={(current.productImageRatio === "portrait" ? "aspect-[4/5]" : current.productImageRatio === "landscape" ? "aspect-[4/3]" : "aspect-square") + " rounded-md bg-muted"} /><div className="mt-2 h-3 w-4/5 rounded bg-muted" /></div>)}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => {
          const locked = false; // All templates are visible and selectable
          const active = store?.theme === t.id;
          return (
            <div
              key={t.id}
              className={`surface-card overflow-hidden p-0 ${active ? "ring-2 ring-primary" : ""}`}
            >
              <div className="relative">
                <ThemePreview theme={t} />
                {t.premium && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 p-1">
                    <Crown className="h-3.5 w-3.5 text-gold" />
                  </span>
                )}
              </div>

              <div className="border-t p-4">
                <p className="text-sm text-muted-foreground">{t.tagline}</p>
                <p className="mt-1 text-xs text-muted-foreground">Best for {t.bestFor.toLowerCase()}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={active ? "secondary" : locked ? "outline" : "default"}
                  disabled={active || save.isPending}
                  asChild={locked}
                  onClick={locked ? undefined : () => save.mutate({ theme: t.id })}
                >
                  {locked ? (
                    <Link to="/upgrade">
                      <Lock className="mr-1.5 h-3.5 w-3.5" /> Lifetime only
                    </Link>
                  ) : active ? (
                    <span>
                      <Check className="mr-1.5 inline h-3.5 w-3.5" /> Current template
                    </span>
                  ) : (
                    <span>Use this template</span>
                  )}
                </Button>
                {!locked && <Button size="sm" variant="outline" onClick={() => editTemplate(t.id)} disabled={save.isPending}>Edit</Button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-card mt-8 space-y-5 p-5">
        <div>
          <p className="font-display font-semibold">Storefront sections</p>
          <p className="text-sm text-muted-foreground">
            Fine-tune your hero and layout. Custom colours and fonts are a Lifetime feature.
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="font-medium">Layout editor</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose where each storefront section appears. Use the arrows to move products, featured items and categories.
          </p>

          <div className="mt-4 space-y-2">
            {(current.sectionOrder ?? ["hero", "featured", "categories", "products"]).map((section, index, order) => (
              <div key={section} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="flex-1 text-sm font-medium capitalize">{section === "hero" ? "Hero banner" : section}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...order];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    patchSettings({ sectionOrder: next as ThemeSettings["sectionOrder"] });
                  }}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === order.length - 1}
                  onClick={() => {
                    const next = [...order];
                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                    patchSettings({ sectionOrder: next as ThemeSettings["sectionOrder"] });
                  }}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="columns">Products per row</Label>
              <select
                id="columns"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={current.productColumns ?? 0}
                onChange={(e) => patchSettings({ productColumns: e.target.value === "0" ? undefined : Number(e.target.value) as 2 | 3 | 4 })}
              >
                <option value={0}>Theme default</option>
                <option value={2}>2 products</option>
                <option value={3}>3 products</option>
                <option value={4}>4 products</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ratio">Product image shape</Label>
              <select
                id="ratio"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={current.productImageRatio ?? "square"}
                onChange={(e) => patchSettings({ productImageRatio: e.target.value as "square" | "portrait" | "landscape" })}
              >
                <option value="square">Square</option>
                <option value="portrait">Portrait / tall</option>
                <option value="landscape">Landscape / wide</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="font-medium">Hero banner photo</p><p className="text-sm text-muted-foreground">Upload a picture for the top of your store.</p></div>
            <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHeroImage(file); e.currentTarget.value = ""; }} />
            <Button type="button" variant="outline" onClick={() => heroFileRef.current?.click()} disabled={uploading}><ImagePlus className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : current.heroImageUrl ? "Replace photo" : "Upload photo"}</Button>
          </div>
          {current.heroImageUrl && <div className="mt-4"><img src={current.heroImageUrl} alt="Hero preview" className="h-40 w-full rounded-lg border object-cover" /><Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => patchSettings({ heroImageUrl: undefined })}>Remove photo</Button></div>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="headline">Hero headline</Label>
            <Input
              id="headline"
              value={current.heroHeadline ?? ""}
              placeholder={activeStore.name}
              onChange={(e) => patchSettings({ heroHeadline: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subline">Hero subline</Label>
            <Input
              id="subline"
              value={current.heroSubline ?? ""}
              placeholder="Free delivery on orders over…"
              onChange={(e) => patchSettings({ heroSubline: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accent">Accent colour {!isLifetime && "(Lifetime)"}</Label>
            <Input
              id="accent"
              type="color"
              disabled={!isLifetime}
              value={current.accent ?? "#111318"}
              onChange={(e) => patchSettings({ accent: e.target.value })}
              className="h-10 w-24 p-1"
            />
          </div>
          <div className="space-y-3">
            {(
              [
                ["showHero", "Show hero banner"],
                ["showFeatured", "Show featured products"],
                ["showCategories", "Show categories"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key}>{label}</Label>
                <Switch
                  id={key}
                  checked={current[key] !== false}
                  onCheckedChange={(v) => patchSettings({ [key]: v })}
                />
              </div>
            ))}
          </div>
        </div>
        <Button onClick={() => save.mutate({ theme_settings: current })} disabled={save.isPending}>
          Save storefront settings
        </Button>
      </div>
    </DashboardShell>
  );
}
