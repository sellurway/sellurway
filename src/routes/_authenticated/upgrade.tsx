import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";
import { getLifetimeLocalPrice, LIFETIME_PRICE_USD, PAYPAL_CHECKOUT_URL } from "@/lib/geo-pricing";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "SellUrWay Lifetime — Grow Your Store for $10 Once" },
      { name: "description", content: "Unlock unlimited products, premium storefront themes, advanced analytics and dropshipping with one $10 payment. No recurring SellUrWay subscription." },
      { property: "og:title", content: "SellUrWay Lifetime — One Payment, More Possibilities" },
      { property: "og:description", content: "Unlock unlimited products, premium themes, analytics and dropshipping with one $10 payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Upgrade,
});

function Upgrade() {
  const { isLifetime, user } = useAuth();
  const queryClient = useQueryClient();
  const [opened, setOpened] = useState(false);
  const [reference, setReference] = useState("");

  const { data: price, isLoading: priceLoading } = useQuery({
    queryKey: ["lifetime-price"],
    queryFn: getLifetimeLocalPrice,
    staleTime: 1000 * 60 * 60,
  });

  const { data: claim } = useQuery({
    queryKey: ["upgrade-claim", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upgrade_claims")
        .select("id,status,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("upgrade_claims").insert({
        user_id: user!.id,
        paypal_note: reference.trim() || null,
        country: price?.country ?? null,
        local_currency: price?.currency ?? null,
        local_amount: price?.amount ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Payment claim submitted. Lifetime will unlock after payment verification.");
    },
    onError: (e: Error) => toast.error(e.message),

  });

  const pending = claim?.status === "pending";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo to="/dashboard" />
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container-page max-w-2xl py-14">
        <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-gold/40 bg-card p-8 shadow-[var(--shadow-lift)]">
          <div aria-hidden className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft/60 px-3 py-1.5 text-sm font-semibold">
              <Crown className="h-4 w-4 text-gold" /> SellUrWay Lifetime
            </p>
            <h2 className="mt-4 max-w-lg font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Your business deserves room to grow.
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
              Stop counting products or holding back your ideas. Unlock the tools to build a bigger, better online store — with one payment, not another monthly bill.
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
              ${LIFETIME_PRICE_USD} <span className="text-base font-medium text-muted-foreground">one time</span>
            </h1>
            {priceLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Checking prices for your country…</p>
            ) : price?.converted ? (
              <p className="mt-3 text-sm text-muted-foreground">
                About {formatMoney(price.amount, price.currency)} in your country ({price.country}). PayPal charges in USD and converts at checkout.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Charged in USD by PayPal.</p>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                { title: "Sell without limits", detail: "Add unlimited products as your catalogue grows." },
                { title: "Make your store yours", detail: "Unlock all 12 themes, plus custom colours and fonts." },
                { title: "Know what’s working", detail: "Use advanced analytics to understand your store." },
                { title: "Explore more products", detail: "Unlock dropshipping and supplier product importing." },
              ].map((feature) => (
                <div key={feature.title} className="rounded-xl border bg-background/80 p-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-soft">
                      <Check className="h-3.5 w-3.5 text-gold" />
                    </span>
                    {feature.title}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span>✓ One-time payment</span>
              <span>✓ No recurring SellUrWay subscription</span>
              <span>✓ Priority support</span>
            </div>

            {isLifetime ? (
              <div className="mt-8 rounded-lg border bg-muted/50 p-4 text-sm">
                You already have Lifetime. Every premium feature is unlocked on your account.
              </div>
            ) : pending ? (
              <div className="mt-8 rounded-lg border bg-muted/50 p-4 text-sm">
                Your payment claim has been received. We’ll update your account as soon as it’s processed.
              </div>

            ) : (
              <div className="mt-8 space-y-4">
                {claim?.status === "rejected" && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    Your last confirmation couldn't be matched to a PayPal payment. Please pay again or send the
                    transaction ID.
                  </p>
                )}
                {!opened ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      window.open(PAYPAL_CHECKOUT_URL, "_blank", "noopener,noreferrer");
                      setOpened(true);
                    }}
                  >
                    Pay ${LIFETIME_PRICE_USD} with PayPal <ExternalLink className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="PayPal transaction ID (optional, speeds up approval)"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={submit.isPending}
                      onClick={() => submit.mutate()}
                    >
                      {submit.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                      I have paid
                    </Button>
                    <button
                      type="button"
                      className="w-full text-center text-xs text-muted-foreground underline"
                      onClick={() => window.open(PAYPAL_CHECKOUT_URL, "_blank", "noopener,noreferrer")}
                    >
                      Open the PayPal page again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
