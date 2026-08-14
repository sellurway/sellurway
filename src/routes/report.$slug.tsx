import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_CATEGORIES } from "@/lib/store-options";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/report/$slug")({
  head: () => ({
    meta: [
      { title: "Report a store — Sellurway" },
      { name: "description", content: "Report a Sellurway store for fraud, prohibited products or other policy issues." },
      { property: "og:title", content: "Report a store — Sellurway" },
      { property: "og:description", content: "Tell the Sellurway team about a store that breaks our policies." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { slug } = useParams({ from: "/report/$slug" });
  const { user } = useAuth();
  const [category, setCategory] = useState(REPORT_CATEGORIES[0]!);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const { data: store, isLoading } = useQuery({
    queryKey: ["report-store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id,name,slug")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || busy) return;
    if (details.trim().length < 15) {
      toast.error("Please add a little more detail (at least 15 characters).");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("reports").insert({
        store_id: store.id,
        category,
        details: details.trim().slice(0, 2000),
        reporter_email: email.trim() || null,
        reporter_id: user?.id ?? null,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container-page flex h-16 items-center">
          <Logo />
        </div>
      </header>
      <main className="container-page max-w-xl py-14">
        {isLoading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        ) : !store ? (
          <p className="text-center text-sm text-muted-foreground">That store could not be found.</p>
        ) : done ? (
          <div className="surface-card p-8 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 font-display text-xl font-bold">Report received</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks for flagging this. Our team reviews every report and will take action if the store breaks our
              policies.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/">Back to Sellurway</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold tracking-tight">Report {store.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Let us know what's wrong. Reports are confidential and reviewed by the Sellurway team.
            </p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Reason</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {REPORT_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="details">What happened?</Label>
                <Textarea
                  id="details"
                  rows={5}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={2000}
                  placeholder="Describe the problem with as much detail as you can."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Your email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  placeholder="So we can follow up"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit report
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
