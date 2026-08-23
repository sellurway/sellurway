import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STRIPE_API = "https://api.stripe.com/v1";

function form(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

async function stripeRequest<T>(secretKey: string, path: string, init?: { method?: string; body?: string }) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(init?.body ? { body: init.body } : {}),
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? "Stripe request failed");
  return json;
}

/** Save (or replace) a merchant's own Stripe secret key for their store. */
export const connectStripe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string; secretKey: string }) => {
    const key = input.secretKey.trim();
    if (!/^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$/.test(key)) {
      throw new Error("That doesn't look like a Stripe secret key (starts with sk_test_ or sk_live_).");
    }
    return { storeId: input.storeId, secretKey: key };
  })
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase
      .from("stores")
      .select("id")
      .eq("id", data.storeId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!store) throw new Error("Store not found");

    const account = await stripeRequest<{ id: string; business_profile?: { name?: string | null }; email?: string | null }>(
      data.secretKey,
      "/account",
    );

    const livemode = data.secretKey.includes("_live_");
    const last4 = data.secretKey.slice(-4);
    const label = account.business_profile?.name ?? account.email ?? account.id;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upsertError } = await supabaseAdmin.from("store_stripe_credentials").upsert(
      {
        store_id: data.storeId,
        secret_key: data.secretKey,
        key_last4: last4,
        livemode,
        account_label: label,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id" },
    );
    if (upsertError) throw upsertError;

    const { error: storeError } = await supabaseAdmin
      .from("stores")
      .update({ stripe_enabled: true, stripe_key_last4: last4, stripe_livemode: livemode })
      .eq("id", data.storeId);
    if (storeError) throw storeError;

    return { last4, livemode, label };
  });

export const disconnectStripe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: store } = await context.supabase
      .from("stores")
      .select("id")
      .eq("id", data.storeId)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!store) throw new Error("Store not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("store_stripe_credentials").delete().eq("store_id", data.storeId);
    await supabaseAdmin
      .from("stores")
      .update({ stripe_enabled: false, stripe_key_last4: null, stripe_livemode: false })
      .eq("id", data.storeId);
    return { ok: true };
  });

/** Create a Stripe Checkout Session for an existing order. Public: order numbers are unguessable. */
export const createStripeCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string; origin: string }) => {
    if (!input.slug || !input.orderNumber) throw new Error("Missing order");
    if (!/^https?:\/\//.test(input.origin)) throw new Error("Invalid origin");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id,name,slug,currency,stripe_enabled")
      .eq("slug", data.slug)
      .eq("published", true)
      .eq("suspended", false)
      .maybeSingle();
    if (!store?.stripe_enabled) throw new Error("Card payments are not available for this store.");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,total,currency,customer_email,payment_status")
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.payment_status === "paid") throw new Error("This order is already paid.");

    const { data: creds } = await supabaseAdmin
      .from("store_stripe_credentials")
      .select("secret_key")
      .eq("store_id", store.id)
      .maybeSingle();
    if (!creds) throw new Error("Card payments are not available for this store.");

    const amount = Math.round(Number(order.total) * 100);
    const params: Record<string, string> = {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": String(order.currency ?? store.currency).toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][price_data][product_data][name]": `${store.name} — order ${order.order_number}`,
      success_url: `${data.origin}/s/${store.slug}/confirmation?order=${order.order_number}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/s/${store.slug}/confirmation?order=${order.order_number}`,
      "metadata[order_number]": order.order_number,
      client_reference_id: order.order_number,
    };
    if (order.customer_email) params["customer_email"] = order.customer_email;

    const session = await stripeRequest<{ id: string; url: string }>(creds.secret_key, "/checkout/sessions", {
      method: "POST",
      body: form(params),
    });

    await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return { url: session.url };
  });

/** Verify a completed Stripe Checkout Session and mark the order paid. */
export const confirmStripePayment = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string; sessionId: string }) => {
    if (!input.sessionId.startsWith("cs_")) throw new Error("Invalid session");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!store) throw new Error("Store not found");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,total,currency,payment_status")
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.payment_status === "paid") return { paid: true as const };

    const { data: creds } = await supabaseAdmin
      .from("store_stripe_credentials")
      .select("secret_key")
      .eq("store_id", store.id)
      .maybeSingle();
    if (!creds) throw new Error("Card payments are not available for this store.");

    const session = await stripeRequest<{
      payment_status: string;
      amount_total: number;
      payment_intent: string | null;
      client_reference_id: string | null;
    }>(creds.secret_key, `/checkout/sessions/${data.sessionId}`);

    const expected = Math.round(Number(order.total) * 100);
    const valid =
      session.payment_status === "paid" &&
      session.client_reference_id === data.orderNumber &&
      session.amount_total === expected;
    if (!valid) return { paid: false as const };

    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "paid",
        stripe_payment_intent: session.payment_intent,
      })
      .eq("id", order.id);

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      store_id: store.id,
      kind: "order",
      provider: "stripe",
      provider_reference: session.payment_intent,
      amount: Number(order.total),
      currency: order.currency,
      status: "paid",
    });

    return { paid: true as const };
  });

/** Public order tracking lookup by store slug + order number. */
export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; orderNumber: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin.from("stores").select("id").eq("slug", data.slug).maybeSingle();
    if (!store) return null;
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number,status,payment_status,delivery_status,courier_name,tracking_number,tracking_url,shipped_at,total,currency,created_at")
      .eq("store_id", store.id)
      .eq("order_number", data.orderNumber.trim().toUpperCase())
      .maybeSingle();
    return order ?? null;
  });
