import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { resolveStoreImage, uploadStoreImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  userId: string;
  folder: string;
  max?: number;
  label?: string;
  hint?: string;
  aspect?: "square" | "wide";
}

export function ImageUploader({ value, onChange, userId, folder, max = 5, label = "Images", hint, aspect = "square" }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = max - value.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, Math.max(0, remaining));
    if (!picked.length) return toast.error(`You can upload up to ${max} image${max > 1 ? "s" : ""}.`);
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const file of picked) paths.push(await uploadStoreImage(file, userId, folder));
      onChange([...value, ...paths]);
      toast.success(`${paths.length} image${paths.length > 1 ? "s" : ""} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{value.length} / {max}</span>
      </div>
      <div className={`grid gap-3 ${aspect === "wide" ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-5"}`}>
        {value.map((url, i) => (
          <div key={url} className={`group relative overflow-hidden rounded-lg border bg-muted ${aspect === "wide" ? "aspect-[16/6]" : "aspect-square"}`}>
            <img src={resolveStoreImage(url) ?? ""} alt="" className="h-full w-full object-cover" loading="lazy" />
            {i === 0 && aspect === "square" && <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">Main</span>}
            <button type="button" aria-label="Remove image" onClick={() => onChange(value.filter((u) => u !== url))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground transition hover:border-primary hover:text-primary ${aspect === "wide" ? "aspect-[16/6]" : "aspect-square"}`}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? "Uploading" : "Add"}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" multiple={max > 1} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {value.length === 0 && <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? "Uploading…" : "Choose image"}</Button>}
    </div>
  );
}
