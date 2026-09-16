import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, ORDER_STATUSES, formatPrice, normalizeProduct, type Product } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel zamówień i produktów | SiViK Flowers" },
      { name: "description", content: "Zarządzanie zamówieniami i produktami kwiaciarni." },
      { property: "og:title", content: "Panel — SiViK Flowers" },
      { property: "og:description", content: "Zarządzanie zamówieniami i produktami." },
    ],
  }),
  component: AdminPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_date: string;
  delivery_slot: string;
  gift_message: string | null;
  notes: string | null;
  payment_method: string;
  payment_status: string;
  status: string;
  total: number;
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin");
      if (error) throw error;
      return (data ?? []).length > 0;
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (roleLoading) {
    return <p className="py-24 text-center text-sm text-muted-foreground">Ładowanie…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl">Brak uprawnień</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          To konto nie ma dostępu do panelu. Poproś o nadanie uprawnień administratora.
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut}>
          Wyloguj się
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Panel</p>
          <h1 className="mt-1 text-3xl">Zarządzanie</h1>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          Wyloguj się
        </Button>
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders">Zamówienia</TabsTrigger>
          <TabsTrigger value="calendar">Kalendarz</TabsTrigger>
          <TabsTrigger value="products">Produkty</TabsTrigger>
          <TabsTrigger value="stats">Statystyki</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-6">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <CalendarTab />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <StatsTab />
        </TabsContent>
      </Tabs>

    </div>
  );
}

function useOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });
}

function OrdersTab() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useOrders();
  const [filter, setFilter] = useState("wszystkie");
  const [openOrder, setOpenOrder] = useState<OrderRow | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status zaktualizowany");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = (orders ?? []).filter((o) => filter === "wszystkie" || o.status === filter);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {[{ value: "wszystkie", label: "Wszystkie" }, ...ORDER_STATUSES].map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={filter === s.value ? "default" : "outline"}
            className="rounded-full px-4"
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Ładowanie…</p>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Brak zamówień.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4"
            >
              <div className="min-w-[12rem]">
                <p className="text-sm font-medium">
                  #{o.order_number} · {o.customer_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {o.delivery_date} · {o.delivery_slot} · {o.delivery_city}
                </p>
              </div>
              <p className="text-sm">{formatPrice(Number(o.total))}</p>
              <div className="flex items-center gap-2">
                <Select
                  value={o.status}
                  onValueChange={(status) => updateStatus.mutate({ id: o.id, status })}
                >
                  <SelectTrigger className="w-[10rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setOpenOrder(o)}>
                  Szczegóły
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OrderDialog order={openOrder} onClose={() => setOpenOrder(null)} />
    </div>
  );
}

function OrderDialog({ order, onClose }: { order: OrderRow | null; onClose: () => void }) {
  const { data: items } = useQuery({
    queryKey: ["order-items", order?.id],
    enabled: !!order,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>Zamówienie #{order.order_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Klient: </span>
                {order.customer_name} · {order.customer_phone}
                {order.customer_email ? ` · ${order.customer_email}` : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Dostawa: </span>
                {order.delivery_address}, {order.delivery_city}
              </p>
              <p>
                <span className="text-muted-foreground">Termin: </span>
                {order.delivery_date}, {order.delivery_slot}
              </p>
              <p>
                <span className="text-muted-foreground">Płatność: </span>
                {order.payment_method} · {order.payment_status}
              </p>
              {order.gift_message && (
                <p>
                  <span className="text-muted-foreground">Bilecik: </span>
                  {order.gift_message}
                </p>
              )}
              {order.notes && (
                <p>
                  <span className="text-muted-foreground">Uwagi: </span>
                  {order.notes}
                </p>
              )}
              <div className="mt-4 space-y-1 border-t border-border/70 pt-3">
                {(items ?? []).map((it) => (
                  <div key={String(it.id)} className="flex justify-between">
                    <span>
                      {it.product_name}
                      {it.variant ? ` (${it.variant})` : ""} × {it.quantity}
                    </span>
                    <span>{formatPrice(Number(it.unit_price) * Number(it.quantity))}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-base">
                  <span>Razem</span>
                  <span>{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Zamknij
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_PRODUCT = {
  id: "",
  slug: "",
  name: "",
  description: "",
  price: 0,
  category: "bukiety",
  image_url: "",
  variants: [] as string[],
  in_stock: true,
  featured: false,
};

function ProductsTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | typeof EMPTY_PRODUCT | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(normalizeProduct);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produkt usunięty");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <Button className="mb-5" onClick={() => setEditing({ ...EMPTY_PRODUCT })}>
        Dodaj produkt
      </Button>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Ładowanie…</p>
      ) : (
        <div className="space-y-3">
          {(products ?? []).map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  width={56}
                  height={56}
                  className="size-14 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.category} · {formatPrice(p.price)} ·{" "}
                    {p.in_stock ? "dostępny" : "niedostępny"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                  Edytuj
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm(`Usunąć „${p.name}”?`)) remove.mutate(p.id);
                  }}
                >
                  Usuń
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <ProductDialog product={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ProductDialog({
  product,
  onClose,
}: {
  product: Product | typeof EMPTY_PRODUCT;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...product, variantsText: product.variants.join(", ") });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        slug:
          form.slug.trim() ||
          form.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        image_url: form.image_url,
        variants: form.variantsText
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        in_stock: form.in_stock,
        featured: form.featured,
      };
      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Zapisano");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edytuj produkt" : "Nowy produkt"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nazwa</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Opis</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cena (zł)</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select
                value={form.category}
                onValueChange={(category) => setForm({ ...form, category })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adres zdjęcia (URL)</Label>
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Warianty (oddzielone przecinkami)</Label>
            <Input
              value={form.variantsText}
              onChange={(e) => setForm({ ...form, variantsText: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.in_stock}
                onCheckedChange={(in_stock) => setForm({ ...form, in_stock })}
              />
              Dostępny
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.featured}
                onCheckedChange={(featured) => setForm({ ...form, featured })}
              />
              Polecany
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatsTab() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Ładowanie…</p>;
  }

  const all = orders ?? [];
  const now = Date.now();
  const inLast = (days: number) =>
    all.filter((o) => now - new Date(o.created_at).getTime() <= days * 86400000);
  const sum = (rows: OrderRow[]) => rows.reduce((acc, o) => acc + Number(o.total), 0);

  const today = inLast(1);
  const week = inLast(7);

  const cards = [
    { label: "Zamówienia dziś", value: String(today.length) },
    { label: "Przychód dziś", value: formatPrice(sum(today)) },
    { label: "Zamówienia (7 dni)", value: String(week.length) },
    { label: "Przychód (7 dni)", value: formatPrice(sum(week)) },
    { label: "Wszystkie zamówienia", value: String(all.length) },
    { label: "Przychód łącznie", value: formatPrice(sum(all)) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border/70 bg-card p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
          <p className="mt-2 text-2xl">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
