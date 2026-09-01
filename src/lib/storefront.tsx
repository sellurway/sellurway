import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveStoreImage } from "@/lib/storage";
import candle from "@/assets/demo-candle.jpg";
import mug from "@/assets/demo-mug.jpg";
import tote from "@/assets/demo-tote.jpg";
import throwBlanket from "@/assets/demo-throw.jpg";
import type { ThemeSettings } from "@/lib/themes";

export interface PublicStore {
  id: string; name: string; slug: string; description: string | null; logo_url: string | null; banner_url: string | null;
  currency: string; country: string | null; category: string | null;
  selling_mode: "full_checkout" | "direct_order" | "whatsapp" | "multiple";
  product_action: string; whatsapp_number: string | null; contact_email: string | null; contact_phone: string | null;
  theme: string; theme_settings: ThemeSettings; delivery_settings: Record<string, unknown>; payment_methods: string[];
  policies: Record<string, string>; social_links: Record<string, string>; stripe_enabled?: boolean;
}

export interface PublicProduct {
  id: string; name: string; description: string | null; price: number; compare_at_price: number | null;
  featured: boolean; stock_quantity: number; track_stock: boolean; category_id: string | null;
  product_images: { url: string; position: number }[];
  product_variants?: { id: string; name: string; value: string; price_delta: number }[];
}

const STORE_SELECT = "id,name,slug,description,logo_url,banner_url,currency,country,category,selling_mode,product_action,whatsapp_number,contact_email,contact_phone,theme,theme_settings,delivery_settings,payment_methods,policies,social_links,stripe_enabled";

export function useStoreQuery(slug: string) {
  return useQuery({
    queryKey: ["storefront", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select(STORE_SELECT).eq("slug", slug).eq("published", true).eq("suspended", false).maybeSingle();
      if (error) throw error;
      return (data as unknown as PublicStore) ?? null;
    },
  });
}

export function useStoreProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["storefront-products", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      // Fetch products and photos separately. This guarantees one storefront card per
      // product, no matter how many photos that product has.
      const { data: productRows, error: productError } = await supabase.from("products")
        .select("id,name,description,price,compare_at_price,featured,stock_quantity,track_stock,category_id")
        .eq("store_id", storeId!).eq("status", "active").order("created_at", { ascending: false });
      if (productError) throw productError;

      const products = (productRows ?? []) as unknown as Omit<PublicProduct, "product_images">[];
      if (!products.length) return [];

      const ids = products.map((product) => product.id);
      const { data: imageRows, error: imageError } = await supabase
        .from("product_images")
        .select("product_id,url,position")
        .in("product_id", ids)
        .order("position");
      if (imageError) throw imageError;

      const imagesByProduct = new Map<string, { url: string; position: number }[]>();
      for (const image of imageRows ?? []) {
        const list = imagesByProduct.get(image.product_id) ?? [];
        list.push({ url: image.url, position: image.position });
        imagesByProduct.set(image.product_id, list);
      }

      return products.map((product) => ({
        ...product,
        product_images: imagesByProduct.get(product.id) ?? [],
      })) as PublicProduct[];
    },
  });
}

export function useStoreCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: ["storefront-categories", storeId], enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name,slug").eq("store_id", storeId!).order("name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; slug: string }[];
    },
  });
}

export function useDeliveryAreas(storeId: string | undefined) {
  return useQuery({
    queryKey: ["storefront-areas", storeId], enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_areas").select("id,name,fee,eta").eq("store_id", storeId!).order("fee");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; fee: number; eta: string | null }[];
    },
  });
}

const StoreContext = createContext<PublicStore | null>(null);
export const StoreProvider = StoreContext.Provider;
export function useStore(): PublicStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Storefront context missing");
  return store;
}

// The built-in demo store ships with local images. Its old database URLs were broken after deployment,
// so always render the bundled assets for these demo products.
const DEMO_IMAGES: Record<string, string> = {
  "Sand Ceramic Candle": candle,
  "Forest Glaze Mug": mug,
  "Everyday Canvas Tote": tote,
  "Oatmeal Linen Throw": throwBlanket,
};

export function productImageUrl(product: PublicProduct, value?: string | null) {
  return DEMO_IMAGES[product.name] ?? resolveStoreImage(value);
}

export function productImages(product: PublicProduct) {
  const sorted = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  if (DEMO_IMAGES[product.name]) return [DEMO_IMAGES[product.name]];
  return sorted.map((image) => productImageUrl(product, image.url)).filter((url): url is string => !!url);
}

export function productImage(product: PublicProduct) {
  return productImages(product)[0] ?? null;
}

export function storeImage(value: string | null | undefined) {
  return resolveStoreImage(value);
}

export function whatsappLink(store: PublicStore, message: string) {
  const number = (store.whatsapp_number ?? "").replace(/[^\d]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
