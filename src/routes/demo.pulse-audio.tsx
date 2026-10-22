import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Heart, IceCreamBowl, Menu, Minus, Plus, ShoppingBag, Sparkles, Star, X } from "lucide-react";

export const Route = createFileRoute("/demo/pulse-audio")({
  head: () => ({
    meta: [
      { title: "Scoop & Joy — Happiness by the Scoop | SellUrWay Demo" },
      { name: "description", content: "A colourful, premium ice cream shop concept with handcrafted flavours, sundaes, and sweet treats. Powered by SellUrWay." },
      { rel: "canonical", href: "https://sellurway.vercel.app/demo/pulse-audio" },
      { property: "og:title", content: "Scoop & Joy — Happiness by the Scoop" },
      { property: "og:description", content: "A little scoop of happy. Explore our handcrafted ice cream flavours." },
    ],
  }),
  component: ScoopAndJoyDemo,
});

type Product = { id: string; name: string; subtitle: string; price: number; category: string; image: string; color: string; tag?: string };

const products: Product[] = [
  { id: "strawberry-cloud", name: "Strawberry Cloud", subtitle: "Strawberry ripple · vanilla bean", price: 48, category: "Scoops", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=85", color: "#f8dce0", tag: "Bestseller" },
  { id: "choc-hazelnut", name: "Choc-a-Lot", subtitle: "Dark chocolate · roasted hazelnut", price: 52, category: "Scoops", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=85", color: "#e8d6c5", tag: "Fan favourite" },
  { id: "mango-sorbet", name: "Mango Tango", subtitle: "Sun-ripened mango · bright citrus", price: 45, category: "Scoops", image: "https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&w=900&q=85", color: "#f9e7b0", tag: "Dairy free" },
  { id: "waffle-sundae", name: "The Waffle Party", subtitle: "Warm waffle · three scoops · sauce", price: 89, category: "Sundaes", image: "https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=900&q=85", color: "#f4d7b7", tag: "Made for sharing" },
  { id: "cookie-dough", name: "Cookie Monster", subtitle: "Cookie dough · chocolate chips", price: 52, category: "Scoops", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=900&q=85", color: "#c9d9bc" },
  { id: "berry-milkshake", name: "Berry Blush Shake", subtitle: "Strawberry shake · whipped cream", price: 65, category: "Shakes", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=85", color: "#f1d3df", tag: "New" },
];

const money = (amount: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amount);

function ScoopAndJoyDemo() {
  const [category, setCategory] = useState("All treats");
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const categories = ["All treats", "Scoops", "Sundaes", "Shakes"];
  const visibleProducts = useMemo(() => products.filter((p) => category === "All treats" || p.category === category), [category]);
  const cartProducts = cart.map((line) => ({ ...line, product: products.find((p) => p.id === line.id)! })).filter((line) => line.product);
  const total = cartProducts.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const add = (id: string) => {
    setCart((current) => current.some((line) => line.id === id) ? current.map((line) => line.id === id ? { ...line, qty: line.qty + 1 } : line) : [...current, { id, qty: 1 }]);
    setNotice("A little happiness added to your bag!");
    window.setTimeout(() => setNotice(""), 2200);
  };
  const changeQty = (id: string, delta: number) => setCart((current) => current.map((line) => line.id === id ? { ...line, qty: line.qty + delta } : line).filter((line) => line.qty > 0));

  return (
    <div className="min-h-screen overflow-hidden bg-[#fffaf2] text-[#38241f]">
      <div className="bg-[#45291f] px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-white sm:text-xs">A little scoop of happy ✳ Free delivery on orders over R350</div>
      <header className="sticky top-0 z-40 border-b border-[#eadfd1] bg-[#fffaf2]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-4 sm:px-8">
          <button className="rounded-full p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 rotate-[-8deg] items-center justify-center rounded-[15px] bg-[#f6c94c] text-[#45291f]"><IceCreamBowl size={24} strokeWidth={2.4} /></span>
            <span><span className="block text-xl font-black leading-none tracking-[-0.07em] sm:text-2xl">scoop<span className="text-[#ed8a9a]">&</span>joy</span><span className="mt-1 block text-[8px] font-extrabold uppercase tracking-[0.24em] text-[#97766b]">Happiness by the scoop</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-[11px] font-extrabold uppercase tracking-[0.13em] md:flex"><a href="#menu" className="transition hover:text-[#e47d8f]">Our menu</a><a href="#story" className="transition hover:text-[#e47d8f]">Our little story</a><a href="#visit" className="transition hover:text-[#e47d8f]">Find us</a></nav>
          <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-full bg-[#f6c94c] px-3 py-3 transition hover:bg-[#f1b934] sm:px-5" aria-label="Open shopping bag"><ShoppingBag size={17} /><span className="hidden text-[10px] font-black uppercase tracking-wider sm:inline">Your treats</span>{count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#45291f] px-1 text-[10px] font-black text-white">{count}</span>}</button>
        </div>
        {menuOpen && <nav className="grid gap-1 border-t border-[#eadfd1] px-5 py-4 text-xs font-bold uppercase tracking-widest md:hidden"><a href="#menu" onClick={() => setMenuOpen(false)} className="py-3">Our menu</a><a href="#story" onClick={() => setMenuOpen(false)} className="py-3">Our little story</a><a href="#visit" onClick={() => setMenuOpen(false)} className="py-3">Find us</a></nav>}
      </header>

      <main id="top">
        <section className="relative mx-auto max-w-[1440px] px-3 pt-3 sm:px-6 sm:pt-6">
          <div className="relative grid min-h-[590px] overflow-hidden rounded-[26px] bg-[#f8dfe0] sm:min-h-[650px] sm:rounded-[36px] lg:grid-cols-[1.03fr_.97fr]">
            <div className="relative z-10 flex items-center px-6 py-12 sm:px-12 sm:py-16 lg:px-16 xl:px-20">
              <div className="max-w-xl">
                <div className="mb-6 inline-flex rotate-[-2deg] items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#7e4b43] sm:text-[10px]"><Sparkles size={14} className="text-[#e88b9b]" /> Scooped fresh, served with love</div>
                <h1 className="max-w-2xl text-[60px] font-black leading-[0.87] tracking-[-0.085em] sm:text-7xl lg:text-[84px] xl:text-[100px]">Life is<br />better with<br /><span className="relative inline-block text-[#dc778b]">sprinkles<span className="absolute -right-7 -top-5 rotate-12 text-3xl text-[#e8ad2c] sm:-right-10 sm:text-5xl">✳</span></span></h1>
                <p className="mt-6 max-w-md text-sm leading-7 text-[#76534a] sm:text-base">Small-batch scoops, big-time joy. Meet your new favourite flavour, made for sunny afternoons, little celebrations and “just because” moments.</p>
                <div className="mt-8 flex flex-wrap gap-3"><a href="#menu" className="inline-flex items-center gap-3 rounded-full bg-[#45291f] px-6 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#6d4234]">Explore the menu <ArrowRight size={16} /></a><a href="#story" className="inline-flex items-center gap-2 rounded-full border border-[#b9887b] px-6 py-4 text-[10px] font-black uppercase tracking-[0.14em] transition hover:bg-white/60">Meet your scoop crew</a></div>
                <div className="mt-9 flex items-center gap-3"><div className="flex -space-x-2">{["#ed8b9c","#f6ca4e","#b7c6a5"].map((c) => <span key={c} className="h-7 w-7 rounded-full border-2 border-[#f8dfe0]" style={{ backgroundColor: c }} />)}</div><div><div className="flex gap-0.5 text-[#e4a72b]">{[1,2,3,4,5].map((n) => <Star key={n} size={12} fill="currentColor" />)}</div><p className="mt-0.5 text-[9px] font-bold text-[#76534a]">Made for your happy place</p></div></div>
              </div>
            </div>
            <div className="relative min-h-[340px] overflow-hidden lg:min-h-full">
              <img src="https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=1400&q=90" alt="Colourful ice cream and sweet treats" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#45291f]/20 via-transparent to-white/10" />
              <div className="absolute right-5 top-5 flex h-24 w-24 rotate-12 flex-col items-center justify-center rounded-full bg-[#f6c94c] text-center shadow-xl sm:right-9 sm:top-9 sm:h-32 sm:w-32"><span className="text-[8px] font-black uppercase tracking-[0.2em]">A whole lotta</span><span className="text-2xl font-black leading-none tracking-[-0.08em] sm:text-3xl">YUM!</span><span className="mt-1 text-[8px] font-black uppercase tracking-[0.18em]">Since day one</span></div>
              <div className="absolute bottom-5 left-5 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm sm:bottom-8 sm:left-8 sm:px-5 sm:py-4"><p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a2786c]">Flavour of the moment</p><p className="mt-1 text-base font-black tracking-[-0.04em] sm:text-lg">Strawberry Cloud 🍓</p></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {[["🍓","Real fruit joy","Flavours worth falling for"],["🥄","Small-batch love","Made with care, every day"],["🌈","A scoop for everyone","Classic, vegan & dairy-free"],["💛","Made for moments","Little treats, big memories"]].map(([emoji,title,body]) => <div key={title} className="rounded-2xl border border-[#eee2d3] bg-white/70 p-4 sm:p-5"><span className="text-2xl sm:text-3xl">{emoji}</span><h2 className="mt-3 text-xs font-black sm:text-sm">{title}</h2><p className="mt-1 text-[10px] leading-5 text-[#92796f] sm:text-xs">{body}</p></div>)}
          </div>
        </section>

        <section id="menu" className="bg-[#fff3dc] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#c07b73]">The good stuff / scooped daily</p><h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.075em] sm:text-6xl">Meet your new<br className="sm:hidden" /> happy place.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#8e7166]">From first lick to last spoonful, every treat is a little reason to smile.</p></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-[#7e5146]"><Sparkles size={14} className="text-[#e9ae30]" /> Scooped with love</span>
            </div>
            <div className="mb-8 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={"whitespace-nowrap rounded-full border px-5 py-3 text-[9px] font-black uppercase tracking-[0.13em] transition " + (category === item ? "border-[#45291f] bg-[#45291f] text-white" : "border-[#dec9b8] bg-white/50 hover:border-[#45291f]")}>{item}</button>)}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const isSaved = saved.includes(product.id);
                return <article key={product.id} className="group">
                  <div className="relative aspect-[4/4.5] overflow-hidden rounded-[20px] sm:rounded-[26px]" style={{ backgroundColor: product.color }}>
                    <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    {product.tag && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-2 text-[8px] font-black uppercase tracking-[0.12em] sm:left-4 sm:top-4 sm:text-[9px]">{product.tag}</span>}
                    <button onClick={() => setSaved((current) => isSaved ? current.filter((id) => id !== product.id) : [...current, product.id])} aria-label={isSaved ? "Remove from favourites" : "Add to favourites"} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:bg-[#f6c94c] sm:right-4 sm:top-4">{isSaved ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}</button>
                    <button onClick={() => add(product.id)} className="absolute bottom-3 left-3 right-3 hidden items-center justify-center gap-2 rounded-full bg-[#45291f] py-3.5 text-[9px] font-black uppercase tracking-[0.13em] text-white transition hover:bg-[#ed8a9a] sm:flex sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">Add a little joy <Plus size={14} /></button>
                    <button onClick={() => add(product.id)} className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f6c94c] text-[#45291f] sm:hidden" aria-label={"Add " + product.name + " to bag"}><Plus size={19} /></button>
                  </div>
                  <div className="flex items-start justify-between gap-2 px-1 pt-4"><div><h3 className="text-sm font-black tracking-[-0.03em] sm:text-base">{product.name}</h3><p className="mt-1.5 max-w-[220px] text-[10px] leading-4 text-[#977b70] sm:text-xs">{product.subtitle}</p></div><p className="shrink-0 text-sm font-black">{money(product.price)}</p></div>
                </article>;
              })}
            </div>
            <p className="mt-8 text-center text-[9px] font-semibold text-[#a88c7d]">Demo menu and prices for presentation purposes.</p>
          </div>
        </section>

        <section id="story" className="mx-auto grid max-w-[1440px] overflow-hidden bg-[#e9f0df] md:grid-cols-2">
          <div className="relative min-h-[360px] sm:min-h-[500px]"><img src="https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&w=1200&q=85" alt="A delicious ice cream treat" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute bottom-5 left-5 rotate-[-5deg] rounded-full bg-[#f6c94c] px-5 py-4 text-center sm:bottom-8 sm:left-8"><span className="block text-[8px] font-black uppercase tracking-[0.18em]">Good days start</span><span className="text-lg font-black tracking-[-0.06em]">one scoop at a time</span></div></div>
          <div className="flex items-center px-6 py-14 sm:px-12 sm:py-20 lg:px-20"><div className="max-w-xl"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d07885]">A little about us</p><h2 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.08em] sm:text-7xl">Serious about<br />ice cream.<br /><span className="text-[#d07885]">Never serious.</span></h2><p className="mt-6 text-sm leading-7 text-[#6e7964]">We believe the best things in life are simple: good people, sunny days, and a scoop that makes you close your eyes after the first bite. So we dream up playful flavours, make room for everyone, and serve every cone with a little extra joy.</p><p className="mt-4 text-sm leading-7 text-[#6e7964]">Come for your favourite. Leave with a new one.</p><a href="#menu" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#45291f] px-6 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#d07885]">Find your flavour <ArrowRight size={15} /></a></div></div>
        </section>

        <section id="visit" className="px-4 py-16 text-center sm:px-8 sm:py-24"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#c07b73]">Your table is waiting</p><h2 className="mx-auto mt-4 max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.08em] sm:text-7xl">Come hungry.<br /><span className="text-[#dc778b]">Leave happy.</span></h2><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#8e7166]">Bring your bestie, bring the kids, or just bring yourself. There's always room for one more scoop.</p><a href="#menu" className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#f6c94c] px-7 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition hover:bg-[#ed8a9a]">Pick your happy <ArrowRight size={15} /></a></section>
      </main>

      <footer className="bg-[#45291f] px-5 py-9 text-white sm:px-8 sm:py-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><a href="#top" className="inline-flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6c94c] text-[#45291f]"><IceCreamBowl size={21} /></span><span className="text-2xl font-black tracking-[-0.08em]">scoop<span className="text-[#ed8a9a]">&</span>joy</span></a><p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">Happiness by the scoop</p></div><div className="text-[10px] leading-6 text-white/65"><p>Concept storefront powered by SellUrWay</p><Link to="/" className="mt-1 inline-flex items-center gap-2 font-black text-[#f6c94c] hover:text-white">Build your own store <ArrowRight size={13} /></Link></div></div><div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-4 text-[9px] text-white/40">© {new Date().getFullYear()} Scoop & Joy demo storefront · A sweet SellUrWay concept.</div></footer>

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#45291f] px-5 py-3 text-xs font-bold text-white shadow-xl"><Check size={15} className="mr-2 inline text-[#f6c94c]" />{notice}</div>}
      {cartOpen && <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-[#2b1714]/55" onClick={() => setCartOpen(false)} aria-label="Close bag" /><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fffaf2] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between border-b border-[#eadfd1] pb-5"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a08275]">A little treat for you</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Your happy bag ({count})</h2></div><button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-[#f8e7dc]" aria-label="Close bag"><X size={20} /></button></div><div className="flex-1 overflow-y-auto py-5">{cartProducts.length === 0 ? <div className="py-16 text-center"><IceCreamBowl size={32} className="mx-auto text-[#d07885]" /><p className="mt-4 text-sm text-[#8e7166]">Your bag needs a scoop of happiness.</p><button onClick={() => setCartOpen(false)} className="mt-5 rounded-full bg-[#f6c94c] px-5 py-3 text-[9px] font-black uppercase tracking-widest">Find a treat</button></div> : <div className="space-y-4">{cartProducts.map(({ id, qty, product }) => <div key={id} className="flex gap-3 border-b border-[#eadfd1] pb-4"><img src={product.image} alt="" className="h-24 w-20 rounded-xl object-cover" /><div className="flex-1"><h3 className="text-sm font-black">{product.name}</h3><p className="mt-1 text-xs font-bold">{money(product.price)}</p><div className="mt-3 inline-flex items-center gap-3 rounded-full border border-[#eadfd1] px-2 py-1"><button onClick={() => changeQty(id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span className="text-xs font-black">{qty}</span><button onClick={() => changeQty(id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><p className="text-sm font-black">{money(product.price * qty)}</p></div>)}</div>}</div>{cartProducts.length > 0 && <div className="border-t border-[#eadfd1] pt-5"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span><span className="text-lg font-black">{money(total)}</span></div><p className="mt-2 text-[10px] leading-5 text-[#9a8074]">Checkout and delivery are not connected in this demo.</p><button onClick={() => setNotice("Demo only — checkout is not connected yet")} className="mt-5 w-full rounded-full bg-[#45291f] py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d07885]">Continue to checkout <ArrowRight size={15} className="ml-2 inline" /></button></div>}</aside></div>}
    </div>
  );
}
