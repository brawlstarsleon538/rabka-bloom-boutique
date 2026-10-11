import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  formatPrice,
  getProductVariants,
  type Product,
  type ProductVariant,
} from "@/lib/shop";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [dialogOpen, setDialogOpen] = useState(false);

  const variants = getProductVariants(product);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]);
  const [quantity, setQuantity] = useState(1);

  const minPrice = variants.reduce(
    (min, v) => (v.price != null && v.price < min ? v.price : min),
    product.price,
  );

  const activePrice = selectedVariant?.price ?? product.price;

  const handleOpenOrder = () => {
    setSelectedVariant(variants[0]);
    setQuantity(1);
    setDialogOpen(true);
  };

  const handleAddToCart = () => {
    add({
      productId: product.id,
      name: product.name,
      price: activePrice,
      image: product.image_url,
      variant: selectedVariant?.name ?? null,
      quantity,
    });
    toast.success("Dodano do koszyka", {
      description: `${product.name} (${selectedVariant?.name ?? "Standard"}) × ${quantity}`,
    });
    setDialogOpen(false);
  };

  return (
    <>
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
          <p className="text-sm text-muted-foreground">od {formatPrice(minPrice)}</p>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span>🚗</span> Dostawa: Rabka-Zdrój i okolice
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 w-full rounded-full border-gold/50 text-primary hover:bg-secondary cursor-pointer"
            disabled={!product.in_stock}
            onClick={handleOpenOrder}
          >
            {product.in_stock ? "Zamów" : "Chwilowo niedostępne"}
          </Button>
        </div>
      </article>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-medium">Wybierz rozmiar</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Wybierz preferowaną wielkość kompozycji przed dodaniem do koszyka
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-muted/30 p-3">
            <img
              src={product.image_url}
              alt={product.name}
              className="size-16 rounded-lg object-cover border border-border/50 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
              <p className="text-xs font-semibold text-primary mt-1">od {formatPrice(minPrice)}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Dostępne rozmiary:
            </p>
            <div className="grid gap-2">
              {variants.map((v) => {
                const isSelected = selectedVariant?.name === v.name;
                const vPrice = v.price ?? product.price;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-border/70 hover:border-gold/60 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border transition-colors shrink-0",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{v.name}</span>
                    </div>
                    <span className="font-semibold text-sm text-primary shrink-0 pl-2">
                      {formatPrice(vPrice)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <span className="text-sm font-medium">Ilość sztuk:</span>
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Zmniejsz ilość"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Zwiększ ilość"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <Button
              className="w-full rounded-full py-5 text-sm font-medium shadow-sm cursor-pointer"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="mr-2 size-4" />
              Dodaj do koszyka · {formatPrice(activePrice * quantity)}
            </Button>
            <div className="text-center">
              <Link
                to="/produkt/$slug"
                params={{ slug: product.slug }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                onClick={() => setDialogOpen(false)}
              >
                Zobacz pełne szczegóły i opis produktu →
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
