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

Copy the values from `.env.example`. The split matters:

| Variable | Needed at |
| --- | --- |
| `VITE_SUPABASE_URL` | build **and** runtime |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build **and** runtime |
| `VITE_SUPABASE_PROJECT_ID` | build |
| `SUPABASE_URL` | runtime |
| `SUPABASE_PUBLISHABLE_KEY` | runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime |

`VITE_*` values are inlined into the JavaScript the browser downloads, so they
must be set *before* the build runs — adding them later needs a redeploy to take
effect. Railway forwards service variables to the `ARG`s declared in the
Dockerfile automatically.

`SUPABASE_SERVICE_ROLE_KEY` backs the admin client used when writing orders
(`src/lib/orders.functions.ts`). Keep it server-side: never rename it with a
`VITE_` prefix, or it would be shipped to the browser.

### 3. Build and run it locally first (optional)

```sh
docker build \
  --build-arg VITE_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." \
  -t sivik-bloom .

docker run --rm -p 8080:8080 --env-file .env sivik-bloom
```

Then open http://localhost:8080.

### Notes

- Railway's legacy `railway.json` / `railway.toml` config-as-code is deprecated
  and new services can't opt into it, so this repo doesn't ship one. To manage
  the service declaratively, use [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code)
  (`.railway/railway.ts` plus `railway config apply`).
- Docker's `SecretsUsedInArgOrEnv` build warning about the publishable key is
  expected. That key is designed to be public and already ships in the client
  bundle; the service-role key is never passed as a build argument.
