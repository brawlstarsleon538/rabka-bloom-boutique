/**
 * Server-only Postgres access. Never import this from client code — it would
 * leak DATABASE_URL into the browser bundle.
 *
 * Callers use `db()` rather than the raw client so that schema migrations are
 * guaranteed to have run before the first query of a process.
 */
import postgres from "postgres";

import { migrations } from "./schema";

// Advisory lock key, arbitrary but must be stable: it serialises migrations
// when several replicas boot at once.
const MIGRATION_LOCK_KEY = 8_427_301;

let client: postgres.Sql | undefined;
let ready: Promise<postgres.Sql> | undefined;

function connect(): postgres.Sql {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. On Railway this comes from the Postgres service; " +
        "locally, copy it from .env.example.",
    );
  }

  return postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Railway's internal network terminates TLS at the proxy, and the managed
    // certificate is not in the public trust store.
    ssl: url.includes("railway.internal") ? false : "prefer",
  });
}

async function migrate(sql: postgres.Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql.begin(async (tx) => {
    // Held until the transaction ends, so concurrent booters wait rather than
    // applying the same migration twice.
    await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_KEY})`;

    const applied = await tx<{ name: string }[]>`SELECT name FROM schema_migrations`;
    const done = new Set(applied.map((row) => row.name));

    for (const migration of migrations) {
      if (done.has(migration.name)) continue;
      await tx.unsafe(migration.sql);
      await tx`INSERT INTO schema_migrations ${tx({ name: migration.name })}`;
      console.log(`[db] applied migration ${migration.name}`);
    }
  });
}

export function db(): Promise<postgres.Sql> {
  if (!ready) {
    client = connect();
    const sql = client;
    ready = migrate(sql)
      .then(() => sql)
      .catch((error: unknown) => {
        // Let the next request retry instead of wedging the process on a
        // transient startup failure.
        ready = undefined;
        throw error;
      });
  }
  return ready;
}
