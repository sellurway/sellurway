import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const PLATFORM_DOMAIN = "sellurway.shop";
const PLATFORM_HOSTS = new Set([
  PLATFORM_DOMAIN,
  `www.${PLATFORM_DOMAIN}`,
  "sellurway.vercel.app",
  "www.sellurway.vercel.app",
  "localhost",
  "127.0.0.1",
]);
const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "dashboard"]);

function tenantFromPlatformHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const suffix = `.${PLATFORM_DOMAIN}`;
  if (!host.endsWith(suffix)) return null;
  const tenant = host.slice(0, -suffix.length);
  if (!tenant || tenant.includes(".") || RESERVED_SUBDOMAINS.has(tenant)) return null;
  return tenant;
}

function customDomainFromHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || PLATFORM_HOSTS.has(host)) return null;
  if (host.endsWith(`.${PLATFORM_DOMAIN}`)) return null;
  if (host.endsWith(".vercel.app")) return null;
  if (host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    rewrite: {
      input: ({ url }) => {
        if (url.pathname.startsWith("/s/")) return url;

        const platformTenant = tenantFromPlatformHost(url.hostname);
        if (platformTenant) {
          url.pathname = `/s/${platformTenant}${url.pathname === "/" ? "" : url.pathname}`;
          return url;
        }

        const customDomain = customDomainFromHost(url.hostname);
        if (customDomain) {
          url.pathname = `/s/${customDomain}${url.pathname === "/" ? "" : url.pathname}`;
        }
        return url;
      },
      output: ({ url }) => {
        const match = url.pathname.match(/^\/s\/([^/]+)(\/.*)?$/);
        if (!match) return url;

        const tenant = match[1];
        if (!tenant) return url;

        if (tenant.includes(".")) {
          url.hostname = tenant;
        } else {
          url.hostname = `${tenant}.${PLATFORM_DOMAIN}`;
        }
        url.pathname = match[2] || "/";
        return url;
      },
    },
  });

  return router;
};
