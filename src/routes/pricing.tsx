import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Minus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Free forever or $10 lifetime | Sellurway" },
      {
        name: "description",
        content:
          "Start free with 5 products. Upgrade once for $10 to unlock unlimited products, premium themes and advanced analytics. No subscriptions.",
      },
      { property: "og:title", content: "Sellurway pricing — free, or $10 once" },
      { property: "og:description", content: "Five products free forever. Unlimited products for a single $10 payment." },
    ],
  }),
  component: Pricing,
});

const rows: { label: string; free: string | boolean; lifetime: string | boolean }[] = [
  { label: "Products", free: "5", lifetime: "Unlimited" },
  { label: "Storefront link", free: true, lifetime: true },
  { label: "Product photos", free: "5 per product", lifetime: "5 per product" },
  { label: "Full checkout", free: true, lifetime: true },
  { label: "Direct delivery orders", free: true, lifetime: true },
  { label: "WhatsApp orders", free: true, lifetime: true },
  { label: "Themes", free: "3 free", lifetime: "All 8" },
  { label: "Custom theme colours & fonts", free: false, lifetime: true },
  { label: "Categories & variants", free: true, lifetime: true },
  { label: "Delivery areas & fees", free: true, lifetime: true },
  { label: "Orders & customers", free: true, lifetime: true },
  { label: "Analytics", free: "Basic", lifetime: "Advanced" },
  { label: "Support", free: "Standard", lifetime: "Priority" },
];

function Cell({ value, gold }: { value: string | boolean; gold?: boolean }) {
  if (value === true)
    return <Check className={`mx-auto h-4 w-4 ${gold ? "text-gold" : "text-accent"}`} aria-label="Included" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />;
  return <span className="text-sm">{value}</span>;
}

function Pricing() {
  const { user, isLifetime } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Button asChild size="sm" variant="outline">
            {user ? (
              <Link to="/dashboard">Dashboard</Link>
            ) : (
              <Link to="/auth" search={{ mode: "signup" }}>Start free</Link>
            )}
          </Button>
        </div>
      </header>

      <main className="container-page py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            One price. <span className="text-gradient">Paid once.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Sellurway has no monthly fee and takes no cut of your sales. Start free, and upgrade only when
            your catalogue outgrows five products.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="surface-card p-8">
            <p className="text-sm font-medium text-muted-foreground">Free</p>
            <p className="mt-2 font-display text-4xl font-extrabold">$0</p>
            <p className="mt-1 text-sm text-muted-foreground">For your first five products.</p>
            <Button asChild variant="outline" className="mt-6 w-full">
              {user ? (
                <Link to="/dashboard">Go to dashboard</Link>
              ) : (
                <Link to="/auth" search={{ mode: "signup" }}>Start free</Link>
              )}
            </Button>
          </div>
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-gold/40 bg-card p-8 shadow-[var(--shadow-lift)]">
            <div aria-hidden className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/15 blur-2xl" />
            <div className="relative">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                <Crown className="h-4 w-4 text-gold" /> Lifetime
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                $10 <span className="text-base font-medium text-muted-foreground">one time</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Unlimited products, forever.</p>
              <Button asChild className="mt-6 w-full">
                {user ? (
                  <Link to="/upgrade">{isLifetime ? "You have lifetime" : "Upgrade for $10"}</Link>
                ) : (
                  <Link to="/auth" search={{ mode: "signup" }}>Create account to upgrade</Link>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[var(--radius-xl)] border">
          <table className="w-full text-left">
            <thead className="bg-muted/60 text-sm">
              <tr>
                <th className="p-4 font-medium">What you get</th>
                <th className="w-32 p-4 text-center font-medium">Free</th>
                <th className="w-40 p-4 text-center font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-gold" /> Lifetime
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t">
                  <td className="p-4 text-sm">{r.label}</td>
                  <td className="p-4 text-center"><Cell value={r.free} /></td>
                  <td className="bg-gold-soft/40 p-4 text-center"><Cell value={r.lifetime} gold /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mx-auto mt-14 max-w-2xl space-y-6">
          <h2 className="font-display text-2xl font-bold">Questions</h2>
          {[
            {
              q: "Is the $10 really one time?",
              a: "Yes. It is a single payment that permanently unlocks unlimited products and premium themes on your account. There is no renewal and no subscription.",
            },
            {
              q: "Does Sellurway take a commission on my sales?",
              a: "No. Orders and payments are between you and your customer. Sellurway never takes a percentage.",
            },
            {
              q: "What happens to my products if I stay on free?",
              a: "Nothing. Your five products keep selling. You only need the upgrade when you want to publish a sixth.",
            },
            {
              q: "Can I change my selling mode later?",
              a: "Any time, from your store settings. You can also run more than one mode at once.",
            },
          ].map((f) => (
            <div key={f.q} className="surface-card p-6">
              <h3 className="font-display text-base font-semibold">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
