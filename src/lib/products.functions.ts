/**
 * Product reads and admin writes, replacing the `supabase.from("products")`
 * calls that previously ran straight from the browser under RLS.
 *
 * Reads are public (the shop is public). Writes call `requireAdmin()`, which is
 * what now stands in for the "products admin write" policy.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Shape sent to the client. `price` arrives as a string because Postgres
 * numerics are exact; `normalizeProduct` in lib/shop.ts coerces it.
 */
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  variants: string[];
  in_stock: boolean;
  featured: boolean;
};

const productInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160),
  name: z.string().min(1).max(200),
  description: z.string().max(4000).default(""),
  price: z.number().min(0).max(1_000_000),
  category: z.string().min(1).max(60),
  image_url: z.string().max(500).default(""),
  variants: z.array(z.string().max(100)).max(20).default([]),
  in_stock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => {
    const { db } = await import("@/db/client.server");
    const sql = await db();
    const rows = await sql<ProductRow[]>`
      SELECT id, slug, name, description, price, category, image_url, variants, in_stock, featured
      FROM products
      ORDER BY created_at ASC
    `;
    // Spread out of postgres.js's RowList, which carries an iterator that the
    // server-function serializer rejects.
    return [...rows];
  },
);

export const listFeaturedProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => {
    const { db } = await import("@/db/client.server");
    const sql = await db();
    const rows = await sql<ProductRow[]>`
      SELECT id, slug, name, description, price, category, image_url, variants, in_stock, featured
      FROM products
      WHERE featured = true
      ORDER BY created_at ASC
      LIMIT 6
    `;
    return [...rows];
  },
);

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(160) }).parse(input))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    const { db } = await import("@/db/client.server");
    const sql = await db();
    const rows = await sql<ProductRow[]>`
      SELECT id, slug, name, description, price, category, image_url, variants, in_stock, featured
      FROM products
      WHERE slug = ${data.slug}
    `;
    return rows[0] ?? null;
  });

export const saveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => productInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();
    // JSON.stringify keeps the array as a single jsonb value rather than
    // postgres.js expanding it into a Postgres array.
    const variants = JSON.stringify(data.variants);

    if (data.id) {
      await sql`
        UPDATE products SET
          slug = ${data.slug},
          name = ${data.name},
          description = ${data.description},
          price = ${data.price},
          category = ${data.category},
          image_url = ${data.image_url},
          variants = ${variants}::jsonb,
          in_stock = ${data.in_stock},
          featured = ${data.featured}
        WHERE id = ${data.id}
      `;
      return { ok: true as const };
    }

    await sql`
      INSERT INTO products
        (slug, name, description, price, category, image_url, variants, in_stock, featured)
      VALUES (
        ${data.slug}, ${data.name}, ${data.description}, ${data.price}, ${data.category},
        ${data.image_url}, ${variants}::jsonb, ${data.in_stock}, ${data.featured}
      )
    `;
    return { ok: true as const };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();
    await sql`DELETE FROM products WHERE id = ${data.id}`;
    return { ok: true as const };
  });
