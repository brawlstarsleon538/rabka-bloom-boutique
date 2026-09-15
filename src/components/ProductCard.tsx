import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/lib/shop";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group overflow-hidden rounded-xl border border-border/70 bg-card">
      <Link
        to="/produkt/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square overflow-hidden bg-cream"
      >
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="space-y-3 p-4 text-center">
        <Link to="/produkt/$slug" params={{ slug: product.slug }}>
          <h3 className="text-lg">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-gold/50 text-primary hover:bg-secondary"
          disabled={!product.in_stock}
          onClick={() => {
            add({
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.image_url,
              variant: product.variants[0] ?? null,
              quantity: 1,
            });
            toast.success("Dodano do koszyka", { description: product.name });
          }}
        >
          {product.in_stock ? "Dodaj do koszyka" : "Chwilowo niedostępne"}
        </Button>
      </div>
    </article>
  );
}
