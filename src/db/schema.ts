/**
 * Schema for the Railway Postgres database.
 *
 * Ported from the Supabase migrations in `supabase/migrations/`, with two
 * deliberate differences:
 *
 *  - No RLS policies or role GRANTs. Supabase enforced access with RLS keyed on
 *    `auth.uid()`; here the app connects as a single owner role, so every
 *    authorization decision is made in server code (see `src/lib/authz.ts`).
 *  - `auth.users` does not exist, so `users` and `sessions` hold the accounts
 *    and login sessions that Supabase Auth used to manage.
 *
 * Migrations are append-only: each entry runs once and is recorded in
 * `schema_migrations`. Never edit an entry that has already been deployed.
 */

export type Migration = { name: string; sql: string };

// These are plain template literals, never String.raw: bundlers (Bun, and
// rolldown in the production build) re-emit the Polish characters below as
// \uXXXX escapes, and String.raw would keep the backslashes literal so the
// database would end up storing "Rabka-Zdr\u00F3j". The SQL contains no
// intentional backslashes, so normal escape handling is what we want.
const init = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Emails are compared case-insensitively, so uniqueness has to be too.
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Only a SHA-256 digest of the cookie token is stored, so a database leak
  -- does not hand out usable sessions.
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TYPE app_role AS ENUM ('admin');

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'bukiety',
  image_url text NOT NULL DEFAULT '',
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE
    DEFAULT to_char(now(), 'YYMMDD') || lpad((floor(random()*100000))::text, 5, '0'),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  delivery_address text NOT NULL,
  delivery_city text NOT NULL DEFAULT 'Rabka-Zdrój',
  delivery_date date NOT NULL,
  delivery_slot text NOT NULL,
  gift_message text,
  notes text,
  payment_method text NOT NULL DEFAULT 'blik',
  payment_status text NOT NULL DEFAULT 'oczekuje',
  status text NOT NULL DEFAULT 'nowe',
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX orders_delivery_date_idx ON orders (delivery_date);

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);
`;

// Matches the Supabase seed, but pointing at the images now committed under
// public/images/ instead of Lovable's asset proxy. Skipped when the table
// already has rows so a redeploy never overwrites edits made in the panel.
const seedProducts = `
INSERT INTO products (slug, name, description, price, category, image_url, variants, featured)
SELECT * FROM (VALUES
  ('bukiet-piwonie','Bukiet piwonii i róż','Delikatny bukiet pudrowych piwonii i róż w kremowym papierze. Idealny na urodziny, imieniny i rocznice.',189.00,'bukiety','/images/p1.jpg','["Mały","Średni","Duży"]'::jsonb,true),
  ('zestaw-mis-czekoladki','Zestaw: róże, czekoladki i miś','Pudełko prezentowe z różami, praliniami i pluszowym misiem. Gotowe do wręczenia.',249.00,'zestawy','/images/p2.jpg','["Standard","Premium"]'::jsonb,true),
  ('bukiet-biale-roze','Bukiet białych róż z eukaliptusem','Elegancki bukiet kremowych róż z gałązkami eukaliptusa.',219.00,'bukiety','/images/p3.jpg','["Mały","Średni","Duży"]'::jsonb,true),
  ('kosz-tulipany','Kosz z tulipanami i słodyczami','Wiklinowy kosz z pudrowymi tulipanami i pudełkiem czekoladek.',179.00,'prezenty','/images/p4.jpg','["Standard","Premium"]'::jsonb,false),
  ('tort-kwiaty','Tort z kwiatami','Kremowy tort dekorowany świeżymi różami wraz z małym bukietem.',299.00,'zestawy','/images/p5.jpg','["12 cm","16 cm","20 cm"]'::jsonb,false),
  ('flowerbox-roze','Flowerbox z różami','Róże w eleganckim pudełku — kompozycja, która długo cieszy oko.',229.00,'prezenty','/images/p6.jpg','["Mały","Duży"]'::jsonb,true)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM products);
`;

export const migrations: Migration[] = [
  { name: "001_init", sql: init },
  { name: "002_seed_products", sql: seedProducts },
];
