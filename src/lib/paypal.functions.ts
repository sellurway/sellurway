import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAYPAL_API = "https://api-m.paypal.com";
const PAYPAL_ATTRIBUTION_ID = process.env.PAYPAL_PARTNER_ATTRIBUTION_ID;

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

function authAssertion(clientId: string, sellerPayerId: string) {
  const b64 = (value: string) => Buffer.from(value).toString("base64url");
  return b64(JSON.stringify({ alg: "none" })) + "." + b64(JSON.stringify({ iss: clientId, payer_id: sellerPayerId })) + ".";
}

async function paypalRequest<T>(path: string, init: RequestInit & { accessToken: string; sellerPayerId: string }) {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + init.accessToken);
  headers.set("Content-Type", "application/json");
  headers.set("PayPal-Auth-Assertion", authAssertion(clientId, init.sellerPayerId));
  if (PAYPAL_ATTRIBUTION_ID) headers.set("PayPal-Partner-Attribution-Id", PAYPAL_ATTRIBUTION_ID);
  const response = await fetch(PAYPAL_API + path, { ...init, headers });
  const result = (await response.json()) as T & { message?: string; details?: Array<{ description?: string }> };
  if (!response.ok) {
    const detail = result.details?.map((item) => item.description).filter(Boolean).join(" ");
    throw new Error(detail || result.message || "PayPal request failed.");
  }
  return result;
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
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json", ...(PAYPAL_ATTRIBUTION_ID ? { "PayPal-Partner-Attribution-Id": PAYPAL_ATTRIBUTION_ID } : {}) },
      body: JSON.stringify({
        operations: [{ operation: "API_INTEGRATION", api_integration_preference: { rest_api_integration: { integration_method: "SDK", integration_type: "THIRD_PARTY", third_party_details: { signup_mode: "VERIFY_WITH_PAYPAL", organization } } } }],
        products: ["PPCP"],
        legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
        legal_country_code: "ZA",
        tracking_id: trackingId,
        partner_config_override: {
          return_url: "https://sellurway.vercel.app/paypal/onboarding-return",
          return_url_description: "Return to SellUrWay after PayPal seller setup",
        },
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

export const createPayPalCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string; origin: string }) => {
    if (!input.slug || !input.orderNumber) throw new Error("Missing order.");
    if (!/^https?:\/\//.test(input.origin)) throw new Error("Invalid origin.");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin.from("stores").select("id,name,slug,currency,payment_methods,theme_settings").eq("slug", data.slug).eq("published", true).eq("suspended", false).maybeSingle();
    if (!store) throw new Error("Store not available.");
    const methods = Array.isArray(store.payment_methods) ? store.payment_methods as string[] : [];
    if (!methods.includes("paypal")) throw new Error("PayPal payments are not enabled for this store.");

    const settings = (store.theme_settings ?? {}) as Record<string, unknown>;
    const paypal = (settings.paypal ?? {}) as Record<string, unknown>;
    const merchantId = typeof paypal.merchantId === "string" ? paypal.merchantId : "";
    const status = typeof paypal.status === "string" ? paypal.status : "not_connected";
    if (!merchantId || status !== "connected") throw new Error("This store is not connected to PayPal yet.");

    const { data: order } = await supabaseAdmin.from("orders").select("id,order_number,total,currency,customer_email,payment_status").eq("store_id", store.id).eq("order_number", data.orderNumber).maybeSingle();
    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") throw new Error("This order is already paid.");

    const accessToken = await getPayPalAccessToken();
    const amount = Number(order.total).toFixed(2);
    const result = await paypalRequest<{ id: string; status: string; links?: Array<{ href: string; rel: string }> }>("/v2/checkout/orders", {
      method: "POST",
      accessToken,
      sellerPayerId: merchantId,
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: order.order_number,
          invoice_id: order.order_number,
          amount: { currency_code: String(order.currency ?? store.currency).toUpperCase(), value: amount },
          payee: { merchant_id: merchantId },
        }],
        application_context: {
          brand_name: String(store.name).slice(0, 127),
          user_action: "PAY_NOW",
          return_url: data.origin + "/s/" + store.slug + "/confirmation?order=" + encodeURIComponent(order.order_number),
          cancel_url: data.origin + "/s/" + store.slug + "/confirmation?order=" + encodeURIComponent(order.order_number),
        },
      }),
    });

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      store_id: store.id,
      kind: "order",
      provider: "paypal",
      provider_reference: result.id,
      amount: Number(order.total),
      currency: order.currency ?? store.currency,
      status: "pending",
    });

    const approvalUrl = result.links?.find((link) => link.rel === "approve")?.href;
    if (!approvalUrl) throw new Error("PayPal did not return an approval link.");
    return { approvalUrl, paypalOrderId: result.id };
  });

