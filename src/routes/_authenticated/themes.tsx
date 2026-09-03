import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Crown, Lock, Monitor, Smartphone, Settings2, LayoutTemplate, Eye, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [selectedSection, setSelectedSection] = useState<"hero" | "promo" | "imageText" | "featured" | "categories" | "products" | "testimonials" | "newsletter" | "social">("hero");
  const [uploading, setUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const featuredFileRef = useRef<HTMLInputElement>(null);
  const productsFileRef = useRef<HTMLInputElement>(null);
  const [bannerDrag, setBannerDrag] = useState<number | null>(null);
  const [sectionDrag, setSectionDrag] = useState<string | null>(null);
  const allSections = ["hero", "promo", "imageText", "featured", "categories", "products", "testimonials", "newsletter", "social"] as const;

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

  async function uploadThemeImage(file: File, key: "heroImageUrl" | "featuredImageUrl" | "productsImageUrl") {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    const reader = new FileReader();
    reader.onload = () => {
      patchSettings({ [key]: String(reader.result) } as Partial<ThemeSettings>);
      toast.success("Photo added — remember to save changes");
    };
    reader.onerror = () => toast.error("Could not read that image");
    reader.readAsDataURL(file);
  }

  async function uploadHeroImage(file: File) {
    await uploadThemeImage(file, "heroImageUrl");
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
                {selectedSection === "hero" && <div className="space-y-4"><div className="rounded-xl border bg-muted/20 p-3"><Label>Announcement bar</Label><Input className="mt-2" value={current.announcementText ?? ""} placeholder="Free delivery on orders over R500" onChange={(e) => patchSettings({ announcementText: e.target.value })} /></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Headline</Label><Input className="mt-1" value={current.heroHeadline ?? ""} placeholder={activeStore.name} onChange={(e) => patchSettings({ heroHeadline: e.target.value })} /></div><div><Label>Subheadline</Label><Input className="mt-1" value={current.heroSubline ?? ""} placeholder="Tell customers what makes your store special" onChange={(e) => patchSettings({ heroSubline: e.target.value })} /></div></div><div><Label>Hero photo</Label><div className="mt-2 flex flex-wrap gap-2"><input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHeroImage(file); e.currentTarget.value = ""; }} /><Button type="button" variant="outline" onClick={() => heroFileRef.current?.click()} disabled={uploading}><ImagePlus className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : current.heroImageUrl ? "Replace photo" : "Add photo"}</Button>{current.heroImageUrl && <Button type="button" variant="ghost" onClick={() => patchSettings({ heroImageUrl: undefined })}>Remove</Button>}</div>{current.heroImageUrl && <img src={current.heroImageUrl} alt="Hero preview" className="mt-3 h-32 w-full rounded-lg border object-cover" />}
<div className="rounded-xl border p-3">
  <p className="text-sm font-medium">Banner slider</p>
  <p className="mb-3 text-xs text-muted-foreground">Add multiple photos. Drag banners to change their order.</p>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
    {(current.heroImages ?? []).map((url, index, list) => (
      <div key={url + index} draggable onDragStart={() => setBannerDrag(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (bannerDrag === null || bannerDrag === index) return; const next=[...list]; const [moved]=next.splice(bannerDrag,1); next.splice(index,0,moved); patchSettings({ heroImages: next, heroImageUrl: next[0] }); setBannerDrag(null); }} className="group relative cursor-grab overflow-hidden rounded-lg border">
        <img src={url} alt={`Banner ${index + 1}`} className="h-24 w-full object-cover" />
        <button type="button" onClick={() => { const next=list.filter((_,i)=>i!==index); patchSettings({ heroImages: next, heroImageUrl: next[0] }); }} className="absolute right-1 top-1 rounded bg-black/70 px-2 py-1 text-xs text-white">×</button>
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Slide {index + 1}</span>
      </div>
    ))}
    <button type="button" onClick={() => heroFileRef.current?.click()} className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-muted"><ImagePlus className="mr-2 h-4 w-4" />Add banner</button>
  </div>
