import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { PetalDivider } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/koszyk")({
  head: () => ({
    meta: [
      { title: "Koszyk — SiViK Flowers" },
      { name: "description", content: "Twoje wybrane kwiaty i prezenty gotowe do zamówienia." },
      { property: "og:title", content: "Koszyk — SiViK Flowers" },
      { property: "og:description", content: "Twoje wybrane kwiaty i prezenty." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQuantity, remove, total } = useCart();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl">Koszyk</h1>
        <PetalDivider className="my-5" />
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Twój koszyk jest pusty.</p>
          <Button asChild className="mt-5 rounded-full px-8">
            <Link to="/sklep">Przejdź do sklepu</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {items.map((item) => (
              <li key={`${item.productId}-${item.variant}`} className="flex gap-4 p-4">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  width={96}
                  height={96}
                  className="size-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-base">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">{item.variant}</p>
                  )}
                  <p className="mt-1 text-sm text-primary">{formatPrice(item.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        setQuantity(item.productId, item.variant, Number(e.target.value))
                      }
                      className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm"
                    />
                    <button
                      onClick={() => remove(item.productId, item.variant)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Usuń"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-cream px-5 py-4">
            <span className="text-sm text-muted-foreground">Razem</span>
            <span className="text-xl text-primary">{formatPrice(total)}</span>
          </div>

          <Button asChild className="mt-6 w-full rounded-full py-6">
            <Link to="/zamowienie">Przejdź do zamówienia</Link>
          </Button>
        </>
      )}
    </div>
  );
}
