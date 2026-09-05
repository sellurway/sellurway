import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Crown, MessageCircle, Palette, Smartphone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/free-online-store")({
  head: () => ({
    meta: [
      { title: "Free Online Store Builder — Sellurway" },
      {
        name: "description",
        content:
          "Create a free online store with Sellurway. Start with up to 3 products and 2 themes, then upgrade to lifetime access for $10 when you need more.",
      },
      { property: "og:title", content: "Free Online Store Builder — Sellurway" },
      {
        property: "og:description",
        content:
          "Build an online store for free with 3 products and 2 themes. Upgrade to lifetime access for $10 when you need more.",
      },
    ],
  }),
  component: FreeOnlineStorePage,
});

const pageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Free Online Store Builder — Sellurway",
  url: "https://sellurway.vercel.app/free-online-store",
  description:
    "Create a free online store with Sellurway. Start with up to 3 products and 2 themes, then upgrade to lifetime access for $10 when you need more.",
  isPartOf: {
    "@type": "WebSite",
    name: "Sellurway",
    url: "https://sellurway.vercel.app/",
  },
};

function FreeOnlineStorePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>Start free</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="container-page grid gap-10 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Free online store builder</p>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Create your online store for free.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Sellurway helps small businesses launch a real online store without a monthly subscription. Start free,
                add up to 3 products, choose from 2 free themes, and share your store link anywhere.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Create my free store <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>

            <div className="surface-card p-6">
              <p className="text-sm font-semibold">What you get for free</p>
              <div className="mt-5 space-y-4">
                {[
                  "Up to 3 products",
                  "2 free themes",
                  "Your own storefront link",
                  "Orders and customers",
                  "Checkout, delivery and WhatsApp selling",
                  "Works on mobile",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-gold/40 bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Crown className="h-4 w-4 text-gold" />
                  Need more?
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upgrade to lifetime access for <strong className="text-foreground">$10 once</strong> when you need more products and themes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container-page">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Why use Sellurway?</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="surface-card p-6">
                <Palette className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">Launch with a theme</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Choose a storefront design and make your products look professional from day one.
                </p>
              </div>
              <div className="surface-card p-6">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">Sell your way</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Take orders through checkout, direct delivery or WhatsApp, depending on how your customers buy.
                </p>
              </div>
              <div className="surface-card p-6">
                <Smartphone className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">Works on any phone</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Your storefront and dashboard are designed to work cleanly on mobile as well as desktop.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-surface-tint py-16 md:py-20">
          <div className="container-page">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Free to start, upgrade only when you need more.</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              There is no need to pay before you know whether Sellurway fits your business. Build your store first.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="surface-card p-6">
                <p className="text-sm font-semibold">Free</p>
                <p className="mt-2 font-display text-4xl font-extrabold">$0</p>
                <p className="mt-2 text-sm text-muted-foreground">Start your store and test the experience.</p>
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link to="/auth" search={{ mode: "signup" }}>Start free</Link>
                </Button>
              </div>
              <div className="surface-card border-gold/40 p-6">
                <div className="flex items-center gap-2 text-sm font-semibold"><Crown className="h-4 w-4 text-gold" /> Lifetime</div>
                <p className="mt-2 font-display text-4xl font-extrabold">$10 <span className="text-base font-medium text-muted-foreground">once</span></p>
                <p className="mt-2 text-sm text-muted-foreground">Unlock more products and themes with lifetime access.</p>
                <Button asChild className="mt-6 w-full">
                  <Link to="/pricing">View lifetime plan</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container-page flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Sellurway — build. sell. own it.</span>
          <div className="flex gap-4">
            <Link to="/">Home</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
    </div>
  );
}
