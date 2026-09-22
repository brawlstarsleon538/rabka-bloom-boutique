import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatPrice, type Product } from "@/lib/shop";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md">
      {product.featured && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-gold/90 px-3 py-1 text-xs font-medium text-white shadow-sm">
          Bestseller
        </span>
      )}
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
      <div className="space-y-3 p-5 text-center">
        <Link to="/produkt/$slug" params={{ slug: product.slug }}>
          <h3 className="text-lg">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>🚗</span> Dostawa: Rabka-Zdrój i okolice
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 w-full rounded-full border-gold/50 text-primary hover:bg-secondary"
          disabled={!product.in_stock}
          onClick={() => {
            const defaultVariant = product.variants[0];
            const itemPrice = defaultVariant?.price ?? product.price;
            add({
              productId: product.id,
              name: product.name,
              price: itemPrice,
              image: product.image_url,
              variant: defaultVariant?.name ?? null,
              quantity: 1,
            });
            toast.success("Dodano do koszyka", { description: product.name });
          }}
        >
          {product.in_stock ? "Zamów" : "Chwilowo niedostępne"}
        </Button>
      </div>
    </article>
  );
}
