export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  variants: string[];
  in_stock: boolean;
  featured: boolean;
};

export const CATEGORIES = [
  { value: "bukiety", label: "Bukiety" },
  { value: "prezenty", label: "Prezenty" },
  { value: "zestawy", label: "Zestawy" },
] as const;

export const DELIVERY_SLOTS = [
  "09:00 – 12:00",
  "12:00 – 15:00",
  "15:00 – 18:00",
  "18:00 – 20:00",
];

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

export function normalizeProduct(row: Record<string, unknown>): Product {
  const rawVariants = row["variants"];
  return {
    id: String(row["id"]),
    slug: String(row["slug"]),
    name: String(row["name"]),
    description: String(row["description"] ?? ""),
    price: Number(row["price"] ?? 0),
    category: String(row["category"] ?? "bukiety"),
    image_url: String(row["image_url"] ?? ""),
    variants: Array.isArray(rawVariants) ? (rawVariants as string[]) : [],
    in_stock: Boolean(row["in_stock"]),
    featured: Boolean(row["featured"]),
  };
}
