export type ThemeId =
  | "lumen"
  | "slate"
  | "market"
  | "atelier"
  | "noir"
  | "bloom"
  | "kiosk"
  | "vertex"
  | "prisma"
  | "linea"
  | "verde"
  | "neon"
  | "mono"
  | "oasis"
  | "royal"
  | "sunset"
  | "studio"
  | "pulse";

export interface StoreTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  premium: boolean;
  layout: "grid" | "editorial" | "list" | "showcase" | "lookbook";
  /** Which demo photo set the preview mock-up uses. */
  photoSet: "home" | "fashion" | "food" | "jewel" | "beauty" | "tech" | "flowers";
  /** Preview swatches, also used as the default palette. */
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

export const THEMES: StoreTheme[] = [
  {
    id: "lumen",
    photoSet: "home",
    name: "Lumen",
    tagline: "Bright, airy and product-first.",
    premium: false,
    layout: "grid",
    palette: {
      bg: "#ffffff",
      surface: "#f7f7f8",
      ink: "#111318",
      muted: "#6b7280",
      accent: "#111318",
      accentInk: "#ffffff",
      border: "#e7e7ea",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "10px",
    cardRadius: "16px",
    bestFor: "Any catalogue",
  },
  {
    id: "slate",
    photoSet: "tech",
    name: "Slate",
    tagline: "Dark, quiet and modern.",
    premium: false,
    layout: "grid",
    palette: {
      bg: "#0e1014",
      surface: "#171a20",
      ink: "#f4f5f7",
      muted: "#9aa1ac",
      accent: "#f4f5f7",
      accentInk: "#0e1014",
      border: "#252932",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "8px",
    cardRadius: "12px",
    bestFor: "Tech, streetwear",
  },
  {
    id: "market",
    photoSet: "home",
    name: "Market",
    tagline: "Dense grid built for browsing lots of items.",
    premium: true,
    layout: "list",
    palette: {
      bg: "#fbfaf7",
      surface: "#ffffff",
      ink: "#1b1a17",
      muted: "#6f6a60",
      accent: "#1f7a4d",
      accentInk: "#ffffff",
      border: "#e8e4dc",
    },
    heading: "'Plus Jakarta Sans', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "999px",
    cardRadius: "14px",
    bestFor: "Groceries, general stores",
  },
  {
    id: "atelier",
    photoSet: "fashion",
    name: "Atelier",
    tagline: "Editorial layout with generous white space.",
    premium: true,
    layout: "editorial",
    palette: {
      bg: "#fdfcfa",
      surface: "#f4f1eb",
      ink: "#1a1814",
      muted: "#7a7266",
      accent: "#8a6b3f",
      accentInk: "#ffffff",
      border: "#e6e0d5",
    },
    heading: "'Sora', serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "2px",
    cardRadius: "2px",
    bestFor: "Fashion, ceramics, craft",
  },
  {
    id: "noir",
    photoSet: "jewel",
    name: "Noir",
    tagline: "Luxury dark with gold detailing.",
    premium: true,
    layout: "showcase",
    palette: {
      bg: "#0b0b0d",
      surface: "#141417",
      ink: "#f6f3ec",
      muted: "#a09a8d",
      accent: "#c9a227",
      accentInk: "#0b0b0d",
      border: "#26262b",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "4px",
    cardRadius: "6px",
    bestFor: "Jewellery, premium goods",
  },
  {
    id: "bloom",
    photoSet: "flowers",
    name: "Bloom",
    tagline: "Soft, warm and friendly.",
    premium: true,
    layout: "grid",
    palette: {
      bg: "#fffaf7",
      surface: "#fdeee6",
      ink: "#2a1c19",
      muted: "#8a6f66",
      accent: "#e2664f",
      accentInk: "#ffffff",
      border: "#f6ddd1",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "999px",
    cardRadius: "22px",
    bestFor: "Florists, bakeries, beauty",
  },
  {
    id: "kiosk",
    photoSet: "food",
    name: "Kiosk",
    tagline: "Menu-style list made for food ordering.",
    premium: true,
    layout: "list",
    palette: {
      bg: "#12100e",
      surface: "#1d1a16",
      ink: "#f7f2e9",
      muted: "#a89c8a",
      accent: "#ff7a29",
      accentInk: "#12100e",
      border: "#2c2721",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "12px",
    cardRadius: "16px",
    bestFor: "Restaurants, takeaways",
  },
  {
    id: "vertex",
    photoSet: "tech",
    name: "Vertex",
    tagline: "Bold type, big imagery, high contrast.",
    premium: true,
    layout: "showcase",
    palette: {
      bg: "#ffffff",
      surface: "#f0f2ff",
      ink: "#0d1030",
      muted: "#5b608c",
      accent: "#3d3dff",
      accentInk: "#ffffff",
      border: "#dfe2f5",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "8px",
    cardRadius: "18px",
    bestFor: "Digital products, services",
  },
  {
    id: "prisma",
    photoSet: "beauty",
    name: "Prisma",
    tagline: "Colour-washed gradients with oversized product cards.",
    premium: true,
    layout: "lookbook",
    palette: {
      bg: "#faf7ff",
      surface: "#ffffff",
      ink: "#1b1436",
      muted: "#6f668f",
      accent: "#7c3aed",
      accentInk: "#ffffff",
      border: "#e7deff",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "14px",
    cardRadius: "24px",
    bestFor: "Beauty, wellness, cosmetics",
  },
  {
    id: "linea",
    photoSet: "fashion",
    name: "Linea",
    tagline: "Gallery-quiet lookbook with hairline rules.",
    premium: true,
    layout: "lookbook",
    palette: {
      bg: "#f8f8f6",
      surface: "#ffffff",
      ink: "#141414",
      muted: "#7c7c78",
      accent: "#141414",
      accentInk: "#ffffff",
      border: "#dedbd4",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "0px",
    cardRadius: "0px",
    bestFor: "Fashion, lookbooks, studios",
  },
  {
    id: "verde",
    photoSet: "flowers",
    name: "Verde",
    tagline: "Organic greens and soft cards for natural goods.",
    premium: true,
    layout: "editorial",
    palette: {
      bg: "#f6f8f3",
      surface: "#ffffff",
      ink: "#17241a",
      muted: "#63735f",
      accent: "#2f7d4f",
      accentInk: "#ffffff",
      border: "#dce6d6",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "999px",
    cardRadius: "20px",
    bestFor: "Plants, florists, organic food",
  },
  {
    id: "neon",
    photoSet: "tech",
    name: "Neon",
    tagline: "Night-mode showcase with electric highlights.",
    premium: true,
    layout: "showcase",
    palette: {
      bg: "#08080f",
      surface: "#12121f",
      ink: "#eef0ff",
      muted: "#8f93b8",
      accent: "#22e5a1",
      accentInk: "#06110c",
      border: "#22233a",
    },
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    buttonRadius: "10px",
    cardRadius: "14px",
    bestFor: "Sneakers, gadgets, streetwear",
  },,
  {
    id: "mono", photoSet: "fashion", name: "Mono", tagline: "Minimal monochrome storefront with gallery energy.", premium: true, layout: "lookbook",
    palette: { bg: "#f5f5f3", surface: "#ffffff", ink: "#111111", muted: "#747474", accent: "#111111", accentInk: "#ffffff", border: "#dededb" },
    heading: "'Sora', sans-serif", body: "'Plus Jakarta Sans', sans-serif", buttonRadius: "0px", cardRadius: "0px", bestFor: "Fashion, furniture, photography"
  },
  {
    id: "oasis", photoSet: "beauty", name: "Oasis", tagline: "Soft luxury with calm colours and spacious cards.", premium: true, layout: "editorial",
    palette: { bg: "#fff8ed", surface: "#ffffff", ink: "#24332a", muted: "#718077", accent: "#b86b45", accentInk: "#ffffff", border: "#eadfce" },
    heading: "'Sora', sans-serif", body: "'Plus Jakarta Sans', sans-serif", buttonRadius: "18px", cardRadius: "28px", bestFor: "Beauty, wellness, lifestyle"
  },
  {
    id: "royal", photoSet: "jewel", name: "Royal", tagline: "Premium boutique styling with rich jewel tones.", premium: true, layout: "showcase",
    palette: { bg: "#171126", surface: "#211a33", ink: "#f8f3ff", muted: "#b8adca", accent: "#d7ae55", accentInk: "#21150b", border: "#382e4e" },
    heading: "'Sora', serif", body: "'Plus Jakarta Sans', sans-serif", buttonRadius: "6px", cardRadius: "10px", bestFor: "Jewellery, luxury, gifts"
  },
  {
    id: "sunset", photoSet: "food", name: "Sunset", tagline: "Warm, energetic storefront made to drive quick orders.", premium: true, layout: "grid",
    palette: { bg: "#fff3eb", surface: "#ffffff", ink: "#2b1820", muted: "#88656b", accent: "#ef5b3f", accentInk: "#ffffff", border: "#f2d8cf" },
    heading: "'Sora', sans-serif", body: "'Plus Jakarta Sans', sans-serif", buttonRadius: "999px", cardRadius: "20px", bestFor: "Food, drinks, handmade goods"
  },
  {
    id: "studio", photoSet: "home", name: "Studio", tagline: "Clean creative catalogue with bold editorial hierarchy.", premium: true, layout: "editorial",
    palette: { bg: "#eef2f4", surface: "#ffffff", ink: "#152027", muted: "#60707a", accent: "#3867d6", accentInk: "#ffffff", border: "#d5dde1" },
    heading: "'Sora', sans-serif", body: "'Plus Jakarta Sans', sans-serif", buttonRadius: "10px", cardRadius: "4px", bestFor: "Creative shops, home, design"
  },
  {
    id: "pulse", photoSet: "tech", name: "Pulse", tagline: "Bold digital commerce with a futuristic edge.", premium: true, layout: "showcase",
    palette: { bg: "#101018", surface: "#191925", ink: "#ffffff", muted: "#a4a5b8", accent: "#ff3d8d", accentInk: "#ffffff", border: "#2c2d3d" },
    heading: "'Sora', sans-serif", body: "'Plus Jakarta Sans', sans-serif", buttonRadius: "16px", cardRadius: "22px", bestFor: "Tech, gaming, gadgets"
  }
];

export function getTheme(id: string | null | undefined): StoreTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export interface ThemeSettings {
  accent?: string;
  ink?: string;
  bg?: string;
  headingFont?: string;
  buttonStyle?: "rounded" | "pill" | "square";
  showHero?: boolean;
  showFeatured?: boolean;
  showCategories?: boolean;
  heroHeadline?: string;
  heroSubline?: string;
  /** Controls the order of the main storefront sections. */
  sectionOrder?: ("hero" | "featured" | "categories" | "products")[];
  /** Number of product cards shown across on larger screens. */
  productColumns?: 2 | 3 | 4;
  /** Product card image crop. */
  productImageRatio?: "square" | "portrait" | "landscape";
}

export function resolveThemeVars(theme: StoreTheme, settings: ThemeSettings = {}) {
  const radius =
    settings.buttonStyle === "pill"
      ? "999px"
      : settings.buttonStyle === "square"
        ? "2px"
        : settings.buttonStyle === "rounded"
          ? "12px"
          : theme.buttonRadius;
  return {
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
