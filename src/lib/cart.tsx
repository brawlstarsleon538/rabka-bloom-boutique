import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  variant: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, variant: string | null) => void;
  setQuantity: (productId: string, variant: string | null, quantity: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "sivik-cart";

const sameLine = (a: CartItem, productId: string, variant: string | null) =>
  a.productId === productId && (a.variant ?? "") === (variant ?? "");

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      add: (item) =>
        setItems((prev) => {
          const found = prev.find((p) => sameLine(p, item.productId, item.variant));
          if (found) {
            return prev.map((p) =>
              sameLine(p, item.productId, item.variant)
                ? { ...p, quantity: p.quantity + item.quantity }
                : p,
            );
          }
          return [...prev, item];
        }),
      remove: (productId, variant) =>
        setItems((prev) => prev.filter((p) => !sameLine(p, productId, variant))),
      setQuantity: (productId, variant, quantity) =>
        setItems((prev) =>
          prev.map((p) =>
            sameLine(p, productId, variant) ? { ...p, quantity: Math.max(1, quantity) } : p,
          ),
        ),
      clear: () => setItems([]),
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
