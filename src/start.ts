import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const PLATFORM_DOMAIN = "sellurway.shop";
const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "dashboard"]);

function rewriteStorefrontHost(request: Request): Request {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();
  const suffix = `.${PLATFORM_DOMAIN}`;

  if (!host.endsWith(suffix)) return request;

  const tenant = host.slice(0, -suffix.length);
  if (!tenant || tenant.includes(".") || RESERVED_SUBDOMAINS.has(tenant)) return request;

  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) return request;

  if (url.pathname.startsWith("/s/") || url.pathname === "/report" || url.pathname.startsWith("/report/")) {
    return request;
  }

  url.pathname = `/s/${tenant}${url.pathname === "/" ? "" : url.pathname}`;
  return new Request(url.toString(), request);
}

const hostRoutingMiddleware = createMiddleware().server(async ({ request, next }) => {
  return next({ request: rewriteStorefrontHost(request) });
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [hostRoutingMiddleware, errorMiddleware, csrfMiddleware],
}));
