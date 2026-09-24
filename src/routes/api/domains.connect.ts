import { createFileRoute } from "@tanstack/react-router";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
}
function validDomain(value: string) {
  if (!value || value.length > 253 || value.includes(" ")) return false;
  const labels = value.split(".");
  return labels.length >= 2 && labels.every((label) => label.length >= 1 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-") && /^[a-z0-9-]+$/.test(label));
}
async function supabaseRequest(path: string, accessToken: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SellUrWay database configuration is missing.");
  const response = await fetch(url + path, {
    ...init,
    headers: { apikey: key, Authorization: "Bearer " + accessToken, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

export const Route = createFileRoute("/api/domains/connect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authorization = request.headers.get("authorization") ?? "";
          if (!authorization.startsWith("Bearer ")) return json({ error: "You must be logged in." }, 401);
          const accessToken = authorization.slice(7);
          const body = await request.json().catch(() => ({})) as { storeId?: string; domain?: string };
          const storeId = body.storeId?.trim();
          const domain = normalizeDomain(body.domain ?? "");
          if (!storeId || !validDomain(domain)) return json({ error: "Enter a valid domain, for example yourstore.com." }, 400);

          const userResult = await supabaseRequest("/auth/v1/user", accessToken);
          if (!userResult.response.ok || !userResult.body?.id) return json({ error: "Your session has expired. Please log in again." }, 401);

          const storeResult = await supabaseRequest("/rest/v1/stores?id=eq." + encodeURIComponent(storeId) + "&select=id,owner_id&limit=1", accessToken);
          if (!storeResult.response.ok) return json({ error: "Could not verify your store." }, 500);
          const store = Array.isArray(storeResult.body) ? storeResult.body[0] : null;
          if (!store || store.owner_id !== userResult.body.id) return json({ error: "You do not have permission to connect a domain to this store." }, 403);

          const token = process.env.VERCEL_TOKEN;
          const projectId = process.env.VERCEL_PROJECT_ID;
          const teamId = process.env.VERCEL_TEAM_ID;
          if (!token || !projectId) return json({ error: "Custom domains are not fully configured yet. SellUrWay needs its Vercel project connection enabled." }, 503);

          const query = teamId ? "?teamId=" + encodeURIComponent(teamId) : "";
          const addResponse = await fetch("https://api.vercel.com/v10/projects/" + encodeURIComponent(projectId) + "/domains" + query, {
            method: "POST",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({ name: domain }),
          });
          const addBody = await addResponse.json().catch(() => null);
          if (!addResponse.ok && addBody?.error?.code !== "domain_already_in_use") {
            return json({ error: addBody?.error?.message || "Vercel could not add this domain." }, addResponse.status >= 400 && addResponse.status < 500 ? addResponse.status : 502);
          }

          const statusResponse = await fetch("https://api.vercel.com/v9/projects/" + encodeURIComponent(projectId) + "/domains/" + encodeURIComponent(domain) + (teamId ? "?teamId=" + encodeURIComponent(teamId) : ""), {
            headers: { Authorization: "Bearer " + token },
          });
          const statusBody = await statusResponse.json().catch(() => null);
          const verification = Array.isArray(statusBody?.verification) ? statusBody.verification : [];
          const dnsRecords = verification.map((item: { type?: string; domain?: string; value?: string }) => ({
            type: item.type ?? "TXT",
            name: item.domain ?? domain,
            value: item.value ?? "",
          })).filter((item: { value: string }) => item.value);

          return json({ domain, verified: statusBody?.verified === true, dnsRecords });
        } catch (error) {
          console.error(error);
          return json({ error: error instanceof Error ? error.message : "Could not connect this domain." }, 500);
        }
      },
    },
  },
});
