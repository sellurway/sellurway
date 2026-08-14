import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDeliveryAreas, type PublicStore } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";
import type { CartLine } from "@/lib/cart";

const ERRORS: Record<string, string> = {
  STORE_NOT_AVAILABLE: "This store is not accepting orders right now.",
  EMPTY_ORDER: "Your order is empty.",
  PRODUCT_UNAVAILABLE: "One of the items is no longer available.",
  OUT_OF_STOCK: "One of the items just went out of stock.",
  INVALID_DELIVERY_AREA: "Choose a valid delivery area.",
  MIN_ORDER_NOT_MET: "Your order is below this store's minimum.",
};

interface Props {
  store: PublicStore;
  lines: CartLine[];
  source: "online_checkout" | "direct_order";
  onPlaced: (result: { order_number: string; total: number; currency: string }) => void;
}

const field =
  "w-full rounded-md border bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-offset-0";

export function CheckoutForm({ store, lines, source, onPlaced }: Props) {
  const navigate = useNavigate();
  const { data: areas } = useDeliveryAreas(store.id);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    postal_code: "",
    instructions: "",
    preferred_time: "",
    notes: "",
  });
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [areaId, setAreaId] = useState<string>("");

  const settings = (store.delivery_settings ?? {}) as Record<string, string>;
  const paymentMethods = useMemo(() => {
    const list = Array.isArray(store.payment_methods) ? (store.payment_methods as string[]) : [];
    return list.length ? list : ["cash_on_delivery"];
  }, [store.payment_methods]);
  const [payment, setPayment] = useState(paymentMethods[0]!);

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const chosenArea = areas?.find((a) => a.id === areaId);
  const baseFee = Number(settings["fee"] ?? 0);
  const shipping =
    fulfillment === "pickup"
      ? 0
      : settings["free_threshold"] && subtotal >= Number(settings["free_threshold"])
        ? 0
        : (chosenArea?.fee ?? baseFee);
  const total = subtotal + Number(shipping);
  const pickupEnabled = settings["pickup"] === "true" || settings["pickup"] === "1";

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem =
      form.name.trim().length < 2
        ? "Enter your name."
        : !/^[\d\s+()-]{6,20}$/.test(form.phone.trim())
          ? "Enter a valid phone number."
          : form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
            ? "Enter a valid email address."
            : fulfillment === "delivery" && form.address.trim().length < 5
              ? "Enter your delivery address."
              : fulfillment === "delivery" && (areas?.length ?? 0) > 0 && !areaId
                ? "Choose your delivery area."
                : !lines.length
                  ? "Your order is empty."
                  : null;
    if (problem) {
      toast.error(problem);
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("place_order", {
        _slug: store.slug,
        _items: lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          variant_label: l.variant_label ?? "",
        })),
        _customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim(),
        },
        _delivery: {
          fulfillment_type: fulfillment,
          address: form.address.trim(),
          apartment: form.apartment.trim(),
          city: form.city.trim(),
          postal_code: form.postal_code.trim(),
          delivery_area_id: areaId,
          instructions: form.instructions.trim(),
          preferred_time: form.preferred_time.trim() || null,
        },
        _source: source,
        _payment_method: payment,
      });
      if (error) throw error;
      const result = data as unknown as { order_number: string; total: number; currency: string };
      onPlaced(result);
      navigate({
        to: "/s/$slug/confirmation",
        params: { slug: store.slug },
        search: { order: result.order_number },
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Order failed";
      const code = Object.keys(ERRORS).find((k) => raw.includes(k));
      toast.error(code ? ERRORS[code]! : "We couldn't place your order. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const borderStyle = { borderColor: "var(--sf-border)" };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]" noValidate>
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--sf-muted)" }}>
            Your details
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={field} style={borderStyle} placeholder="Full name *" value={form.name} onChange={set("name")} maxLength={80} />
            <input className={field} style={borderStyle} placeholder="Phone number *" value={form.phone} onChange={set("phone")} maxLength={20} inputMode="tel" />
            <input className={`${field} sm:col-span-2`} style={borderStyle} placeholder="Email (optional)" value={form.email} onChange={set("email")} maxLength={255} inputMode="email" />
          </div>
        </section>

        {pickupEnabled && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--sf-muted)" }}>
              How would you like to get it?
            </h2>
            <div className="flex gap-2">
              {(["delivery", "pickup"] as const).map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFulfillment(f)}
                  className="flex-1 border px-4 py-2.5 text-sm capitalize"
                  style={{
                    borderColor: fulfillment === f ? "var(--sf-accent)" : "var(--sf-border)",
                    background: fulfillment === f ? "var(--sf-accent)" : "transparent",
                    color: fulfillment === f ? "var(--sf-accent-ink)" : "var(--sf-ink)",
                    borderRadius: "var(--sf-btn-radius)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>
        )}

        {fulfillment === "delivery" && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--sf-muted)" }}>
              Delivery address
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={`${field} sm:col-span-2`} style={borderStyle} placeholder="Street address *" value={form.address} onChange={set("address")} maxLength={200} />
              <input className={field} style={borderStyle} placeholder="Apartment / unit" value={form.apartment} onChange={set("apartment")} maxLength={80} />
              <input className={field} style={borderStyle} placeholder="City" value={form.city} onChange={set("city")} maxLength={80} />
              <input className={field} style={borderStyle} placeholder="Postal code" value={form.postal_code} onChange={set("postal_code")} maxLength={20} />
              <input className={field} style={borderStyle} type="datetime-local" placeholder="Preferred time" value={form.preferred_time} onChange={set("preferred_time")} />
              {(areas?.length ?? 0) > 0 && (
                <select
                  className={`${field} sm:col-span-2`}
                  style={borderStyle}
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  aria-label="Delivery area"
                >
                  <option value="">Select your delivery area *</option>
                  {areas!.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {formatMoney(a.fee, store.currency)}
                      {a.eta ? ` · ${a.eta}` : ""}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                className={`${field} sm:col-span-2`}
                style={borderStyle}
                placeholder="Delivery instructions (optional)"
                rows={2}
                value={form.instructions}
                onChange={set("instructions")}
                maxLength={300}
              />
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--sf-muted)" }}>
            Payment
          </h2>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <label
                key={m}
                className="flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm"
                style={{
                  ...borderStyle,
                  borderRadius: "var(--sf-btn-radius)",
                  borderColor: payment === m ? "var(--sf-accent)" : "var(--sf-border)",
                }}
              >
                <input type="radio" name="payment" checked={payment === m} onChange={() => setPayment(m)} />
                <span className="capitalize">{m.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
          <textarea
            className={`${field} mt-3`}
            style={borderStyle}
            rows={2}
            placeholder="Order notes (optional)"
            value={form.notes}
            onChange={set("notes")}
            maxLength={300}
          />
        </section>
      </div>

      <aside
        className="h-fit border p-5 lg:sticky lg:top-24"
        style={{ ...borderStyle, borderRadius: "var(--sf-card-radius)", background: "var(--sf-surface)" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--sf-muted)" }}>
          Order summary
        </h2>
        <ul className="mt-4 space-y-3">
          {lines.map((l) => (
            <li key={`${l.product_id}-${l.variant_label ?? ""}`} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{l.name}</span>
                <span style={{ color: "var(--sf-muted)" }}>
                  {l.variant_label ? `${l.variant_label} · ` : ""}× {l.quantity}
                </span>
              </span>
              <span className="whitespace-nowrap">{formatMoney(l.price * l.quantity, store.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1.5 border-t pt-4 text-sm" style={borderStyle}>
          <div className="flex justify-between">
            <span style={{ color: "var(--sf-muted)" }}>Subtotal</span>
            <span>{formatMoney(subtotal, store.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--sf-muted)" }}>{fulfillment === "pickup" ? "Pickup" : "Delivery"}</span>
            <span>{Number(shipping) === 0 ? "Free" : formatMoney(shipping, store.currency)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatMoney(total, store.currency)}</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)", borderRadius: "var(--sf-btn-radius)" }}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Place order
        </button>
        <p className="mt-3 text-xs" style={{ color: "var(--sf-muted)" }}>
          By placing this order you agree to be contacted by {store.name} about it.
        </p>
      </aside>
    </form>
  );
}
