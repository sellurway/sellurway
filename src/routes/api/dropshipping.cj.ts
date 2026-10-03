import { createFileRoute } from "@tanstack/react-router";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Response(JSON.stringify({ error: "Your session has expired. Please log in again." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
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

  return userData.user.id;
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
          await requireLifetimeAccess(request);
          const body = await request.json().catch(() => ({})) as {
            apiKey?: string;
            accessToken?: string;
            action?: "connect" | "search" | "detail" | "stock";
            keyword?: string;
            page?: number;
            size?: number;
            pid?: string;
            vid?: string;
            storeId?: string;
          };

          const apiKey = body.apiKey?.trim();
          if (!apiKey && !body.accessToken) return json({ error: "Enter your CJ API key." }, 400);
          if (apiKey && apiKey.length > 200) return json({ error: "That CJ API key is too long." }, 400);

          const token = body.accessToken || await getAccessToken(apiKey!);
          const action = body.action ?? "search";

          if (action === "connect") {
            if (!apiKey) return json({ error: "Enter your CJ API key." }, 400);
            if (!body.storeId?.trim()) return json({ error: "A store ID is required." }, 400);

            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: store } = await supabaseAdmin
              .from("stores")
              .select("id,owner_id")
              .eq("id", body.storeId.trim())
              .maybeSingle();
            if (!store) return json({ error: "Store not found." }, 404);
            const authorization = request.headers.get("authorization") ?? "";
            const accessToken = authorization.slice(7);
            const userResponse = await fetch(
              (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) + "/auth/v1/user",
              {
                headers: {
                  apikey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
                  Authorization: "Bearer " + accessToken,
                },
              },
            );
            const user = await userResponse.json().catch(() => null) as { id?: string };
            if (!user?.id || store.owner_id !== user.id) return json({ error: "You do not own this store." }, 403);

            const { error } = await supabaseAdmin.from("store_dropshipping_connections").upsert({
              store_id: store.id,
              provider: "cjdropshipping",
              api_key: apiKey,
              api_key_last4: apiKey.slice(-4),
              enabled: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: "store_id" });
            if (error) throw error;
            return json({ connected: true, last4: apiKey.slice(-4) });
          }


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
              {
                headers: { "CJ-Access-Token": token },
              },
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
