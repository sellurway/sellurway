import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";
import { labelize } from "@/lib/store-options";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Sellurway" },
      { name: "description", content: "Revenue, orders and best sellers for your Sellurway store." },
      { property: "og:title", content: "Analytics — Sellurway" },
      { property: "og:description", content: "See what sells, where orders come from and how revenue is trending." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { activeStore, isLifetime } = useAuth();
  const [days, setDays] = useState("30");

  const { data } = useQuery({
    queryKey: ["analytics", activeStore?.id, days],
    enabled: !!activeStore,
    queryFn: async () => {
      const since = new Date(Date.now() - Number(days) * 86400000).toISOString();
      const [orders, items] = await Promise.all([
        supabase
          .from("orders")
          .select("total,currency,status,source,created_at")
          .eq("store_id", activeStore!.id)
          .gte("created_at", since),
        supabase
          .from("order_items")
          .select("product_name,quantity,line_total,created_at")
          .eq("store_id", activeStore!.id)
          .gte("created_at", since),
      ]);
      if (orders.error) throw orders.error;
      if (items.error) throw items.error;
      return { orders: orders.data ?? [], items: items.data ?? [] };
    },
  });

  if (!activeStore) {
    return (
      <DashboardShell title="Analytics">
        <NoStore />
      </DashboardShell>
    );
  }

  const orders = data?.orders ?? [];
  const valid = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const currency = orders[0]?.currency ?? "USD";
  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const aov = valid.length ? revenue / valid.length : 0;

  const bySource = valid.reduce<Record<string, number>>((acc, o) => {
    acc[o.source] = (acc[o.source] ?? 0) + Number(o.total);
    return acc;
  }, {});

  const topProducts = Object.values(
    (data?.items ?? []).reduce<Record<string, { name: string; qty: number; revenue: number }>>((acc, i) => {
      const row = acc[i.product_name] ?? { name: i.product_name, qty: 0, revenue: 0 };
      row.qty += i.quantity;
      row.revenue += Number(i.line_total);
      acc[i.product_name] = row;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const buckets = Array.from({ length: Math.min(Number(days), 30) }, (_, i) => {
    const day = new Date(Date.now() - (Math.min(Number(days), 30) - 1 - i) * 86400000);
    const key = day.toISOString().slice(0, 10);
    const total = valid
      .filter((o) => o.created_at.slice(0, 10) === key)
      .reduce((s, o) => s + Number(o.total), 0);
    return { key, total };
  });
  const peak = Math.max(1, ...buckets.map((b) => b.total));

  return (
    <DashboardShell
      title="Analytics"
      description="How your store is performing."
      actions={
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Revenue", value: formatMoney(revenue, currency) },
          { label: "Orders", value: String(valid.length) },
          { label: "Average order", value: formatMoney(aov, currency) },
          { label: "Cancelled / refunded", value: String(orders.length - valid.length) },
        ].map((s) => (
          <div key={s.label} className="surface-card p-5">
            <p className="font-display text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="surface-card mt-6 p-5">
        <p className="text-sm font-medium">Revenue per day</p>
        <div className="mt-4 flex h-40 items-end gap-1">
          {buckets.map((b) => (
            <div
              key={b.key}
              title={`${b.key}: ${formatMoney(b.total, currency)}`}
              className="flex-1 rounded-t bg-primary/80"
              style={{ height: `${Math.max(2, (b.total / peak) * 100)}%` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-5">
          <p className="text-sm font-medium">Best sellers</p>
          {topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No sales in this period yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {topProducts.map((p) => (
                <li key={p.name} className="flex justify-between gap-3">
                  <span className="truncate">
                    {p.name} <span className="text-muted-foreground">× {p.qty}</span>
                  </span>
                  <span className="font-medium">{formatMoney(p.revenue, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-card p-5">
          <p className="text-sm font-medium">Where orders come from</p>
          {Object.keys(bySource).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No orders in this period yet.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {Object.entries(bySource).map(([source, total]) => (
                <li key={source}>
                  <div className="flex justify-between">
                    <span>{labelize(source)}</span>
                    <span className="font-medium">{formatMoney(total, currency)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${revenue ? (total / revenue) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!isLifetime && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-gold/40 bg-gold-soft/40 p-5">
          <p className="text-sm">
            <Crown className="mr-1.5 inline h-4 w-4 text-gold" />
            Lifetime keeps your full order history and unlocks 90-day reporting as your store grows.
          </p>
          <Button asChild size="sm">
            <Link to="/upgrade">Upgrade for $10</Link>
          </Button>
        </div>
      )}
    </DashboardShell>
  );
}
