import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/lib/products.functions";
import { useCart } from "@/lib/cart";
import { formatPrice, normalizeProduct } from "@/lib/shop";

export const Route = createFileRoute("/produkt/$slug")({
  head: () => ({
    meta: [
      { title: "Produkt — SiViK Flowers" },
      { name: "description", content: "Szczegóły kompozycji kwiatowej i zamówienie online." },
      { property: "og:title", content: "Produkt — SiViK Flowers" },
      { property: "og:description", content: "Szczegóły kompozycji kwiatowej i zamówienie online." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const [variant, setVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const row = await getProductBySlug({ data: { slug } });
      return row ? normalizeProduct(row) : null;
    },
  });

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-muted-foreground">Ładowanie…</p>;
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">Nie znaleźliśmy tego produktu.</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/sklep">Wróć do sklepu</Link>
        </Button>
      </div>
    );
  }

  const chosenVariant = product.variants.find((v) => v.name === variant) ?? product.variants[0] ?? null;
  const activePrice = chosenVariant?.price ?? product.price;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl bg-cream">
        <img
          src={product.image_url}
          alt={product.name}
          width={1024}
          height={1024}
          className="size-full object-cover"
        />
      </div>

      <div>
        <p className="eyebrow">{product.category}</p>
        <h1 className="mt-2 text-4xl">{product.name}</h1>
        <p className="mt-3 text-2xl text-primary">{formatPrice(activePrice)}</p>
        <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>

        {product.variants.length > 0 && (
          <div className="mt-7">
            <p className="mb-2 text-sm text-muted-foreground">Rozmiar / wariant</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <Button
                  key={v.name}
                  size="sm"
                  variant={chosenVariant?.name === v.name ? "default" : "outline"}
                  className="rounded-full border-gold/50 px-5"
                  onClick={() => setVariant(v.name)}
                >
                  <span>{v.name}</span>
                  {v.price != null && (
                    <span className="ml-1 text-xs opacity-75">({formatPrice(v.price)})</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-border">
            <button className="p-2.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Mniej">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm">{qty}</span>
            <button className="p-2.5" onClick={() => setQty((q) => q + 1)} aria-label="Więcej">
              <Plus className="size-4" />
            </button>
          </div>
          <Button
            className="flex-1 rounded-full"
            disabled={!product.in_stock}
            onClick={() => {
              add({
                productId: product.id,
                name: product.name,
                price: activePrice,
                image: product.image_url,
                variant: chosenVariant?.name ?? null,
                quantity: qty,
              });
              toast.success("Dodano do koszyka");
            }}
          >
            {product.in_stock ? "Zamów" : "Chwilowo niedostępne"}
          </Button>
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">🚗</span> 
          <span>
            <strong>Dostawa: Rabka-Zdrój i okolice.</strong> Wybierzesz dzień i godzinę przy zamówieniu.
          </span>
        </p>
      </div>
    </div>
  );
}
