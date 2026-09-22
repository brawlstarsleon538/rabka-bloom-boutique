import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Instagram, Facebook, MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PetalDivider } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/contact.functions";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — SiViK Flowers, Rabka-Zdrój" },
      {
        name: "description",
        content: "Zadzwoń, napisz na e-mail sivik.flowers@gmail.com, WhatsApp lub Instagram. Kwiaciarnia SiViK Flowers, Rabka-Zdrój.",
      },
      { property: "og:title", content: "Kontakt — SiViK Flowers" },
      { property: "og:description", content: "E-mail, telefon, WhatsApp, Instagram i formularz kontaktowy." },
    ],
  }),
  component: Contact,
});

const PHONE = "+48 532 136 020";
const EMAIL = "sivik.flowers@gmail.com";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      return await sendContactMessage({ data: { name, email, message } });
    },
    onSuccess: (res) => {
      toast.success(res.message);
      setName("");
      setEmail("");
      setMessage("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Wystąpił błąd podczas wysyłania wiadomości.");
    },
  });

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
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sage">
              <Mail className="size-5" />
            </span>
            <span>
              <span className="block font-medium">{EMAIL}</span>
              <span className="text-xs text-muted-foreground">Napisz e-mail</span>
            </span>
          </a>
          <a
            href="tel:+48532136020"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50"
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
            href="https://wa.me/48532136020"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50"
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
            href="https://www.instagram.com/sivik_flowers"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sage">
              <Instagram className="size-5" />
            </span>
            <span>
              <span className="block">@sivik_flowers</span>
              <span className="text-xs text-muted-foreground">Obserwuj nas</span>
            </span>
          </a>
          <a
            href="https://www.facebook.com/share/1CofRdJcS5/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/50"
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
            sendMutation.mutate();
          }}
        >
          <h2 className="text-2xl">Napisz do nas</h2>
          <div>
            <Label htmlFor="cname">Imię</Label>
            <Input
              id="cname"
              name="cname"
              placeholder="Twoje imię"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cemail">Adres e-mail</Label>
            <Input
              id="cemail"
              name="cemail"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cmsg">Wiadomość</Label>
            <Textarea
              id="cmsg"
              name="cmsg"
              rows={5}
              placeholder="Wpisz treść swojej wiadomości..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={sendMutation.isPending || !name.trim() || !email.trim() || !message.trim()}
          >
            {sendMutation.isPending
              ? "Wysyłanie na sivik.flowers@gmail.com..."
              : "Wyślij wiadomość"}
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
