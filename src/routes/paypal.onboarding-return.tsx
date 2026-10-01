import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/paypal/onboarding-return")({
  component: PayPalOnboardingReturn,
});

function PayPalOnboardingReturn() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">PayPal connection</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        SellUrWay now connects PayPal using the seller's own API credentials. Return to Settings to connect or update your PayPal account.
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
