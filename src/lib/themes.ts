export type ThemeId =
  | "aura"
  | "vault"
  | "drift"
  | "muse"
  | "ember"
  | "horizon"
  | "velvet"
  | "circuit"
  | "terra"
  | "halo"
  | "maison"
  | "nova"
  | "atlas"
  | "solstice"
  | "kinetic"
  | "atelier"
  | "pulse"
  | "canvas"
  | "street"
  | "fresh"
  | "bloom"
  | "mono"
  | "market"
  | "glow";

export interface StoreTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  premium: boolean;
  layout: "grid" | "editorial" | "list" | "showcase" | "lookbook" | "bento" | "split" | "catalog" | "minimal" | "immersive";
  photoSet: "home" | "fashion" | "food" | "jewel" | "beauty" | "tech" | "flowers";
  palette: {
    bg: string;
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    accentInk: string;
    border: string;
  };
  heading: string;
  body: string;
  buttonRadius: string;
  cardRadius: string;
  bestFor: string;
}

const sans = "'Sora', sans-serif";
const body = "'Plus Jakarta Sans', sans-serif";

export const THEMES: StoreTheme[] = [
  {
    id: "aura", name: "Marketplace", photoSet: "beauty", premium: true, layout: "grid",
    tagline: "Clean, balanced shopping with an easy everyday storefront.",
    palette: { bg: "#fff9f5", surface: "#ffffff", ink: "#241b25", muted: "#7d6f7c", accent: "#b76e79", accentInk: "#ffffff", border: "#eedfe4" },
    heading: sans, body, buttonRadius: "18px", cardRadius: "28px", bestFor: "Beauty, skincare, lifestyle"
  },
  {
    id: "vault", name: "Noir Luxury", photoSet: "jewel", premium: true, layout: "immersive",
    tagline: "A cinematic dark storefront built to make products feel expensive.",
    palette: { bg: "#0b0c10", surface: "#15171d", ink: "#f5f1e8", muted: "#a7a096", accent: "#d6b25e", accentInk: "#17120a", border: "#292c34" },
    heading: sans, body, buttonRadius: "6px", cardRadius: "12px", bestFor: "Luxury, jewellery, watches"
  },
  {
    id: "drift", name: "Studio", photoSet: "home", premium: true, layout: "split",
    tagline: "Calm, architectural and image-led with plenty of breathing room.",
    palette: { bg: "#f2f5f5", surface: "#ffffff", ink: "#1c292b", muted: "#6d7b7c", accent: "#466b6d", accentInk: "#ffffff", border: "#d8e0df" },
    heading: sans, body, buttonRadius: "999px", cardRadius: "4px", bestFor: "Home, furniture, design"
  },
  {
    id: "muse", name: "Runway", photoSet: "fashion", premium: true, layout: "editorial",
    tagline: "Magazine-style fashion with bold typography and clean product focus.",
    palette: { bg: "#f8f3ed", surface: "#fffdf9", ink: "#201a19", muted: "#82736d", accent: "#8e3d36", accentInk: "#ffffff", border: "#e5d8cf" },
    heading: sans, body, buttonRadius: "0px", cardRadius: "0px", bestFor: "Fashion, art, photography"
  },
  {
    id: "ember", name: "Food Rush", photoSet: "food", premium: true, layout: "bento",
    tagline: "Warm, hungry and energetic — designed to turn browsing into orders.",
    palette: { bg: "#fff2e7", surface: "#ffffff", ink: "#32170f", muted: "#956d5b", accent: "#e9512e", accentInk: "#ffffff", border: "#f3d4c5" },
    heading: sans, body, buttonRadius: "999px", cardRadius: "22px", bestFor: "Food, drinks, takeaways"
  },
  {
    id: "horizon", name: "Apple Tech", photoSet: "tech", premium: true, layout: "minimal",
    tagline: "Sharp, futuristic and confident with a high-end technology feel.",
    palette: { bg: "#eef4ff", surface: "#ffffff", ink: "#111b35", muted: "#64718c", accent: "#315efb", accentInk: "#ffffff", border: "#d7e1f5" },
    heading: sans, body, buttonRadius: "12px", cardRadius: "20px", bestFor: "Tech, gadgets, digital products"
  },
  {
    id: "velvet", name: "Velvet Boutique", photoSet: "beauty", premium: true, layout: "lookbook",
    tagline: "Rich colour, elegant curves and a sophisticated boutique personality.",
    palette: { bg: "#241323", surface: "#321a30", ink: "#fff7fb", muted: "#c5a8be", accent: "#f0a6c6", accentInk: "#381226", border: "#4b2947" },
    heading: sans, body, buttonRadius: "20px", cardRadius: "30px", bestFor: "Beauty, fashion, premium gifts"
  },
  {
    id: "circuit", name: "Neon Circuit", photoSet: "tech", premium: true, layout: "immersive",
    tagline: "Electric contrast and modern UI energy for products with an edge.",
    palette: { bg: "#0b1020", surface: "#121a30", ink: "#f4f7ff", muted: "#95a3c5", accent: "#5cf0c2", accentInk: "#062219", border: "#253252" },
    heading: sans, body, buttonRadius: "10px", cardRadius: "18px", bestFor: "Gaming, tech, sneakers"
  },
  {
    id: "terra", name: "Green Market", photoSet: "flowers", premium: true, layout: "catalog",
    tagline: "Organic textures, natural tones and an effortless handcrafted feel.",
    palette: { bg: "#f7f4ea", surface: "#fffdf8", ink: "#283022", muted: "#727866", accent: "#637b45", accentInk: "#ffffff", border: "#dfe3d1" },
    heading: sans, body, buttonRadius: "14px", cardRadius: "24px", bestFor: "Plants, handmade, organic goods"
  },
  {
    id: "halo", name: "Social Drop", photoSet: "fashion", premium: true, layout: "bento",
    tagline: "Bright and polished with soft gradients and a modern social-commerce feel.",
    palette: { bg: "#f6f4ff", surface: "#ffffff", ink: "#201b3d", muted: "#77718f", accent: "#7657e8", accentInk: "#ffffff", border: "#e2ddf8" },
    heading: sans, body, buttonRadius: "999px", cardRadius: "26px", bestFor: "Fashion, accessories, creators"
  },
  {
    id: "maison", name: "Maison", photoSet: "home", premium: true, layout: "lookbook",
    tagline: "Quiet European elegance with an editorial catalogue experience.",
    palette: { bg: "#eee9e1", surface: "#faf8f4", ink: "#25211c", muted: "#756d62", accent: "#3d3429", accentInk: "#ffffff", border: "#d9d1c5" },
    heading: sans, body, buttonRadius: "2px", cardRadius: "8px", bestFor: "Furniture, home, premium craft"
  },
  {
    id: "atlas", name: "Atlas Commerce", photoSet: "beauty", premium: true, layout: "catalog",
    tagline: "A powerful modern marketplace built for big catalogues and serious shopping.",
    palette: { bg: "#f4f7fb", surface: "#ffffff", ink: "#172033", muted: "#68738a", accent: "#ff6b35", accentInk: "#ffffff", border: "#dce3ee" },
    heading: sans, body, buttonRadius: "10px", cardRadius: "14px", bestFor: "Marketplaces, general stores, deals"
  },
  {
    id: "solstice", name: "Solstice", photoSet: "fashion", premium: true, layout: "split",
    tagline: "Sunlit editorial design with oversized imagery and premium storytelling.",
    palette: { bg: "#fff7e8", surface: "#fffdf8", ink: "#302317", muted: "#8b7967", accent: "#d67a2d", accentInk: "#ffffff", border: "#eadbc7" },
    heading: sans, body, buttonRadius: "4px", cardRadius: "2px", bestFor: "Fashion, lifestyle, photography"
  },
  {
    id: "kinetic", name: "Kinetic", photoSet: "tech", premium: true, layout: "immersive",
    tagline: "Fast, loud and energetic with a product-launch feel made for modern brands.",
    palette: { bg: "#080b12", surface: "#111722", ink: "#f7fbff", muted: "#93a0b5", accent: "#8b5cf6", accentInk: "#ffffff", border: "#263247" },
    heading: sans, body, buttonRadius: "999px", cardRadius: "28px", bestFor: "Gaming, gadgets, streetwear"
  },
  {
    id: "atelier", name: "Atelier", photoSet: "home", premium: true, layout: "masonry",
    tagline: "A refined gallery-like boutique for carefully curated collections.",
    palette: { bg: "#f1eee8", surface: "#faf9f6", ink: "#24211d", muted: "#756f66", accent: "#6f5644", accentInk: "#ffffff", border: "#d8d2c9" },
    heading: sans, body, buttonRadius: "2px", cardRadius: "6px", bestFor: "Luxury goods, furniture, art"
  },
  {
    id: "nova", name: "Launch", photoSet: "tech", premium: true, layout: "showcase",
    tagline: "Bold colour and playful confidence for a fresh next-generation store.",
    palette: { bg: "#11111a", surface: "#1a1a27", ink: "#ffffff", muted: "#a8a8bd", accent: "#ff4f9a", accentInk: "#ffffff", border: "#303044" },
    heading: sans, body, buttonRadius: "16px", cardRadius: "24px", bestFor: "Gadgets, music, youth brands"
  }
,{
    id: "pulse", name: "Pulse", photoSet: "tech", premium: true, layout: "bento",
    tagline: "High-energy layouts, sharp cards and a modern shopping experience.",
    palette: { bg: "#f3f6ff", surface: "#ffffff", ink: "#171b2d", muted: "#68708a", accent: "#ef4444", accentInk: "#ffffff", border: "#dce2f2" },
    heading: sans, body, buttonRadius: "12px", cardRadius: "16px", bestFor: "Tech, fitness, active brands"
  },
  {
    id: "canvas", name: "Canvas", photoSet: "home", premium: true, layout: "editorial",
    tagline: "A creative gallery layout that puts photography and storytelling first.",
    palette: { bg: "#faf8f4", surface: "#ffffff", ink: "#26221d", muted: "#7b746b", accent: "#8a6a52", accentInk: "#ffffff", border: "#e3ddd4" },
    heading: sans, body, buttonRadius: "4px", cardRadius: "10px", bestFor: "Art, interiors, creative studios"
  },
  {
    id: "street", name: "Street", photoSet: "fashion", premium: true, layout: "catalog",
    tagline: "Bold urban styling for brands that want their products to stand out.",
    palette: { bg: "#111214", surface: "#191b1f", ink: "#f7f7f4", muted: "#a5a8ad", accent: "#d7ff3f", accentInk: "#161a08", border: "#2b2e34" },
    heading: sans, body, buttonRadius: "8px", cardRadius: "14px", bestFor: "Streetwear, sneakers, youth fashion"
  },
  {
    id: "fresh", name: "Fresh", photoSet: "food", premium: true, layout: "grid",
    tagline: "Light, colourful and approachable for products people love to discover.",
    palette: { bg: "#f5fbf2", surface: "#ffffff", ink: "#1d2a1c", muted: "#6e7d6d", accent: "#49a942", accentInk: "#ffffff", border: "#dcebd9" },
    heading: sans, body, buttonRadius: "999px", cardRadius: "22px", bestFor: "Food, wellness, everyday products"
  },
  {
    id: "bloom", name: "Bloom", photoSet: "flowers", premium: true, layout: "lookbook",
    tagline: "Soft, elegant and expressive for beautiful products and giftable collections.",
    palette: { bg: "#fff5f8", surface: "#ffffff", ink: "#321f27", muted: "#8a7079", accent: "#d85b87", accentInk: "#ffffff", border: "#f0dbe3" },
    heading: sans, body, buttonRadius: "18px", cardRadius: "28px", bestFor: "Flowers, gifts, beauty"
  },
  {
    id: "mono", name: "Mono", photoSet: "jewel", premium: true, layout: "minimal",
    tagline: "Minimal black-and-white presentation for a clean, premium catalogue.",
    palette: { bg: "#f7f7f5", surface: "#ffffff", ink: "#141414", muted: "#737373", accent: "#202020", accentInk: "#ffffff", border: "#ddddda" },
    heading: sans, body, buttonRadius: "4px", cardRadius: "4px", bestFor: "Design, jewellery, minimalist brands"
  },
  {
    id: "market", name: "Market", photoSet: "home", premium: true, layout: "catalog",
    tagline: "Practical, spacious shopping built for variety and everyday browsing.",
    palette: { bg: "#f5f7f9", surface: "#ffffff", ink: "#17212b", muted: "#6c7782", accent: "#0f766e", accentInk: "#ffffff", border: "#dce2e7" },
    heading: sans, body, buttonRadius: "10px", cardRadius: "14px", bestFor: "General stores, home, marketplaces"
  },
  {
    id: "glow", name: "Glow", photoSet: "beauty", premium: true, layout: "split",
    tagline: "Soft gradients and polished details for a bright modern storefront.",
    palette: { bg: "#f8f5ff", surface: "#ffffff", ink: "#241d38", muted: "#7b7191", accent: "#a855f7", accentInk: "#ffffff", border: "#e7def8" },
    heading: sans, body, buttonRadius: "999px", cardRadius: "24px", bestFor: "Beauty, skincare, creators"
  }
];

