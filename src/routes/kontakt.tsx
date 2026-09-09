import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Facebook, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { PetalDivider } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — SiViK Flowers, Rabka-Zdrój" },
      {
        name: "description",
        content: "Zadzwoń, napisz na WhatsApp lub Instagram. Kwiaciarnia SiViK Flowers, Rabka-Zdrój.",
      },
      { property: "og:title", content: "Kontakt — SiViK Flowers" },
      { property: "og:description", content: "Telefon, WhatsApp, Instagram i formularz kontaktowy." },
    ],
  }),
  component: Contact,
});

const PHONE = "+48 000 000 000";

function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <p className="eyebrow">Skontaktuj się z nami</p>
        <h1 className="mt-2 text-4xl">Kontakt</h1>
        <PetalDivider className="my-5" />
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <a
            href="tel:+48000000000"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sage">
              <Phone className="size-5" />
            </span>
            <span>
              <span className="block">{PHONE}</span>
              <span className="text-xs text-muted-foreground">Zadzwoń</span>
            </span>
          </a>
          <a
            href="https://wa.me/48000000000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sage">
              <MessageCircle className="size-5" />
            </span>
            <span>
              <span className="block">WhatsApp</span>
              <span className="text-xs text-muted-foreground">Napisz do nas</span>
            </span>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sage">
              <Instagram className="size-5" />
            </span>
            <span>
              <span className="block">@tutaj_nazwa_instagrama</span>
              <span className="text-xs text-muted-foreground">Obserwuj nas</span>
            </span>
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sage">
              <Facebook className="size-5" />
            </span>
            <span>
              <span className="block">SiViK Flowers</span>
              <span className="text-xs text-muted-foreground">Facebook</span>
            </span>
          </a>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sage">
              <MapPin className="size-5" />
            </span>
            <span>
              <span className="block">Rabka-Zdrój i okolice</span>
              <span className="text-xs text-muted-foreground">Obszar dostawy</span>
            </span>
          </div>
        </div>

        <form
          className="space-y-4 rounded-xl border border-border bg-cream p-5"
          onSubmit={(e) => {
            e.preventDefault();
            e.currentTarget.reset();
            toast.success("Dziękujemy! Odezwiemy się wkrótce.");
          }}
        >
          <h2 className="text-2xl">Napisz do nas</h2>
          <div>
            <Label htmlFor="cname">Imię</Label>
            <Input id="cname" name="cname" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="cphone">Telefon lub e-mail</Label>
            <Input id="cphone" name="cphone" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="cmsg">Wiadomość</Label>
            <Textarea id="cmsg" name="cmsg" rows={5} required className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full rounded-full">
            Wyślij wiadomość
          </Button>
        </form>
      </div>

      <div className="mt-12 overflow-hidden rounded-xl border border-border">
        <iframe
          title="Mapa — Rabka-Zdrój"
          src="https://www.google.com/maps?q=Rabka-Zdr%C3%B3j&output=embed"
          width="100%"
          height="360"
          loading="lazy"
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
