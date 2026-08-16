export const LIFETIME_PRICE_USD = 10;
export const PAYPAL_CHECKOUT_URL = "https://www.paypal.com/ncp/payment/N6VFLK873TZFC";

const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR",
  NL: "EUR", BE: "EUR", PT: "EUR", AT: "EUR", FI: "EUR", GR: "EUR", CH: "CHF", SE: "SEK",
  NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", RO: "RON", TR: "TRY", RU: "RUB", UA: "UAH",
  ZA: "ZAR", NG: "NGN", GH: "GHS", KE: "KES", UG: "UGX", TZ: "TZS", EG: "EGP", MA: "MAD",
  DZ: "DZD", TN: "TND", AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  JO: "JOD", LB: "LBP", IL: "ILS", IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR",
  CN: "CNY", JP: "JPY", KR: "KRW", HK: "HKD", TW: "TWD", SG: "SGD", MY: "MYR", ID: "IDR",
  TH: "THB", VN: "VND", PH: "PHP", AU: "AUD", NZ: "NZD", BR: "BRL", MX: "MXN", AR: "ARS",
  CL: "CLP", CO: "COP", PE: "PEN", UY: "UYU",
};

export interface LocalPrice {
  country: string | null;
  currency: string;
  amount: number;
  rate: number;
  converted: boolean;
}

function countryFromLocale(): string | null {
  if (typeof navigator === "undefined") return null;
  for (const loc of navigator.languages ?? [navigator.language]) {
    const region = new Intl.Locale(loc).maximize().region;
    if (region) return region;
  }
  return null;
}

async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const json = (await res.json()) as { country_code?: string };
      if (json.country_code) return json.country_code.toUpperCase();
    }
  } catch {
    /* fall back to the browser locale */
  }
  return countryFromLocale();
}

async function usdRate(currency: string): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { rates?: Record<string, number> };
    return json.rates?.[currency] ?? null;
  } catch {
    return null;
  }
}

function roundNicely(value: number, currency: string): number {
  const zeroDecimal = ["JPY", "KRW", "VND", "IDR", "CLP", "UGX", "TZS", "COP", "LBP"];
  if (zeroDecimal.includes(currency)) return Math.round(value);
  return Math.round(value * 100) / 100;
}

export async function getLifetimeLocalPrice(): Promise<LocalPrice> {
  const fallback: LocalPrice = {
    country: null,
    currency: "USD",
    amount: LIFETIME_PRICE_USD,
    rate: 1,
    converted: false,
  };
  const country = await detectCountry();
  if (!country) return fallback;
  const currency = COUNTRY_CURRENCY[country] ?? "USD";
  if (currency === "USD") return { ...fallback, country, converted: false };
  const rate = await usdRate(currency);
  if (!rate) return { ...fallback, country };
  return {
    country,
    currency,
    amount: roundNicely(LIFETIME_PRICE_USD * rate, currency),
    rate,
    converted: true,
  };
}
