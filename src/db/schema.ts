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

const addKwiatyPrezenty = `
INSERT INTO products (slug, name, description, price, category, image_url, variants, featured)
SELECT * FROM (VALUES
  ('rozany-romantyk','Różany Romantyk','Klasyczny bukiet świeżych róż',129.00,'bukiety','/images/p1.jpg','[]'::jsonb,false),
  ('slodka-chwila','Słodka Chwila','Bukiet połączony z wybornymi pralinami',159.00,'bukiety-dodatki','/images/p2.jpg','[]'::jsonb,false),
  ('milosc-mis','Miłość & Miś','Romantyczny bukiet w towarzystwie uroczego pluszaka',179.00,'pluszaki','/images/p3.jpg','[]'::jsonb,true),
  ('sweet-box','Sweet Box','Elegancki box wypełniony po brzegi słodyczami',99.00,'slodkie-zestawy','/images/p4.jpg','[]'::jsonb,false),
  ('flower-teddy','Flower & Teddy','Duży bukiet z misiem i czekoladkami',229.00,'boxy-prezentowe','/images/p5.jpg','[]'::jsonb,true),
  ('sivik-premium-box','SiViK Premium Box','Wykwintne kwiaty, słodycze, świeca i personalizowana kartka',249.00,'boxy-prezentowe','/images/p6.jpg','[]'::jsonb,true)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'rozany-romantyk');
`;

export const migrations: Migration[] = [
  { name: "001_init", sql: init },
  { name: "002_seed_products", sql: seedProducts },
  { name: "003_add_kwiaty_prezenty", sql: addKwiatyPrezenty },
  { name: "004_add_all_requested_products", sql: `
INSERT INTO products (slug, name, description, price, category, image_url, variants, featured)
SELECT * FROM (VALUES
  ('klasyczny-bukiet','Klasyczny Bukiet','Elegancka kompozycja klasycznych kwiatów',119.00,'bukiety','/images/klasyczny-bukiet.jpg','[]'::jsonb,false),
  ('bukiet-roz','Bukiet Róż','Czerwone lub pastelowe róże w pięknym ułożeniu',149.00,'bukiety','/images/bukiet-roz.jpg','[]'::jsonb,true),
  ('bukiet-piwonii','Bukiet Piwonii','Sezonowy bukiet z pachnących piwonii',189.00,'bukiety','/images/bukiet-piwonii.jpg','[]'::jsonb,true),
  ('bukiet-sezonowy','Bukiet Sezonowy','Kompozycja z najświeższych kwiatów sezonowych',99.00,'bukiety','/images/bukiet-sezonowy.jpg','[]'::jsonb,false),
  ('maly-bukiet','Mały Bukiet','Subtelny i delikatny bukiet na każdą okazję',69.00,'bukiety','/images/maly-bukiet.jpg','[]'::jsonb,false),
  ('duzy-bukiet-premium','Duży Bukiet Premium','Ekskluzywna kompozycja dla wymagających',299.00,'bukiety','/images/duzy-bukiet-premium.jpg','[]'::jsonb,true),
  ('zestaw-czekoladek','Zestaw Czekoladek','Wyselekcjonowane czekoladki belgijskie',79.00,'slodkie-zestawy','/images/zestaw-czekoladek.jpg','[]'::jsonb,false),
  ('zestaw-slodyczy','Zestaw Słodyczy','Pudełko pełne słodkich niespodzianek',89.00,'slodkie-zestawy','/images/zestaw-slodyczy.jpg','[]'::jsonb,false),
  ('elegancki-box-prezentowy','Elegancki Box Prezentowy','Luksusowe pudełko ze słodkościami',149.00,'slodkie-zestawy','/images/elegancki-box-prezentowy.jpg','[]'::jsonb,true),
  ('slodki-zestaw-dla-niej','Słodki Zestaw Dla Niej','Praliny i makaroniki w pastelowych barwach',129.00,'slodkie-zestawy','/images/slodki-zestaw-dla-niej.jpg','[]'::jsonb,false),
  ('slodki-zestaw-dla-niego','Słodki Zestaw Dla Niego','Wyborne ciemne czekolady i trufle',129.00,'slodkie-zestawy','/images/slodki-zestaw-dla-niego.jpg','[]'::jsonb,false),
  ('bukiet-plus-czekoladki','Bukiet + Czekoladki','Bukiet świeżych kwiatów z paczką czekoladek',169.00,'bukiety-dodatki','/images/bukiet-plus-czekoladki.jpg','[]'::jsonb,true),
  ('bukiet-plus-praliny','Bukiet + Praliny','Delikatny bukiet z ekskluzywnymi pralinami',179.00,'bukiety-dodatki','/images/bukiet-plus-praliny.jpg','[]'::jsonb,false),
  ('bukiet-plus-maly-prezent','Bukiet + Mały Prezent','Kwiaty w zestawie z uroczym upominkiem',159.00,'bukiety-dodatki','/images/bukiet-plus-maly-prezent.jpg','[]'::jsonb,false),
  ('bukiet-plus-kartka','Bukiet + Kartka z Życzeniami','Twój bukiet z dedykowaną kartką',139.00,'bukiety-dodatki','/images/bukiet-plus-kartka.jpg','[]'::jsonb,false),
  ('bukiet-plus-mis','Bukiet + Miś','Romantyczny bukiet i pluszowy miś',199.00,'pluszaki','/images/bukiet-plus-mis.jpg','[]'::jsonb,true),
  ('bukiet-plus-maly-pluszak','Bukiet + Mały Pluszak','Urocza kompozycja z mniejszą maskotką',149.00,'pluszaki','/images/bukiet-plus-maly-pluszak.jpg','[]'::jsonb,false),
  ('bukiet-plus-duzy-mis','Bukiet + Duży Miś','Zestaw z dużym, pluszowym misiem premium',259.00,'pluszaki','/images/bukiet-plus-duzy-mis.jpg','[]'::jsonb,true),
  ('bukiet-pluszak-slodycze','Bukiet + Pluszak + Słodycze','Pełen pakiet radości: kwiaty, maskotka i słodycze',289.00,'pluszaki','/images/bukiet-pluszak-slodycze.jpg','[]'::jsonb,true),
  ('kwiaty-slodycze','Kwiaty + Słodycze','Flowerbox uzupełniony pysznymi słodyczami',189.00,'boxy-prezentowe','/images/kwiaty-slodycze.jpg','[]'::jsonb,false),
  ('kwiaty-pluszak','Kwiaty + Pluszak','Box kwiatowy z ukrytym pluszakiem',199.00,'boxy-prezentowe','/images/kwiaty-pluszak.jpg','[]'::jsonb,false),
  ('kwiaty-swieca','Kwiaty + Świeca','Zestaw zapachowy z kwiatami i sojową świecą',179.00,'boxy-prezentowe','/images/kwiaty-swieca.jpg','[]'::jsonb,false),
  ('kwiaty-czekoladki-kartka','Kwiaty + Czekoladki + Kartka','Box z kompletnym zestawem prezentowym',219.00,'boxy-prezentowe','/images/kwiaty-czekoladki-kartka.jpg','[]'::jsonb,true),
  ('zestaw-prezentowy-premium','Zestaw Prezentowy Premium','Nasz najbardziej luksusowy box ze wszystkimi dodatkami',349.00,'boxy-prezentowe','/images/zestaw-prezentowy-premium.jpg','[]'::jsonb,true)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'klasyczny-bukiet');
` },
  { name: "005_update_product_images", sql: `UPDATE products SET image_url = '/images/' || slug || '.jpg';` }
];

