import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function getSupabaseAuthClient(accessToken: string) {
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error("SellUrWay authentication is not configured on the server. Add the existing Supabase URL and publishable key environment variables.");
  }

  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function requireLifetimeAccess(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Lifetime access is required for Dropshipping." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const token = authorization.slice(7);
  const supabase = getSupabaseAuthClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Response(JSON.stringify({ error: "Your session has expired. Please log in again." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Lifetime access check failed:", profileError);
    throw new Error("Could not verify your SellUrWay Lifetime access.");
  }

  if (profile?.plan !== "lifetime") {
    throw new Response(JSON.stringify({
      error: "Dropshipping is a SellUrWay Lifetime feature. Upgrade once to unlock it forever.",
      code: "LIFETIME_REQUIRED",
    }), {
      status: 402,
      headers: { "content-type": "application/json" },
    });
  }

  return { userId: userData.user.id, supabase };
}

function cloudflareConfig() {
  const accountId = process.env["CLOUDFLARE_ACCOUNT_ID"];
  const databaseId = process.env["CLOUDFLARE_D1_DATABASE_ID"];
  const apiToken = process.env["CLOUDFLARE_API_TOKEN"];

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Cloudflare Dropshipping storage is not configured. Add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_API_TOKEN to the SellUrWay server environment.",
    );
  }

  return { accountId, databaseId, apiToken };
}

