import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, Mic2, Music2, ShoppingBag, Speaker, X } from "lucide-react";

export const Route = createFileRoute("/demo/pulse-audio")({
  head: () => ({
    meta: [
      { title: "Pulse Audio — Premium Audio" },
      { name: "description", content: "Pulse Audio demo store powered by SellUrWay." },
      { rel: "canonical", href: "https://sellurway.vercel.app/demo/pulse-audio" },
      { property: "og:title", content: "Pulse Audio — Premium Audio" },
      { property: "og:description", content: "Explore the Pulse Audio demo store on SellUrWay." },
    ],
  }),
  component: PulseAudioDemo,
});

const categories = [
  { name: "All", value: "all" },
  { name: "Headphones", value: "headphones" },
  { name: "Earphones", value: "earbuds" },
  { name: "Speakers", value: "speakers" },
  { name: "Studio", value: "studio" },
  { name: "Vinyl", value: "vinyl" },
];

const products = [
  {
    id: "pulse-pro-headphones",
    name: "Pulse Pro Headphones",
    price: 149,
    category: "headphones",
    tag: "Best seller",
    image: "https://images.unsplash.com/photo-1752055831529-669caee003c3?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-air-buds",
    name: "Pulse Air Buds",
    price: 89,
    category: "earbuds",
    tag: "New",
    image: "https://images.unsplash.com/photo-1686554825516-2a3dfb4ca93d?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-boom-speaker",
    name: "Pulse Boom Speaker",
    price: 129,
    category: "speakers",
    tag: "Popular",
    image: "https://images.unsplash.com/photo-1727061181133-3797c19254f5?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-studio-mic",
    name: "Pulse Studio Mic",
    price: 119,
    category: "studio",
    tag: "Creator pick",
    image: "https://images.unsplash.com/photo-1691392774565-3bea10c45b08?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-vinyl-one",
    name: "Pulse Vinyl One",
    price: 249,
    category: "vinyl",
    tag: "Classic",
    image: "https://images.unsplash.com/photo-1613311106434-89edb8bb30c8?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-studio-headset",
    name: "Pulse Studio Headset",
    price: 179,
    category: "headphones",
    tag: "Studio",
    image: "https://images.unsplash.com/photo-1557256080-c76847e4e52a?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-bass-max",
    name: "Pulse Bass Max",
    price: 199,
    category: "speakers",
    tag: "Deep bass",
    image: "https://images.unsplash.com/photo-1727061181133-3797c19254f5?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-room-speaker",
    name: "Pulse Room Speaker",
    price: 159,
    category: "speakers",
    tag: "Home audio",
    image: "https://images.unsplash.com/photo-1727061181133-3797c19254f5?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-mini-speaker",
    name: "Pulse Mini Speaker",
    price: 79,
    category: "speakers",
    tag: "Compact",
    image: "https://images.unsplash.com/photo-1727061181133-3797c19254f5?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-party-speaker",
    name: "Pulse Party Speaker",
    price: 229,
    category: "speakers",
    tag: "Party pick",
    image: "https://images.unsplash.com/photo-1727061181133-3797c19254f5?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-stereo-speaker",
    name: "Pulse Stereo Speaker",
    price: 289,
    category: "speakers",
    tag: "Premium",
    image: "https://images.unsplash.com/photo-1727061181133-3797c19254f5?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-air-01",
    name: "Pulse Air 01 Earphones",
    price: 59,
    category: "earbuds",
    tag: "Everyday",
    image: "https://images.unsplash.com/photo-1686554825516-2a3dfb4ca93d?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-air-02",
    name: "Pulse Air 02 Earphones",
    price: 69,
    category: "earbuds",
    tag: "New",
    image: "https://images.unsplash.com/photo-1686554825516-2a3dfb4ca93d?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-air-03",
    name: "Pulse Air 03 Earphones",
    price: 79,
    category: "earbuds",
    tag: "Best seller",
    image: "https://images.unsplash.com/photo-1686554825516-2a3dfb4ca93d?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-air-04",
    name: "Pulse Air 04 Earphones",
    price: 99,
    category: "earbuds",
    tag: "Pro sound",
    image: "https://images.unsplash.com/photo-1686554825516-2a3dfb4ca93d?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-air-05",
    name: "Pulse Air 05 Earphones",
    price: 119,
    category: "earbuds",
    tag: "Premium",
    image: "https://images.unsplash.com/photo-1686554825516-2a3dfb4ca93d?auto=format&fit=crop&fm=jpg&q=82&w=1000",
  },
  {
    id: "pulse-mixer-pro",
    name: "Pulse Studio Mixer",
    price: 299,
    category: "studio",
    tag: "Pro setup",
    image: "https://images.unsplash.com/photo-1624269797847-1825704dd05a?auto=format&fit=crop&fm=jpg&q=82&w=1200",
  },
  {
    id: "pulse-dj-deck",
    name: "Pulse DJ Deck",
    price: 399,
    category: "studio",
    tag: "DJ gear",
    image: "https://images.unsplash.com/photo-1642784352365-9cd3b81cdfbc?auto=format&fit=crop&fm=jpg&q=82&w=1200",
  },
  {
    id: "pulse-monitor-headphones",
    name: "Pulse Monitor Headphones",
    price: 189,
    category: "headphones",
    tag: "Studio",
    image: "https://images.unsplash.com/photo-1587311865307-b564f4af6e1b?auto=format&fit=crop&fm=jpg&q=82&w=1200",
  },
  {
    id: "pulse-classic-headphones",
    name: "Pulse Classic Headphones",
    price: 129,
    category: "headphones",
    tag: "Classic",
    image: "https://images.unsplash.com/photo-1557256080-c76847e4e52a?auto=format&fit=crop&fm=jpg&q=82&w=1200",
  },
  {
    id: "pulse-green-headphones",
    name: "Pulse Green Headphones",
    price: 159,
    category: "headphones",
    tag: "Fresh drop",
    image: "https://images.unsplash.com/photo-1752055831529-669caee003c3?auto=format&fit=crop&fm=jpg&q=82&w=1200",
  },
  {
    id: "pulse-turntable-pro",
    name: "Pulse Turntable Pro",
    price: 349,
    category: "studio",
    tag: "Vinyl studio",
    image: "https://images.unsplash.com/photo-1642784352365-9cd3b81cdfbc?auto=format&fit=crop&fm=jpg&q=82&w=1200",
  },
];

function PulseMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700 shadow-lg shadow-blue-500/20">
      <div className="flex items-end gap-0.5">
        {[8, 14, 20, 12, 7].map((height, index) => (
          <span key={index} className="w-1 rounded-full bg-white" style={{ height }} />
        ))}
      </div>
    </div>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function PulseAudioDemo() {
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const cartProducts = useMemo(() => products.filter((product) => cart.includes(product.id)), [cart]);
  const visibleProducts = useMemo(
    () => category === "all" ? products : products.filter((product) => product.category === category),
    [category],
  );
  const total = cartProducts.reduce((sum, product) => sum + product.price, 0);

  const addToCart = (id: string) => {
    setCart((current) => current.includes(id) ? current : [...current, id]);
  };

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/demo/pulse-audio" className="flex items-center gap-3">
            <PulseMark />
            <div>
              <div className="text-sm font-black tracking-[0.22em]">PULSE</div>
              <div className="text-[9px] font-semibold tracking-[0.38em] text-cyan-400">AUDIO</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
            <a href="#shop" className="hover:text-white">Shop</a>
            <a href="#categories" className="hover:text-white">Categories</a>
            <a href="#about" className="hover:text-white">Why Pulse</a>
          </nav>
          <button onClick={() => setCartOpen(true)} className="relative rounded-full border border-white/15 p-2.5 hover:bg-white/10" aria-label="Open cart">
            <ShoppingBag className="h-5 w-5" />
            {cart.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">{cart.length}</span>}
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <img
            src="https://images.unsplash.com/photo-1752055831529-669caee003c3?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800"
            alt="Premium headphones"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070b] via-[#05070b]/90 to-[#05070b]/35" />
          <div className="relative mx-auto grid min-h-[620px] max-w-6xl gap-10 px-4 py-24 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">Pulse Audio</p>
              <h1 className="max-w-xl text-5xl font-black tracking-tight sm:text-7xl">Feel every beat.</h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/65">Premium audio gear for music lovers, creators and everyone who wants their sound to hit different.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#shop" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300">Shop the collection <ArrowRight className="h-4 w-4" /></a>
                <a href="#categories" className="rounded-full border border-white/20 px-6 py-3 font-bold hover:bg-white/10">Browse categories</a>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-xs text-white/50">
                <span>Free shipping over $100</span>
                <span>30-day returns</span>
                <span>Secure checkout</span>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Explore</p>
            <h2 className="mt-2 text-3xl font-black">Shop by category</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { name: "Headphones", value: "headphones", icon: Headphones },
              { name: "Earphones", value: "earbuds", icon: Music2 },
              { name: "Speakers", value: "speakers", icon: Speaker },
              { name: "Studio gear", value: "studio", icon: Mic2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.value} onClick={() => { setCategory(item.value); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.07]">
                  <Icon className="h-8 w-8 text-cyan-300" strokeWidth={1.5} />
                  <div className="mt-8 font-bold">{item.name}</div>
                  <div className="mt-1 text-xs text-white/40">Explore collection →</div>
                </button>
              );
            })}
          </div>
        </section>

        <section id="shop" className="mx-auto max-w-6xl px-4 pb-20">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Collection</p>
              <h2 className="mt-2 text-3xl font-black">Audio, your way.</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button key={item.value} onClick={() => setCategory(item.value)} className={"whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold " + (category === item.value ? "bg-white text-slate-950" : "border border-white/10 text-white/60 hover:text-white")}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => {
              const inCart = cart.includes(product.id);
              return (
                <article key={product.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">{product.tag}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">{product.category}</p>
                    <h3 className="mt-1 font-bold">{product.name}</h3>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xl font-black">{money(product.price)}</p>
                      <button onClick={() => addToCart(product.id)} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">
                        {inCart ? "Added" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="about" className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-3">
            {[
              ["01", "Built for sound", "Carefully selected audio gear for everyday listening, travel and studio sessions."],
              ["02", "Made to look good", "A premium storefront experience with bold photography, clean spacing and a modern dark aesthetic."],
              ["03", "Shop with confidence", "Clear pricing in USD, simple categories, a cart experience and a polished mobile layout."],
            ].map(([number, title, body]) => (
              <div key={number} className="rounded-3xl border border-white/10 bg-black/20 p-7">
                <div className="text-xs font-bold text-cyan-400">{number}</div>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/50">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-sm text-white/40">This is a live SellUrWay storefront demo.</p>
          <Link to="/" className="mt-3 inline-block text-sm font-semibold text-cyan-300 hover:underline">Build your own store with SellUrWay →</Link>
        </section>
      </main>

      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/70" onClick={() => setCartOpen(false)} aria-label="Close cart" />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-[#080b11] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Your cart</h2>
              <button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close cart"><X className="h-5 w-5" /></button>
            </div>
            {cartProducts.length === 0 ? (
              <p className="mt-10 text-sm text-white/50">Your cart is empty.</p>
            ) : (
              <>
                <div className="mt-8 space-y-3">
                  {cartProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
                      <img src={product.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{product.name}</div><div className="text-sm text-cyan-300">{money(product.price)}</div></div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 font-bold"><span>Total</span><span>{money(total)}</span></div>
                <button className="mt-5 w-full rounded-xl bg-cyan-400 py-3 font-black text-slate-950">Demo checkout</button>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
