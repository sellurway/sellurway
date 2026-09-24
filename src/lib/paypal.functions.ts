import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAYPAL_API = "https://api-m.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal live credentials are not configured on SellUrWay.");
  const auth = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const response = await fetch(PAYPAL_API + "/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description ?? "Could not authenticate with PayPal.");
  return data.access_token;
}

export const getPayPalSellerConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase.from("stores").select("id,theme_settings").eq("id", data.storeId).eq("owner_id", context.userId).maybeSingle();
    if (error) throw error;
    if (!store) throw new Error("Store not found.");
    const settings = (store.theme_settings ?? {}) as Record<string, unknown>;
    const paypal = (settings.paypal ?? {}) as Record<string, unknown>;
    return {
      status: typeof paypal.status === "string" ? paypal.status : "not_connected",
      merchantId: typeof paypal.merchantId === "string" ? paypal.merchantId : null,
      trackingId: typeof paypal.trackingId === "string" ? paypal.trackingId : null,
    };
  });

export const createPayPalSellerOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase.from("stores").select("id,name,slug,theme_settings").eq("id", data.storeId).eq("owner_id", context.userId).maybeSingle();
    if (error) throw error;
    if (!store) throw new Error("Store not found.");
    const organization = process.env.PAYPAL_PARTNER_ORGANIZATION;
    if (!organization) throw new Error("PayPal marketplace approval is not finished yet. SellUrWay still needs the PayPal partner organization value.");
    const accessToken = await getPayPalAccessToken();
    const trackingId = "sellurway_" + store.id;
    const currentSettings = (store.theme_settings ?? {}) as Record<string, unknown>;
    const currentPaypal = (currentSettings.paypal ?? {}) as Record<string, unknown>;
    const nextSettings = { ...currentSettings, paypal: { ...currentPaypal, status: "pending", trackingId, merchantId: null } };

    const response = await fetch(PAYPAL_API + "/v2/customer/partner-referrals", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        operations: [{ operation: "API_INTEGRATION", api_integration_preference: { rest_api_integration: { integration_method: "SDK", integration_type: "THIRD_PARTY", third_party_details: { signup_mode: "VERIFY_WITH_PAYPAL", organization } } } }],
        products: ["PPCP"],
        legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
        legal_country_code: "ZA",
        tracking_id: trackingId,
      }),
    });
    const result = (await response.json()) as { links?: Array<{ href?: string; rel?: string }>; error?: string; message?: string; details?: Array<{ description?: string }> };
    if (!response.ok) {
      const detail = result.details?.map((item) => item.description).filter(Boolean).join(" ");
      throw new Error(detail || result.message || result.error || "PayPal seller onboarding could not be started.");
    }
    const actionUrl = result.links?.find((link) => link.rel === "action_url")?.href ?? result.links?.find((link) => link.rel === "self")?.href;
    if (!actionUrl) throw new Error("PayPal did not return a seller onboarding URL.");
    const { error: updateError } = await context.supabase.from("stores").update({ theme_settings: nextSettings }).eq("id", store.id).eq("owner_id", context.userId);
    if (updateError) throw updateError;
    return { actionUrl, trackingId, storeName: store.name, slug: store.slug };
  });
