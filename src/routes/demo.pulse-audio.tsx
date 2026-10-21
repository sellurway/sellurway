import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, Heart, Menu, Search, ShoppingBag, Star, X } from "lucide-react";

export const Route = createFileRoute("/demo/pulse-audio")({
  head: () => ({
    meta: [
      { title: "Modern Mbadada — Chase the Sun | SellUrWay Demo" },
      { name: "description", content: "A premium South African streetwear and footwear storefront concept inspired by Modern Mbadada, powered by SellUrWay." },
      { rel: "canonical", href: "https://sellurway.vercel.app/demo/pulse-audio" },
      { property: "og:title", content: "Modern Mbadada — Chase the Sun" },
      { property: "og:description", content: "South African heritage. Modern streetwear. A SellUrWay storefront concept." },
    ],
  }),
  component: ModernMbadadaDemo,
});

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  tag?: string;
  image: string;
  colour: string;
};

const products: Product[] = [
  { id: "chukka-black", name: "Make My Shoe — Chukka", category: "Sneakers", price: 1499, tag: "Bestseller", colour: "Black", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1100&q=85" },
  { id: "x202-tan", name: "X202 — Everyday Classic", category: "Sneakers", price: 1299, tag: "Made to move", colour: "Tan", image: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1100&q=85" },
  { id: "igoduka-traveller", name: "Igoduka — Traveller", category: "Footwear", price: 2699, tag: "Statement piece", colour: "Earth", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1100&q=85" },
  { id: "signature-tee", name: "Signature T-Shirt", category: "Clothing", price: 299, tag: "Everyday essential", colour: "Black", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1100&q=85" },
  { id: "golfer", name: "Modern Golfer", category: "Clothing", price: 499, colour: "Cream", image: "https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1100&q=85" },
  { id: "signature-cap", name: "Chase the Sun Cap", category: "Accessories", price: 199, oldPrice: 350, tag: "Special price", colour: "Black", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1100&q=85" },
];

const categories = ["All", "Sneakers", "Footwear", "Clothing", "Accessories"];
const zar = (amount: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amount);

function ModernMbadadaDemo() {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesSearch = (product.name + " " + product.category + " " + product.colour).toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [category, search]);

  const cartProducts = useMemo(() => cart.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product)), [cart]);
  const total = cartProducts.reduce((sum, product) => sum + product.price, 0);

  const addToCart = (product: Product) => {
    setCart((current) => [...current, product.id]);
    setNotice(product.name + " added to your bag");
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#191a17]">
      <div className="bg-[#d9f36a] px-4 py-2 text-center text-[10px] font-extrabold uppercase tracking-[0.2em] sm:text-xs">
        Chase the Sun · South African roots, worldwide energy · Shop the new season
      </div>

      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f7f5ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-7">
          <button className="rounded-full p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
          <Link to="/demo/pulse-audio" className="leading-none">
            <span className="block text-lg font-black uppercase tracking-[-0.08em] sm:text-2xl">MODERN</span>
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.32em] sm:text-xs">MBADADA®</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[11px] font-bold uppercase tracking-[0.14em] md:flex">
            <a href="#shop" className="hover:opacity-60">Shop all</a>
            <button onClick={() => { setCategory("Sneakers"); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:opacity-60">Sneakers</button>
            <button onClick={() => { setCategory("Clothing"); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:opacity-60">Clothing</button>
            <a href="#story" className="hover:opacity-60">Our story</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={() => setSearchOpen(!searchOpen)} className="rounded-full p-2.5 hover:bg-black/5" aria-label="Search products"><Search size={19} /></button>
            <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-full p-2.5 hover:bg-black/5" aria-label="Open shopping bag">
              <ShoppingBag size={19} /><span className="hidden text-[10px] font-bold uppercase tracking-widest sm:inline">Bag</span>
              {cart.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d9f36a] px-1 text-[10px] font-black">{cart.length}</span>}
            </button>
          </div>
        </div>
        {searchOpen && <div className="border-t border-black/10 px-4 py-3"><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sneakers, clothing, accessories..." className="mx-auto block w-full max-w-7xl bg-transparent px-2 py-2 text-sm outline-none placeholder:text-black/40" /></div>}
        {menuOpen && <nav className="grid gap-1 border-t border-black/10 px-5 py-4 text-xs font-bold uppercase tracking-widest md:hidden"><a href="#shop" onClick={() => setMenuOpen(false)} className="py-3">Shop all</a><a href="#story" onClick={() => setMenuOpen(false)} className="py-3">Our story</a></nav>}
      </header>

      <main>
        <section className="relative isolate min-h-[620px] overflow-hidden bg-[#24251f] text-white sm:min-h-[700px]">
          <img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=2200&q=90" alt="Contemporary streetwear collection" className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-70" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/40 to-black/5" />
          <div className="mx-auto flex min-h-[620px] max-w-7xl items-end px-5 pb-14 pt-24 sm:min-h-[700px] sm:items-center sm:px-10 sm:pb-20">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 border border-white/40 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.24em] sm:text-[10px]"><span className="h-2 w-2 rounded-full bg-[#d9f36a]" /> Rooted here. Ready everywhere.</div>
              <h1 className="max-w-2xl text-6xl font-black uppercase leading-[0.88] tracking-[-0.075em] sm:text-8xl lg:text-[104px]">Chase<br />the sun<span className="text-[#d9f36a]">.</span></h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/80 sm:text-base">A new expression of South African heritage. Everyday pieces, bold footwear and streetwear made for your own kind of journey.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#shop" className="inline-flex items-center gap-3 bg-[#d9f36a] px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-white">Shop the collection <ArrowRight size={16} /></a>
                <a href="#story" className="inline-flex items-center border border-white/60 px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] transition hover:bg-white hover:text-black">Our story</a>
              </div>
              <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.24em] text-white/60">Designed with heritage. Styled for right now.</p>
            </div>
          </div>
          <div className="absolute bottom-7 right-7 hidden text-right text-[9px] font-bold uppercase tracking-[0.22em] text-white/70 md:block">South Africa<br />Since the beginning</div>
        </section>

        <section className="border-b border-black/10 bg-[#eae8df]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-black/10 px-4 py-5 sm:grid-cols-4 sm:px-7">
            {[["01", "Heritage in every detail"], ["02", "Made for everyday"], ["03", "Nationwide delivery"], ["04", "Secure checkout concept"]].map(([num, label]) => <div key={num} className="flex items-center gap-3 px-3 py-3 sm:px-5"><span className="text-[10px] font-black text-black/40">{num}</span><span className="text-[9px] font-extrabold uppercase leading-4 tracking-[0.12em] sm:text-[10px]">{label}</span></div>)}
          </div>
        </section>

        <section id="shop" className="mx-auto max-w-7xl px-4 py-16 sm:px-7 sm:py-24">
          <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/50">The edit / 001</p><h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[-0.06em] sm:text-6xl">Wear your story.</h2><p className="mt-3 max-w-md text-sm leading-6 text-black/60">The pieces you reach for. The ones that say something without saying a word.</p></div>
            <a href="#story" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] underline decoration-1 underline-offset-4">Discover Modern Mbadada <ArrowRight size={14} /></a>
          </div>
          <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={"whitespace-nowrap border px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] transition " + (category === item ? "border-black bg-black text-white" : "border-black/20 bg-transparent hover:border-black")}>{item}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-3">
            {visibleProducts.map((product, index) => {
              const isSaved = saved.includes(product.id);
              return <article key={product.id} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#e7e4db]">
                  <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                  {product.tag && <span className="absolute left-3 top-3 bg-[#d9f36a] px-2.5 py-2 text-[8px] font-black uppercase tracking-[0.12em] sm:left-4 sm:top-4 sm:text-[9px]">{product.tag}</span>}
                  <button onClick={() => setSaved((current) => isSaved ? current.filter((id) => id !== product.id) : [...current, product.id])} aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f5ef]/90 transition hover:bg-white sm:right-4 sm:top-4">{isSaved ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}</button>
                  <button onClick={() => addToCart(product)} className="absolute bottom-0 left-0 right-0 flex translate-y-full items-center justify-between bg-[#d9f36a] px-4 py-4 text-[9px] font-black uppercase tracking-[0.16em] transition-transform duration-300 group-hover:translate-y-0 focus:translate-y-0">Add to bag <ArrowRight size={15} /></button>
                  <button onClick={() => addToCart(product)} className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#d9f36a] text-black sm:hidden" aria-label={"Add " + product.name + " to bag"}><ShoppingBag size={16} /></button>
                </div>
                <div className="flex items-start justify-between gap-2 pt-4">
                  <div><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-black/45 sm:text-[9px]">{product.category} · {product.colour}</p><h3 className="mt-1.5 text-xs font-extrabold leading-5 sm:text-sm">{product.name}</h3>{product.oldPrice && <p className="mt-1 text-[10px] font-bold text-black/40 line-through">{zar(product.oldPrice)}</p>}</div>
                  <p className="shrink-0 text-xs font-black sm:text-sm">{zar(product.price)}</p>
                </div>
              </article>;
            })}
          </div>
          {visibleProducts.length === 0 && <p className="py-16 text-center text-sm text-black/60">No products found. Try another search or category.</p>}
          <div className="mt-12 text-center"><button onClick={() => { setCategory("All"); setSearch(""); }} className="border border-black px-7 py-4 text-[9px] font-black uppercase tracking-[0.2em] transition hover:bg-black hover:text-white">View all pieces <ChevronDown size={14} className="ml-2 inline" /></button></div>
        </section>

        <section id="story" className="grid bg-[#20211d] text-white md:grid-cols-2">
          <div className="relative min-h-[380px] overflow-hidden sm:min-h-[540px]"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85" alt="Modern streetwear and self-expression" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" /></div>
          <div className="flex items-center px-6 py-14 sm:px-12 sm:py-20 lg:px-20">
            <div className="max-w-xl"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d9f36a]">More than a look</p><h2 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] sm:text-6xl">Our roots.<br />Our road.<br /><span className="text-[#d9f36a]">Our story.</span></h2><p className="mt-6 text-sm leading-7 text-white/65">Inspired by the ingenuity and spirit behind imbadada, Modern Mbadada brings a heritage classic into a new era. It's a celebration of home, ambition, self-expression and the journeys that shape us.</p><p className="mt-4 text-sm leading-7 text-white/65">From the everyday to the unforgettable, wear your story proudly — wherever the road takes you.</p><a href="#shop" className="mt-8 inline-flex items-center gap-3 bg-[#d9f36a] px-6 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-black hover:bg-white">Explore the collection <ArrowRight size={15} /></a></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-7 sm:py-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {[["01", "Rooted in culture", "A modern take on a story that belongs to home."], ["02", "Made to stand out", "Confident pieces for people who make their own lane."], ["03", "Ready for the journey", "A versatile edit for everyday plans and big moments."]].map(([num, title, body]) => <div key={num} className="border-t border-black/20 py-5"><p className="text-[9px] font-black tracking-[0.2em] text-black/40">{num} / THE PROMISE</p><h3 className="mt-4 text-lg font-black uppercase tracking-[-0.03em]">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-black/60">{body}</p></div>)}
          </div>
        </section>

        <section className="bg-[#d9f36a] px-4 py-14 text-center sm:py-20">
          <p className="text-[9px] font-black uppercase tracking-[0.25em]">Your next chapter starts here</p><h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] sm:text-6xl">Find your fit.<br />Make it yours.</h2><a href="#shop" className="mt-7 inline-flex items-center gap-3 bg-black px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black">Shop the edit <ArrowRight size={15} /></a>
        </section>
      </main>

      <footer className="bg-[#191a17] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div><div className="text-2xl font-black uppercase tracking-[-0.08em]">MODERN MBADADA®</div><p className="mt-2 text-[9px] font-bold uppercase tracking-[0.24em] text-white/50">Chase the Sun · South Africa</p></div>
          <div className="text-[9px] font-bold uppercase leading-6 tracking-[0.15em] text-white/60"><p>Concept storefront powered by SellUrWay</p><Link to="/" className="mt-1 inline-flex items-center gap-2 text-[#d9f36a] hover:text-white">Build your own store <ArrowRight size={13} /></Link></div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-4 text-[9px] text-white/40">© {new Date().getFullYear()} Modern Mbadada concept · Product photography shown for demonstration.</div>
      </footer>

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 bg-black px-5 py-3 text-xs font-bold text-white shadow-xl"><Check size={15} className="mr-2 inline text-[#d9f36a]" />{notice}</div>}

      {cartOpen && <div className="fixed inset-0 z-50">
        <button className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} aria-label="Close bag" />
        <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f7f5ef] p-5 shadow-2xl sm:p-7">
          <div className="flex items-center justify-between border-b border-black/10 pb-5"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/50">Your selection</p><h2 className="mt-1 text-2xl font-black uppercase tracking-[-0.05em]">Shopping bag ({cart.length})</h2></div><button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-black/5" aria-label="Close bag"><X size={20} /></button></div>
          <div className="flex-1 overflow-y-auto py-5">
            {cartProducts.length === 0 ? <div className="py-16 text-center"><ShoppingBag size={28} className="mx-auto text-black/30" /><p className="mt-4 text-sm text-black/60">Your bag is waiting for something good.</p><button onClick={() => setCartOpen(false)} className="mt-5 border border-black px-5 py-3 text-[9px] font-black uppercase tracking-widest">Keep shopping</button></div> : <div className="space-y-4">{cartProducts.map((product, index) => <div key={product.id + index} className="flex gap-4 border-b border-black/10 pb-4"><img src={product.image} alt="" className="h-24 w-20 object-cover" /><div className="flex-1"><p className="text-[9px] font-bold uppercase tracking-widest text-black/45">{product.category}</p><h3 className="mt-1 text-sm font-extrabold">{product.name}</h3><p className="mt-2 text-sm font-black">{zar(product.price)}</p></div><button onClick={() => setCart((current) => { const next = [...current]; next.splice(index, 1); return next; })} className="self-start text-[9px] font-bold uppercase underline underline-offset-4">Remove</button></div>)}</div>}
          </div>
          {cartProducts.length > 0 && <div className="border-t border-black/15 pt-5"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span><span className="text-lg font-black">{zar(total)}</span></div><p className="mt-2 text-[10px] leading-5 text-black/50">Shipping and payment are not processed in this demonstration storefront.</p><button onClick={() => setNotice("Demo only — checkout is not connected")} className="mt-5 w-full bg-black py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#d9f36a] hover:text-black">Continue to checkout <ArrowRight size={15} className="ml-2 inline" /></button></div>}
        </aside>
      </div>}
    </div>
  );
}
