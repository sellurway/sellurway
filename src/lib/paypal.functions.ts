import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAYPAL_API = "https://api-m.paypal.com";

async function getPayPalAccessToken(clientId: string, clientSecret: string) {
  const auth = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const response = await fetch(PAYPAL_API + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ??
        data.error ??
        "PayPal rejected these API credentials. Check the Client ID and Client Secret.",
    );
  }

  return data.access_token;
}

async function paypalRequest<T>(
  path: string,
  init: RequestInit & { accessToken: string },
) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + init.accessToken);
  headers.set("Content-Type", "application/json");

  const response = await fetch(PAYPAL_API + path, { ...init, headers });
  const result = (await response.json()) as T & {
    message?: string;
    details?: Array<{ description?: string }>;
  };

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
    const { data: credentials, error } = await context.supabase
      .from("store_paypal_credentials")
      .select("client_id_last4,livemode")
      .eq("store_id", data.storeId)
      .maybeSingle();

    if (error) throw error;

    return {
      status: credentials ? "connected" : "not_connected",
      clientIdLast4: credentials?.client_id_last4 ?? null,
      livemode: credentials?.livemode ?? null,
    };
  });

export const connectPayPal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string; clientId: string; clientSecret: string }) => {
    const clientId = input.clientId.trim();
    const clientSecret = input.clientSecret.trim();

    if (clientId.length < 10) {
      throw new Error("Enter a valid PayPal Client ID.");
    }
    if (clientSecret.length < 10) {
      throw new Error("Enter a valid PayPal Client Secret.");
    }

    return { storeId: input.storeId, clientId, clientSecret };
  })
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase
      .from("stores")
      .select("id")
      .eq("id", data.storeId)
      .eq("owner_id", context.userId)
      .maybeSingle();

    if (error) throw error;
    if (!store) throw new Error("Store not found.");

    await getPayPalAccessToken(data.clientId, data.clientSecret);

    const livemode = true;
    const clientIdLast4 = data.clientId.slice(-4);

    const { data: existing, error: existingError } = await context.supabase
      .from("store_paypal_credentials")
      .select("store_id")
      .eq("store_id", data.storeId)
      .maybeSingle();

    if (existingError) throw existingError;

    const { error: credentialError } = existing
      ? await context.supabase
          .from("store_paypal_credentials")
          .update({
            client_id: data.clientId,
            client_secret: data.clientSecret,
            client_id_last4: clientIdLast4,
            livemode,
            updated_at: new Date().toISOString(),
          })
          .eq("store_id", data.storeId)
      : await context.supabase.from("store_paypal_credentials").insert({
          store_id: data.storeId,
          client_id: data.clientId,
          client_secret: data.clientSecret,
          client_id_last4: clientIdLast4,
          livemode,
        });

    if (credentialError) throw credentialError;

    return { clientIdLast4, livemode };
  });

export const disconnectPayPal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: store } = await context.supabase
      .from("stores")
      .select("id")
      .eq("id", data.storeId)
      .eq("owner_id", context.userId)
      .maybeSingle();

    if (!store) throw new Error("Store not found.");

    const { error } = await context.supabase
      .from("store_paypal_credentials")
      .delete()
      .eq("store_id", data.storeId);

    if (error) throw error;
    return { ok: true };
  });

export const createPayPalCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string; origin: string }) => {
    if (!input.slug || !input.orderNumber) throw new Error("Missing order.");
    if (!/^https?:\\/\\//.test(input.origin)) throw new Error("Invalid origin.");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id,name,slug,currency,payment_methods")
      .eq("slug", data.slug)
      .eq("published", true)
      .eq("suspended", false)
      .maybeSingle();

    if (!store) throw new Error("Store not available.");

    const methods = Array.isArray(store.payment_methods)
      ? (store.payment_methods as string[])
      : [];
    if (!methods.includes("paypal")) {
      throw new Error("PayPal payments are not enabled for this store.");
    }

    const { data: credentials } = await supabaseAdmin
      .from("store_paypal_credentials")
      .select("client_id,client_secret")
      .eq("store_id", store.id)
      .maybeSingle();

    if (!credentials) {
      throw new Error("This store has not connected its PayPal account yet.");
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,total,currency,customer_email,payment_status")
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber)
      .maybeSingle();

    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") {
      throw new Error("This order is already paid.");
    }

    const accessToken = await getPayPalAccessToken(
      credentials.client_id,
      credentials.client_secret,
    );

    const amount = Number(order.total).toFixed(2);
    const result = await paypalRequest<{
      id: string;
      status: string;
      links?: Array<{ href: string; rel: string }>;
    }>("/v2/checkout/orders", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: order.order_number,
          invoice_id: order.order_number,
          amount: {
            currency_code: String(order.currency ?? store.currency).toUpperCase(),
            value: amount,
          },
        }],
        application_context: {
          brand_name: String(store.name).slice(0, 127),
          user_action: "PAY_NOW",
          return_url:
            data.origin +
            "/s/" +
            store.slug +
            "/confirmation?order=" +
            encodeURIComponent(order.order_number),
          cancel_url:
            data.origin +
            "/s/" +
            store.slug +
            "/confirmation?order=" +
            encodeURIComponent(order.order_number),
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

    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id,currency")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!store) throw new Error("Store not found.");

    const { data: credentials } = await supabaseAdmin
      .from("store_paypal_credentials")
      .select("client_id,client_secret")
      .eq("store_id", store.id)
      .maybeSingle();

    if (!credentials) throw new Error("This store has not connected PayPal.");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,total,currency,payment_status")
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber)
      .maybeSingle();

    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") return { paid: true as const };

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id,provider_reference")
      .eq("store_id", store.id)
      .eq("order_id", order.id)
      .eq("provider", "paypal")
      .eq("provider_reference", data.paypalOrderId)
      .maybeSingle();

    if (!payment) throw new Error("PayPal payment record not found.");

    const accessToken = await getPayPalAccessToken(
      credentials.client_id,
      credentials.client_secret,
    );

    const result = await paypalRequest<{
      id: string;
      status: string;
      purchase_units?: Array<{
        payments?: {
          captures?: Array<{
            id: string;
            status: string;
            amount?: { value?: string; currency_code?: string };
          }>;
        };
      }>;
    }>("/v2/checkout/orders/" + encodeURIComponent(data.paypalOrderId) + "/capture", {
      method: "POST",
      accessToken,
      body: JSON.stringify({}),
    });

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    const expected = Number(order.total).toFixed(2);
    const valid =
      result.status === "COMPLETED" &&
      capture?.status === "COMPLETED" &&
      capture.amount?.value === expected &&
      capture.amount?.currency_code ===
        String(order.currency ?? store.currency).toUpperCase();

    if (!valid) return { paid: false as const };

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "paid" })
      .eq("id", order.id);

    await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        provider_reference: capture.id,
      })
      .eq("id", payment.id);

    return { paid: true as const, captureId: capture.id };
  });