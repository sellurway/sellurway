import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LogOut, Package, Receipt, Store as StoreIcon, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { CrownBadge } from "@/components/CrownBadge";
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

function Dashboard() {
  const { profile, isLifetime, activeStore, stores } = useAuth();
  const navigate = useNavigate();

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

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo to="/dashboard" />
          <div className="flex items-center gap-3">
            {isLifetime && <CrownBadge />}
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        {stores.length === 0 ? (
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
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">{activeStore!.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Overview of your store today.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/s/$slug" params={{ slug: activeStore!.slug }} target="_blank">
                  View storefront <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            {!isLifetime && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-gold/40 bg-gold-soft/40 p-6">
                <div>
                  <p className="font-display font-semibold">You're on the free plan</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Up to 5 products. Unlock unlimited products and premium themes for a single $10 payment.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/upgrade">Upgrade for $10</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
