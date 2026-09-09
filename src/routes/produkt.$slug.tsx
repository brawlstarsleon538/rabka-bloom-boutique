import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeProduct(data) : null;
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

  const chosen = variant ?? product.variants[0] ?? null;

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
        <p className="mt-3 text-2xl text-primary">{formatPrice(product.price)}</p>
        <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>

        {product.variants.length > 0 && (
          <div className="mt-7">
            <p className="mb-2 text-sm text-muted-foreground">Rozmiar / wariant</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={chosen === v ? "default" : "outline"}
                  className="rounded-full border-gold/50 px-5"
                  onClick={() => setVariant(v)}
                >
                  {v}
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
                price: product.price,
                image: product.image_url,
                variant: chosen,
                quantity: qty,
              });
              toast.success("Dodano do koszyka");
            }}
          >
            {product.in_stock ? "Dodaj do koszyka" : "Chwilowo niedostępne"}
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Dostawa: Rabka-Zdrój i okolice. Wybierzesz dzień i godzinę przy zamówieniu.
        </p>
      </div>
    </div>
  );
}
