import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useStore, whatsappLink } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/s/$slug/confirmation")({
  validateSearch: (search: Record<string, unknown>): { order: string } => ({
    order: typeof search["order"] === "string" ? (search["order"] as string) : "",
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { slug } = useParams({ from: "/s/$slug/confirmation" });
  const { order } = Route.useSearch();
  const store = useStore();
  const [summary, setSummary] = useState<{ total: number; currency: string } | null>(null);

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

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: "var(--sf-accent)" }} />
      <h1 className="mt-5 text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--sf-heading)" }}>
        Order received
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
        {summary && (
          <div className="mt-2 flex justify-between text-sm">
            <span style={{ color: "var(--sf-muted)" }}>Total</span>
            <span className="font-semibold">{formatMoney(summary.total, summary.currency ?? store.currency)}</span>
          </div>
        )}
        <p className="mt-4 text-xs" style={{ color: "var(--sf-muted)" }}>
          Keep this number handy — quote it when you contact the store about your order.
        </p>
      </div>

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
