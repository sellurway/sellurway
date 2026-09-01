import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SEEN_KEY = "sellurway-install-banner-seen";

export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const closeBanner = () => {
    localStorage.setItem(SEEN_KEY, "true");
    setVisible(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(SEEN_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => closeBanner();

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const showTimer = window.setTimeout(() => setVisible(true), 1000);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(closeBanner, 30000);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      closeBanner();
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    alert(isIOS
      ? "To install Sellurway: tap Share, then Add to Home Screen."
      : "Use your browser menu and choose Install app or Add to Home screen.");
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg sm:left-auto sm:right-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install Sellurway</p>
        <p className="text-xs text-muted-foreground">Get quick access from your device.</p>
      </div>
      <button onClick={install} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
        Download
      </button>
      <button onClick={closeBanner} aria-label="Close download prompt" className="shrink-0 text-muted-foreground transition hover:text-foreground">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
