import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useStore } from "@/lib/storefront";
import { CheckoutForm } from "@/components/CheckoutForm";
import { clearCart, readCart, type CartLine } from "@/lib/cart";

export const Route = createFileRoute("/s/$slug/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { slug } = useParams({ from: "/s/$slug/checkout" });
  const store = useStore();
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => setLines(readCart(slug)), [slug]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--sf-heading)" }}>
        Checkout
      </h1>
      {lines.length === 0 ? (
        <div
          className="mt-8 border border-dashed p-10 text-center text-sm"
          style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)", color: "var(--sf-muted)" }}
        >
          Your cart is empty.{" "}
          <Link to="/s/$slug" params={{ slug }} className="underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <CheckoutForm
            store={store}
            lines={lines}
            source="online_checkout"
            onPlaced={(result) => {
              if (typeof window !== "undefined") {
                window.sessionStorage.setItem(`sellurway.order.${result.order_number}`, JSON.stringify(result));
              }
              clearCart(slug);
            }}
          />
        </div>
      )}
    </main>
  );
}
