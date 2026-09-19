# SiViK Bloom Web

"Create a website for 'SiViK Flowers' — a flower and gift delivery shop in Rabka-Zdrój, Poland. Match the visual style of the attached flyer/business card: soft pastel palette (blush pink, sage green, cream, gold accents), elegant serif/script font for the logo name, clean modern sans-serif for body text, delicate watercolor-style floral illustrations as decorative accents. Warm, romantic, boutique-florist feel — not corporate.

**Pages/sections needed:**

1. **Home** — hero banner with logo, tagline, call-to-action button 'Zamów teraz' (Order now), featured bouquets/gift sets

2. **Catalog/Shop** — grid of products (flowers, bouquets, gift sets combining flowers with teddy bears, chocolates, cakes) with photo, name, price, 'Add to cart' button. Filterable by category (bukiety, prezenty, zestawy)

3. **Product detail page** — larger photo, description, price, size/variant options, quantity selector, add to cart

4. **Cart & Checkout** — order summary, delivery address form, delivery date/time picker, payment method selection (BLIK, card), customer contact info, optional gift message/card text

5. **About Us** — short story about the shop, delivery area (Rabka-Zdrój i okolice), Instagram/Facebook links

6. **Contact** — phone, WhatsApp, Instagram, Facebook, simple contact form, embedded Google Map

**Admin panel (protected login):**

- Dashboard with list of incoming orders (status: new / in progress / delivered)

- Ability to add/edit/delete products (name, photo, price, category, description, stock availability)

- Order details view (customer info, delivery address/time, items ordered, payment status)

- Ability to update order status

- Simple sales/orders overview (count of orders, revenue by day/week)

**Functionality requirements:**

- Mobile-first responsive design (most customers will order from phone)

- Online payment integration placeholder for BLIK/card (Polish payment methods)

- Delivery date and time slot selection at checkout

- Language: Polish (primary), with easy option to add English later

- Fast loading, clean minimalist layout with generous white space, floral accents used sparingly as decoration, not clutter

Please generate this as a functioning web app with database-backed product and order management, not just a static mockup."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rabka-bloom-boutique.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d7651a19-01ee-493b-a0a3-fc1e652d1660).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploying to Railway

The app is a TanStack Start SSR server, not a static site. `vite.config.ts` pins
Nitro's `node-server` preset for self-hosted builds, which emits a self-contained
bundle at `.output/server/index.mjs`. Lovable's own builds keep using Lovable's
preset, so deploying here does not change anything in the editor.

### 1. Create the service

Railway auto-detects the root `Dockerfile`, so point a new service at this repo
and no builder configuration is needed. Railway also assigns `PORT`, which the
server reads; it listens on `0.0.0.0` so the container is reachable.

Generate a public URL under **Settings → Networking → Generate Domain**, and
optionally set the healthcheck path to `/`.

### 2. Set the service variables

Only one is needed. Add it to the app service as a **reference variable** so it
follows the database:

```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
```

Nothing is required at build time. All data access runs through server
functions, so no credentials are inlined into the browser bundle and changing a
variable takes effect on restart rather than needing a rebuild.

### 3. Build and run it locally first (optional)

```sh
docker run -d --name sivik-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17-alpine

docker build -t sivik-bloom .
docker run --rm -p 8080:8080 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/postgres" \
  sivik-bloom
```

Then open http://localhost:8080.

## Database and accounts

The app talks directly to Postgres; Supabase is no longer used.

- **Schema** lives in `src/db/schema.ts` as an append-only list of migrations.
  They run automatically on the first database query after a boot, guarded by a
  Postgres advisory lock so multiple replicas can start at once. Never edit a
  migration that has already been deployed — add a new one.
- **Seeding** inserts the six starting products only when the table is empty, so
  redeploys never overwrite edits made in the admin panel.
- **Accounts**: there is no email confirmation step. Register at `/auth`, and the
  **first account created automatically becomes the admin** — the replacement for
  the old `grant_first_admin` trigger. Register your own account before sharing
  the URL, or someone else can claim the panel.
- **Authorization** used to be enforced by Postgres RLS. It is now enforced in
  server code: any server function touching admin data calls `requireAdmin()`
  from `src/lib/auth/authz.server.ts`. There is no database-level safety net, so
  new admin endpoints must add that call themselves.
- **Passwords** are hashed with scrypt (`node:crypto`), and sessions are rows in
  the `sessions` table keyed by a SHA-256 digest of an httpOnly cookie, so
  logging out revokes access server-side.

### Notes

- Railway's legacy `railway.json` / `railway.toml` config-as-code is deprecated
  and new services can't opt into it, so this repo doesn't ship one. To manage
  the service declaratively, use [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code)
  (`.railway/railway.ts` plus `railway config apply`).
- The SQL in `src/db/schema.ts` uses plain template literals rather than
  `String.raw`. Bundlers re-emit the Polish characters as `\uXXXX` escapes, and
  `String.raw` would store them literally (`Rabka-Zdr\u00F3j`).
