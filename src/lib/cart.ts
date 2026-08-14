export interface CartLine {
  product_id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  variant_label?: string | null;
}

const key = (slug: string) => `sellurway.cart.${slug}`;

export function readCart(slug: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(slug: string, lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(slug), JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("sellurway:cart", { detail: { slug } }));
}

export function addToCart(slug: string, line: CartLine) {
  const lines = readCart(slug);
  const existing = lines.find(
    (l) => l.product_id === line.product_id && (l.variant_label ?? "") === (line.variant_label ?? ""),
  );
  if (existing) existing.quantity = Math.min(999, existing.quantity + line.quantity);
  else lines.push(line);
  writeCart(slug, lines);
  return lines;
}

export function clearCart(slug: string) {
  writeCart(slug, []);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}
