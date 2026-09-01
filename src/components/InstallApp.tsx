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
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    // If the browser supports installation, show the banner when ready.
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setVisible(false));

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", () => setVisible(false));
    };
  }, []);

  // Automatically hide the download/install banner after 30 seconds.
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 30000);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
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

      <button
        onClick={install}
        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
      >
        Download
      </button>

      <button
        onClick={() => setVisible(false)}
        aria-label="Close download prompt"
        className="shrink-0 text-muted-foreground transition hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
