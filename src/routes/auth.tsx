import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput, validatePassword } from "@/components/PasswordInput";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: Mode; redirect?: string } => {
    const mode: Mode = search["mode"] === "login" ? "login" : "signup";
    const redirect = search["redirect"];
    return typeof redirect === "string" && redirect.startsWith("/") ? { mode, redirect } : { mode };
  },
  head: () => ({
    meta: [
      { title: "Log in or create your Sellurway store" },
      { name: "description", content: "Access your Sellurway dashboard or create a free account and open your online store today." },
      { property: "og:title", content: "Sellurway account" },
      { property: "og:description", content: "Create a free Sellurway account and open your store in minutes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      toast.error(pwError);
      return;
    }
    if (isSignup) {
      if (fullName.trim().length < 2) {
        toast.error("Enter your name.");
        return;
      }
      if (!agreed) {
        toast.error("Please accept the Terms and Privacy Policy to continue.");
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to Sellurway.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      refresh();
      navigate({ to: redirect && redirect.startsWith("/") ? redirect : "/dashboard", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(
        message.toLowerCase().includes("invalid login")
          ? "That email and password combination doesn't match an account."
          : message.toLowerCase().includes("already registered")
            ? "An account with that email already exists. Log in instead."
            : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {isSignup ? "Create your free store" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Five products free, forever. No card needed."
              : "Log in to manage your store, orders and customers."}
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Amara Okoye"
                  maxLength={80}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 6 characters, 1 number" : "Your password"}
                maxLength={72}
              />
              {isSignup && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters and include a number.
                </p>
              )}
            </div>

            {isSignup && (
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  className="mt-0.5"
                  aria-label="Accept terms"
                />
                <span className="text-muted-foreground">
                  I agree to the Sellurway Terms of Service and Privacy Policy.
                </span>
              </label>
            )}

            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignup ? "Create account" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New to Sellurway? "}
            <Link
              to="/auth"
              search={{ mode: isSignup ? "login" : "signup", ...(redirect ? { redirect } : {}) }}
              className="font-medium text-primary hover:underline"
            >
              {isSignup ? "Log in" : "Create one free"}
            </Link>
          </p>
        </div>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>

      <div className="relative hidden overflow-hidden bg-brand-gradient lg:block">
        <div className="flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-md">
            <p className="font-display text-2xl font-semibold leading-snug">
              “I sent the link to my WhatsApp status and took eleven orders the same evening.”
            </p>
            <footer className="mt-4 text-sm text-white/75">A Sellurway merchant, Lagos</footer>
          </blockquote>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-6 text-sm text-white/80">
            <div>
              <p className="font-display text-xl font-bold text-white">3</p>
              <p>ways to sell</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white">8</p>
              <p>themes</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white">$10</p>
              <p>once for unlimited</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
