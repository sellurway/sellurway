import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPayPalSellerOnboarding } from "@/lib/paypal.functions";

export function PayPalConnectCard({ storeId }: { storeId: string }) {
  const startOnboarding = useServerFn(createPayPalSellerOnboarding);
  const connect = useMutation({
    mutationFn: () => startOnboarding({ data: { storeId } }),
    onSuccess: ({ actionUrl }) => window.location.assign(actionUrl),
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-primary" /><p className="font-display font-semibold">PayPal payments</p></div>
      <p className="text-sm text-muted-foreground">Connect your PayPal account so customers can pay for products from your store.</p>
      <Button onClick={() => connect.mutate()} disabled={connect.isPending}>{connect.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Connect PayPal</Button>
      <p className="text-xs text-muted-foreground">You will complete the connection securely on PayPal. SellUrWay does not see your PayPal password.</p>
    </div>
  );
}