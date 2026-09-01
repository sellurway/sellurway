import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Always show the banner shortly after entering Sellurway.
    // The install action becomes available when the browser provides its PWA prompt.
    const showTimer = window.setTimeout(() => setVisible(true), 1000);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 30000);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setVisible(false);
      return;
    }

    // Some browsers (especially iPhone/iPad) do not expose beforeinstallprompt.
    // Give the user the correct manual installation hint instead.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      alert("To install Sellurway: tap Share, then choose Add to Home Screen.");
    } else {
      alert("To install Sellurway, open your browser menu and choose Install app or Add to Home screen.");
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg sm:left-auto sm:right-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Download className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Download Sellurway</p>
        <p className="text-xs text-muted-foreground">Install the app for quick access.</p>
      </div>

      <button onClick={install} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
        Download
      </button>

      <button onClick={() => setVisible(false)} aria-label="Close download prompt" className="shrink-0 text-muted-foreground transition hover:text-foreground">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
