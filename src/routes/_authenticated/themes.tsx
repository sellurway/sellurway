import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Lock } from "lucide-react";
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
      { property: "og:description", content: "Eight storefront templates, five of them exclusive to Lifetime." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThemesPage,
});

function ThemesPage() {
  const { activeStore, isLifetime } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ThemeSettings | null>(null);

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

  return (
    <DashboardShell
      title="Themes"
      description="Choose the template your storefront uses. Premium templates are included with Lifetime."
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => {
          const locked = t.premium && !isLifetime;
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
                <Button
                  className="mt-3 w-full"
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
