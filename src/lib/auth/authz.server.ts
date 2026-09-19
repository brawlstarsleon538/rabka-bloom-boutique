/**
 * Authorization checks that replace the Supabase RLS policies.
 *
 * Under RLS the database rejected unauthorized reads and writes even if the
 * app forgot to check. There is no such safety net now: every server function
 * touching admin-only data must call `requireAdmin()` before it queries.
 *
 * Policy mapping from supabase/migrations:
 *   products  — public read            -> no check on read, requireAdmin to write
 *   orders    — public insert          -> no check on create, requireAdmin to read/update/delete
 *   order_items — public insert        -> written only alongside an order
 *   user_roles — own roles readable    -> exposed via the session's isAdmin flag
 */
import { getSessionUser, type SessionUser } from "./session.server";

export class AuthError extends Error {
  constructor(message = "Wymagane zalogowanie") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new AuthError("Brak uprawnień administratora");
  return user;
}
