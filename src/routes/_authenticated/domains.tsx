import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Globe2, Link2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/domains")({
  head: () => ({
    meta: [
      { title: "Domains — Sellurway" },
      { name: "description", content: "Connect your own custom domain to your Sellurway storefront." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DomainsPage,
});

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
}

function validDomain(value: string) {
  if (!value || value.length > 253 || value.includes(" ")) return false;
  const labels = value.split(".");
  return labels.length >= 2 && labels.every((label) =>
    label.length >= 1 &&
    label.length <= 63 &&
    !label.startsWith("-") &&
    !label.endsWith("-") &&
    /^[a-z0-9-]+$/.test(label),
  );
}

function DomainsPage() {
  const { activeStore } = useAuth();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [dnsRecords, setDnsRecords] = useState<Array<{ type: string; name: string; value: string }>>([]);
  const [domainStatus, setDomainStatus] = useState<"idle" | "pending" | "connected">("idle");

  const { data: store, isLoading, isError, error } = useQuery({
    queryKey: ["store-domain", activeStore?.id],
    enabled: !!activeStore,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id,name,slug,theme_settings")
        .eq("id", activeStore!.id)
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        theme_settings: (data.theme_settings ?? {}) as Record<string, unknown>,
      };
    },
  });

  useEffect(() => {
    setSlug(store?.slug ?? "");
    const saved = typeof store?.theme_settings?.customDomain === "string" ? store.theme_settings.customDomain : "";
    setCustomDomain(saved);
    setDomainStatus(saved ? "connected" : "idle");
  }, [store?.id, store?.slug, store?.theme_settings]);

  const saveSlug = useMutation({
    mutationFn: async () => {
      if (!activeStore) throw new Error("No active store");
      const normalized = slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      if (!normalized || normalized.length < 2) throw new Error("Enter a store link with at least 2 letters or numbers.");
      if (normalized.length > 50) throw new Error("Your store link must be 50 characters or less.");

      const { data: existing, error: lookupError } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", normalized)
        .neq("id", activeStore.id)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) throw new Error("That store link is already taken. Choose another one.");

      const { error } = await supabase.from("stores").update({ slug: normalized }).eq("id", activeStore.id);
      if (error) throw error;
      return normalized;
    },
    onSuccess: (normalized) => {
      setSlug(normalized);
      queryClient.invalidateQueries({ queryKey: ["store-domain", activeStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-stores"] });
      toast.success("Store link updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const connectDomain = useMutation({
    mutationFn: async () => {
      if (!activeStore) throw new Error("No active store");
      const normalized = normalizeDomain(customDomain);
      if (!validDomain(normalized)) throw new Error("Enter a valid domain, for example yourstore.com");

      setDomainStatus("pending");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Your session has expired. Please log in again.");

      const response = await fetch("/api/domains/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ storeId: activeStore.id, domain: normalized }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not connect this domain.");

      const currentSettings = (store?.theme_settings ?? {}) as Record<string, unknown>;
      const { error } = await supabase
        .from("stores")
        .update({ theme_settings: { ...currentSettings, customDomain: normalized } })
        .eq("id", activeStore.id);
      if (error) throw error;

      return {
        domain: normalized,
        dnsRecords: Array.isArray(payload.dnsRecords) ? payload.dnsRecords : [],
      };
    },
    onSuccess: ({ domain, dnsRecords: records }) => {
      setCustomDomain(domain);
      setDnsRecords(records);
      setDomainStatus(records.length ? "pending" : "connected");
      queryClient.invalidateQueries({ queryKey: ["store-domain", activeStore?.id] });
      toast.success(records.length ? "Domain added — finish the DNS setup below." : "Domain connected");
    },
    onError: (error: Error) => {
      setDomainStatus("idle");
      toast.error(error.message);
    },
  });

  if (!activeStore) return <NoStore />;

  if (isLoading) {
    return (
      <DashboardShell title="Domains">
        <div className="surface-card p-5"><p className="text-sm text-muted-foreground">Loading domain settings…</p></div>
      </DashboardShell>
    );
  }

  if (isError || !store) {
    return (
      <DashboardShell title="Domains">
        <div className="surface-card p-5">
          <p className="font-medium">Domain settings could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Please refresh the page and try again."}</p>
          <Button className="mt-4" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["store-domain", activeStore.id] })}>Try again</Button>
        </div>
      </DashboardShell>
    );
  }

  const defaultUrl = `https://sellurway.vercel.app/${store.slug}`;

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied");
  }

  return (
    <DashboardShell title="Domains" description="Give your store its own professional web address.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Link2 className="h-5 w-5" /></div>
            <div>
              <p className="font-display font-semibold">Your SellUrWay store link</p>
              <p className="mt-1 text-sm text-muted-foreground">Choose the address customers use to open your store.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-slug">Store link</Label>
            <div className="flex gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                <span className="shrink-0">sellurway.vercel.app/</span>
                <Input id="store-slug" className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="your-store" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              </div>
              <Button onClick={() => saveSlug.mutate()} disabled={saveSlug.isPending}>{saveSlug.isPending ? "Saving…" : "Save"}</Button>
            </div>
            <p className="text-xs text-muted-foreground">Use letters, numbers and hyphens. Changing this link does not change your shop name.</p>
          </div>
        </div>

        <div className="surface-card space-y-5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Globe2 className="h-5 w-5" /></div>
            <div>
              <p className="font-display font-semibold">Custom domain</p>
              <p className="mt-1 text-sm text-muted-foreground">Connect a domain you already own to this store.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-domain">Your domain</Label>
            <Input id="custom-domain" value={customDomain} onChange={(event) => setCustomDomain(normalizeDomain(event.target.value))} placeholder="yourstore.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <Button className="w-full" onClick={() => connectDomain.mutate()} disabled={connectDomain.isPending}>
              {connectDomain.isPending ? "Connecting…" : domainStatus === "connected" ? "Check domain" : "Connect domain"}
            </Button>
          </div>

          {dnsRecords.length > 0 && (
            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">Add these DNS records at your domain registrar</p>
              <div className="mt-3 space-y-2">
                {dnsRecords.map((record, index) => (
                  <div key={index} className="rounded-lg bg-muted/30 p-3 text-xs">
                    <p><span className="font-semibold">Type:</span> {record.type}</p>
                    <p><span className="font-semibold">Name:</span> {record.name}</p>
                    <p className="break-all"><span className="font-semibold">Value:</span> {record.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">After DNS updates, click Check domain again.</p>
            </div>
          )}

          {domainStatus === "connected" && (
            <div className="rounded-xl border p-4 text-sm"><span className="font-medium">✓ Domain connected:</span> {customDomain}</div>
          )}
        </div>

        <div className="surface-card space-y-4 p-5 lg:col-span-2">
          <p className="font-display font-semibold">How custom domains work</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["1", "Enter your domain", "Type the domain you bought."],
              ["2", "Connect it", "SellUrWay adds it to your store."],
              ["3", "Update DNS", "Copy the DNS record(s) shown here to your registrar."],
              ["4", "Verify", "Come back and click Check domain."],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-xl border p-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">{step}</div>
                <p className="mt-3 text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <div className="border-t pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your free SellUrWay URL</p>
            <div className="mt-2 flex gap-2">
              <Input readOnly value={defaultUrl} />
              <Button variant="outline" size="icon" onClick={() => copy(defaultUrl)} aria-label="Copy store URL"><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