export function getTheme(id: string | null | undefined): StoreTheme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!;
}

export interface ThemeSettings {
  accent?: string;
  ink?: string;
  bg?: string;
  headingFont?: string;
  buttonStyle?: "rounded" | "pill" | "square";
  layoutOverride?: StoreTheme["layout"];
  showHero?: boolean;
  showFeatured?: boolean;
  showCategories?: boolean;
  heroHeadline?: string;
  heroSubline?: string;
  heroImageUrl?: string;
  heroImages?: string[];
  announcementText?: string;
  enabledSections?: ("hero" | "featured" | "categories" | "products" | "promo" | "imageText" | "testimonials" | "newsletter" | "social")[];
  promoText?: string;
  promoButtonText?: string;
  promoButtonUrl?: string;
  imageTextImageUrl?: string;
  imageTextHeading?: string;
  imageTextBody?: string;
  testimonials?: { name: string; quote: string }[];
  newsletterHeading?: string;
  socialLinks?: { instagram?: string; facebook?: string; tiktok?: string };
  featuredImageUrl?: string;
  featuredHeading?: string;
  featuredSubline?: string;
  productsImageUrl?: string;
  categoryLabels?: string[];
  sectionOrder?: ("hero" | "featured" | "categories" | "products")[];
  productColumns?: 2 | 3 | 4;
  productImageRatio?: "square" | "portrait" | "landscape";
  selectedProductIds?: string[];
}

export function resolveThemeVars(theme: StoreTheme, settings: ThemeSettings = {}) {
  const effectiveLayout = settings.layoutOverride || theme.layout;
  const radius =
    settings.buttonStyle === "pill"
      ? "999px"
      : settings.buttonStyle === "square"
        ? "2px"
        : settings.buttonStyle === "rounded"
          ? "12px"
          : theme.buttonRadius;

  return {
    "--sf-layout": effectiveLayout,
    "--sf-bg": settings.bg || theme.palette.bg,
    "--sf-surface": theme.palette.surface,
    "--sf-ink": settings.ink || theme.palette.ink,
    "--sf-muted": theme.palette.muted,
    "--sf-accent": settings.accent || theme.palette.accent,
    "--sf-accent-ink": theme.palette.accentInk,
    "--sf-border": theme.palette.border,
    "--sf-btn-radius": radius,
    "--sf-card-radius": theme.cardRadius,
    "--sf-heading": settings.headingFont || theme.heading,
    "--sf-body": theme.body,
  } as React.CSSProperties;
}
