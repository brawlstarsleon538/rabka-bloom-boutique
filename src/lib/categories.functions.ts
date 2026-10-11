import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
};

const PL_MAP: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[ąćęłńóśźż]/g, (char) => PL_MAP[char] ?? char)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryRow[]> => {
    const { db } = await import("@/db/client.server");
    const sql = await db();
    const rows = await sql<CategoryRow[]>`
      SELECT id, slug, name
      FROM categories
      ORDER BY name ASC
    `;
    return [...rows];
  },
);

export const createCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1, "Nazwa kategorii jest wymagana").max(100),
        slug: z.string().trim().max(100).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CategoryRow> => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();
    const generatedSlug = data.slug && data.slug.length > 0 ? slugify(data.slug) : slugify(data.name);
    const finalSlug = generatedSlug || `kat-${Date.now()}`;

    const rows = await sql<CategoryRow[]>`
      INSERT INTO categories (slug, name)
      VALUES (${finalSlug}, ${data.name})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, slug, name
    `;

    return rows[0];
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/auth/authz.server");
    const { db } = await import("@/db/client.server");
    await requireAdmin();

    const sql = await db();
    const cat = await sql<{ slug: string }[]>`
      SELECT slug FROM categories WHERE id = ${data.id}
    `;
    if (cat.length > 0) {
      const slug = cat[0].slug;
      // Reassign any products from deleted category to default 'bukiety'
      await sql`
        UPDATE products SET category = 'bukiety' WHERE category = ${slug}
      `;
    }
    await sql`DELETE FROM categories WHERE id = ${data.id}`;
    return { ok: true as const };
  });

