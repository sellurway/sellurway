import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectPayPal, disconnectPayPal, getPayPalSellerConnection } from "@/lib/paypal.functions";

export function PayPalConnectCard({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const getConnection = useServerFn(getPayPalSellerConnection);
  const connect = useServerFn(connectPayPal);
  const disconnect = useServerFn(disconnectPayPal);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const connection = useQuery({
    queryKey: ["paypal-connection", storeId],
    queryFn: () => getConnection({ data: { storeId } }),
  });

  const save = useMutation({
    mutationFn: () =>
      connect({
        data: {
          storeId,
          clientId,
          clientSecret,
        },
      }),
    onSuccess: (res) => {
      setClientId("");
      setClientSecret("");
      toast.success(`PayPal connected (Client ID ····${res.clientIdLast4})`);
      void qc.invalidateQueries({ queryKey: ["paypal-connection", storeId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => disconnect({ data: { storeId } }),
    onSuccess: () => {
      toast.success("PayPal disconnected");
      void qc.invalidateQueries({ queryKey: ["paypal-connection", storeId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    void connection.refetch();
  }, [storeId]);

  const connected = connection.data?.status === "connected";

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <WalletCards className="h-4 w-4 text-primary" />
        <p className="font-display font-semibold">PayPal payments</p>
      </div>

      {connected ? (
        <div className="space-y-3">
          <p className="text-sm">
            Connected with your PayPal Client ID ending{" "}
            <span className="font-mono">····{connection.data?.clientIdLast4}</span>.
            Customer payments go directly to the PayPal account associated with these credentials.
          </p>
          <Button variant="outline" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect PayPal
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste your own PayPal API credentials. SellUrWay uses them only on the server to create and capture
            payments for your store.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="paypal-client-id">PayPal Client ID</Label>
            <Input
              id="paypal-client-id"
              type="text"
              autoComplete="off"
              placeholder="Your PayPal Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paypal-client-secret">PayPal Client Secret</Label>
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
            Your Client Secret is stored server-side only and is never sent back to the browser.
          </p>
        </div>
      )}
    </div>
  );
}