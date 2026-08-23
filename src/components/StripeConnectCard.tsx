import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectStripe, disconnectStripe } from "@/lib/stripe.functions";

interface Props {
  storeId: string;
  enabled: boolean;
  last4: string | null;
  livemode: boolean;
}

export function StripeConnectCard({ storeId, enabled, last4, livemode }: Props) {
  const qc = useQueryClient();
  const connect = useServerFn(connectStripe);
  const disconnect = useServerFn(disconnectStripe);
  const [key, setKey] = useState("");

  const save = useMutation({
    mutationFn: () => connect({ data: { storeId, secretKey: key } }),
    onSuccess: (res) => {
      setKey("");
      toast.success(`Stripe connected (${res.livemode ? "live" : "test"} key ····${res.last4})`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => disconnect({ data: { storeId } }),
    onSuccess: () => {
      toast.success("Stripe disconnected");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <p className="font-display font-semibold">Card payments (Stripe)</p>
      </div>

      {enabled ? (
        <div className="space-y-3">
          <p className="text-sm">
            Connected with your {livemode ? "live" : "test"} key ending{" "}
            <span className="font-mono">····{last4}</span>. Shoppers can pay by card at checkout when you tick
            “Card (Stripe)” in your payment methods.
          </p>
          <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect Stripe
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste your own Stripe secret key. Payments go straight into your Stripe account — Sellurway never holds
            your money. Start with a <span className="font-mono">sk_test_</span> key to try it out.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="stripe-key">Stripe secret key</Label>
            <Input
              id="stripe-key"
              type="password"
              autoComplete="off"
              placeholder="sk_live_..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={() => save.mutate()} disabled={!key.trim() || save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Stripe
          </Button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Your key is stored server-side only and is never sent back to any browser.
          </p>
        </div>
      )}
    </div>
  );
}
