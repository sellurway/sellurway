import { supabase } from "@/integrations/supabase/client";

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

  // Save the stable storage path instead of a long-lived signed URL.
  return path;
}
