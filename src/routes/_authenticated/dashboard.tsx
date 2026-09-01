import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  LifeBuoy,
  Package,
  Palette,
  Plus,
  Receipt,
  Settings,
  Store as StoreIcon,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Empty } from "@/components/Empty";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sellurway" },
      { name: "description", content: "Manage your Sellurway store, products, orders and customers." },
      { property: "og:title", content: "Sellurway dashboard" },
      { property: "og:description", content: "Your store overview: revenue, orders, products and customers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  { to: "/products/new", label: "Add a product", hint: "Photos, price, stock and options", icon: Plus },
  { to: "/products", label: "Edit products", hint: "Update, hide or delete items", icon: Package },
  { to: "/themes", label: "Choose a template", hint: "12 storefront designs", icon: Palette },
  { to: "/settings", label: "Edit your store", hint: "Branding, delivery, payments", icon: Settings },
  { to: "/orders", label: "Manage orders", hint: "Statuses, filters and CSV export", icon: Receipt },
  { to: "/customers", label: "Customers", hint: "Spend and order history", icon: Users },
  { to: "/analytics", label: "Analytics", hint: "Revenue and best sellers", icon: BarChart3 },
  { to: "/support", label: "Support", hint: "Ask our team anything", icon: LifeBuoy },
] as const;

function Dashboard() {
  const { isLifetime, activeStore, stores } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const storeId = activeStore!.id;
      const [orders, products, customers] = await Promise.all([
        supabase.from("orders").select("total,currency,status").eq("store_id", storeId),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", storeId),
      ]);
      if (orders.error) throw orders.error;
      const rows = orders.data ?? [];
      const revenue = rows
        .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
        .reduce((s, o) => s + Number(o.total), 0);
      return {
        revenue,
        currency: rows[0]?.currency ?? "USD",
        orders: rows.length,
        products: products.count ?? 0,
        customers: customers.count ?? 0,
      };
    },
  });

  if (stores.length === 0) {
    return (
      <DashboardShell title="Dashboard">
        <Empty
          icon={StoreIcon}
          title="You don't have a store yet"
          description="Set up your storefront — name, currency, how you take orders — and start adding products."
          action={
            <Button asChild>
              <Link to="/onboarding">Create your store</Link>
            </Button>
          }
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={activeStore!.name}
      description="Overview of your store today."
      actions={
        <Button asChild>
          <Link to="/products/new">
            <Plus className="mr-1.5 h-4 w-4" /> Add product
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Revenue", value: formatMoney(stats?.revenue ?? 0, stats?.currency), icon: Receipt },
          { label: "Orders", value: String(stats?.orders ?? 0), icon: Receipt },
          { label: "Products", value: String(stats?.products ?? 0), icon: Package },
          { label: "Customers", value: String(stats?.customers ?? 0), icon: Users },
        ].map((s) => (
          <div key={s.label} className="surface-card p-5">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Manage your store</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="surface-card group flex items-start gap-3 p-4 transition hover:border-primary/40 hover:shadow-[var(--shadow-lift)]"
            >
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <a.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-medium">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {!isLifetime && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-gold/40 bg-gold-soft/40 p-6">
          <div>
            <p className="font-display font-semibold">You're on the free plan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Up to 3 products. Unlock unlimited products and premium themes for a single $10 payment.
            </p>
          </div>
          <Button asChild>
            <Link to="/upgrade">Upgrade for $10</Link>
          </Button>
        </div>
      )}
    </DashboardShell>
  );
}
