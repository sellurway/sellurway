import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell, NoStore } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff — Sellurway" },
      { name: "description", content: "Manage the people who can help run your Sellurway store." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffPage,
});

type Member = {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
};

function StaffPage() {
  const { activeStore, user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["store-staff", activeStore?.id],
    enabled: !!activeStore,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_store_members", {
        _store_id: activeStore!.id,
      });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const clean = email.trim().toLowerCase();
      if (!clean || !clean.includes("@")) throw new Error("Enter a valid email address.");
      const { error } = await supabase.rpc("add_store_member_by_email", {
        _store_id: activeStore!.id,
        _email: clean,
        _role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["store-staff", activeStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-stores", user?.id] });
      toast.success("Staff member added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (member: Member) => {
      const { error } = await supabase.rpc("remove_store_member", {
        _store_id: activeStore!.id,
        _user_id: member.user_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-staff", activeStore?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-stores", user?.id] });
      toast.success("Staff member removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!activeStore) return <NoStore />;

  return (
    <DashboardShell
      title="Staff"
      description="Give trusted people access to help manage this store."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <div className="surface-card space-y-5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-semibold">Add staff</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The person must already have a SellUrWay account using the email you enter.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-email">Staff email</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="staff@example.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label>Access level</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={() => add.mutate()} disabled={add.isPending}>
            {add.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            {add.isPending ? "Adding…" : "Add staff member"}
          </Button>

          <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <p>Staff access is tied to their SellUrWay account. Store owners keep full control and can remove access at any time.</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display font-semibold">Your team</p>
              <p className="mt-1 text-sm text-muted-foreground">{members.length} staff member{members.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading staff…</div>
          ) : members.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No staff members yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Add your first team member using their SellUrWay email.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.full_name || member.email || "SellUrWay user"}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-1 text-[11px] capitalize">{member.role}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Remove ${member.email || "staff member"}`}
                    onClick={() => remove.mutate(member)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
