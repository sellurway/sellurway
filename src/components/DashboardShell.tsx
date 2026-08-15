import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Package,
  Palette,
  Receipt,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { CrownBadge } from "@/components/CrownBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/themes", label: "Themes", icon: Palette },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/support", label: "Support", icon: LifeBuoy },
] as const;

export function DashboardShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { profile, isLifetime, activeStore, isStaff } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Logo to="/dashboard" />
          <div className="flex items-center gap-2">
            {isLifetime && <CrownBadge />}
            <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground sm:inline">
              {profile?.email}
            </span>
            {activeStore && (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/s/$slug" params={{ slug: activeStore.slug }} target="_blank">
                  View store <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        <nav className="container-page -mb-px flex gap-1 overflow-x-auto pb-0">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "!border-primary !text-foreground font-medium" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              to="/admin"
              className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "!border-primary !text-foreground font-medium" }}
            >
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>
      </header>

      <main className="container-page py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

export function NoStore() {
  return (
    <div className="surface-card p-10 text-center">
      <p className="font-display text-lg font-semibold">You don't have a store yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Create your storefront first — then products, orders and customers all appear here.
      </p>
      <Button asChild className="mt-5">
        <Link to="/onboarding">Create your store</Link>
      </Button>
    </div>
  );
}