export const capturePayPalPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string; paypalOrderId: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin.from("stores").select("id,currency,theme_settings").eq("slug", data.slug).maybeSingle();
    if (!store) throw new Error("Store not found.");

    const settings = (store.theme_settings ?? {}) as Record<string, unknown>;
    const paypal = (settings.paypal ?? {}) as Record<string, unknown>;
    const merchantId = typeof paypal.merchantId === "string" ? paypal.merchantId : "";
    if (!merchantId) throw new Error("This store is not connected to PayPal.");

    const { data: order } = await supabaseAdmin.from("orders").select("id,total,currency,payment_status").eq("store_id", store.id).eq("order_number", data.orderNumber).maybeSingle();
    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") return { paid: true as const };

    const { data: payment } = await supabaseAdmin.from("payments").select("id,provider_reference,amount,status").eq("store_id", store.id).eq("order_id", order.id).eq("provider", "paypal").eq("provider_reference", data.paypalOrderId).maybeSingle();
    if (!payment) throw new Error("PayPal payment record not found.");

    const accessToken = await getPayPalAccessToken();
    const result = await paypalRequest<{ id: string; status: string; purchase_units?: Array<{ payments?: { captures?: Array<{ id: string; status: string; amount?: { value?: string; currency_code?: string } }> } }> }>("/v2/checkout/orders/" + encodeURIComponent(data.paypalOrderId) + "/capture", {
      method: "POST",
      accessToken,
      sellerPayerId: merchantId,
      body: JSON.stringify({}),
    });

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    const expected = Number(order.total).toFixed(2);
    const valid = result.status === "COMPLETED" && capture?.status === "COMPLETED" && capture.amount?.value === expected && capture.amount?.currency_code === String(order.currency ?? store.currency).toUpperCase();
    if (!valid) return { paid: false as const };

    await supabaseAdmin.from("orders").update({ payment_status: "paid", status: "paid" }).eq("id", order.id);
    await supabaseAdmin.from("payments").update({ status: "paid", provider_reference: capture.id }).eq("id", payment.id);
    return { paid: true as const, captureId: capture.id };
  });

export const completePayPalSellerOnboarding = createServerFn({ method: "POST" })
  .inputValidator((input: { trackingId: string; merchantIdInPayPal: string; permissionsGranted: boolean }) => input)
  .handler(async ({ data }) => {
    if (!data.trackingId.startsWith("sellurway_") || !data.merchantIdInPayPal || !data.permissionsGranted) {
      throw new Error("PayPal seller connection was not completed.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const storeId = data.trackingId.slice("sellurway_".length);
    const { data: store } = await supabaseAdmin.from("stores").select("id,theme_settings").eq("id", storeId).maybeSingle();
    if (!store) throw new Error("Store not found.");
    const settings = (store.theme_settings ?? {}) as Record<string, unknown>;
    const paypal = (settings.paypal ?? {}) as Record<string, unknown>;
    const nextSettings = {
      ...settings,
      paypal: {
        ...paypal,
        status: "connected",
        trackingId: data.trackingId,
        merchantId: data.merchantIdInPayPal,
      },
    };
    const { error } = await supabaseAdmin.from("stores").update({ theme_settings: nextSettings }).eq("id", store.id);
    if (error) throw error;
    return { connected: true as const };
  });
