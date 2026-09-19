import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flower2, Gift, Heart } from "lucide-react";

import { Logo, PetalDivider } from "@/components/Logo";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { listFeaturedProducts } from "@/lib/products.functions";
import { normalizeProduct } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SiViK Flowers — kwiaty i prezenty z dostawą | Rabka-Zdrój" },
      {
        name: "description",
        content:
          "Świeże bukiety, flowerboxy i zestawy prezentowe. Zamów online z dostawą w Rabce-Zdroju i okolicach.",
      },
      { property: "og:title", content: "SiViK Flowers — kwiaty i prezenty z dostawą" },
      {
        property: "og:description",
        content: "Świeże bukiety i prezenty z dostawą w Rabce-Zdroju i okolicach.",
      },
    ],
  }),
  component: Index,
});

const HIGHLIGHTS = [
  { icon: Flower2, title: "Bukiety kwiatów", text: "róże, piwonie, tulipany, kompozycje sezonowe" },
  { icon: Gift, title: "Prezenty i dodatki", text: "kosze prezentowe, słodycze, upominki" },
  { icon: Heart, title: "Dostawa", text: "Rabka-Zdrój i okolice, także tego samego dnia" },
];

function Index() {
  const { data: featured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const rows = await listFeaturedProducts();
      return rows.map(normalizeProduct);
    },
  });

  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Pastelowe piwonie i eukaliptus"
          width={1920}
          height={1080}
          className="absolute inset-0 size-full object-cover opacity-70"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
          <p className="script text-2xl text-sage">Kwiaty i prezenty z dostawą</p>
          <div className="mt-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <PetalDivider className="my-6" />
          <p className="eyebrow">Kwiaty · Prezenty · Dostawa</p>
          <p className="script mt-4 text-2xl text-sage">Rabka-Zdrój i okolice</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/sklep">Zamów teraz</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-gold/60 px-8">
              <Link to="/o-nas">Poznaj nas</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-sage">
              <Icon className="size-6" />
            </div>
            <h2 className="mt-4 text-lg">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="text-center">
          <p className="eyebrow">Nasza oferta</p>
          <h2 className="mt-2 text-3xl">Wybrane kompozycje</h2>
          <PetalDivider className="my-5" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(featured ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full border-gold/60 px-8">
            <Link to="/sklep">Zobacz cały sklep</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="script text-2xl leading-relaxed text-sage">
          Bo każda chwila zasługuje na piękne kwiaty…
        </p>
      </section>
    </div>
  );
}
