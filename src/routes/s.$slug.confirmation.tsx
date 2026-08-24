import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CreditCard, Loader2, MessageCircle, Truck } from "lucide-react";
import { toast } from "sonner";
import { useStore, whatsappLink } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";
import { labelize } from "@/lib/store-options";
import { confirmStripePayment, createStripeCheckout, trackOrder } from "@/lib/stripe.functions";

export const Route = createFileRoute("/s/$slug/confirmation")({
  validateSearch: (search: Record<string, unknown>): { order: string; session_id?: string } => {
    const order = typeof search["order"] === "string" ? (search["order"] as string) : "";
    const session = search["session_id"];
    return typeof session === "string" && session ? { order, session_id: session } : { order };
  },
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { slug } = useParams({ from: "/s/$slug/confirmation" });
  const { order, session_id } = Route.useSearch();
  const store = useStore();
  const [summary, setSummary] = useState<{ total: number; currency: string } | null>(null);
  const [payBusy, setPayBusy] = useState(false);

  const confirmPayment = useServerFn(confirmStripePayment);
  const startCheckout = useServerFn(createStripeCheckout);
  const lookup = useServerFn(trackOrder);

  useEffect(() => {
    if (!order || typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(`sellurway.order.${order}`);
    if (raw) {
      try {
        setSummary(JSON.parse(raw));
      } catch {
        setSummary(null);
      }
    }
  }, [order]);

  const confirmQuery = useQuery({
    queryKey: ["stripe-confirm", slug, order, session_id],
    enabled: !!order && !!session_id,
    queryFn: () => confirmPayment({ data: { slug, orderNumber: order, sessionId: session_id! } }),
  });

  const statusQuery = useQuery({
    queryKey: ["order-status", slug, order, confirmQuery.data?.paid],
    enabled: !!order,
    queryFn: () => lookup({ data: { slug, orderNumber: order } }),
  });

  const status = statusQuery.data;
  const paid = status?.payment_status === "paid";

  async function payNow() {
    if (payBusy) return;
    setPayBusy(true);
    try {
      const { url } = await startCheckout({ data: { slug, orderNumber: order, origin: window.location.origin } });
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start card payment.");
      setPayBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: "var(--sf-accent)" }} />
      <h1 className="mt-5 text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--sf-heading)" }}>
        {paid ? "Payment received" : "Order received"}
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--sf-muted)" }}>
        Thank you. {store.name} has your order and will be in touch to confirm.
      </p>

      <div
        className="mt-8 border p-6 text-left"
        style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-card-radius)", background: "var(--sf-surface)" }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--sf-muted)" }}>Order number</span>
          <span className="font-semibold">{order || "—"}</span>
        </div>
        {(status || summary) && (
          <div className="mt-2 flex justify-between text-sm">
            <span style={{ color: "var(--sf-muted)" }}>Total</span>
            <span className="font-semibold">
              {formatMoney(Number(status?.total ?? summary?.total ?? 0), status?.currency ?? summary?.currency ?? store.currency)}
            </span>
          </div>
        )}
        {status && (
          <div className="mt-2 flex justify-between text-sm">
            <span style={{ color: "var(--sf-muted)" }}>Payment</span>
            <span className="font-semibold">{labelize(status.payment_status)}</span>
          </div>
        )}
        {status?.delivery_status && (
          <div className="mt-2 flex justify-between text-sm">
            <span style={{ color: "var(--sf-muted)" }}>Delivery</span>
            <span className="font-semibold">{labelize(status.delivery_status)}</span>
          </div>
        )}
        {(status?.courier_name || status?.tracking_number) && (
          <div className="mt-4 border-t pt-4 text-sm" style={{ borderColor: "var(--sf-border)" }}>
            <p className="flex items-center gap-2 font-semibold">
              <Truck className="h-4 w-4" /> Tracking
            </p>
            {status.courier_name && (
              <p className="mt-1" style={{ color: "var(--sf-muted)" }}>
                Courier: {status.courier_name}
              </p>
            )}
            {status.tracking_number && (
              <p style={{ color: "var(--sf-muted)" }}>Tracking number: {status.tracking_number}</p>
            )}
            {status.tracking_url && (
              <a href={status.tracking_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block underline">
                Track your parcel
              </a>
            )}
          </div>
        )}
        <p className="mt-4 text-xs" style={{ color: "var(--sf-muted)" }}>
          Keep this number handy — quote it when you contact the store about your order.
        </p>
      </div>

      {store.stripe_enabled && status && !paid && (
        <button
          onClick={payNow}
          disabled={payBusy || confirmQuery.isFetching}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)", borderRadius: "var(--sf-btn-radius)" }}
        >
          {payBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Pay by card
        </button>
      )}

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Link
          to="/s/$slug"
          params={{ slug }}
          className="px-5 py-3 text-sm font-semibold"
          style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)", borderRadius: "var(--sf-btn-radius)" }}
        >
          Continue shopping
        </Link>
        {store.whatsapp_number && (
          <a
            href={whatsappLink(store, `Hi ${store.name}, I just placed order ${order}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border px-5 py-3 text-sm font-semibold"
            style={{ borderColor: "var(--sf-border)", borderRadius: "var(--sf-btn-radius)" }}
          >
            <MessageCircle className="h-4 w-4" /> Message the store
          </a>
        )}
      </div>
    </main>
  );
}
