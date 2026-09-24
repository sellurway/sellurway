import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

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
  const connected = Boolean(params.merchantIdInPayPal && params.permissionsGranted);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <h1 className="mt-5 text-2xl font-bold">PayPal setup received</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {connected
          ? "PayPal has returned your seller connection details. You can return to SellUrWay."
          : "PayPal returned you to SellUrWay, but the connection is not fully confirmed yet."}
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        Return to SellUrWay
      </Link>
    </main>
  );
}
