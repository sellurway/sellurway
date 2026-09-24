import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { completePayPalSellerOnboarding } from "@/lib/paypal.functions";

export const Route = createFileRoute("/paypal/onboarding-return")({
  validateSearch: (search: Record<string, unknown>) => ({
    merchantId: typeof search.merchantId === "string" ? search.merchantId : "",
    merchantIdInPayPal: typeof search.merchantIdInPayPal === "string" ? search.merchantIdInPayPal : "",
    permissionsGranted: search.permissionsGranted === true || search.permissionsGranted === "true",
    accountStatus: typeof search.accountStatus === "string" ? search.accountStatus : "",
  }),
  component: PayPalOnboardingReturn,
});

function PayPalOnboardingReturn() {
  const params = Route.useSearch();
  const complete = useServerFn(completePayPalSellerOnboarding);
  const [state, setState] = useState<"saving" | "connected" | "error">(
    params.merchantIdInPayPal && params.permissionsGranted ? "saving" : "error",
  );

  useEffect(() => {
    if (!params.merchantId || !params.merchantIdInPayPal || !params.permissionsGranted) return;
    void complete({
      data: {
        trackingId: params.merchantId,
        merchantIdInPayPal: params.merchantIdInPayPal,
        permissionsGranted: params.permissionsGranted,
      },
    }).then(() => setState("connected")).catch(() => setState("error"));
  }, [params.merchantId, params.merchantIdInPayPal, params.permissionsGranted]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      {state === "saving" ? <Loader2 className="mx-auto h-12 w-12 animate-spin" /> : <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />}
      <h1 className="mt-5 text-2xl font-bold">
        {state === "connected" ? "PayPal connected" : state === "saving" ? "Finishing PayPal setup…" : "PayPal setup incomplete"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {state === "connected"
          ? "Your PayPal seller connection is saved. You can return to your SellUrWay dashboard."
          : "PayPal did not return all of the information needed to connect this seller account."}
      </p>
      <Link to="/dashboard" className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
        Return to SellUrWay
      </Link>
    </main>
  );
}
