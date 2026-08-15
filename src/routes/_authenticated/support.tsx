import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { Empty } from "@/components/Empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/format";
import { SUPPORT_CATEGORIES, labelize } from "@/lib/store-options";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support — Sellurway" },
      { name: "description", content: "Open a support ticket and message the Sellurway team about your store." },
      { property: "og:title", content: "Support — Sellurway" },
      { property: "og:description", content: "Get help with your store, billing or orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { user, isLifetime } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(SUPPORT_CATEGORIES[0]!);
  const [body, setBody] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data: tickets } = useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id,subject,category,status,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["support-messages", openId],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id,body,is_staff,created_at")
        .eq("ticket_id", openId!)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !body.trim()) throw new Error("Add a subject and a message.");
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({ user_id: user!.id, subject: subject.trim(), category })
        .select("id")
        .single();
      if (error) throw error;
      const msg = await supabase
        .from("support_messages")
        .insert({ ticket_id: data.id, author_id: user!.id, body: body.trim(), is_staff: false });
      if (msg.error) throw msg.error;
      return data.id;
    },
    onSuccess: (id) => {
      setSubject("");
      setBody("");
      setOpenId(id);
      queryClient.invalidateQueries({ queryKey: ["support-tickets", user?.id] });
      toast.success("Ticket opened — we'll reply here.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!reply.trim()) return;
      const { error } = await supabase
        .from("support_messages")
        .insert({ ticket_id: openId!, author_id: user!.id, body: reply.trim(), is_staff: false });
      if (error) throw error;
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["support-messages", openId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell
      title="Support"
      description={isLifetime ? "Lifetime accounts get priority replies." : "We usually reply within a working day."}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="surface-card space-y-4 p-5">
          <p className="font-display font-semibold">Open a ticket</p>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">What's happening?</Label>
            <Textarea id="message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full">
            Send to support
          </Button>
        </div>

        <div className="space-y-4">
          {(tickets ?? []).length === 0 ? (
            <Empty icon={LifeBuoy} title="No tickets yet" description="Anything you send us shows up here with our replies." />
          ) : (
            (tickets ?? []).map((t) => (
              <div key={t.id} className="surface-card p-4">
                <button
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setOpenId(openId === t.id ? null : t.id)}
                >
                  <div>
                    <p className="font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category} · {formatDateTime(t.created_at)}
                    </p>
                  </div>
                  <Badge variant={t.status === "resolved" || t.status === "closed" ? "secondary" : "default"}>
                    {labelize(t.status)}
                  </Badge>
                </button>

                {openId === t.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {(messages ?? []).map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg p-3 text-sm ${m.is_staff ? "bg-primary/10" : "bg-muted"}`}
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {m.is_staff ? "Sellurway support" : "You"} · {formatDateTime(m.created_at)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))}
                    {t.status !== "closed" && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a reply"
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                        />
                        <Button size="icon" aria-label="Send reply" onClick={() => send.mutate()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
