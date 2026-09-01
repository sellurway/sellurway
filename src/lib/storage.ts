import { supabase } from "@/integrations/supabase/client";

const LEGACY_BUCKET = "store-media";

// Cloudinary unsigned-upload settings. These are public identifiers, not secrets.
const CLOUDINARY_CLOUD_NAME = "kybbqkia";
const CLOUDINARY_UPLOAD_PRESET = "sellurway_uploads";

export function resolveStoreImage(value: string | null | undefined) {
  if (!value) return null;

  // Cloudinary URLs and older absolute URLs can be rendered directly.
  if (/^https?:\/\//i.test(value)) return value;

  // Backward compatibility for older Supabase storage records.
  const { data } = supabase.storage.from(LEGACY_BUCKET).getPublicUrl(value);
  return data.publicUrl;
}

export async function uploadStoreImage(file: File, userId: string, folder: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Images must be smaller than 8 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  // Organize uploads without exposing any private credentials.
  formData.append("folder", `sellurway/${userId}/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || "Image upload failed.");
  }

  if (!result?.secure_url) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  // Save the permanent HTTPS URL directly in the existing database.
  return result.secure_url as string;
}
