import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export interface ProductDraft {
  id?: string;
  name: string;
  description: string;
  price: string;
  compare_at_price: string;
  sku: string;
  stock_quantity: string;
  track_stock: boolean;
  status: string;
  featured: boolean;
  category_id: string | null;
  images: string[];
  variants: { id?: string; name: string; value: string; price_delta: string }[];
}

export const emptyDraft: ProductDraft = {
  name: "",
  description: "",
  price: "",
  compare_at_price: "",
  sku: "",
  stock_quantity: "0",
  track_stock: false,
  status: "active",
  featured: false,
  category_id: null,
  images: [],
  variants: [],
};

export function ProductForm({ initial, storeId }: { initial: ProductDraft; storeId: string }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [newCategory, setNewCategory] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const { data: categories } = useQuery({
    queryKey: ["categories", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .eq("store_id", storeId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await supabase
        .from("categories")
        .insert({ store_id: storeId, name, slug })
        .select("id,name")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      setNewCategory("");
      set("category_id", row.id);
      queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
      toast.success("Category added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.name.trim()) throw new Error("Give your product a name.");
      const price = Number(draft.price);
      if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");

      const payload = {
        store_id: storeId,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price,
        compare_at_price: draft.compare_at_price ? Number(draft.compare_at_price) : null,
        sku: draft.sku.trim() || null,
        stock_quantity: Number(draft.stock_quantity) || 0,
        track_stock: draft.track_stock,
        status: draft.status,
        featured: draft.featured,
        category_id: draft.category_id,
      };

      let productId = draft.id;
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) {
          if (error.message.includes("PRODUCT_LIMIT_REACHED")) {
            throw new Error("You've reached the 3 product limit on the free plan. Upgrade for unlimited products.");
          }
          throw error;
        }
        productId = data.id;
      }

      await supabase.from("product_images").delete().eq("product_id", productId!);
      if (draft.images.length) {
        const { error } = await supabase.from("product_images").insert(
          draft.images.map((url, position) => ({ product_id: productId!, store_id: storeId, url, position })),
        );
        if (error) throw error;
      }

      await supabase.from("product_variants").delete().eq("product_id", productId!);
      const variants = draft.variants.filter((v) => v.name.trim() && v.value.trim());
      if (variants.length) {
        const { error } = await supabase.from("product_variants").insert(
          variants.map((v) => ({
            product_id: productId!,
            store_id: storeId,
            name: v.name.trim(),
            value: v.value.trim(),
            price_delta: Number(v.price_delta) || 0,
          })),
        );
        if (error) throw error;
      }
      return productId!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(draft.id ? "Product updated" : "Product created");
      navigate({ to: "/products" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="space-y-6">
        <div className="surface-card space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" value={draft.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is it, what's included, sizing, delivery time…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compare">Compare-at price (optional)</Label>
              <Input
                id="compare"
                inputMode="decimal"
                value={draft.compare_at_price}
                onChange={(e) => set("compare_at_price", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <ImageUploader
            value={draft.images}
            onChange={(urls) => set("images", urls)}
            userId={user!.id}
            folder="products"
            max={5}
            label="Product photos"
            hint="Up to 5 images. The first one is used as the main photo."
          />
        </div>

        <div className="surface-card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Options</p>
              <p className="text-xs text-muted-foreground">Sizes, colours or anything that changes the price.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set("variants", [...draft.variants, { name: "", value: "", price_delta: "0" }])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add option
            </Button>
          </div>
          {draft.variants.map((v, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_7rem_auto]">
              <Input
                placeholder="Option (Size)"
                value={v.name}
                onChange={(e) =>
                  set("variants", draft.variants.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))
                }
              />
              <Input
                placeholder="Value (Large)"
                value={v.value}
                onChange={(e) =>
                  set("variants", draft.variants.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))
                }
              />
              <Input
                placeholder="+0.00"
                inputMode="decimal"
                value={v.price_delta}
                onChange={(e) =>
                  set("variants", draft.variants.map((x, xi) => (xi === i ? { ...x, price_delta: e.target.value } : x)))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove option"
                onClick={() => set("variants", draft.variants.filter((_, xi) => xi !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="surface-card space-y-4 p-5">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={draft.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active — visible in your store</SelectItem>
                <SelectItem value="draft">Draft — hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="featured">Feature on storefront</Label>
            <Switch id="featured" checked={draft.featured} onCheckedChange={(v) => set("featured", v)} />
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={draft.category_id ?? "none"}
              onValueChange={(v) => set("category_id", v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!newCategory.trim() || addCategory.isPending}
              onClick={() => addCategory.mutate(newCategory.trim())}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU (optional)</Label>
            <Input id="sku" value={draft.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="track">Track stock</Label>
            <Switch id="track" checked={draft.track_stock} onCheckedChange={(v) => set("track_stock", v)} />
          </div>
          {draft.track_stock && (
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock quantity</Label>
              <Input
                id="stock"
                inputMode="numeric"
                value={draft.stock_quantity}
                onChange={(e) => set("stock_quantity", e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {draft.id ? "Save changes" : "Create product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/products" })}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
