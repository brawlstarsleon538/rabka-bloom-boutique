/**
 * Login, registration and logout, replacing `supabase.auth.*`.
 *
 * These run on the server so that password hashes and DATABASE_URL never reach
 * the browser. The client only ever sees `{ id, email, isAdmin }`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(6).max(200),
});

// Serialises the "first account becomes admin" check so two simultaneous
// registrations cannot both claim the role.
const FIRST_ADMIN_LOCK_KEY = 5_512_907;

export const register = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const { db } = await import("@/db/client.server");
    const { hashPassword } = await import("@/lib/auth/password");
    const { createSession } = await import("@/lib/auth/session.server");

    const sql = await db();
    const passwordHash = await hashPassword(data.password);

    const userId = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(${FIRST_ADMIN_LOCK_KEY})`;

      const existing = await tx<{ id: string }[]>`
        SELECT id FROM users WHERE lower(email) = lower(${data.email})
      `;
      if (existing.length > 0) {
        throw new Error("To konto już istnieje — zaloguj się.");
      }

      const inserted = await tx<{ id: string }[]>`
        INSERT INTO users (email, password_hash)
        VALUES (${data.email}, ${passwordHash})
        RETURNING id
      `;
      const id = inserted[0]!.id;

      // Mirrors the old grant_first_admin trigger on auth.users: the shop owner
      // registers first and gets the panel, later accounts do not.
      await tx`
        INSERT INTO user_roles (user_id, role)
        SELECT ${id}, 'admin'::app_role
        WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin')
      `;

      return id;
    });

    await createSession(userId);
    return { ok: true as const };
  });

export const login = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const { db } = await import("@/db/client.server");
    const { verifyPassword } = await import("@/lib/auth/password");
    const { createSession } = await import("@/lib/auth/session.server");

    const sql = await db();
    const rows = await sql<{ id: string; password_hash: string }[]>`
      SELECT id, password_hash FROM users WHERE lower(email) = lower(${data.email})
    `;

    const user = rows[0];
    // Same message whether the address is unknown or the password is wrong, so
    // the form cannot be used to enumerate accounts.
    const invalid = new Error("Nieprawidłowy e-mail lub hasło");
    if (!user) throw invalid;
    if (!(await verifyPassword(data.password, user.password_hash))) throw invalid;

    await createSession(user.id);
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { destroySession } = await import("@/lib/auth/session.server");
  await destroySession();
  return { ok: true as const };
});

/** Returns the signed-in user, or null. Used by route guards and the panel. */
export const currentUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/session.server");
  return await getSessionUser();
});

/** True when at least one account exists, so the form can offer registration. */
export const hasAnyAccount = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("@/db/client.server");
  const sql = await db();
  const rows = await sql<{ exists: boolean }[]>`SELECT EXISTS (SELECT 1 FROM users) AS exists`;
  return rows[0]?.exists ?? false;
});
