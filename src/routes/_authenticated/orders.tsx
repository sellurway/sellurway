import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Empty } from "@/components/Empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { DELIVERY_STATUSES, ORDER_STATUSES, labelize } from "@/lib/store-options";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Sellurway" },
      { name: "description", content: "Track, filter and update every order that comes into your store." },
      { property: "og:title", content: "Orders — Sellurway" },
      { property: "og:description", content: "Order queue with delivery and payment status updates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  source: string;
  status: string;
  delivery_status: string | null;
  payment_status: string;
  payment_method: string | null;
  fulfillment_type: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  delivery_address: string | null;
  delivery_apartment: string | null;
  delivery_city: string | null;
  delivery_postal_code: string | null;
  delivery_instructions: string | null;
  preferred_delivery_at: string | null;
  notes: string | null;
  created_at: string;
}

const statusTone: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  paid: "default",
  processing: "secondary",
  shipped: "secondary",
  completed: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

function OrdersPage() {
  const { activeStore } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", activeStore!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["order-items", openId],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("id,product_name,variant_label,unit_price,quantity,line_total")
        .eq("order_id", openId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { status?: OrderRow["status"]; delivery_status?: string } }) => {
      const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", activeStore?.id] });
      toast.success("Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!activeStore) {
    return (
      <DashboardShell title="Orders">
        <NoStore />
      </DashboardShell>
    );
  }

  const all = orders ?? [];
  const q = search.trim().toLowerCase();
  const filtered = all.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      (source === "all" || o.source === source) &&
      (q === "" ||
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.customer_email ?? "").toLowerCase().includes(q) ||
        (o.customer_phone ?? "").includes(q)),
  );
  const open = all.find((o) => o.id === openId) ?? null;
  const revenue = filtered
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <DashboardShell
      title="Orders"
      description={`${filtered.length} order${filtered.length === 1 ? "" : "s"} shown · ${formatMoney(revenue, all[0]?.currency)} in value`}
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search order number, name, email or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {labelize(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="online_checkout">Full checkout</SelectItem>
            <SelectItem value="direct_order">Direct order</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : filtered.length === 0 ? (
        <Empty
          icon={Receipt}
          title={all.length === 0 ? "No orders yet" : "No orders match those filters"}
          description={
            all.length === 0
              ? "Share your store link — every order placed lands here with the customer's details."
              : "Try clearing the search or choosing a different status."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-xl)] border">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Delivery</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t bg-card">
                  <td className="p-3">
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</p>
                  </td>
                  <td className="p-3">
                    <p>{o.customer_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_phone ?? o.customer_email ?? ""}</p>
                  </td>
                  <td className="p-3 text-xs">{labelize(o.source)}</td>
                  <td className="p-3 font-medium">{formatMoney(o.total, o.currency)}</td>
                  <td className="p-3">
                    <Select
                      value={o.status}
                      onValueChange={(v) => update.mutate({ id: o.id, patch: { status: v as OrderRow["status"] } })}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {labelize(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Select
                      value={o.delivery_status ?? "new"}
                      onValueChange={(v) => update.mutate({ id: o.id, patch: { delivery_status: v } })}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {labelize(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setOpenId(o.id)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {open.order_number}
                  <Badge variant={statusTone[open.status] ?? "outline"}>{labelize(open.status)}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer</p>
                  <p className="mt-1 font-medium">{open.customer_name ?? "—"}</p>
                  <p className="text-muted-foreground">{open.customer_phone ?? ""}</p>
                  <p className="text-muted-foreground">{open.customer_email ?? ""}</p>
                </div>
                {open.fulfillment_type === "delivery" && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery</p>
                    <p className="mt-1">
                      {[open.delivery_address, open.delivery_apartment, open.delivery_city, open.delivery_postal_code]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                    {open.preferred_delivery_at && (
                      <p className="text-muted-foreground">Preferred: {open.preferred_delivery_at}</p>
                    )}
                    {open.delivery_instructions && (
                      <p className="text-muted-foreground">Notes: {open.delivery_instructions}</p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Items</p>
                  <ul className="mt-1 space-y-1">
                    {(items ?? []).map((i) => (
                      <li key={i.id} className="flex justify-between gap-3">
                        <span>
                          {i.quantity} × {i.product_name}
                          {i.variant_label ? ` (${i.variant_label})` : ""}
                        </span>
                        <span>{formatMoney(i.line_total, open.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1 border-t pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatMoney(open.subtotal, open.currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>{formatMoney(open.shipping, open.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(open.total, open.currency)}</span>
                  </div>
                  <p className="pt-2 text-xs text-muted-foreground">
                    Payment: {labelize(open.payment_method)} · {labelize(open.payment_status)}
                  </p>
                </div>
                {open.notes && (
                  <p className="rounded-lg bg-muted p-3 text-muted-foreground">“{open.notes}”</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
