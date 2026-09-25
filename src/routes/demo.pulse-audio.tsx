import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Headphones, Mic2, Music2, ShoppingBag, Speaker, X } from "lucide-react";

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

const products = [
  { id: "pulse-pro-headphones", name: "Pulse Pro Headphones", price: 1499, icon: Headphones, tone: "from-blue-600 via-cyan-500 to-slate-900", tag: "Best seller" },
  { id: "pulse-air-buds", name: "Pulse Air Buds", price: 899, icon: Music2, tone: "from-violet-600 via-fuchsia-500 to-slate-900", tag: "New" },
  { id: "pulse-boom-speaker", name: "Pulse Boom Speaker", price: 1299, icon: Speaker, tone: "from-sky-500 via-blue-700 to-slate-950", tag: "Popular" },
  { id: "pulse-studio-mic", name: "Pulse Studio Mic", price: 1099, icon: Mic2, tone: "from-indigo-500 via-blue-600 to-slate-950", tag: "Creator pick" },
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
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value);
}

function PulseAudioDemo() {
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const cartProducts = useMemo(() => products.filter((product) => cart.includes(product.id)), [cart]);
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
          <button onClick={() => setCartOpen(true)} className="relative rounded-full border border-white/15 p-2.5 hover:bg-white/10" aria-label="Open cart">
            <ShoppingBag className="h-5 w-5" />
            {cart.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">{cart.length}</span>}
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(14,165,233,.28),transparent_35%),radial-gradient(circle_at_20%_70%,rgba(37,99,235,.2),transparent_35%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-cyan-400">Pulse Audio</p>
              <h1 className="max-w-xl text-5xl font-black tracking-tight sm:text-7xl">Feel every beat.</h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-white/60">Premium headphones, earbuds, speakers and creator gear built for music that moves you.</p>
              <a href="#shop" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300">Shop the collection</a>
            </div>
            <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-950 via-slate-900 to-black shadow-2xl shadow-blue-950/50">
              <div className="absolute h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
              <Headphones className="relative h-40 w-40 text-cyan-300 drop-shadow-[0_0_35px_rgba(34,211,238,.45)]" strokeWidth={1.2} />
            </div>
          </div>
        </section>

        <section id="shop" className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Shop</p>
            <h2 className="mt-2 text-3xl font-black">Audio, your way.</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const Icon = product.icon;
              const inCart = cart.includes(product.id);
              return (
                <article key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                  <div className={"relative flex aspect-square items-center justify-center bg-gradient-to-br " + product.tone}>
                    <span className="absolute left-3 top-3 rounded-full bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{product.tag}</span>
                    <Icon className="h-24 w-24 text-white/90" strokeWidth={1.1} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="mt-2 text-lg font-black text-cyan-300">{money(product.price)}</p>
                    <button onClick={() => addToCart(product.id)} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">
                      {inCart ? "Added to cart" : "Add to cart"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-6xl px-4 py-14 text-center">
            <p className="text-sm text-white/50">This is a live SellUrWay storefront demo.</p>
            <Link to="/" className="mt-3 inline-block text-sm font-semibold text-cyan-300 hover:underline">Build your own store with SellUrWay →</Link>
          </div>
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
                  {cartProducts.map((product) => <div key={product.id} className="flex items-center justify-between rounded-xl border border-white/10 p-4"><span className="text-sm font-semibold">{product.name}</span><span className="text-sm text-cyan-300">{money(product.price)}</span></div>)}
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
