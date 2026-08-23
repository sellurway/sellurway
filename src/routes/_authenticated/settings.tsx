import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { ImageUploader } from "@/components/ImageUploader";
import { StripeConnectCard } from "@/components/StripeConnectCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CURRENCIES, PRODUCT_ACTIONS, SELLING_MODES } from "@/lib/store-options";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Store settings — Sellurway" },
      { name: "description", content: "Update your store details, selling mode, payments and delivery areas." },
      { property: "og:title", content: "Store settings — Sellurway" },
      { property: "og:description", content: "Control how your storefront looks and how customers order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const PAYMENT_OPTIONS = [
  { id: "card", label: "Card (Stripe)" },
  { id: "cash_on_delivery", label: "Cash on delivery" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "pay_on_pickup", label: "Pay on pickup" },
  { id: "mobile_money", label: "Mobile money" },
];


interface Form {
  name: string;
  description: string;
  currency: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  selling_mode: string;
  product_action: string;
  published: boolean;
  logo: string[];
  banner: string[];
  payment_methods: string[];
  delivery_fee: string;
  free_threshold: string;
  min_order: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  returns: string;
  shipping_policy: string;
}

function SettingsPage() {
  const { activeStore, user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [areaDraft, setAreaDraft] = useState({ name: "", fee: "", eta: "" });

  const { data: store } = useQuery({
    queryKey: ["store-settings", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").eq("id", activeStore!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: areas } = useQuery({
    queryKey: ["delivery-areas", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_areas")
        .select("id,name,fee,eta")
        .eq("store_id", activeStore!.id)
        .order("fee");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!store || form) return;
    const delivery = (store.delivery_settings ?? {}) as Record<string, unknown>;
    const social = (store.social_links ?? {}) as Record<string, string>;
    const policies = (store.policies ?? {}) as Record<string, string>;
    setForm({
      name: store.name,
      description: store.description ?? "",
      currency: store.currency,
      contact_email: store.contact_email ?? "",
      contact_phone: store.contact_phone ?? "",
      whatsapp_number: store.whatsapp_number ?? "",
      selling_mode: store.selling_mode,
      product_action: store.product_action,
      published: store.published,
      logo: store.logo_url ? [store.logo_url] : [],
      banner: store.banner_url ? [store.banner_url] : [],
      payment_methods: Array.isArray(store.payment_methods) ? (store.payment_methods as string[]) : [],
      delivery_fee: delivery["fee"] == null ? "" : String(delivery["fee"]),
      free_threshold: delivery["free_threshold"] == null ? "" : String(delivery["free_threshold"]),
      min_order: delivery["min_order"] == null ? "" : String(delivery["min_order"]),
      instagram: social["instagram"] ?? "",
      facebook: social["facebook"] ?? "",
      tiktok: social["tiktok"] ?? "",
      returns: policies["returns"] ?? "",
      shipping_policy: policies["shipping"] ?? "",
    });
  }, [store, form]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const patch = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        currency: form.currency,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        selling_mode: form.selling_mode,
        product_action: form.product_action,
        published: form.published,
        logo_url: form.logo[0] ?? null,
        banner_url: form.banner[0] ?? null,
        payment_methods: form.payment_methods,
        delivery_settings: {
          fee: form.delivery_fee === "" ? 0 : Number(form.delivery_fee),
          free_threshold: form.free_threshold === "" ? null : Number(form.free_threshold),
          min_order: form.min_order === "" ? 0 : Number(form.min_order),
        },
        social_links: { instagram: form.instagram, facebook: form.facebook, tiktok: form.tiktok },
        policies: { returns: form.returns, shipping: form.shipping_policy },
      };
      const { error } = await supabase.from("stores").update(patch as never).eq("id", activeStore!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addArea = useMutation({
    mutationFn: async () => {
      if (!areaDraft.name.trim()) throw new Error("Give the area a name.");
      const { error } = await supabase.from("delivery_areas").insert({
        store_id: activeStore!.id,
        name: areaDraft.name.trim(),
        fee: Number(areaDraft.fee) || 0,
        eta: areaDraft.eta.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAreaDraft({ name: "", fee: "", eta: "" });
      queryClient.invalidateQueries({ queryKey: ["delivery-areas", activeStore?.id] });
      toast.success("Delivery area added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_areas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delivery-areas", activeStore?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!activeStore) {
    return (
      <DashboardShell title="Settings">
        <NoStore />
      </DashboardShell>
    );
  }
  if (!form) {
    return (
      <DashboardShell title="Settings">
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </DashboardShell>
    );
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });
  const storeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${activeStore.slug}`;

  return (
    <DashboardShell
      title="Store settings"
      description="Your details, how customers order, payments and delivery."
      actions={
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          Save changes
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-5">
          <p className="font-display font-semibold">Store details</p>
          <div className="space-y-1.5">
            <Label htmlFor="store-name">Store name</Label>
            <Input id="store-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store-desc">Description</Label>
            <Textarea
              id="store-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Your store link</Label>
            <div className="flex gap-2">
              <Input readOnly value={storeUrl} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copy store link"
                onClick={() => {
                  navigator.clipboard.writeText(storeUrl);
                  toast.success("Link copied");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="published">Store is live</Label>
              <p className="text-xs text-muted-foreground">Turn off to hide your storefront from shoppers.</p>
            </div>
            <Switch id="published" checked={form.published} onCheckedChange={(v) => set("published", v)} />
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <p className="font-display font-semibold">Branding</p>
          <ImageUploader
            value={form.logo}
            onChange={(v) => set("logo", v)}
            userId={user!.id}
            folder="store"
            max={1}
            label="Logo"
          />
          <ImageUploader
            value={form.banner}
            onChange={(v) => set("banner", v)}
            userId={user!.id}
            folder="store"
            max={1}
            label="Banner"
            aspect="wide"
          />
        </div>

        <div className="surface-card space-y-4 p-5">
          <p className="font-display font-semibold">How customers order</p>
          <div className="space-y-1.5">
            <Label>Selling mode</Label>
            <Select value={form.selling_mode} onValueChange={(v) => set("selling_mode", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELLING_MODES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {SELLING_MODES.find((m) => m.id === form.selling_mode)?.description}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Main product button</Label>
            <Select value={form.product_action} onValueChange={(v) => set("product_action", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_ACTIONS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa">WhatsApp number</Label>
            <Input
              id="wa"
              placeholder="+27 82 000 0000"
              value={form.whatsapp_number}
              onChange={(e) => set("whatsapp_number", e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Contact email</Label>
              <Input id="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Contact phone</Label>
              <Input id="phone" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <p className="font-display font-semibold">Payments</p>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.payment_methods.includes(p.id)}
                  onCheckedChange={(v) =>
                    set(
                      "payment_methods",
                      v ? [...form.payment_methods, p.id] : form.payment_methods.filter((m) => m !== p.id),
                    )
                  }
                />
                {p.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Tick “Card (Stripe)” only after you connect your Stripe account below — shoppers are sent to Stripe
            Checkout to pay.
          </p>
        </div>

        <StripeConnectCard
          storeId={activeStore!.id}
          enabled={Boolean((store as { stripe_enabled?: boolean } | undefined)?.stripe_enabled)}
          last4={(store as { stripe_key_last4?: string | null } | undefined)?.stripe_key_last4 ?? null}
          livemode={Boolean((store as { stripe_livemode?: boolean } | undefined)?.stripe_livemode)}
        />


        <div className="surface-card space-y-4 p-5 lg:col-span-2">
          <p className="font-display font-semibold">Delivery</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="fee">Default delivery fee</Label>
              <Input id="fee" inputMode="decimal" value={form.delivery_fee} onChange={(e) => set("delivery_fee", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="free">Free delivery over</Label>
              <Input id="free" inputMode="decimal" value={form.free_threshold} onChange={(e) => set("free_threshold", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min">Minimum order</Label>
              <Input id="min" inputMode="decimal" value={form.min_order} onChange={(e) => set("min_order", e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border">
            {(areas ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b p-3 text-sm last:border-b-0">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(a.fee, form.currency)}
                    {a.eta ? ` · ${a.eta}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Remove area" onClick={() => removeArea.mutate(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(areas ?? []).length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No delivery areas yet — the default fee applies to every order.
              </p>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_8rem_10rem_auto]">
            <Input
              placeholder="Area name"
              value={areaDraft.name}
              onChange={(e) => setAreaDraft({ ...areaDraft, name: e.target.value })}
            />
            <Input
              placeholder="Fee"
              inputMode="decimal"
              value={areaDraft.fee}
              onChange={(e) => setAreaDraft({ ...areaDraft, fee: e.target.value })}
            />
            <Input
              placeholder="ETA (same day)"
              value={areaDraft.eta}
              onChange={(e) => setAreaDraft({ ...areaDraft, eta: e.target.value })}
            />
            <Button type="button" variant="outline" onClick={() => addArea.mutate()} disabled={addArea.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Add area
            </Button>
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <p className="font-display font-semibold">Social links</p>
          {(["instagram", "facebook", "tiktok"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={k} className="capitalize">
                {k}
              </Label>
              <Input id={k} value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder="https://" />
            </div>
          ))}
        </div>

        <div className="surface-card space-y-4 p-5">
          <p className="font-display font-semibold">Policies</p>
          <div className="space-y-1.5">
            <Label htmlFor="returns">Returns policy</Label>
            <Textarea id="returns" rows={4} value={form.returns} onChange={(e) => set("returns", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipping">Shipping policy</Label>
            <Textarea
              id="shipping"
              rows={4}
              value={form.shipping_policy}
              onChange={(e) => set("shipping_policy", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          Save changes
        </Button>
      </div>
    </DashboardShell>
  );
}
