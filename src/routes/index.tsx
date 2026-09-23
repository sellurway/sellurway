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
import { ThemePreview } from "@/components/ThemePreview";

import candle from "@/assets/demo-candle.jpg";
import mug from "@/assets/demo-mug.jpg";
import tote from "@/assets/demo-tote.jpg";
import throwBlanket from "@/assets/demo-throw.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sellurway — Online Store Builder for Businesses" },
      { rel: "canonical", href: "https://sellurway.vercel.app/" },
      {
        name: "description",
        content:
          "Sellurway helps businesses build professional online stores, reach customers anywhere and manage their online business in one place.",
      },
      { property: "og:title", content: "Sellurway — Online Store Builder for Businesses" },
      {
        property: "og:description",
        content:
          "Sellurway helps businesses build professional online stores, reach customers anywhere and manage their online business in one place.",
      },
    ],
  }),
  component: Landing,
});

const modes = [
  {
    icon: CreditCard,
    title: "Full checkout",
    body: "Give customers a simple cart and checkout flow with the payment method that works for your business.",
  },
  {
    icon: Truck,
    title: "Direct delivery orders",
    body: "Collect the product, address and delivery details without making customers jump through extra steps.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp orders",
    body: "Send product details straight into WhatsApp so you can close sales in the conversation customers already use.",
  },
];

const features = [
  { icon: Package, title: "Product management", body: "Add multiple photos, variants, stock, categories and featured products." },
  { icon: Palette, title: "24 storefront templates", body: "Choose from 24 storefront templates and make your shop look like your brand." },
  { icon: BarChart3, title: "Analytics", body: "Track revenue, orders, average order value and your best-selling products." },
  { icon: Globe2, title: "Sell anywhere", body: "Set your currency, delivery areas and fees for the customers you serve." },
  { icon: ShieldCheck, title: "Secure by default", body: "Your store data is protected with database security and server-side checks." },
  { icon: Smartphone, title: "Installable", body: "Your storefront and dashboard can be installed on a phone like an app." },
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
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[32rem] bg-brand-gradient opacity-[0.16] blur-3xl" />
          <div className="container-page relative grid gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Free forever for your first 3 products
              </span>

              <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Sellurway — Sellurway — Sellurway — Sellurway — Sellurway — Sellurway — Set up your online shop in
                <span className="text-gradient"> ten minutes.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Build a professional online store, add your products, share your link and start taking orders.
                Everything stays in one simple dashboard so you can spend more time selling and less time managing tools.
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
                {["Your own store link", "Live in minutes", "Works on any phone"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-fit lg:mx-0 lg:justify-self-center">
              <div className="relative w-[270px] rotate-[4deg] rounded-[2.9rem] border-[6px] border-neutral-800 bg-neutral-800 shadow-[var(--shadow-lift)] sm:w-[300px]">
                <div className="overflow-hidden rounded-[2.45rem] bg-white">
                  <div className="relative flex h-9 items-center justify-between px-5 pt-1 text-[10px] font-semibold text-neutral-900">
                    <span>9:41</span>
                    <span className="absolute left-1/2 top-1.5 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900" />
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-3 rounded-[2px] bg-neutral-900/80" />
                      <span className="inline-block h-2 w-1 rounded-[1px] bg-neutral-900/80" />
                    </span>
                  </div>
                  <div className="px-4 pb-5 pt-2">
                    <p className="font-display text-xl font-extrabold tracking-tight text-neutral-900">Kora Home</p>
                    <p className="mt-0.5 text-[10px] text-neutral-500">Handmade homeware · Ships nationwide</p>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      {[
                        { img: candle, name: "Ember soy candle", price: "$28.00" },
                        { img: tote, name: "Canvas tote", price: "$34.00" },
                        { img: mug, name: "Stoneware mug", price: "$22.00" },
                        { img: throwBlanket, name: "Wool throw", price: "$96.00" },
                      ].map((product) => (
                        <div key={product.name} className="overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-100">
                          <img src={product.img} alt={product.name} className="aspect-square w-full object-cover" loading="lazy" />
                          <div className="p-2">
                            <p className="truncate text-[10px] font-medium text-neutral-900">{product.name}</p>
                            <p className="text-[10px] text-neutral-500">{product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-full bg-brand-gradient py-2.5 text-center text-xs font-semibold text-white shadow-md">Shop now</div>
                    <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-neutral-300" />
                  </div>
                </div>
              </div>
              <div className="surface-card absolute -bottom-6 -left-4 hidden w-56 p-3 sm:block">
                <p className="text-[11px] text-muted-foreground">Orders today</p>
                <p className="font-display text-2xl font-bold">14</p>
                <div className="mt-2 flex h-8 items-end gap-1">
                  {[35, 55, 30, 70, 45, 85, 60].map((height, index) => (
                    <span key={index} className="flex-1 rounded-sm bg-brand-gradient" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="border-y bg-surface-tint py-16 md:py-20">
          <div className="container-page">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Three ways to take an order. Use one or all three.</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">Choose the selling flow that fits your business and change it later from your store settings.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {modes.map((mode) => (
                <div key={mode.title} className="surface-card p-6">
                  <div className="inline-flex rounded-xl bg-brand-gradient p-2.5 text-white">
                    <mode.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{mode.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24">
          <div className="container-page">
            <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything a small shop actually needs.</h2>
            <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title}>
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-display text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="themes" className="border-y bg-surface-tint py-16 md:py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Themes that fit your trade.</h2>
                <p className="mt-3 max-w-xl text-muted-foreground">Explore all 24 storefront templates, each designed to make your products look great on every screen.</p>
              </div>
              <Button asChild variant="outline"><Link to="/pricing">Compare plans</Link></Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {THEMES.map((theme) => (
                <div key={theme.id} className="surface-card overflow-hidden">
                  <ThemePreview theme={theme} />
                  <div className="flex items-start justify-between gap-2 border-t p-4">
                    <div>
                      <p className="font-display text-sm font-semibold">{theme.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{theme.bestFor}</p>
                    </div>
                    {theme.premium && <Crown className="h-4 w-4 shrink-0 text-gold" aria-label="Premium theme" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container-page">
            <div className="surface-card grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start free</p>
                <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Open your store without a monthly subscription.</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">Start with up to 3 products, build your storefront and upgrade once when you need more.</p>
              </div>
              <Button asChild size="lg" className="h-12 px-6"><Link to="/auth" search={{ mode: "signup" }}>Create your store <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="container-page flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>Sellurway — build your store, share your link, make more sales.</p>
        </div>
      </footer>
    </div>
  );
}
