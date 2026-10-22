import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Heart, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, Star, X } from "lucide-react";

export const Route = createFileRoute("/demo/luxe-jewellery")({
  head: () => ({
    meta: [
      { title: "AURELLE — Jewellery That Becomes Your Story | SellUrWay Demo" },
      { name: "description", content: "Discover timeless gold jewellery, elegant everyday pieces and meaningful gifts at AURELLE. A premium SellUrWay jewellery storefront concept." },
      { property: "og:title", content: "AURELLE — Jewellery That Becomes Your Story" },
      { property: "og:description", content: "Quiet luxury. Everyday sparkle. Discover the AURELLE collection." },
    ],
  }),
  component: AurelleDemo,
});

type Product = { id: string; name: string; detail: string; price: number; category: string; image: string; tag?: string };

const imageFallback = "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85";
const products: Product[] = [
  { id: "gold-hoops", name: "The Everyday Hoops", detail: "Gold-tone · timeless essentials", price: 649, category: "Earrings", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85", tag: "Bestseller" },
  { id: "sol-necklace", name: "Sol Pendant Necklace", detail: "A little light, wherever you go", price: 890, category: "Necklaces", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85", tag: "Loved" },
  { id: "pearl-drops", name: "Pearl Drop Earrings", detail: "Soft lustre · occasion-ready", price: 720, category: "Earrings", image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85" },
  { id: "layered-chain", name: "The Layered Chain", detail: "Delicate layers · effortless style", price: 1_090, category: "Necklaces", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85", tag: "New in" },
  { id: "signet-ring", name: "Mini Signet Ring", detail: "A personal touch · made to stack", price: 580, category: "Rings", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=85" },
  { id: "cuff-bracelet", name: "Sculpted Cuff", detail: "A bold little finishing touch", price: 950, category: "Bracelets", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1000&q=85", tag: "Statement piece" },
];

const money = (amount: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amount);

function SafeImage({ src, alt, className, loading = "lazy" }: { src: string; alt: string; className: string; loading?: "eager" | "lazy" }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  return <img src={currentSrc} alt={alt} loading={loading} onError={() => { if (currentSrc !== imageFallback) setCurrentSrc(imageFallback); }} className={className} />;
}

function AurelleDemo() {
  const [category, setCategory] = useState("All pieces");
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const categories = ["All pieces", "Earrings", "Necklaces", "Rings", "Bracelets"];
  const visibleProducts = useMemo(() => products.filter((p) => category === "All pieces" || p.category === category), [category]);
  const cartProducts = cart.map((line) => ({ ...line, product: products.find((p) => p.id === line.id)! })).filter((line) => line.product);
  const total = cartProducts.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const add = (id: string) => {
    setCart((current) => current.some((line) => line.id === id) ? current.map((line) => line.id === id ? { ...line, qty: line.qty + 1 } : line) : [...current, { id, qty: 1 }]);
    setNotice("Beautiful choice — added to your bag.");
    window.setTimeout(() => setNotice(""), 2200);
  };
  const changeQty = (id: string, delta: number) => setCart((current) => current.map((line) => line.id === id ? { ...line, qty: line.qty + delta } : line).filter((line) => line.qty > 0));

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f5ef] text-[#25231f]">
      <div className="bg-[#272720] px-4 py-2.5 text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-[#e8d6b2] sm:text-[10px]">A little something beautiful · Complimentary delivery over R1,500</div>
      <header className="sticky top-0 z-40 border-b border-[#e7e0d4] bg-[#f8f5ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-4 sm:px-8">
          <button className="rounded-full p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#b69b68] text-[#9c7c42]"><Sparkles size={20} strokeWidth={1.5} /></span>
            <span><span className="block text-[21px] font-medium leading-none tracking-[0.19em] sm:text-2xl">AURELLE</span><span className="mt-1.5 block text-[7px] font-medium uppercase tracking-[0.31em] text-[#8b806e]">Jewellery with meaning</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-[10px] font-semibold uppercase tracking-[0.18em] md:flex"><a href="#collection" className="transition hover:text-[#a1834d]">Shop the collection</a><a href="#craft" className="transition hover:text-[#a1834d]">Our philosophy</a><a href="#gifting" className="transition hover:text-[#a1834d]">The art of gifting</a></nav>
          <div className="flex items-center gap-1 sm:gap-3"><a href="#collection" aria-label="Search collection" className="hidden rounded-full p-3 transition hover:bg-[#eee7dc] sm:block"><Search size={17} strokeWidth={1.5} /></a><button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-full border border-[#d9cdbb] px-3 py-3 transition hover:bg-[#eee7dc] sm:px-4" aria-label="Open shopping bag"><ShoppingBag size={17} strokeWidth={1.5} /><span className="hidden text-[9px] font-semibold uppercase tracking-wider sm:inline">Bag</span>{count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a1834d] px-1 text-[10px] font-bold text-white">{count}</span>}</button></div>
        </div>
        {menuOpen && <nav className="grid gap-1 border-t border-[#e7e0d4] px-5 py-4 text-[10px] font-semibold uppercase tracking-widest md:hidden"><a href="#collection" onClick={() => setMenuOpen(false)} className="py-3">Shop the collection</a><a href="#craft" onClick={() => setMenuOpen(false)} className="py-3">Our philosophy</a><a href="#gifting" onClick={() => setMenuOpen(false)} className="py-3">The art of gifting</a></nav>}
      </header>

      <main id="top">
        <section className="mx-auto max-w-[1440px] px-3 pt-3 sm:px-6 sm:pt-6">
          <div className="relative grid min-h-[570px] overflow-hidden bg-[#e8e0d2] sm:min-h-[660px] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative z-10 flex items-center px-6 py-14 sm:px-12 sm:py-16 lg:px-16 xl:px-20">
              <div className="max-w-lg">
                <p className="mb-6 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#8b744d]"><span className="h-px w-8 bg-[#a1834d]" /> The everyday, elevated</p>
                <h1 className="font-serif text-[58px] font-normal leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[82px]">A little<br />gold. A lot<br /><span className="italic text-[#98774a]">of meaning.</span></h1>
                <p className="mt-7 max-w-sm text-sm leading-7 text-[#696052] sm:text-base">Jewellery for the moments that make you — and the memories you keep close. Discover timeless pieces made to be worn, loved and passed on.</p>
                <div className="mt-8 flex flex-wrap gap-3"><a href="#collection" className="inline-flex items-center gap-4 bg-[#292920] px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#a1834d]">Discover the collection <ArrowRight size={15} /></a><a href="#craft" className="inline-flex items-center gap-2 border border-[#b7a88e] px-5 py-4 text-[9px] font-semibold uppercase tracking-[0.16em] transition hover:bg-white/40">Our story</a></div>
                <div className="mt-9 flex items-center gap-3"><div className="flex gap-0.5 text-[#a1834d]">{[1,2,3,4,5].map((n) => <Star key={n} size={12} fill="currentColor" strokeWidth={1} />)}</div><p className="text-[9px] font-medium tracking-wide text-[#716858]">Thoughtful details. Lasting impressions.</p></div>
              </div>
            </div>
            <div className="relative min-h-[350px] overflow-hidden bg-[#c8b79b] lg:min-h-full">
              <SafeImage src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1400&q=90" alt="Elegant gold jewellery styled in warm natural light" loading="eager" className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#e8e0d2]/30 via-transparent to-[#30271c]/10" />
              <div className="absolute bottom-6 right-5 max-w-[200px] border border-white/60 bg-[#f8f5ef]/90 p-4 backdrop-blur-sm sm:bottom-10 sm:right-10 sm:max-w-[230px] sm:p-5"><p className="text-[8px] uppercase tracking-[0.22em] text-[#8a754f]">The signature edit</p><p className="mt-2 font-serif text-2xl italic">Wear your story.</p><a href="#collection" className="mt-3 inline-flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.16em]">Explore pieces <ArrowRight size={12} /></a></div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[#e5ddcf] px-3 py-10 sm:grid-cols-4 sm:px-8 sm:py-14">
          {[["01","Everyday elegance","Pieces you'll reach for"],["02","Meaningful gifting","A moment in a box"],["03","Made to be layered","Make it your own"],["04","Thoughtful details","The beauty is in them"]].map(([n,title,body]) => <div key={title} className="bg-[#f8f5ef] px-4 py-5 sm:px-6 sm:py-7"><span className="text-[9px] tracking-[0.18em] text-[#a1834d]">{n} /</span><h2 className="mt-3 font-serif text-lg sm:text-xl">{title}</h2><p className="mt-2 text-[10px] leading-5 text-[#8b806e] sm:text-xs">{body}</p></div>)}
        </section>

        <section id="collection" className="bg-[#f0ebe1] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#9a7b48]">The AURELLE collection</p><h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] sm:text-6xl">Pieces to keep close.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#766e60]">The finishing touch, the everyday favourite, the gift they'll remember. Find the piece that feels like you.</p></div><span className="w-fit border-b border-[#b9a681] pb-2 text-[9px] font-medium uppercase tracking-[0.2em]">Designed for your moments</span></div>
            <div className="mb-8 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={"whitespace-nowrap border px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] transition " + (category === item ? "border-[#292920] bg-[#292920] text-white" : "border-[#d3c8b6] bg-transparent hover:border-[#292920]")}>{item}</button>)}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
              {visibleProducts.map((product) => { const isSaved = saved.includes(product.id); return <article key={product.id} className="group">
                <div className="relative aspect-[4/4.7] overflow-hidden bg-[#e2d8c8]"><SafeImage src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />{product.tag && <span className="absolute left-3 top-3 bg-[#f8f5ef]/95 px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.14em] sm:left-4 sm:top-4">{product.tag}</span>}<button onClick={() => setSaved((current) => isSaved ? current.filter((id) => id !== product.id) : [...current, product.id])} aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f5ef]/90 transition hover:bg-white sm:right-4 sm:top-4">{isSaved ? <Heart size={16} fill="currentColor" /> : <Heart size={16} strokeWidth={1.5} />}</button><button onClick={() => add(product.id)} className="absolute bottom-3 left-3 right-3 hidden items-center justify-center gap-2 bg-[#292920] py-4 text-[9px] font-semibold uppercase tracking-[0.17em] text-white transition hover:bg-[#a1834d] sm:flex sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">Add to bag <Plus size={14} /></button><button onClick={() => add(product.id)} className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f8f5ef] text-[#292920] sm:hidden" aria-label={"Add " + product.name + " to bag"}><Plus size={18} /></button></div>
                <div className="flex items-start justify-between gap-2 px-1 pt-4"><div><h3 className="font-serif text-base sm:text-lg">{product.name}</h3><p className="mt-1.5 text-[9px] leading-4 text-[#898071] sm:text-[11px]">{product.detail}</p></div><p className="shrink-0 pt-0.5 text-xs font-semibold sm:text-sm">{money(product.price)}</p></div>
              </article>; })}
            </div>
            <p className="mt-9 text-center text-[9px] text-[#9a8f7e]">Illustrative collection and prices for this demo storefront.</p>
          </div>
        </section>

        <section id="craft" className="mx-auto grid max-w-[1440px] overflow-hidden bg-[#292920] text-[#f8f5ef] md:grid-cols-2">
          <div className="relative min-h-[360px] bg-[#b7a58a] sm:min-h-[500px]"><SafeImage src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=85" alt="Detailed jewellery pieces" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute bottom-5 left-5 border border-white/70 bg-[#292920]/85 px-5 py-4 sm:bottom-8 sm:left-8"><p className="text-[8px] uppercase tracking-[0.2em] text-[#d4b77e]">The AURELLE approach</p><p className="mt-1 font-serif text-xl italic">Less, but more meaningful.</p></div></div>
          <div className="flex items-center px-6 py-14 sm:px-12 sm:py-20 lg:px-20"><div className="max-w-xl"><p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#d4b77e]">Our philosophy</p><h2 className="mt-5 font-serif text-5xl leading-[0.98] tracking-[-0.045em] sm:text-7xl">Not just<br />something you<br /><span className="italic text-[#d4b77e]">wear.</span></h2><p className="mt-6 text-sm leading-7 text-white/65">It's the necklace you never take off. The earrings you wore on your big day. The ring that reminds you of someone special. We believe jewellery should mean something — and fit beautifully into your real life.</p><p className="mt-4 text-sm leading-7 text-white/65">Choose your favourite, layer it your way, and make it part of your story.</p><a href="#collection" className="mt-8 inline-flex items-center gap-3 border border-[#c7ad7d] px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.18em] transition hover:bg-[#d4b77e] hover:text-[#292920]">Find your piece <ArrowRight size={14} /></a></div></div>
        </section>

        <section id="gifting" className="px-4 py-16 text-center sm:px-8 sm:py-24"><p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#9a7b48]">For the ones who mean everything</p><h2 className="mx-auto mt-5 max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.05em] sm:text-7xl">Some gifts say it<br /><span className="italic text-[#98774a]">without a word.</span></h2><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#766e60]">Birthdays, new beginnings, thank-yous, or simply “I thought of you”. Find a piece that makes the moment last a little longer.</p><a href="#collection" className="mt-8 inline-flex items-center gap-3 bg-[#292920] px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.19em] text-white transition hover:bg-[#a1834d]">Find a meaningful gift <ArrowRight size={14} /></a></section>
      </main>

      <footer className="bg-[#22231d] px-5 py-10 text-white sm:px-8 sm:py-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><a href="#top" className="font-serif text-3xl tracking-[0.18em]">AURELLE</a><p className="mt-3 text-[8px] font-medium uppercase tracking-[0.24em] text-white/45">Jewellery with meaning</p></div><div className="text-[10px] leading-6 text-white/55"><p>Concept storefront powered by SellUrWay</p><Link to="/" className="mt-1 inline-flex items-center gap-2 font-semibold text-[#d4b77e] hover:text-white">Build your own store <ArrowRight size={13} /></Link></div></div><div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-4 text-[9px] text-white/35">© {new Date().getFullYear()} AURELLE demo storefront · A SellUrWay concept.</div></footer>

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 -translate-x-1/2 rounded-full bg-[#292920] px-5 py-3 text-xs font-medium text-white shadow-xl"><Check size={15} className="mr-2 inline text-[#d4b77e]" />{notice}</div>}
      {cartOpen && <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-black/55" onClick={() => setCartOpen(false)} aria-label="Close bag" /><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f8f5ef] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between border-b border-[#e2d9ca] pb-5"><div><p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#9a7b48]">A piece picked just for you</p><h2 className="mt-1 font-serif text-2xl">Your bag ({count})</h2></div><button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-[#eee7dc]" aria-label="Close bag"><X size={20} /></button></div><div className="flex-1 overflow-y-auto py-5">{cartProducts.length === 0 ? <div className="py-16 text-center"><ShoppingBag size={30} className="mx-auto text-[#a1834d]" /><p className="mt-4 text-sm text-[#766e60]">Your bag is waiting for something beautiful.</p><button onClick={() => setCartOpen(false)} className="mt-5 bg-[#292920] px-5 py-3 text-[9px] font-semibold uppercase tracking-widest text-white">Explore the collection</button></div> : <div className="space-y-4">{cartProducts.map(({ id, qty, product }) => <div key={id} className="flex gap-3 border-b border-[#e2d9ca] pb-4"><SafeImage src={product.image} alt="" className="h-24 w-20 object-cover" /><div className="flex-1"><h3 className="font-serif text-base">{product.name}</h3><p className="mt-1 text-xs font-semibold">{money(product.price)}</p><div className="mt-3 inline-flex items-center gap-3 border border-[#d8cdbb] px-2 py-1"><button onClick={() => changeQty(id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span className="text-xs font-semibold">{qty}</span><button onClick={() => changeQty(id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><p className="text-sm font-semibold">{money(product.price * qty)}</p></div>)}</div>}</div>{cartProducts.length > 0 && <div className="border-t border-[#e2d9ca] pt-5"><div className="flex items-center justify-between"><span className="text-[9px] font-semibold uppercase tracking-widest">Subtotal</span><span className="text-lg font-semibold">{money(total)}</span></div><p className="mt-2 text-[10px] leading-5 text-[#898071]">Checkout and delivery are not connected in this demo.</p><button onClick={() => setNotice("Demo only — checkout is not connected yet")} className="mt-5 w-full bg-[#292920] py-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#a1834d]">Continue to checkout <ArrowRight size={14} className="ml-2 inline" /></button></div>}</aside></div>}
    </div>
  );
}
