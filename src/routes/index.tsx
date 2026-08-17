import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  Crown,
  Globe2,
  MessageCircle,
  Package,
  Palette,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { THEMES } from "@/lib/themes";
import candle from "@/assets/demo-candle.jpg";
import mug from "@/assets/demo-mug.jpg";
import tote from "@/assets/demo-tote.jpg";
import throwBlanket from "@/assets/demo-throw.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sellurway — Sell your way, anywhere in the world" },
      {
        name: "description",
        content:
          "Build a storefront in minutes and take orders by full checkout, direct delivery or WhatsApp. Free to start, $10 once for unlimited products.",
      },
      { property: "og:title", content: "Sellurway — Sell your way, anywhere" },
      {
        property: "og:description",
        content:
          "Storefronts, orders, customers and analytics in one place. Free forever for 5 products, $10 once for unlimited.",
      },
    ],
  }),
  component: Landing,
});

const modes = [
  {
    icon: CreditCard,
    title: "Full checkout",
    body: "Cart, checkout, order confirmation and payment method of your choice — cash on delivery, bank transfer or pay on pickup.",
  },
  {
    icon: Truck,
    title: "Direct delivery orders",
    body: "Skip the cart. Buyers pick a product, add their address and delivery window, and land straight in your order queue.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp orders",
    body: "Every product button opens WhatsApp with the item, quantity and price already written out for you.",
  },
];

const features = [
  { icon: Package, title: "Product management", body: "Up to 5 photos per product, variants, stock tracking, categories and featured picks." },
  { icon: Palette, title: "Themes", body: "Eight storefront themes with colour and layout controls. Premium themes unlock with lifetime." },
  { icon: BarChart3, title: "Analytics", body: "Revenue, orders, average order value, best sellers and repeat customers." },
  { icon: Globe2, title: "Built for anywhere", body: "20 currencies, worldwide countries, delivery areas and fees you define." },
  { icon: ShieldCheck, title: "Secure by default", body: "Row-level security on every table and server-side price validation on checkout." },
  { icon: Smartphone, title: "Installable", body: "Your dashboard and storefronts install to the home screen and work like an app." },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition hover:text-foreground">How it works</a>
            <a href="#features" className="transition hover:text-foreground">Features</a>
            <a href="#themes" className="transition hover:text-foreground">Themes</a>
            <Link to="/pricing" className="transition hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth" search={{ mode: "login" }}>Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ mode: "signup" }}>Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] opacity-[0.16] blur-3xl bg-brand-gradient"
          />
          <div className="container-page relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Free forever for your first 5 products
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Set up your online shop in
                <span className="text-gradient"> ten minutes.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Sellurway gives you a real storefront with one link you can share anywhere. Pick a template,
                upload your products, and take orders by full checkout, direct delivery or WhatsApp — whichever
                way your customers already buy.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Create your store <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                  <Link to="/s/$slug" params={{ slug: "demo-kora-home" }}>
                    See a live store
                  </Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["No card to start", "No monthly fees", "Your own store link"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="surface-card overflow-hidden p-3 shadow-[var(--shadow-lift)]">
                <div className="flex items-center gap-1.5 px-2 pb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                  <span className="ml-3 truncate rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                    sellurway.app/s/kora-home
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { img: candle, name: "Ember soy candle", price: "$28.00" },
                    { img: mug, name: "Stoneware mug", price: "$22.00" },
                    { img: tote, name: "Everyday canvas tote", price: "$34.00" },
                    { img: throwBlanket, name: "Wool throw", price: "$96.00" },
                  ].map((p) => (
                    <div key={p.name} className="overflow-hidden rounded-xl border bg-card">
                      <img src={p.img} alt={p.name} className="aspect-square w-full object-cover" loading="lazy" />
                      <div className="p-2.5">
                        <p className="truncate text-xs font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="surface-card absolute -bottom-6 -left-4 hidden w-56 p-3 sm:block">
                <p className="text-[11px] text-muted-foreground">Orders today</p>
                <p className="font-display text-2xl font-bold">14</p>
                <div className="mt-2 flex h-8 items-end gap-1">
                  {[35, 55, 30, 70, 45, 85, 60].map((h, i) => (
                    <span key={i} className="flex-1 rounded-sm bg-brand-gradient" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Selling modes */}
        <section id="how" className="border-y bg-surface-tint py-16 md:py-20">
          <div className="container-page">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Three ways to take an order. Pick one, or use them all.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Selling mode is a store setting, so you can change it any time without rebuilding anything.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {modes.map((m) => (
                <div key={m.title} className="surface-card p-6">
                  <div className="inline-flex rounded-xl bg-brand-gradient p-2.5 text-white">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-24">
          <div className="container-page">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything a small shop actually needs.
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title}>
                  <f.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-display text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Themes */}
        <section id="themes" className="border-y bg-surface-tint py-16 md:py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Themes that fit your trade.</h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  Three free themes to start. Five premium themes unlock forever with the lifetime upgrade.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/pricing">Compare plans</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {THEMES.map((t) => (
                <div key={t.id} className="surface-card overflow-hidden">
                  <ThemePreview theme={t} />

                  <div className="flex items-start justify-between gap-2 border-t p-4">
                    <div>
                      <p className="font-display text-sm font-semibold">{t.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.bestFor}</p>
                    </div>
                    {t.premium && <Crown className="h-4 w-4 shrink-0 text-gold" aria-label="Premium theme" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 md:py-24">
          <div className="container-page grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-8">
              <p className="text-sm font-medium text-muted-foreground">Free</p>
              <p className="mt-2 font-display text-4xl font-extrabold">$0</p>
              <p className="mt-1 text-sm text-muted-foreground">Everything you need to open.</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {["Up to 5 products", "1 storefront", "All 3 selling modes", "3 free themes", "Orders & customers", "Basic analytics"].map((i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {i}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-7 w-full">
                <Link to="/auth" search={{ mode: "signup" }}>Start free</Link>
              </Button>
            </div>
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-gold/40 bg-card p-8 shadow-[var(--shadow-lift)]">
              <div aria-hidden className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/15 blur-2xl" />
              <div className="relative">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                  <Crown className="h-4 w-4 text-gold" /> Lifetime
                </p>
                <p className="mt-2 font-display text-4xl font-extrabold">
                  $10 <span className="text-base font-medium text-muted-foreground">once</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Pay once. Yours forever. No renewals.</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[
                    "Unlimited products",
                    "All 8 themes including premium",
                    "Custom theme colours & fonts",
                    "Advanced analytics",
                    "Priority support",
                    "Every future free-plan feature",
                  ].map((i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {i}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full">
                  <Link to="/pricing">Get lifetime</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="container-page">
            <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-brand-gradient px-8 py-14 text-center text-white">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Sell your way.</h2>
              <p className="mx-auto mt-3 max-w-lg text-white/85">
                Open your storefront today and share the link with your first customer tonight.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-7 h-12 px-7 text-base">
                <Link to="/auth" search={{ mode: "signup" }}>Create your free store</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="container-page flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/s/$slug" params={{ slug: "demo-kora-home" }} className="hover:text-foreground">Demo store</Link>
            <Link to="/auth" search={{ mode: "login" }} className="hover:text-foreground">Log in</Link>
          </nav>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Sellurway</p>
        </div>
      </footer>
    </div>
  );
}
