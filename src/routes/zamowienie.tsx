import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { PetalDivider } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/orders.functions";
import { useCart } from "@/lib/cart";
import { ADVANCE_HOURS, DELIVERY_SLOTS, formatPrice, isSlotAvailable } from "@/lib/shop";

export const Route = createFileRoute("/zamowienie")({
  head: () => ({
    meta: [
      { title: "Zamówienie i dostawa — SiViK Flowers" },
      {
        name: "description",
        content: "Podaj adres dostawy, wybierz dzień, godzinę i sposób płatności (BLIK lub gotówka przy odbiorze).",
      },
      { property: "og:title", content: "Zamówienie — SiViK Flowers" },
      { property: "og:description", content: "Dostawa kwiatów w Rabce-Zdroju i okolicach." },
    ],
  }),
  component: Checkout,
});

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Returns the earliest selectable date (today if ≥1 slot is still available, else tomorrow). */
function minDeliveryDate(): string {
  const today = isoDate(new Date());
  if (DELIVERY_SLOTS.some((s) => isSlotAvailable(today, s))) return today;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isoDate(tomorrow);
}

/** Returns the first available slot for a given date, or null. */
function firstAvailableSlot(dateISO: string): string | null {
  return DELIVERY_SLOTS.find((s) => isSlotAvailable(dateISO, s)) ?? null;
}

function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [payment, setPayment] = useState("blik");
  const initialDate = minDeliveryDate();
  const [date, setDate] = useState(initialDate);
  const [slot, setSlot] = useState(() => firstAvailableSlot(initialDate) ?? DELIVERY_SLOTS[0]!);
  const submitOrder = useServerFn(createOrder);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = e.target.value;
    setDate(d);
    // Auto-switch to the first valid slot on the new date
    const first = firstAvailableSlot(d);
    if (first) setSlot(first);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return;
    const form = new FormData(e.currentTarget);
    const selectedDate = String(form.get("date"));
    if (!isSlotAvailable(selectedDate, slot)) {
      toast.error(
        `Wybierz termin dostawy co najmniej ${ADVANCE_HOURS} godziny z wyprzedzeniem.`,
      );
      return;
    }
    setSending(true);
    try {
      const result = await submitOrder({
        data: {
          customer_name: String(form.get("name")),
          customer_phone: String(form.get("phone")),
          customer_email: String(form.get("email") || ""),
          delivery_address: String(form.get("address")),
          delivery_city: String(form.get("city") || "Rabka-Zdrój"),
          delivery_date: String(form.get("date")),
          delivery_slot: slot,
          gift_message: String(form.get("gift") || ""),
          notes: String(form.get("notes") || ""),
          payment_method: payment as "blik" | "gotowka",
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            variant: i.variant ?? null,
            quantity: i.quantity,
          })),
        },
      });

      clear();
      setDone(result.orderNumber);
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się złożyć zamówienia. Spróbuj ponownie.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-4xl">Dziękujemy!</h1>
        <PetalDivider className="my-5" />
        <p className="text-muted-foreground">
          Zamówienie <span className="text-primary">nr {done}</span> zostało przyjęte. Zadzwonimy,
          aby potwierdzić szczegóły dostawy i płatności.
        </p>
        <Button className="mt-8 rounded-full px-8" onClick={() => navigate({ to: "/sklep" })}>
          Wróć do sklepu
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">Koszyk jest pusty.</p>
        <Button asChild className="mt-5 rounded-full px-8">
          <Link to="/sklep">Przejdź do sklepu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl">Zamówienie</h1>
        <PetalDivider className="my-5" />
      </div>

      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input id="name" name="name" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" type="tel" required className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">E-mail (opcjonalnie)</Label>
            <Input id="email" name="email" type="email" className="mt-1.5" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <Label htmlFor="address">Adres dostawy</Label>
              <Input id="address" name="address" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="city">Miejscowość</Label>
              <Input id="city" name="city" defaultValue="Rabka-Zdrój" className="mt-1.5" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Data dostawy</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                min={minDeliveryDate()}
                value={date}
                onChange={handleDateChange}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Godzina dostawy</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {DELIVERY_SLOTS.map((s) => {
                  const available = isSlotAvailable(date, s);
                  return (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={slot === s ? "default" : "outline"}
                      disabled={!available}
                      title={!available ? `Wymagane ${ADVANCE_HOURS}h wyprzedzenia` : undefined}
                      className={`rounded-full border-gold/50 ${
                        !available ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      onClick={() => available && setSlot(s)}
                    >
                      {s}
                    </Button>
                  );
                })}
              </div>
              {!isSlotAvailable(date, slot) && (
                <p className="mt-1 text-xs text-destructive">
                  Dostawa możliwa minimum {ADVANCE_HOURS} godziny z wyprzedzeniem.
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="gift">Bilecik / dedykacja (opcjonalnie)</Label>
            <Textarea id="gift" name="gift" rows={3} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="notes">Uwagi do zamówienia</Label>
            <Textarea id="notes" name="notes" rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Płatność</Label>
            <div className="mt-1.5 flex gap-2">
              {[
                { value: "blik", label: "BLIK" },
                { value: "gotowka", label: "Gotówka przy odbiorze" },
              ].map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  size="sm"
                  variant={payment === m.value ? "default" : "outline"}
                  className="rounded-full border-gold/50"
                  onClick={() => setPayment(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Płatność online (BLIK) potwierdzamy telefonicznie — integracja z operatorem
              płatności zostanie podłączona wkrótce.
            </p>
          </div>

          <Button type="submit" disabled={sending} className="w-full rounded-full py-6">
            {sending ? "Wysyłanie…" : `Zamawiam · ${formatPrice(total)}`}
          </Button>
        </form>

        <aside className="h-fit rounded-xl border border-border bg-cream p-5">
          <h2 className="text-xl">Podsumowanie</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={`${i.productId}-${i.variant}`} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.name}
                  {i.variant ? ` · ${i.variant}` : ""} × {i.quantity}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Razem</span>
            <span className="text-lg text-primary">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
