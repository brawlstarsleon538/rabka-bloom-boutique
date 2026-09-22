import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { ORDER_STATUS_VALUES, isSlotAvailable, ADVANCE_HOURS } from "@/lib/shop";

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

// Placing an order stays public, matching the old "orders public insert" policy.
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    // Server-side: enforce minimum 4-hour advance ordering
    if (!isSlotAvailable(data.delivery_date, data.delivery_slot)) {
      throw new Error(
        `Zamówienie musi być złożone co najmniej ${ADVANCE_HOURS} godziny przed dostawą.`,
      );
    }

    const { db } = await import("@/db/client.server");
    const sql = await db();

    const ids = [...new Set(data.items.map((i) => i.productId))];

    return await sql.begin(async (tx) => {
      const products = await tx<
        { id: string; price: string; in_stock: boolean }[]
      >`SELECT id, price, in_stock FROM products WHERE id = ANY(${ids}::uuid[])`;

      if (products.length !== ids.length) throw new Error("Produkt niedostępny");
      if (products.some((p) => !p.in_stock)) throw new Error("Produkt niedostępny");

      // Prices come from the database, never from the request, so a tampered
      // client cannot set its own totals.
      const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));

      const lines = data.items.map((i) => ({
        product_id: i.productId,
        product_name: i.name,
        variant: i.variant ?? null,
        unit_price: priceById.get(i.productId)!,
        quantity: i.quantity,
      }));
      const total = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);

      const inserted = await tx<{ id: string; order_number: string }[]>`
        INSERT INTO orders (
          customer_name, customer_phone, customer_email, delivery_address, delivery_city,
          delivery_date, delivery_slot, gift_message, notes, payment_method,
          payment_status, status, total
        ) VALUES (
          ${data.customer_name}, ${data.customer_phone}, ${data.customer_email},
          ${data.delivery_address}, ${data.delivery_city}, ${data.delivery_date},
          ${data.delivery_slot}, ${data.gift_message}, ${data.notes}, ${data.payment_method},
          'oczekuje', 'nowe', ${total}
        )
        RETURNING id, order_number
      `;
      const order = inserted[0]!;

      await tx`
        INSERT INTO order_items ${tx(
          lines.map((l) => ({ ...l, order_id: order.id })),
          "order_id",
          "product_id",
          "product_name",
          "variant",
          "unit_price",
          "quantity",
        )}
      `;

      return { orderNumber: order.order_number, total };
    });
  });

export type OrderRow = {
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
  total: string;
  created_at: Date;
};

export type OrderItemRow = {
  id: string;
  product_name: string;
  variant: string | null;
  unit_price: string;
  quantity: number;
};

// Replaces the "orders admin read" policy.
export const listOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderRow[]> => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();
    const rows = await sql<OrderRow[]>`
    SELECT
      id, order_number, customer_name, customer_phone, customer_email,
      delivery_address, delivery_city,
      -- Sent as a plain YYYY-MM-DD string; the panel groups by it verbatim.
      to_char(delivery_date, 'YYYY-MM-DD') AS delivery_date,
      delivery_slot, gift_message, notes, payment_method, payment_status,
      status, total, created_at
    FROM orders
    ORDER BY created_at DESC
  `;
    return [...rows];
  },
);

// Replaces the "order items admin read" policy.
export const listOrderItems = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<OrderItemRow[]> => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();
    const rows = await sql<OrderItemRow[]>`
      SELECT id, product_name, variant, unit_price, quantity
      FROM order_items
      WHERE order_id = ${data.orderId}
      ORDER BY created_at ASC
    `;
    return [...rows];
  });

// Replaces the "orders admin update" policy.
export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(ORDER_STATUS_VALUES) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();
    await sql`UPDATE orders SET status = ${data.status} WHERE id = ${data.id}`;
    return { ok: true as const };
  });
