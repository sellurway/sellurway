import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

function normalizeHost(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\.$/, "");
}

function isPlatformHost(host: string): boolean {
  return (
    host === "sellurway.vercel.app" ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".vercel.sh") ||
    host === "localhost" ||
    host.startsWith("localhost:") ||
    host === "127.0.0.1" ||
    host.startsWith("127.0.0.1:")
  );
}

async function resolveCustomDomainSlug(host: string): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey || isPlatformHost(host)) return null;

  const domain = normalizeHost(host);
  const params = new URLSearchParams({
    select: "slug",
    published: "eq.true",
    suspended: "eq.false",
    "theme_settings->>customDomain": `eq.${domain}`,
    limit: "1",
  });

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/stores?${params.toString()}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!response.ok) {
      console.error("Custom domain lookup failed:", response.status);
      return null;
    }

    const rows = (await response.json()) as Array<{ slug?: string }>;
    return rows[0]?.slug ?? null;
  } catch (error) {
    console.error("Custom domain lookup error:", error);
    return null;
  }
}

async function rewriteCustomDomainRequest(request: Request): Promise<Request> {
  const url = new URL(request.url);
  const host = normalizeHost(url.host);
  const slug = await resolveCustomDomainSlug(host);

  if (!slug || url.pathname !== "/") return request;

  url.pathname = `/s/${encodeURIComponent(slug)}`;
  return new Request(url, request);
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const routedRequest = await rewriteCustomDomainRequest(request);
      const response = await handler.fetch(routedRequest, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
