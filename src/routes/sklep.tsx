import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PetalDivider } from "@/components/Logo";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/products.functions";
import { CATEGORIES, normalizeProduct } from "@/lib/shop";

export const Route = createFileRoute("/sklep")({
  head: () => ({
    meta: [
      { title: "Sklep — bukiety, prezenty i zestawy | SiViK Flowers" },
      {
        name: "description",
        content:
          "Przeglądaj bukiety, flowerboxy, kosze prezentowe i zestawy z dostawą w Rabce-Zdroju.",
      },
      { property: "og:title", content: "Sklep — SiViK Flowers" },
      {
        property: "og:description",
        content: "Bukiety, prezenty i zestawy kwiatowe z dostawą w Rabce-Zdroju.",
      },
    ],
  }),
  component: Shop,
});

function Shop() {
  const [category, setCategory] = useState<string>("wszystkie");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const rows = await listProducts();
      return rows.map(normalizeProduct);
    },
  });

  const visible = (products ?? []).filter(
    (p) => category === "wszystkie" || p.category === category,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center">
        <p className="eyebrow">Nasza oferta</p>
        <h1 className="mt-2 text-4xl">Kwiaty & Prezenty</h1>
        <PetalDivider className="my-5" />
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {[{ value: "wszystkie", label: "Wszystkie" }, ...CATEGORIES].map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={category === c.value ? "default" : "outline"}
            className="rounded-full border-gold/50 px-5"
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Ładowanie…</p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Brak produktów w tej kategorii.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="mt-16 overflow-hidden rounded-2xl bg-cream px-6 py-12 text-center shadow-sm sm:px-12">
        <h2 className="text-2xl font-medium sm:text-3xl">Nie wiesz, co wybrać?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Połącz kwiaty, słodycze i prezent — stworzymy wyjątkowy zestaw specjalnie dla Ciebie.
        </p>
        <Button asChild className="mt-8 rounded-full px-8 shadow-sm">
          <Link to="/kontakt">Stwórz własny zestaw</Link>
        </Button>
      </div>
    </div>
  );
}
