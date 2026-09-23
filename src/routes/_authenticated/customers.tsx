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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activity, setActivity] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: customers, isLoading, isFetching } = useQuery({
    queryKey: ["customers", activeStore?.id, page, search, sort, from, to, activity],
    enabled: !!activeStore,
    queryFn: async () => {
      let query = supabase.from("customers")
        .select("id,name,email,phone,orders_count,total_spent,last_order_at,created_at", { count: "exact" })
        .eq("store_id", activeStore!.id);
      const q = search.trim();
      if (q) query = query.or(`name.ilike.%${q.replace(/[,%]/g, "")}%,email.ilike.%${q.replace(/[,%]/g, "")}%,phone.ilike.%${q.replace(/[,%]/g, "")}%`);
      if (activity === "repeat") query = query.gt("orders_count", 1);
      if (activity === "new") query = query.lte("orders_count", 1);
      if (from) query = query.gte("last_order_at", from);
      if (to) query = query.lt("last_order_at", `${to}T23:59:59.999`);
      if (sort === "spend") query = query.order("total_spent", { ascending: false });
      else if (sort === "orders") query = query.order("orders_count", { ascending: false });
      else query = query.order("last_order_at", { ascending: false, nullsFirst: false });
      const { data, error } = await query.range(page * pageSize, page * pageSize + pageSize - 1);
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

  const rows = customers ?? [];

  function exportCsv() {
    if (rows.length === 0) {
      toast.error("No customers match those filters.");
      return;
    }
    const csv = toCsv(
      ["Name", "Email", "Phone", "Orders", "Total spent", "Last order", "First seen"],
      rows.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.orders_count,
        c.total_spent,
        c.last_order_at,
        c.created_at,
      ]),
    );
    downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}`, csv);
    toast.success(`Exported ${rows.length} customers`);
  }

  return (
    <DashboardShell
      title="Customers"
      description={`${rows.length} customer${rows.length === 1 ? "" : "s"}`}
      actions={
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={activity} onValueChange={setActivity}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            <SelectItem value="repeat">Repeat buyers</SelectItem>
            <SelectItem value="new">One order or fewer</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="cfrom" className="block text-xs text-muted-foreground">From</label>
            <Input id="cfrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <label htmlFor="cto" className="block text-xs text-muted-foreground">To</label>
            <Input id="cto" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {!isLoading && <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground"><span>Page {page + 1}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0 || isFetching} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={isFetching || rows.length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</Button></div></div>}

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
