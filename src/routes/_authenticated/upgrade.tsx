import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

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
  const { isLifetime } = useAuth();

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
              $10 <span className="text-base font-medium text-muted-foreground">one time</span>
            </h1>
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
            ) : (
              <div className="mt-8 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                Card payments aren't switched on for this project yet. Once payments are connected, this button
                takes the $10 payment and unlocks your account automatically.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
