import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, Facebook } from "lucide-react";

import p1 from "@/assets/p1.jpg.asset.json";
import { PetalDivider } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/o-nas")({
  head: () => ({
    meta: [
      { title: "O nas — kwiaciarnia SiViK Flowers w Rabce-Zdroju" },
      {
        name: "description",
        content:
          "Poznaj SiViK Flowers — małą kwiaciarnię z Rabki-Zdroju. Bukiety, prezenty i dostawa w okolicy.",
      },
      { property: "og:title", content: "O nas — SiViK Flowers" },
      { property: "og:description", content: "Mała kwiaciarnia z Rabki-Zdroju z dostawą w okolicy." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <p className="eyebrow">Poznajmy się</p>
        <h1 className="mt-2 text-4xl">O nas</h1>
        <PetalDivider className="my-5" />
      </div>

      <div className="grid items-center gap-10 md:grid-cols-2">
        <img
          src={p1.url}
          alt="Bukiet pudrowych piwonii"
          loading="lazy"
          width={1024}
          height={1024}
          className="rounded-xl object-cover"
        />
        <div className="space-y-4 text-muted-foreground">
          <p>
            SiViK Flowers to mała, rodzinna kwiaciarnia z Rabki-Zdroju. Układamy bukiety z
            sezonowych kwiatów i kompletujemy prezenty, które mówią więcej niż słowa.
          </p>
          <p>
            Każdą kompozycję przygotowujemy ręcznie, w dniu dostawy — dzięki temu kwiaty docierają
            świeże i piękne. Dowozimy na terenie Rabki-Zdroju i okolic, często jeszcze tego samego
            dnia.
          </p>
          <p className="script text-2xl text-sage">Bo każda chwila zasługuje na piękne kwiaty…</p>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-border bg-cream p-8 text-center">
        <h2 className="text-2xl">Obszar dostawy</h2>
        <p className="mt-2 text-muted-foreground">
          Rabka-Zdrój i okolice — Chabówka, Ponice, Rdzawka, Skomielna Biała i pobliskie
          miejscowości.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full px-8">
            <Link to="/sklep">Zamów teraz</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-gold/60 px-6">
            <a href="https://www.instagram.com/sivik_flowers" target="_blank" rel="noreferrer">
              <Instagram className="mr-2 size-4" /> Instagram
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-gold/60 px-6">
            <a href="https://www.facebook.com/share/1CofRdJcS5/" target="_blank" rel="noreferrer">
              <Facebook className="mr-2 size-4" /> Facebook
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
