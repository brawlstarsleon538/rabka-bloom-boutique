/**
 * Password hashing with scrypt from node:crypto.
 *
 * Supabase Auth handled this before the move to Railway Postgres. scrypt is
 * used rather than argon2/bcrypt so there is no native dependency to compile,
 * which keeps the Docker image free of a build toolchain.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

// Node's defaults; N is the work factor. Recorded in the hash string so these
// can be raised later without invalidating existing passwords.
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = Buffer.from(parts[4] ?? "", "base64url");
  const expected = Buffer.from(parts[5] ?? "", "base64url");
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await scryptAsync(password.normalize("NFKC"), salt, expected.length, { N, r, p });
  // Lengths are equal by construction, but timingSafeEqual throws if they differ.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
