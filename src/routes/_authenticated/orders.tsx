import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Receipt, Truck } from "lucide-react";
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
import { downloadCsv, toCsv, withinRange } from "@/lib/csv";
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
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
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
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: {
        status?: OrderRow["status"];
        delivery_status?: string;
        courier_name?: string | null;
        tracking_number?: string | null;
        tracking_url?: string | null;
        shipped_at?: string | null;
      };
    }) => {
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
      withinRange(o.created_at, from, to) &&
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

  function exportCsv() {
    if (filtered.length === 0) {
      toast.error("No orders match those filters.");
      return;
    }
    const csv = toCsv(
      [
        "Order number",
        "Date",
        "Customer",
        "Email",
        "Phone",
        "Channel",
        "Order status",
        "Delivery status",
        "Payment status",
        "Payment method",
        "Fulfillment",
        "Subtotal",
        "Shipping",
        "Total",
        "Currency",
        "Address",
        "City",
        "Postal code",
        "Notes",
      ],
      filtered.map((o) => [
        o.order_number,
        o.created_at,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        labelize(o.source),
        labelize(o.status),
        o.delivery_status ? labelize(o.delivery_status) : "",
        labelize(o.payment_status),
        o.payment_method ? labelize(o.payment_method) : "",
        labelize(o.fulfillment_type),
        o.subtotal,
        o.shipping,
        o.total,
        o.currency,
        [o.delivery_address, o.delivery_apartment].filter(Boolean).join(", "),
        o.delivery_city,
        o.delivery_postal_code,
        o.notes,
      ]),
    );
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}`, csv);
    toast.success(`Exported ${filtered.length} orders`);
  }

  return (
    <DashboardShell
      title="Orders"
      description={`${filtered.length} order${filtered.length === 1 ? "" : "s"} shown · ${formatMoney(revenue, all[0]?.currency)} in value`}
      actions={
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">

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
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="from" className="block text-xs text-muted-foreground">From</label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <label htmlFor="to" className="block text-xs text-muted-foreground">To</label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>
              Clear dates
            </Button>
          )}
        </div>
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
                <TrackingEditor
                  key={open.id}
                  order={open}
                  saving={update.isPending}
                  onSave={(patch) => update.mutate({ id: open.id, patch })}
                />
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

type TrackingPatch = {
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
};

function TrackingEditor({
  order,
  saving,
  onSave,
}: {
  order: OrderRow;
  saving: boolean;
  onSave: (patch: TrackingPatch) => void;
}) {
  const [courier, setCourier] = useState(order.courier_name ?? "");
  const [number, setNumber] = useState(order.tracking_number ?? "");
  const [url, setUrl] = useState(order.tracking_url ?? "");

  const clean = (v: string) => (v.trim() === "" ? null : v.trim());
  const dirty =
    clean(courier) !== (order.courier_name ?? null) ||
    clean(number) !== (order.tracking_number ?? null) ||
    clean(url) !== (order.tracking_url ?? null);

  function save() {
    const trackingUrl = clean(url);
    if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
      toast.error("Tracking link must start with http:// or https://");
      return;
    }
    onSave({
      courier_name: clean(courier),
      tracking_number: clean(number),
      tracking_url: trackingUrl,
      shipped_at: clean(number) ? (order.shipped_at ?? new Date().toISOString()) : null,
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Courier &amp; tracking</p>
      </div>
      <p className="text-xs text-muted-foreground">
        What you enter here shows on the customer's order confirmation page.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="courier" className="block text-xs text-muted-foreground">Courier</label>
          <Input id="courier" value={courier} maxLength={60} onChange={(e) => setCourier(e.target.value)} placeholder="DHL, Aramex, local rider…" />
        </div>
        <div className="space-y-1">
          <label htmlFor="tracking" className="block text-xs text-muted-foreground">Tracking number</label>
          <Input id="tracking" value={number} maxLength={80} onChange={(e) => setNumber(e.target.value)} placeholder="ABC123456789" />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="trackurl" className="block text-xs text-muted-foreground">Tracking link (optional)</label>
        <Input id="trackurl" value={url} maxLength={300} onChange={(e) => setUrl(e.target.value)} placeholder="https://courier.com/track/ABC123456789" />
      </div>
      {order.shipped_at && (
        <p className="text-xs text-muted-foreground">Marked shipped {formatDateTime(order.shipped_at)}</p>
      )}
      <Button size="sm" onClick={save} disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save tracking"}
      </Button>
    </div>
  );
}