</div></div></div>}
                {selectedSection === "products" && <div className="space-y-4"><div><Label>Products section photo</Label><input ref={productsFileRef} type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) uploadThemeImage(f,"productsImageUrl"); e.currentTarget.value="";}} /><div className="mt-2 flex gap-2"><Button type="button" variant="outline" onClick={()=>productsFileRef.current?.click()} disabled={uploading}><ImagePlus className="mr-2 h-4 w-4" />Add photo</Button>{current.productsImageUrl && <Button type="button" variant="ghost" onClick={()=>patchSettings({productsImageUrl:undefined})}>Remove</Button>}</div>{current.productsImageUrl && <img src={current.productsImageUrl} className="mt-3 h-28 w-full rounded-lg object-cover" alt="Products preview" />}</div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Products per row</Label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={current.productColumns ?? 0} onChange={(e) => patchSettings({ productColumns: e.target.value === "0" ? undefined : Number(e.target.value) as 2 | 3 | 4 })}><option value={0}>Theme default</option><option value={2}>2 products</option><option value={3}>3 products</option><option value={4}>4 products</option></select></div><div><Label>Image shape</Label><div className="mt-2 grid grid-cols-3 gap-2"><button type="button" onClick={()=>patchSettings({productImageRatio:"square"})} className={"rounded-lg border p-2 text-left transition " + (current.productImageRatio === "square" || !current.productImageRatio ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted")}><div className="aspect-square w-full rounded-md bg-muted"/><p className="mt-2 text-xs font-medium">Square</p><p className="text-[10px] text-muted-foreground">1:1</p></button><button type="button" onClick={()=>patchSettings({productImageRatio:"portrait"})} className={"rounded-lg border p-2 text-left transition " + (current.productImageRatio === "portrait" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted")}><div className="aspect-[4/5] w-full rounded-md bg-muted"/><p className="mt-2 text-xs font-medium">Portrait</p><p className="text-[10px] text-muted-foreground">4:5</p></button><button type="button" onClick={()=>patchSettings({productImageRatio:"landscape"})} className={"rounded-lg border p-2 text-left transition " + (current.productImageRatio === "landscape" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted")}><div className="aspect-[4/3] w-full rounded-md bg-muted"/><p className="mt-2 text-xs font-medium">Landscape</p><p className="text-[10px] text-muted-foreground">4:3</p></button></div><p className="mt-2 text-xs text-muted-foreground">Click a shape to see it immediately in the live preview below.</p></div></div></div>}
                {selectedSection === "featured" && <div className="space-y-4"><div className="flex items-center justify-between"><div><p className="font-medium">Featured products</p><p className="text-xs text-muted-foreground">Show highlighted products near the top.</p></div><Switch checked={current.showFeatured !== false} onCheckedChange={(v) => patchSettings({ showFeatured: v })} /></div><div><Label>Featured section photo</Label><input ref={featuredFileRef} type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0];if(f) uploadThemeImage(f,"featuredImageUrl");e.currentTarget.value="";}} /><div className="mt-2"><Button type="button" variant="outline" onClick={()=>featuredFileRef.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />Add photo</Button></div>{current.featuredImageUrl && <img src={current.featuredImageUrl} className="mt-3 h-28 w-full rounded-lg object-cover" alt="" />}</div></div>}
                {selectedSection === "categories" && <div className="space-y-4"><div className="flex items-center justify-between"><div><p className="font-medium">Categories</p><p className="text-xs text-muted-foreground">Show category navigation to shoppers.</p></div><Switch checked={current.showCategories !== false} onCheckedChange={(v) => patchSettings({ showCategories: v })} /></div><div><Label>Category names</Label><Input className="mt-2" value={(current.categoryLabels ?? ["New","Popular","Sale"]).join(", ")} placeholder="New, Popular, Sale" onChange={(e)=>patchSettings({categoryLabels:e.target.value.split(",").map(x=>x.trim()).filter(Boolean)})} /><p className="mt-1 text-xs text-muted-foreground">Separate categories with commas.</p></div></div>}
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
                  <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">Products</h3><span className="rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{current.productImageRatio === "portrait" ? "Portrait · 4:5" : current.productImageRatio === "landscape" ? "Landscape · 4:3" : "Square · 1:1"}</span></div>
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
            {(current.sectionOrder?.length ? current.sectionOrder : allSections).map((section, index, order) => (
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

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium">Show or hide sections</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {allSections.map((section) => {
                const enabled = current.enabledSections?.includes(section) ?? ["hero", "featured", "categories", "products"].includes(section);
                return <label key={section} className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="capitalize">{section === "hero" ? "Hero banner" : section}</span>
                  <input type="checkbox" checked={enabled} onChange={(e) => {
                    const all = current.enabledSections ?? ["hero", "featured", "categories", "products"];
                    patchSettings({ enabledSections: e.target.checked ? [...new Set([...all, section])] as ThemeSettings["enabledSections"] : all.filter((s) => s !== section) as ThemeSettings["enabledSections"] });
                  }} />
                </label>;
              })}
            </div>
          </div>

          <div className="mt-5 space-y-4 rounded-xl border p-4">
            <div>
              <Label>Image + text photo</Label>
              <div className="mt-2 flex gap-2"><Input value={current.imageTextImageUrl ?? ""} placeholder="Paste image URL" onChange={(e) => patchSettings({ imageTextImageUrl: e.target.value })} /><Button type="button" variant="outline" onClick={() => { const url = window.prompt("Paste your image URL"); if (url) patchSettings({ imageTextImageUrl: url }); }}>Add photo</Button></div>
            </div>
            <div>
              <Label>Testimonials</Label>
              <div className="mt-2 space-y-2">{(current.testimonials ?? []).map((testimonial, index, list) => <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto]"><Input value={testimonial.name} placeholder="Customer name" onChange={(e) => { const next=[...list]; next[index]={...next[index],name:e.target.value}; patchSettings({ testimonials:next }); }} /><Input value={testimonial.quote} placeholder="Customer review" onChange={(e) => { const next=[...list]; next[index]={...next[index],quote:e.target.value}; patchSettings({ testimonials:next }); }} /><Button type="button" variant="ghost" onClick={() => patchSettings({ testimonials:list.filter((_,i)=>i!==index) })}>Remove</Button></div>)}</div>
              <Button type="button" variant="outline" className="mt-2" onClick={() => patchSettings({ testimonials:[...(current.testimonials ?? []),{name:"Customer",quote:"Amazing experience!"}] })}>+ Add testimonial</Button>
            </div>
            <div>
              <Label>Social links</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">{(["instagram","facebook","tiktok"] as const).map((name)=><Input key={name} value={current.socialLinks?.[name] ?? ""} placeholder={name[0].toUpperCase()+name.slice(1)+" URL"} onChange={(e)=>patchSettings({socialLinks:{...(current.socialLinks??{}),[name]:e.target.value}})} />)}</div>
            </div>
            <div><Label>Promo banner</Label><Input className="mt-2" value={current.promoText ?? ""} placeholder="Big weekend sale — save up to 30%" onChange={(e) => patchSettings({ promoText: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><Input value={current.promoButtonText ?? ""} placeholder="Button text" onChange={(e) => patchSettings({ promoButtonText: e.target.value })} /><Input value={current.promoButtonUrl ?? ""} placeholder="/collections/sale" onChange={(e) => patchSettings({ promoButtonUrl: e.target.value })} /></div>
            <div><Label>Image + text section</Label><Input className="mt-2" value={current.imageTextHeading ?? ""} placeholder="Tell your brand story" onChange={(e) => patchSettings({ imageTextHeading: e.target.value })} /><Textarea className="mt-2" value={current.imageTextBody ?? ""} placeholder="Write something about your store..." onChange={(e) => patchSettings({ imageTextBody: e.target.value })} /></div>
            <div><Label>Newsletter heading</Label><Input className="mt-2" value={current.newsletterHeading ?? ""} placeholder="Join our newsletter" onChange={(e) => patchSettings({ newsletterHeading: e.target.value })} /></div>
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
