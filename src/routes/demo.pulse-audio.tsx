import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Heart, IceCreamBowl, Menu, Minus, Plus, ShoppingBag, Sparkles, Star, X } from "lucide-react";

export const Route = createFileRoute("/demo/pulse-audio")({
  head: () => ({
    meta: [
      { title: "Pop & Joy — Ice Cream Bars for Happy Days | SellUrWay Demo" },
      { name: "description", content: "A colourful, premium ice cream bar shop concept with fruity ice pops and chocolate-dipped frozen treats. Powered by SellUrWay." },
      { rel: "canonical", href: "https://sellurway.vercel.app/demo/pulse-audio" },
      { property: "og:title", content: "Pop & Joy — Ice Cream Bars for Happy Days" },
      { property: "og:description", content: "A little pop of happy. Discover fruity ice pops and chocolate-dipped ice cream bars." },
    ],
  }),
  component: PopAndJoyDemo,
});

type Product = { id: string; name: string; subtitle: string; price: number; category: string; image: string; color: string; tag?: string };

const products: Product[] = [
  { id: "strawberry-swirl", name: "Strawberry Swirl Bar", subtitle: "Strawberry cream · berry ripple", price: 28, category: "Creamy Bars", image: "https://assets.myneworleans.com/2022/05/8xb9xY0x-1c1rB1KD-BigOPops-001-e1652917495561.jpg", color: "#f8dce0", tag: "Bestseller" },
  { id: "choc-crunch", name: "Choc Crunch Bar", subtitle: "Vanilla ice cream · crunchy chocolate shell", price: 32, category: "Chocolate Dipped", image: "https://www.skipthedishes.com/_next/image?q=75&url=https%3A%2F%2Fmenu-images-static.skipthedishes.com%2Fimages%2Fresized%2Flarge-bd4cf8f6e3372998a61d.jpg&w=3840", color: "#e8d6c5", tag: "Fan favourite" },
  { id: "mango-sunshine", name: "Mango Sunshine Bar", subtitle: "Juicy mango · tropical fruit ice", price: 25, category: "Fruit Bars", image: "https://static.wixstatic.com/media/4f1d2d_2791c59c0dea4f6fa2db025aed6df0c7~mv2.jpeg/v1/fill/w_2500%2Ch_1666%2Cal_c/4f1d2d_2791c59c0dea4f6fa2db025aed6df0c7~mv2.jpeg", color: "#f9e7b0", tag: "Dairy free" },
  { id: "rainbow-pop", name: "Rainbow Rush Bar", subtitle: "Colourful fruity layers · summer in every bite", price: 25, category: "Fruit Bars", image: "https://patisserie-stephane-denis.fr/scripts/files/655386648279b7.86302172/glaces.jpg", color: "#f4d7b7", tag: "Colourful favourite" },
  { id: "cookies-cream", name: "Cookies & Cream Bar", subtitle: "Creamy vanilla · cookie crumb coating", price: 32, category: "Chocolate Dipped", image: "https://www.skipthedishes.com/_next/image?q=75&url=https%3A%2F%2Fmenu-images-static.skipthedishes.com%2Fimages%2Fresized%2Flarge-bd4cf8f6e3372998a61d.jpg&w=3840", color: "#c9d9bc" },
  { id: "tropical-passion", name: "Tropical Passion Bar", subtitle: "Passion fruit · pineapple · sunshine", price: 27, category: "Fruit Bars", image: "https://static.wixstatic.com/media/4f1d2d_2791c59c0dea4f6fa2db025aed6df0c7~mv2.jpeg/v1/fill/w_2500%2Ch_1666%2Cal_c/4f1d2d_2791c59c0dea4f6fa2db025aed6df0c7~mv2.jpeg", color: "#f1d3df", tag: "New" },
];

const money = (amount: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amount);

