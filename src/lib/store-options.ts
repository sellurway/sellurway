export const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "NGN", label: "Nigerian Naira (₦)" },
  { code: "KES", label: "Kenyan Shilling (KSh)" },
  { code: "GHS", label: "Ghanaian Cedi (₵)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "PKR", label: "Pakistani Rupee (₨)" },
  { code: "PHP", label: "Philippine Peso (₱)" },
  { code: "IDR", label: "Indonesian Rupiah (Rp)" },
  { code: "BRL", label: "Brazilian Real (R$)" },
  { code: "MXN", label: "Mexican Peso (MX$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "AED", label: "UAE Dirham (د.إ)" },
  { code: "SAR", label: "Saudi Riyal (﷼)" },
  { code: "EGP", label: "Egyptian Pound (E£)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
];

export const COUNTRIES = [
  "Australia",
  "Bangladesh",
  "Brazil",
  "Canada",
  "Egypt",
  "France",
  "Germany",
  "Ghana",
  "India",
  "Indonesia",
  "Ireland",
  "Italy",
  "Japan",
  "Kenya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Pakistan",
  "Philippines",
  "Portugal",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "Spain",
  "Tanzania",
  "Uganda",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Zambia",
  "Zimbabwe",
  "Other",
];

export const STORE_CATEGORIES = [
  "Fashion & Apparel",
  "Beauty & Personal Care",
  "Home & Living",
  "Food & Drink",
  "Electronics",
  "Health & Wellness",
  "Art & Handmade",
  "Jewellery & Accessories",
  "Sports & Outdoors",
  "Baby & Kids",
  "Books & Stationery",
  "Digital Products",
  "Services",
  "Other",
];

export type BusinessType = "physical" | "food" | "services" | "digital" | "local" | "other";

export const BUSINESS_TYPES: {
  id: BusinessType;
  label: string;
  description: string;
  recommended: SellingMode;
  recommendedLabel: string;
}[] = [
  {
    id: "physical",
    label: "Physical products",
    description: "Clothing, homeware, electronics, anything you ship.",
    recommended: "full_checkout",
    recommendedLabel: "Full checkout",
  },
  {
    id: "food",
    label: "Food & delivery",
    description: "Restaurants, bakeries, groceries, meal prep.",
    recommended: "direct_order",
    recommendedLabel: "Direct delivery orders",
  },
  {
    id: "services",
    label: "Services",
    description: "Bookings, consultations, repairs, cleaning.",
    recommended: "whatsapp",
    recommendedLabel: "WhatsApp orders",
  },
  {
    id: "digital",
    label: "Digital products",
    description: "Templates, ebooks, presets, downloads.",
    recommended: "full_checkout",
    recommendedLabel: "Full checkout",
  },
  {
    id: "local",
    label: "Local business",
    description: "A shop your neighbourhood already knows.",
    recommended: "direct_order",
    recommendedLabel: "Direct delivery orders",
  },
  {
    id: "other",
    label: "Something else",
    description: "You'll pick how customers order.",
    recommended: "full_checkout",
    recommendedLabel: "Full checkout",
  },
];

export type SellingMode = "full_checkout" | "direct_order" | "whatsapp" | "multiple";

export const SELLING_MODES: { id: SellingMode; label: string; description: string }[] = [
  {
    id: "full_checkout",
    label: "Full checkout",
    description: "Cart, checkout and order confirmation. Best for normal online shopping.",
  },
  {
    id: "direct_order",
    label: "Direct delivery orders",
    description: "No cart. Customers order a product and give their delivery details.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp orders",
    description: "Every product opens a pre-filled WhatsApp message to your number.",
  },
  {
    id: "multiple",
    label: "Multiple methods",
    description: "Offer more than one, and choose the main button on your products.",
  },
];

export const PRODUCT_ACTIONS = [
  { id: "add_to_cart", label: "Add to Cart" },
  { id: "order_now", label: "Order Now" },
  { id: "whatsapp", label: "Order on WhatsApp" },
  { id: "contact", label: "Contact Us" },
];

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
] as const;

export const DELIVERY_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export const REPORT_CATEGORIES = [
  "Fraud",
  "Prohibited products",
  "Copyright complaint",
  "Scam",
  "Harassment",
  "Other",
];

export const SUPPORT_CATEGORIES = [
  "Account",
  "Billing",
  "Store setup",
  "Products",
  "Orders",
  "Technical issue",
  "Other",
];

export function labelize(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
