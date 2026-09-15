import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const PLATFORM_DOMAIN = "sellurway.shop";
const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "dashboard"]);

function tenantFromHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const suffix = `.${PLATFORM_DOMAIN}`;
  if (!host.endsWith(suffix)) return null;
  const tenant = host.slice(0, -suffix.length);
  if (!tenant || tenant.includes(".") || RESERVED_SUBDOMAINS.has(tenant)) return null;
  return tenant;
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    rewrite: {
      // Browser URL → internal route.
      // Example: https://kora-home.sellurway.shop/ → /s/kora-home
      input: ({ url }) => {
        const tenant = tenantFromHost(url.hostname);
        if (!tenant || url.pathname.startsWith("/s/")) return url;
        url.pathname = `/s/${tenant}${url.pathname === "/" ? "" : url.pathname}`;
        return url;
      },
      // Internal route → clean browser URL.
      // Example: /s/kora-home/product/123 → https://kora-home.sellurway.shop/product/123
      output: ({ url }) => {
        const match = url.pathname.match(/^\/s\/([^/]+)(\/.*)?$/);
        if (!match) return url;
        const tenant = match[1];
        if (!tenant) return url;
        url.hostname = `${tenant}.${PLATFORM_DOMAIN}`;
        url.pathname = match[2] || "/";
        return url;
      },
    },
  });

  return router;
};
