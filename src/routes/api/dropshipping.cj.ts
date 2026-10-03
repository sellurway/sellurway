import { createFileRoute } from "@tanstack/react-router";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
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
            return json({ connected: true });
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
