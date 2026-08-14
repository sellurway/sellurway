export type ThemeId =
  | "lumen"
  | "slate"
  | "market"
  | "atelier"
  | "noir"
  | "bloom"
  | "kiosk"
  | "vertex";

export interface StoreTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  premium: boolean;
  layout: "grid" | "editorial" | "list" | "showcase";
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
    name: "Market",
    tagline: "Dense grid built for browsing lots of items.",
    premium: false,
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
