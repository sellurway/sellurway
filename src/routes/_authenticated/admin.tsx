import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Empty } from "@/components/Empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/format";
import { labelize } from "@/lib/store-options";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Staff admin — Sellurway" },
      { name: "description", content: "Internal Sellurway console for stores, reports and support tickets." },
      { property: "og:title", content: "Staff admin — Sellurway" },
      { property: "og:description", content: "Moderate stores, handle reports and answer support tickets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isStaff, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: stores } = useQuery({
    queryKey: ["admin-stores"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id,name,slug,published,suspended,created_at,currency")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id,store_id,category,details,status,reporter_email,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ["admin-tickets"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id,subject,category,status,created_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const suspend = useMutation({
    mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
      const { error } = await supabase.from("stores").update({ suspended }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_audit_logs").insert({
        actor_id: user!.id,
        action: suspended ? "store_suspended" : "store_reinstated",
        target_type: "store",
        target_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      toast.success("Store updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setReportStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setTicketStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "in_progress" | "resolved" | "closed" }) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tickets"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isStaff) {
    return (
      <DashboardShell title="Staff admin">
        <Empty icon={Shield} title="Staff only" description="This console is only available to Sellurway staff accounts." />
      </DashboardShell>
    );
  }

  const q = search.trim().toLowerCase();
  const filteredStores = (stores ?? []).filter(
    (s) => q === "" || s.name.toLowerCase().includes(q) || s.slug.includes(q),
  );

  return (
    <DashboardShell title="Staff admin" description="Stores, reports and support across the platform.">
      <Tabs defaultValue="stores">
        <TabsList>
          <TabsTrigger value="stores">Stores ({stores?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({reports?.filter((r) => r.status === "open").length ?? 0})</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets?.filter((t) => t.status !== "closed").length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="mt-4 space-y-3">
          <Input
            placeholder="Search stores"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="overflow-hidden rounded-[var(--radius-xl)] border">
            {filteredStores.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 border-b bg-card p-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /s/{s.slug} · {formatDateTime(s.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.suspended ? "destructive" : s.published ? "default" : "outline"}>
                    {s.suspended ? "Suspended" : s.published ? "Live" : "Draft"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={s.suspended ? "outline" : "destructive"}
                    onClick={() => suspend.mutate({ id: s.id, suspended: !s.suspended })}
                  >
                    {s.suspended ? "Reinstate" : "Suspend"}
                  </Button>
                </div>
              </div>
            ))}
            {filteredStores.length === 0 && <p className="p-4 text-sm text-muted-foreground">No stores found.</p>}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-3">
          {(reports ?? []).length === 0 ? (
            <Empty icon={Shield} title="No reports" description="Shopper reports about stores will appear here." />
          ) : (
            (reports ?? []).map((r) => (
              <div key={r.id} className="surface-card flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{r.category}</p>
                  <p className="text-sm text-muted-foreground">{r.details ?? "No details given"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.reporter_email ?? "Anonymous"} · {formatDateTime(r.created_at)}
                  </p>
                </div>
                <Select value={r.status} onValueChange={(v) => setReportStatus.mutate({ id: r.id, status: v })}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["open", "reviewing", "actioned", "dismissed"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {labelize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="tickets" className="mt-4 space-y-3">
          {(tickets ?? []).length === 0 ? (
            <Empty icon={Shield} title="No tickets" description="Merchant support tickets will appear here." />
          ) : (
            (tickets ?? []).map((t) => (
              <div key={t.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · {formatDateTime(t.created_at)}
                  </p>
                </div>
                <Select
                  value={t.status}
                  onValueChange={(v) =>
                    setTicketStatus.mutate({ id: t.id, status: v as "open" | "in_progress" | "resolved" | "closed" })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["open", "in_progress", "resolved", "closed"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {labelize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
