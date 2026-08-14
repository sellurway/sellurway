import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadStoreImage(file: File, userId: string, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be smaller than 8 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("store-media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data, error: signError } = await supabase.storage
    .from("store-media")
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw new Error(signError?.message ?? "Could not read image.");

  return data.signedUrl;
}
