export type ProductVariant = {
  name: string;
  price?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  variants: ProductVariant[];
  in_stock: boolean;
  featured: boolean;
};

export const CATEGORIES = [
  { value: "bukiety", label: "Bukiety" },
  { value: "slodkie-zestawy", label: "Słodkie zestawy" },
  { value: "bukiety-dodatki", label: "Bukiety z dodatkami" },
  { value: "pluszaki", label: "Pluszaki" },
  { value: "boxy-prezentowe", label: "Boxy prezentowe" },
] as const;

export const DELIVERY_SLOTS = [
  "09:00 – 12:00",
  "12:00 – 15:00",
  "15:00 – 18:00",
  "18:00 – 20:00",
];

/** Returns the slot's start hour (0-23) parsed from e.g. "09:00 – 12:00". */
export function slotStartHour(slot: string): number {
  const match = slot.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

/**
 * Returns true when the delivery window (date + slot) starts at least
 * ADVANCE_HOURS hours from now.
 */
export const ADVANCE_HOURS = 4;

export function isSlotAvailable(dateISO: string, slot: string): boolean {
  const hour = slotStartHour(slot);
  // Combine date string with the slot's start time in local time
  const slotStart = new Date(`${dateISO}T${String(hour).padStart(2, "0")}:00:00`);
  const minAllowed = new Date(Date.now() + ADVANCE_HOURS * 60 * 60 * 1000);
  return slotStart >= minAllowed;
}

export const ORDER_STATUSES = [
  { value: "nowe", label: "Nowe" },
  { value: "w realizacji", label: "W realizacji" },
  { value: "dostarczone", label: "Dostarczone" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

/** Kept in sync with ORDER_STATUSES; used to validate writes on the server. */
export const ORDER_STATUS_VALUES = ORDER_STATUSES.map((s) => s.value) as [
  OrderStatus,
  ...OrderStatus[],
];

export function formatPrice(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
  }).format(value);
}

export function parseSingleVariant(item: unknown): ProductVariant | null {
  if (!item) return null;
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    const name = String(obj.name ?? obj.variant ?? "").trim();
    if (!name) return null;
    const price = obj.price != null && !isNaN(Number(obj.price)) ? Number(obj.price) : undefined;
    return { name, price };
  }
  if (typeof item === "string") {
    const str = item.trim();
    if (!str) return null;
    
    // Check "Name: 129" or "Name: 129 zł" or "Name = 129"
    const matchColon = str.match(/^(.*?)\s*[:=]\s*(\d+(?:[.,]\d+)?)\s*(?:zł|pln)?$/i);
    if (matchColon) {
      return { name: matchColon[1].trim(), price: Number(matchColon[2].replace(",", ".")) };
    }

    // Check "Name (129 zł)" or "Name (129)"
    const matchParen = str.match(/^(.*?)\s*\(\s*(\d+(?:[.,]\d+)?)\s*(?:zł|pln)?\s*\)$/i);
    if (matchParen) {
      return { name: matchParen[1].trim(), price: Number(matchParen[2].replace(",", ".")) };
    }

    return { name: str };
  }
  return null;
}

export function textToVariants(text: string): ProductVariant[] {
  if (!text.trim()) return [];
  return text
    .split(",")
    .map((s) => parseSingleVariant(s))
    .filter((v): v is ProductVariant => v !== null);
}

export function variantsToText(variants: ProductVariant[]): string {
  if (!variants || variants.length === 0) return "";
  return variants
    .map((v) => (v.price != null ? `${v.name}: ${v.price} zł` : v.name))
    .join(", ");
}

export function normalizeProduct(row: Record<string, unknown>): Product {
  const rawVariants = row["variants"];
  const parsedVariants: ProductVariant[] = [];
  if (Array.isArray(rawVariants)) {
    for (const item of rawVariants) {
      const parsed = parseSingleVariant(item);
      if (parsed) parsedVariants.push(parsed);
    }
  }
  return {
    id: String(row["id"]),
    slug: String(row["slug"]),
    name: String(row["name"]),
    description: String(row["description"] ?? ""),
    price: Number(row["price"] ?? 0),
    category: String(row["category"] ?? "bukiety"),
    image_url: String(row["image_url"] ?? ""),
    variants: parsedVariants,
    in_stock: Boolean(row["in_stock"]),
    featured: Boolean(row["featured"]),
  };
}
