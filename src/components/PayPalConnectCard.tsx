import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock3, Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPayPalSellerOnboarding, getPayPalSellerConnection } from "@/lib/paypal.functions";
import { supabase } from "@/integrations/supabase/client";

export function PayPalConnectCard({ storeId }: { storeId: string }) {
  const getConnection = useServerFn(getPayPalSellerConnection);
  const startOnboarding = useServerFn(createPayPalSellerOnboarding);

  async function getSupabaseSessionData() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Your SellUrWay session is missing. Please sign in again.");
    }

    const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
    const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error("SellUrWay Supabase connection is not available.");
    }

    return {
      storeId,
      supabaseUrl,
      supabasePublishableKey,
      accessToken: data.session.access_token,
    };
  }

  const connection = useQuery({
    queryKey: ["paypal-connection", storeId],
    queryFn: async () => getConnection({ data: await getSupabaseSessionData() }),
  });
  const connect = useMutation({
    mutationFn: async () => startOnboarding({ data: await getSupabaseSessionData() }),
    onSuccess: ({ actionUrl }) => {
      void connection.refetch();
      window.location.assign(actionUrl);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (connection.data?.status === "pending") {
      const timer = window.setInterval(() => void connection.refetch(), 10000);
      return () => window.clearInterval(timer);
    }
  }, [connection.data?.status, connection.refetch]);

  const status = connection.data?.status ?? "not_connected";
  const isPending = status === "pending";
  const isConnected = status === "connected";

  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <WalletCards className="h-4 w-4 text-primary" />
        <p className="font-display font-semibold">PayPal payments</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Connect your PayPal account so customers can pay for products from your store.
      </p>

      {isConnected ? (
        <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">PayPal connected</p>
            <p className="text-xs text-muted-foreground">Your store is connected to PayPal.</p>
          </div>
        </div>
      ) : isPending ? (
        <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">PayPal connection pending</p>
            <p className="text-xs text-muted-foreground">Finish the PayPal setup. SellUrWay will keep checking the connection status.</p>
          </div>
        </div>
      ) : (
        <Button onClick={() => connect.mutate()} disabled={connect.isPending || connection.isLoading}>
          {connect.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Connect PayPal
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        You will complete the connection securely on PayPal. SellUrWay does not see your PayPal password.
      </p>
    </div>
  );
}
