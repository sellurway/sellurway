import { supabase } from "@/integrations/supabase/client";

const BUCKET = "store-media";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function resolveStoreImage(value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(value);
  return data.publicUrl;
}

export async function uploadStoreImage(file: File, userId: string, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be smaller than 8 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error: signedUrlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS);

  if (signedUrlError || !data?.signedUrl) {
    throw new Error(signedUrlError?.message || "Could not create image URL.");
  }

  return data.signedUrl;
}
