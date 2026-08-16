import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Empty } from "@/components/Empty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatMoney } from "@/lib/format";
import { downloadCsv, toCsv, withinRange } from "@/lib/csv";


export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Sellurway" },
      { name: "description", content: "Every buyer who has ordered from your store, with spend and order history." },
      { property: "og:title", content: "Customers — Sellurway" },
      { property: "og:description", content: "See who buys from you, how often, and how much they spend." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { activeStore } = useAuth();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,name,email,phone,orders_count,total_spent,last_order_at,created_at")
        .eq("store_id", activeStore!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!activeStore) {
    return (
      <DashboardShell title="Customers">
        <NoStore />
      </DashboardShell>
    );
  }

  const q = search.trim().toLowerCase();
  const rows = [...(customers ?? [])]
    .filter(
      (c) =>
        q === "" ||
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q),
    )
    .sort((a, b) => {
      if (sort === "spend") return Number(b.total_spent) - Number(a.total_spent);
      if (sort === "orders") return b.orders_count - a.orders_count;
      return new Date(b.last_order_at ?? b.created_at).getTime() - new Date(a.last_order_at ?? a.created_at).getTime();
    });

  return (
    <DashboardShell title="Customers" description={`${rows.length} customer${rows.length === 1 ? "" : "s"}`}>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent order</SelectItem>
            <SelectItem value="spend">Highest spend</SelectItem>
            <SelectItem value="orders">Most orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading customers…</p>
      ) : rows.length === 0 ? (
        <Empty
          icon={Users}
          title="No customers yet"
          description="Anyone who places an order is saved here automatically, with their contact details and spend."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-xl)] border">
          <table className="w-full min-w-[38rem] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Total spent</th>
                <th className="p-3">Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t bg-card">
                  <td className="p-3 font-medium">{c.name ?? "Guest"}</td>
                  <td className="p-3 text-muted-foreground">
                    <p>{c.phone ?? "—"}</p>
                    <p className="text-xs">{c.email ?? ""}</p>
                  </td>
                  <td className="p-3">{c.orders_count}</td>
                  <td className="p-3 font-medium">{formatMoney(c.total_spent)}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(c.last_order_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