async function cloudflareD1(sql: string, params: unknown[] = []) {
  const { accountId, databaseId, apiToken } = cloudflareConfig();
  const response = await fetch(
    `${CLOUDFLARE_API}/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ sql, params }),
    },
  );

  const body = await response.json().catch(() => null) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: Array<{ success?: boolean; results?: unknown[] }>;
  };

  if (!response.ok || body?.success === false) {
    throw new Error(body?.errors?.[0]?.message || "Cloudflare D1 request failed.");
  }

  const first = body.result?.[0];
  if (first?.success === false) {
    throw new Error("Cloudflare D1 query failed.");
  }

  return (first?.results ?? []) as Array<Record<string, unknown>>;
}

async function ensureDropshippingTable() {
  await cloudflareD1(`
    CREATE TABLE IF NOT EXISTS store_dropshipping_connections (
      store_id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      api_key TEXT NOT NULL,
      api_key_last4 TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    )
  `);
}

async function assertStoreOwner(supabase: ReturnType<typeof getSupabaseAuthClient>, storeId: string, userId: string) {
  const { data: store, error } = await supabase
    .from("stores")
    .select("id,owner_id")
    .eq("id", storeId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!store) {
    throw new Response(JSON.stringify({ error: "Store not found or you do not own this store." }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  return store;
}

async function saveConnection(storeId: string, apiKey: string) {
  await ensureDropshippingTable();
  await cloudflareD1(
    `INSERT INTO store_dropshipping_connections
      (store_id, provider, api_key, api_key_last4, enabled, updated_at)
      VALUES (?, 'cjdropshipping', ?, ?, 1, ?)
      ON CONFLICT(store_id) DO UPDATE SET
        provider = excluded.provider,
        api_key = excluded.api_key,
        api_key_last4 = excluded.api_key_last4,
        enabled = 1,
        updated_at = excluded.updated_at`,
    [storeId, apiKey, apiKey.slice(-4), new Date().toISOString()],
  );
}

async function getStoredApiKey(storeId: string) {
  await ensureDropshippingTable();
  const rows = await cloudflareD1(
    "SELECT api_key, api_key_last4 FROM store_dropshipping_connections WHERE store_id = ? AND enabled = 1 LIMIT 1",
    [storeId],
  );
  const row = rows[0];
  if (!row || typeof row.api_key !== "string") {
    throw new Error("CJdropshipping is not connected for this store. Enter your CJ API key and connect first.");
  }
  return { apiKey: row.api_key, last4: String(row.api_key_last4 ?? "") };
}

async function getAccessToken(apiKey: string) {
  const response = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const body = await response.json().catch(() => null) as {
    code?: number;
    data?: { accessToken?: string };
    message?: string;
  };
  if (!response.ok || body?.code !== 200 || !body.data?.accessToken) {
    throw new Error(body?.message || "CJ rejected the API key. Check that your CJ API app is authorized.");
  }
  return body.data.accessToken;
}

export const Route = createFileRoute("/api/dropshipping/cj")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { userId, supabase } = await requireLifetimeAccess(request);
          const body = await request.json().catch(() => ({})) as {
            apiKey?: string;
            accessToken?: string;
            action?: "connect" | "status" | "search" | "detail" | "stock";
            keyword?: string;
            page?: number;
            size?: number;
            pid?: string;
            vid?: string;
            storeId?: string;
          };

          const storeId = body.storeId?.trim();
          if (!storeId) return json({ error: "A store ID is required." }, 400);
          await assertStoreOwner(supabase, storeId, userId);

          const action = body.action ?? "search";
          const apiKey = body.apiKey?.trim();

          if (action === "connect") {
            if (!apiKey) return json({ error: "Enter your CJ API key." }, 400);
            if (apiKey.length > 200) return json({ error: "That CJ API key is too long." }, 400);

            // Validate the key before saving it in Cloudflare D1.
            await getAccessToken(apiKey);
            await saveConnection(storeId, apiKey);
            return json({ connected: true, last4: apiKey.slice(-4), storage: "cloudflare-d1" });
          }

          if (action === "status") {
            const connection = await getStoredApiKey(storeId);
            return json({ connected: true, last4: connection.last4, storage: "cloudflare-d1" });
          }

          const stored = await getStoredApiKey(storeId);
          const token = body.accessToken || await getAccessToken(stored.apiKey);

          if (action === "stock") {
            if (!body.vid?.trim()) return json({ error: "A CJ variant ID is required." }, 400);
            const response = await fetch(
              `${CJ_BASE}/product/stock/queryByVid?vid=${encodeURIComponent(body.vid.trim())}`,
              { headers: { "CJ-Access-Token": token } },
            );
            const result = await response.json().catch(() => null);
            if (!response.ok || result?.code !== 200) {
              return json({ error: result?.message || "CJ could not load stock." }, 502);
            }
            return json({ stock: result.data });
          }

          if (action === "detail") {
            if (!body.pid?.trim()) return json({ error: "A CJ product ID is required." }, 400);
            const response = await fetch(
              `${CJ_BASE}/product/query?pid=${encodeURIComponent(body.pid.trim())}&features=enable_combine`,
              { headers: { "CJ-Access-Token": token } },
            );
            const result = await response.json().catch(() => null);
            if (!response.ok || result?.code !== 200) {
              return json({ error: result?.message || "CJ could not load that product." }, 502);
            }
            return json({ product: result.data });
          }

          const keyword = body.keyword?.trim();
          if (!keyword) return json({ error: "Enter a product to search for." }, 400);

          const page = Math.max(1, Math.min(1000, Number(body.page) || 1));
          const size = Math.max(1, Math.min(50, Number(body.size) || 20));
          const params = new URLSearchParams({
            page: String(page),
            size: String(size),
            keyWord: keyword,
            features: "enable_description",
            sort: "desc",
            orderBy: "0",
          });

          const response = await fetch(`${CJ_BASE}/product/listV2?${params.toString()}`, {
            headers: { "CJ-Access-Token": token },
          });
          const result = await response.json().catch(() => null) as {
            code?: number;
            message?: string;
            data?: { content?: Array<Record<string, unknown>>; total?: number };
          };

          if (!response.ok || result?.code !== 200) {
            return json({ error: result?.message || "CJ product search failed." }, 502);
          }

          const products = (result.data?.content ?? []).map((item) => ({
            id: String(item.id ?? item.pid ?? ""),
            name: String(item.nameEn ?? item.name ?? "CJ product"),
            image: typeof item.bigImage === "string" ? item.bigImage : null,
            sellPrice: String(item.sellPrice ?? item.nowPrice ?? "0"),
            sku: typeof item.productSku === "string" ? item.productSku : null,
            inventory: Number(item.inventory ?? item.stock ?? 0),
            category: typeof item.categoryName === "string" ? item.categoryName : null,
          })).filter((item) => item.id);

          return json({
            products,
            total: Number(result.data?.total ?? products.length),
            page,
            size,
            storage: "cloudflare-d1",
          });
        } catch (error) {
          console.error("CJ dropshipping API error:", error);
          return json({
            error: error instanceof Error ? error.message : "Could not connect to CJ.",
          }, 500);
        }
      },
    },
  },
});