function PopAndJoyDemo() {
  const [category, setCategory] = useState("All bars");
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const categories = ["All bars", "Creamy Bars", "Chocolate Dipped", "Fruit Bars"];
  const visibleProducts = useMemo(() => products.filter((p) => category === "All bars" || p.category === category), [category]);
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
      <div className="bg-[#45291f] px-4 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-white sm:text-xs">A little pop of happy ✳ Free delivery on orders over R350</div>
      <header className="sticky top-0 z-40 border-b border-[#eadfd1] bg-[#fffaf2]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-4 sm:px-8">
          <button className="rounded-full p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 rotate-[-8deg] items-center justify-center rounded-[15px] bg-[#f6c94c] text-[#45291f]"><IceCreamBowl size={24} strokeWidth={2.4} /></span>
            <span><span className="block text-xl font-black leading-none tracking-[-0.07em] sm:text-2xl">pop<span className="text-[#ed8a9a]">&</span>joy</span><span className="mt-1 block text-[8px] font-extrabold uppercase tracking-[0.24em] text-[#97766b]">Ice cream bars for happy days</span></span>
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
                <p className="mt-6 max-w-md text-sm leading-7 text-[#76534a] sm:text-base">Colourful ice cream bars, fruity ice pops and chocolate-dipped favourites. A little frozen happiness for sunny afternoons, parties and “just because” moments.</p>
                <div className="mt-8 flex flex-wrap gap-3"><a href="#menu" className="inline-flex items-center gap-3 rounded-full bg-[#45291f] px-6 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#6d4234]">Shop ice cream bars <ArrowRight size={16} /></a><a href="#story" className="inline-flex items-center gap-2 rounded-full border border-[#b9887b] px-6 py-4 text-[10px] font-black uppercase tracking-[0.14em] transition hover:bg-white/60">Meet your pop crew</a></div>
                <div className="mt-9 flex items-center gap-3"><div className="flex -space-x-2">{["#ed8b9c","#f6ca4e","#b7c6a5"].map((c) => <span key={c} className="h-7 w-7 rounded-full border-2 border-[#f8dfe0]" style={{ backgroundColor: c }} />)}</div><div><div className="flex gap-0.5 text-[#e4a72b]">{[1,2,3,4,5].map((n) => <Star key={n} size={12} fill="currentColor" />)}</div><p className="mt-0.5 text-[9px] font-bold text-[#76534a]">Made for your happy place</p></div></div>
              </div>
            </div>
            <div className="relative min-h-[340px] overflow-hidden lg:min-h-full">
              <img src="https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=1400&q=90" alt="Colourful ice cream and sweet treats" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#45291f]/20 via-transparent to-white/10" />
              <div className="absolute right-5 top-5 flex h-24 w-24 rotate-12 flex-col items-center justify-center rounded-full bg-[#f6c94c] text-center shadow-xl sm:right-9 sm:top-9 sm:h-32 sm:w-32"><span className="text-[8px] font-black uppercase tracking-[0.2em]">A whole lotta</span><span className="text-2xl font-black leading-none tracking-[-0.08em] sm:text-3xl">YUM!</span><span className="mt-1 text-[8px] font-black uppercase tracking-[0.18em]">Since day one</span></div>
              <div className="absolute bottom-5 left-5 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm sm:bottom-8 sm:left-8 sm:px-5 sm:py-4"><p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a2786c]">Bar of the moment</p><p className="mt-1 text-base font-black tracking-[-0.04em] sm:text-lg">Strawberry Swirl 🍓</p></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {[["🍓","Fresh fruit flavour","Flavours worth falling for"],["🥄","Chocolate-dipped joy","Made with care, every day"],["🌈","A bar for everyone","Creamy, fruity & dairy-free"],["💛","Made for moments","Little treats, big memories"]].map(([emoji,title,body]) => <div key={title} className="rounded-2xl border border-[#eee2d3] bg-white/70 p-4 sm:p-5"><span className="text-2xl sm:text-3xl">{emoji}</span><h2 className="mt-3 text-xs font-black sm:text-sm">{title}</h2><p className="mt-1 text-[10px] leading-5 text-[#92796f] sm:text-xs">{body}</p></div>)}
          </div>
        </section>

        <section id="menu" className="bg-[#fff3dc] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#c07b73]">The good stuff / frozen happiness</p><h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.075em] sm:text-6xl">Meet your new<br className="sm:hidden" /> favourite bar.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#8e7166]">From the first bite to the last, our ice cream bars bring a little sunshine to your day.</p></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-[#7e5146]"><Sparkles size={14} className="text-[#e9ae30]" /> Made for happy bites</span>
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
                    <button onClick={() => add(product.id)} className="absolute bottom-3 left-3 right-3 hidden items-center justify-center gap-2 rounded-full bg-[#45291f] py-3.5 text-[9px] font-black uppercase tracking-[0.13em] text-white transition hover:bg-[#ed8a9a] sm:flex sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">Add to bag <Plus size={14} /></button>
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
          <div className="relative min-h-[360px] sm:min-h-[500px]"><img src="https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&w=1200&q=85" alt="A delicious ice cream treat" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute bottom-5 left-5 rotate-[-5deg] rounded-full bg-[#f6c94c] px-5 py-4 text-center sm:bottom-8 sm:left-8"><span className="block text-[8px] font-black uppercase tracking-[0.18em]">Good days start</span><span className="text-lg font-black tracking-[-0.06em]">one bar at a time</span></div></div>
          <div className="flex items-center px-6 py-14 sm:px-12 sm:py-20 lg:px-20"><div className="max-w-xl"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d07885]">A little about us</p><h2 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.08em] sm:text-7xl">Serious about<br />ice cream bars.<br /><span className="text-[#d07885]">Never boring.</span></h2><p className="mt-6 text-sm leading-7 text-[#6e7964]">We believe the best things in life are simple: good people, sunny days, and an ice cream bar that makes you smile after the first bite. From fruity frozen pops to crunchy chocolate-dipped bars, every treat is made for a little moment of joy.</p><p className="mt-4 text-sm leading-7 text-[#6e7964]">Pick your favourite bar. Find your new one.</p><a href="#menu" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#45291f] px-6 py-4 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#d07885]">Find your flavour <ArrowRight size={15} /></a></div></div>
        </section>

        <section id="visit" className="px-4 py-16 text-center sm:px-8 sm:py-24"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#c07b73]">Your freezer-favourite is waiting</p><h2 className="mx-auto mt-4 max-w-3xl text-5xl font-black leading-[0.9] tracking-[-0.08em] sm:text-7xl">Beat the heat.<br /><span className="text-[#dc778b]">Eat happy.</span></h2><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#8e7166]">Stock up for movie night, share with your bestie, or keep a box in the freezer for yourself. Happy days start with a great ice cream bar.</p><a href="#menu" className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#f6c94c] px-7 py-4 text-[10px] font-black uppercase tracking-[0.16em] transition hover:bg-[#ed8a9a]">Pick your bars <ArrowRight size={15} /></a></section>
      </main>

      <footer className="bg-[#45291f] px-5 py-9 text-white sm:px-8 sm:py-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><a href="#top" className="inline-flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6c94c] text-[#45291f]"><IceCreamBowl size={21} /></span><span className="text-2xl font-black tracking-[-0.08em]">pop<span className="text-[#ed8a9a]">&</span>joy</span></a><p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">Ice cream bars for happy days</p></div><div className="text-[10px] leading-6 text-white/65"><p>Concept storefront powered by SellUrWay</p><Link to="/" className="mt-1 inline-flex items-center gap-2 font-black text-[#f6c94c] hover:text-white">Build your own store <ArrowRight size={13} /></Link></div></div><div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-4 text-[9px] text-white/40">© {new Date().getFullYear()} Pop & Joy demo storefront · A sweet SellUrWay concept.</div></footer>

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#45291f] px-5 py-3 text-xs font-bold text-white shadow-xl"><Check size={15} className="mr-2 inline text-[#f6c94c]" />{notice}</div>}
      {cartOpen && <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-[#2b1714]/55" onClick={() => setCartOpen(false)} aria-label="Close bag" /><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fffaf2] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between border-b border-[#eadfd1] pb-5"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a08275]">A little frozen treat for you</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Your ice cream bag ({count})</h2></div><button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-[#f8e7dc]" aria-label="Close bag"><X size={20} /></button></div><div className="flex-1 overflow-y-auto py-5">{cartProducts.length === 0 ? <div className="py-16 text-center"><IceCreamBowl size={32} className="mx-auto text-[#d07885]" /><p className="mt-4 text-sm text-[#8e7166]">Your bag needs a little frozen happiness.</p><button onClick={() => setCartOpen(false)} className="mt-5 rounded-full bg-[#f6c94c] px-5 py-3 text-[9px] font-black uppercase tracking-widest">Find a bar</button></div> : <div className="space-y-4">{cartProducts.map(({ id, qty, product }) => <div key={id} className="flex gap-3 border-b border-[#eadfd1] pb-4"><img src={product.image} alt="" className="h-24 w-20 rounded-xl object-cover" /><div className="flex-1"><h3 className="text-sm font-black">{product.name}</h3><p className="mt-1 text-xs font-bold">{money(product.price)}</p><div className="mt-3 inline-flex items-center gap-3 rounded-full border border-[#eadfd1] px-2 py-1"><button onClick={() => changeQty(id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span className="text-xs font-black">{qty}</span><button onClick={() => changeQty(id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><p className="text-sm font-black">{money(product.price * qty)}</p></div>)}</div>}</div>{cartProducts.length > 0 && <div className="border-t border-[#eadfd1] pt-5"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span><span className="text-lg font-black">{money(total)}</span></div><p className="mt-2 text-[10px] leading-5 text-[#9a8074]">Checkout and delivery are not connected in this demo.</p><button onClick={() => setNotice("Demo only — checkout is not connected yet")} className="mt-5 w-full rounded-full bg-[#45291f] py-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d07885]">Continue to checkout <ArrowRight size={15} className="ml-2 inline" /></button></div>}</aside></div>}
    </div>
  );
}
