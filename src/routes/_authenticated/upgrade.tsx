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
      { title: "Upgrade to Lifetime — Sellurway" },
      { name: "description", content: "Unlock unlimited products and premium themes with a one-time $10 Sellurway upgrade." },
      { property: "og:title", content: "Sellurway Lifetime" },
      { property: "og:description", content: "One payment of $10 for unlimited products, forever." },
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
      toast.success("Thanks — every premium feature is unlocked on your account.");
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
            <p className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Crown className="h-4 w-4 text-gold" /> Sellurway Lifetime
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
              ${LIFETIME_PRICE_USD} <span className="text-base font-medium text-muted-foreground">one time</span>
            </h1>
            {priceLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Checking prices for your country…</p>
            ) : price?.converted ? (
              <p className="mt-2 text-sm text-muted-foreground">
                About {formatMoney(price.amount, price.currency)} in your country ({price.country}). PayPal charges the
                USD amount and converts at checkout.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Charged in USD by PayPal.</p>
            )}

            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Unlimited products",
                "All 8 themes, including the 5 premium ones",
                "Custom theme colours and fonts",
                "Advanced analytics",
                "Priority support",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {i}
                </li>
              ))}
            </ul>

            {isLifetime ? (
              <div className="mt-8 rounded-lg border bg-muted/50 p-4 text-sm">
                You already have Lifetime. Every premium feature is unlocked on your account.
              </div>
            ) : pending ? (
              <div className="mt-8 rounded-lg border bg-muted/50 p-4 text-sm">
                Lifetime is unlocked on your account — unlimited products, all 12 templates and custom colours are
                available right now. Our team is confirming your PayPal payment in the background.
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
                <p className="text-xs text-muted-foreground">
                  Payments are confirmed manually. After you pay, tap “I have paid” and our team unlocks Lifetime on
                  your account.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
