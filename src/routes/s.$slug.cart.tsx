import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";
import { cartSubtotal, readCart, writeCart, type CartLine } from "@/lib/cart";

export const Route = createFileRoute("/s/$slug/cart")({
  component: CartPage,
});

function CartPage() {
  const { slug } = useParams({ from: "/s/$slug/cart" });
  const store = useStore();
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => setLines(readCart(slug)), [slug]);

  function update(next: CartLine[]) {
    setLines(next);
    writeCart(slug, next);
  }

  const subtotal = cartSubtotal(lines);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--sf-heading)" }}>
        Your cart
      </h1>

      {lines.length === 0 ? (
        <div
          className="mt-8 flex flex-col items-center border border-dashed py-16 text-center"
          style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)" }}
        >
          <ShoppingBag className="h-6 w-6" style={{ color: "var(--sf-muted)" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--sf-muted)" }}>
            Your cart is empty.
          </p>
          <Link
            to="/s/$slug"
            params={{ slug }}
            className="mt-5 px-5 py-2.5 text-sm font-semibold"
            style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)", borderRadius: "var(--sf-btn-radius)" }}
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {lines.map((line, index) => (
              <li
                key={`${line.product_id}-${line.variant_label ?? ""}`}
                className="flex gap-4 border p-3"
                style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)" }}
              >
                {line.image ? (
                  <img src={line.image} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="h-20 w-20 shrink-0 rounded-md" style={{ background: "var(--sf-surface)" }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.name}</p>
                  {line.variant_label && (
                    <p className="text-xs" style={{ color: "var(--sf-muted)" }}>
                      {line.variant_label}
                    </p>
                  )}
                  <p className="mt-1 text-sm">{formatMoney(line.price, store.currency)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="inline-flex items-center border"
                      style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-btn-radius)" }}
                    >
                      <button
                        className="px-2.5 py-1.5"
                        aria-label="Decrease quantity"
                        onClick={() => {
                          const next = [...lines];
                          next[index] = { ...line, quantity: Math.max(1, line.quantity - 1) };
                          update(next);
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-7 text-center text-sm">{line.quantity}</span>
                      <button
                        className="px-2.5 py-1.5"
                        aria-label="Increase quantity"
                        onClick={() => {
                          const next = [...lines];
                          next[index] = { ...line, quantity: Math.min(99, line.quantity + 1) };
                          update(next);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => update(lines.filter((_, i) => i !== index))}
                      className="inline-flex items-center gap-1 text-xs"
                      style={{ color: "var(--sf-muted)" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatMoney(line.price * line.quantity, store.currency)}</p>
              </li>
            ))}
          </ul>

          <div
            className="mt-6 border p-5"
            style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)" }}
          >
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--sf-muted)" }}>Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotal, store.currency)}</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--sf-muted)" }}>
              Delivery is calculated at checkout.
            </p>
            <Link
              to="/s/$slug/checkout"
              params={{ slug }}
              className="mt-4 block w-full px-5 py-3 text-center text-sm font-semibold"
              style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)", borderRadius: "var(--sf-btn-radius)" }}
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
