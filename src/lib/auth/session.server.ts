/**
 * Database-backed login sessions, replacing Supabase Auth's JWTs.
 *
 * The cookie holds a random opaque token; only its SHA-256 digest is stored, so
 * sessions cannot be reconstructed from a database dump. Being table-backed
 * (rather than a signed stateless token) means logout revokes immediately.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

import { db } from "@/db/client.server";

const COOKIE_NAME = "sivik_session";
const SESSION_TTL_DAYS = 30;

export type SessionUser = { id: string; email: string; isAdmin: boolean };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  const sql = await db();

  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hashToken(token)}, ${expiresAt})
  `;

  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // Railway serves the app over HTTPS; plain HTTP only happens locally.
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Resolves the signed-in user, or null when there is no valid session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = getCookie(COOKIE_NAME);
  if (!token) return null;

  const sql = await db();
  const rows = await sql<{ id: string; email: string; is_admin: boolean }[]>`
    SELECT
      u.id,
      u.email,
      EXISTS (
        SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role = 'admin'
      ) AS is_admin
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
  `;

  const row = rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, isAdmin: row.is_admin };
}

export async function destroySession(): Promise<void> {
  const token = getCookie(COOKIE_NAME);
  if (token) {
    const sql = await db();
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  deleteCookie(COOKIE_NAME, { path: "/" });
}

/**
 * Constant-time string compare for secrets of equal expected length, used by
 * the cron endpoints that previously relied on Supabase service auth.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
