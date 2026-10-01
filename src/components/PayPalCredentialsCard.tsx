import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPayPalStatus, connectPayPal, disconnectPayPal } from "@/lib/paypal.functions";

interface Props {
  storeId: string;
}

export function PayPalCredentialsCard({ storeId }: Props) {
  const qc = useQueryClient();
  const getStatus = useServerFn(getPayPalStatus);
  const connect = useServerFn(connectPayPal);
  const disconnect = useServerFn(disconnectPayPal);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const statusQuery = useQuery({
    queryKey: ["paypal-status", storeId],
    queryFn: () => getStatus({ data: { storeId } }),
  });

  const save = useMutation({
    mutationFn: () => connect({ data: { storeId, clientId, clientSecret } }),
    onSuccess: (res) => {
      setClientId("");
      setClientSecret("");
      toast.success(`PayPal connected (${res.livemode ? "live" : "sandbox"} credentials ····${res.last4})`);
      void qc.invalidateQueries({ queryKey: ["paypal-status", storeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => disconnect({ data: { storeId } }),
    onSuccess: () => {
      toast.success("PayPal disconnected");
      void qc.invalidateQueries({ queryKey: ["paypal-status", storeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const status = statusQuery.data;

  return (
    <div className="surface-card space-y-4 p-5">
      <div>
        <p className="font-display font-semibold">PayPal payments</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your own PayPal REST API credentials. Payments go directly through your PayPal merchant account.
        </p>
      </div>

      {status?.enabled ? (
        <div className="space-y-3">
          <p className="text-sm">
            Connected with your {status.livemode ? "live" : "sandbox"} credentials ending{" "}
            <span className="font-mono">····{status.last4}</span>.
          </p>
          <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect PayPal
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="paypal-client-id">PayPal Client ID</Label>
            <Input
              id="paypal-client-id"
              type="password"
              autoComplete="off"
              placeholder="Your PayPal Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paypal-client-secret">PayPal Secret</Label>
            <Input
              id="paypal-client-secret"
              type="password"
              autoComplete="off"
              placeholder="Your PayPal Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => save.mutate()}
            disabled={!clientId.trim() || !clientSecret.trim() || save.isPending}
          >
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect PayPal
          </Button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Your PayPal secret is stored server-side only and is never sent back to the browser.
          </p>
        </div>
      )}
    </div>
  );
}
