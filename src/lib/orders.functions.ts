import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(200),
  variant: z.string().max(100).nullable().optional(),
  quantity: z.number().int().min(1).max(50),
});

const orderSchema = z.object({
  customer_name: z.string().min(2).max(120),
  customer_phone: z.string().min(6).max(30),
  customer_email: z.string().max(160).optional().default(""),
  delivery_address: z.string().min(3).max(300),
  delivery_city: z.string().min(2).max(120).default("Rabka-Zdrój"),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  delivery_slot: z.string().min(3).max(60),
  gift_message: z.string().max(500).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
  payment_method: z.enum(["blik", "karta", "gotowka"]),
  items: z.array(itemSchema).min(1).max(30),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, in_stock")
      .in("id", ids);
    if (prodError) throw new Error(prodError.message);
    if (!products || products.length !== ids.length) throw new Error("Produkt niedostępny");

    const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));
    if (products.some((p) => !p.in_stock)) throw new Error("Produkt niedostępny");

    const lines = data.items.map((i) => ({
      product_id: i.productId,
      product_name: i.name,
      variant: i.variant ?? null,
      unit_price: priceById.get(i.productId)!,
      quantity: i.quantity,
    }));
    const total = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email,
        delivery_address: data.delivery_address,
        delivery_city: data.delivery_city,
        delivery_date: data.delivery_date,
        delivery_slot: data.delivery_slot,
        gift_message: data.gift_message,
        notes: data.notes,
        payment_method: data.payment_method,
        payment_status: "oczekuje",
        status: "nowe",
        total,
      })
      .select("id, order_number")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Nie udało się zapisać zamówienia");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) throw new Error(itemsError.message);

    return { orderNumber: order.order_number as string, total };
  });
