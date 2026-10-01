import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAYPAL_SANDBOX = "https://api-m.sandbox.paypal.com";
const PAYPAL_LIVE = "https://api-m.paypal.com";

function paypalBase(livemode: boolean) {
  return livemode ? PAYPAL_LIVE : PAYPAL_SANDBOX;
}

async function paypalToken(clientId: string, clientSecret: string, livemode: boolean) {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${paypalBase(livemode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description ?? "PayPal credentials were rejected.");
  }
  return json.access_token;
}

async function paypalRequest<T>(
  token: string,
  livemode: boolean,
  path: string,
  init?: { method?: string; body?: unknown },
) {
  const res = await fetch(`${paypalBase(livemode)}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const json = (await res.json()) as T & {
    message?: string;
    details?: Array<{ description?: string }>;
  };
  if (!res.ok) {
    throw new Error(json.details?.[0]?.description ?? json.message ?? "PayPal request failed.");
  }
  return json;
}

async function getStoreForOwner(context: { supabase: any; userId: string }, storeId: string) {
  const { data: store, error } = await context.supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("owner_id", context.userId)
    .maybeSingle();
  if (error) throw error;
  if (!store) throw new Error("Store not found");
  return store;
}

export const getPayPalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data, context }) => {
    await getStoreForOwner(context, data.storeId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: creds, error } = await (supabaseAdmin as any)
      .from("store_paypal_credentials")
      .select("client_id_last4,livemode")
      .eq("store_id", data.storeId)
      .maybeSingle();
    if (error) throw error;
    return {
      enabled: Boolean(creds),
      last4: creds?.client_id_last4 ?? null,
      livemode: Boolean(creds?.livemode),
    };
  });

export const connectPayPal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string; clientId: string; clientSecret: string }) => {
    const clientId = input.clientId.trim();
    const clientSecret = input.clientSecret.trim();
    if (clientId.length < 5 || clientSecret.length < 5) {
      throw new Error("Enter your PayPal Client ID and Client Secret.");
    }
    return { storeId: input.storeId, clientId, clientSecret };
  })
  .handler(async ({ data, context }) => {
    await getStoreForOwner(context, data.storeId);

    let livemode = true;
    let token: string;
    try {
      token = await paypalToken(data.clientId, data.clientSecret, true);
    } catch {
      livemode = false;
      token = await paypalToken(data.clientId, data.clientSecret, false);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("store_paypal_credentials")
      .upsert(
        {
          store_id: data.storeId,
          client_id: data.clientId,
          client_secret: data.clientSecret,
          client_id_last4: data.clientId.slice(-4),
          livemode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" },
      );
    if (error) throw error;

    return { last4: data.clientId.slice(-4), livemode, tokenVerified: Boolean(token) };
  });

export const disconnectPayPal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data, context }) => {
    await getStoreForOwner(context, data.storeId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("store_paypal_credentials")
      .delete()
      .eq("store_id", data.storeId);
    if (error) throw error;
    return { ok: true };
  });

export const createPayPalCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string; origin: string }) => {
    if (!input.slug || !input.orderNumber) throw new Error("Missing order");
    if (!/^https?:\/\//.test(input.origin)) throw new Error("Invalid origin");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id,name,slug,currency,published,suspended")
      .eq("slug", data.slug)
      .eq("published", true)
      .eq("suspended", false)
      .maybeSingle();
    if (!store) throw new Error("Store not found.");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,total,currency,customer_email,payment_status,paypal_order_id")
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber)
      .maybeSingle();
    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") throw new Error("This order is already paid.");

    const { data: creds } = await (supabaseAdmin as any)
      .from("store_paypal_credentials")
      .select("client_id,client_secret,livemode")
      .eq("store_id", store.id)
      .maybeSingle();
    if (!creds) throw new Error("PayPal payments are not available for this store.");

    const token = await paypalToken(creds.client_id, creds.client_secret, creds.livemode);
    const orderCurrency = String(order.currency ?? store.currency).toUpperCase();
    const total = Number(order.total).toFixed(2);

    const paypalOrder = await paypalRequest<{ id: string; links?: Array<{ rel: string; href: string }> }>(
      token,
      creds.livemode,
      "/v2/checkout/orders",
      {
        method: "POST",
        body: {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: order.order_number,
              amount: { currency_code: orderCurrency, value: total },
            },
          ],
          application_context: {
            brand_name: store.name.slice(0, 127),
            user_action: "PAY_NOW",
            return_url: `${data.origin}/s/${store.slug}/confirmation?order=${order.order_number}`,
            cancel_url: `${data.origin}/s/${store.slug}/confirmation?order=${order.order_number}`,
          },
        },
      },
    );
    const approvalUrl = paypalOrder.links?.find((link) => link.rel === "approve")?.href;
    if (!approvalUrl) throw new Error("PayPal did not return an approval link.");

    await supabaseAdmin.from("orders").update({ paypal_order_id: paypalOrder.id } as never).eq("id", order.id);
    return { approvalUrl };
  });

export const capturePayPalPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string; paypalOrderId: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!store) throw new Error("Store not found.");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,total,currency,payment_status,paypal_order_id")
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber)
      .maybeSingle();
    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") return { paid: true as const };
    if (order.paypal_order_id !== data.paypalOrderId) throw new Error("Invalid PayPal order.");

    const { data: creds } = await (supabaseAdmin as any)
      .from("store_paypal_credentials")
      .select("client_id,client_secret,livemode")
      .eq("store_id", store.id)
      .maybeSingle();
    if (!creds) throw new Error("PayPal payments are not available for this store.");

    const token = await paypalToken(creds.client_id, creds.client_secret, creds.livemode);
    const captured = await paypalRequest<{
      status: string;
      purchase_units?: Array<{
        payments?: {
          captures?: Array<{
            id?: string;
            status?: string;
            amount?: { value?: string; currency_code?: string };
          }>;
        };
      }>;
    }>(
      token,
      creds.livemode,
      `/v2/checkout/orders/${encodeURIComponent(data.paypalOrderId)}/capture`,
      { method: "POST" },
    );

    const capture = captured.purchase_units?.[0]?.payments?.captures?.[0];
    const expected = Number(order.total).toFixed(2);
    const valid =
      captured.status === "COMPLETED" &&
      capture?.status === "COMPLETED" &&
      capture.amount?.value === expected &&
      String(capture.amount?.currency_code ?? order.currency).toUpperCase() === String(order.currency).toUpperCase();

    if (!valid) return { paid: false as const };

    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "paid" } as never)
      .eq("id", order.id);

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      store_id: store.id,
      kind: "order",
      provider: "paypal",
      provider_reference: capture.id ?? data.paypalOrderId,
      amount: Number(order.total),
      currency: order.currency,
      status: "paid",
    });

    return { paid: true as const };
  });
