import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/ImageUploader";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/format";
import {
  BUSINESS_TYPES,
  COUNTRIES,
  CURRENCIES,
  SELLING_MODES,
  STORE_CATEGORIES,
  type BusinessType,
  type SellingMode,
} from "@/lib/store-options";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Create your store — Sellurway" },
      { name: "description", content: "Set up your Sellurway storefront: name, link, currency and how you take orders." },
      { property: "og:title", content: "Create your Sellurway store" },
      { property: "og:description", content: "Name it, pick your currency, choose how customers order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user, refresh, stores } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken">("idle");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    country: "United States",
    currency: "USD",
    category: STORE_CATEGORIES[0]!,
    business_type: "physical" as BusinessType,
    selling_mode: "full_checkout" as SellingMode,
    whatsapp_number: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "" as string,
  });

  async function checkSlug(value: string) {
    const clean = slugify(value);
    setForm((f) => ({ ...f, slug: clean }));
    if (clean.length < 3) return setSlugState("idle");
    setSlugState("checking");
    const { data, error } = await supabase.rpc("slug_available", { _slug: clean });
    setSlugState(error ? "idle" : data ? "free" : "taken");
  }

  async function createStore() {
    if (!user) return;
    if (form.name.trim().length < 2) return toast.error("Give your store a name.");
    if (form.slug.length < 3) return toast.error("Choose a store link of at least 3 characters.");
    if (slugState === "taken") return toast.error("That store link is taken.");
    if (form.selling_mode !== "full_checkout" && form.selling_mode === "whatsapp" && !form.whatsapp_number.trim())
      return toast.error("Add your WhatsApp number.");

    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          slug: form.slug,
          description: form.description.trim() || null,
          country: form.country,
          currency: form.currency,
          category: form.category,
          business_type: form.business_type,
          selling_mode: form.selling_mode,
          whatsapp_number: form.whatsapp_number.trim() || null,
          contact_email: form.contact_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          logo_url: form.logo_url || null,
          published: true,
        })
        .select("slug")
        .single();
      if (error) throw error;
      refresh();
      toast.success("Your store is live.");
      navigate({ to: "/dashboard" });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create your store.";
      toast.error(msg.includes("duplicate") ? "That store link is already taken." : msg);
    } finally {
      setBusy(false);
    }
  }

  const steps = ["Basics", "How you sell", "Contact"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo to="/dashboard" />
          {stores.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Cancel</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="container-page max-w-2xl py-12">
        <ol className="mb-8 flex items-center gap-3 text-sm">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={i === step ? "font-medium" : "text-muted-foreground"}>{s}</span>
              {i < steps.length - 1 && <span className="h-px w-6 bg-border" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl font-bold tracking-tight">Let's set up your store</h1>
            <div className="space-y-1.5">
              <Label htmlFor="name">Store name</Label>
              <Input
                id="name"
                value={form.name}
                maxLength={60}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name }));
                  if (!form.slug) void checkSlug(name);
                }}
                placeholder="Kora Home"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Store link</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/s/</span>
                <Input id="slug" value={form.slug} maxLength={40} onChange={(e) => void checkSlug(e.target.value)} placeholder="kora-home" />
              </div>
              <p className="text-xs text-muted-foreground">
                {slugState === "checking" && "Checking availability…"}
                {slugState === "free" && "That link is available."}
                {slugState === "taken" && "That link is taken, try another."}
                {slugState === "idle" && "Letters, numbers and dashes only."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Short description</Label>
              <Textarea
                id="description"
                rows={3}
                maxLength={300}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Handmade homeware, made in small batches."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {STORE_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {user && (
              <ImageUploader
                userId={user.id}
                folder="store"
                label="Store logo"
                max={1}
                value={form.logo_url ? [form.logo_url] : []}
                onChange={(urls) => setForm((f) => ({ ...f, logo_url: urls[0] ?? "" }))}
              />
            )}
            <Button className="w-full" onClick={() => setStep(1)} disabled={form.name.trim().length < 2 || form.slug.length < 3}>
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl font-bold tracking-tight">How do you want to sell?</h1>
            <div className="grid gap-3 sm:grid-cols-2">
              {BUSINESS_TYPES.map((b) => (
                <button
                  key={b.id}
                  onClick={() =>
                    setForm((f) => ({ ...f, business_type: b.id, selling_mode: b.recommended }))
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    form.business_type === b.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-semibold">{b.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Order method</Label>
              {SELLING_MODES.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                    form.selling_mode === m.id ? "border-primary ring-1 ring-primary" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    className="mt-1"
                    checked={form.selling_mode === m.id}
                    onChange={() => setForm((f) => ({ ...f, selling_mode: m.id }))}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {(form.selling_mode === "whatsapp" || form.selling_mode === "multiple") && (
              <div className="space-y-1.5">
                <Label htmlFor="wa">WhatsApp number (with country code)</Label>
                <Input
                  id="wa"
                  value={form.whatsapp_number}
                  maxLength={20}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
                  placeholder="+234 800 000 0000"
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h1 className="font-display text-2xl font-bold tracking-tight">How can customers reach you?</h1>
            <div className="space-y-1.5">
              <Label htmlFor="cemail">Contact email</Label>
              <Input
                id="cemail"
                type="email"
                maxLength={255}
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="hello@yourstore.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Contact phone</Label>
              <Input
                id="cphone"
                maxLength={20}
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => void createStore()} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create store
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
