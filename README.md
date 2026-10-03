# Bikoom Store

Storefront for **Bikoom Store** — a small business in Ogoja, Cross River State, Nigeria
(laptops, phones, furniture, Starlink installation, photocopying/printing and more).

Customers browse the shop, build an order request, and continue to **WhatsApp** where
prices, payment and delivery are finalised. There is **no online payment**.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router |
| Backend  | Express + TypeScript (`tsx`), multer for image uploads |
| Database | Supabase (Postgres + RLS, Auth, Storage) |
| Auth     | Google OAuth via Supabase Auth (PKCE) |
| Email    | Mailgun HTTP API (order & delivery notifications) |
| Chat     | WhatsApp `wa.me` deep links with pre-filled messages |

## Quick start

```bash
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev               # API on :3001, web on :5173
```

The app **requires Supabase** — until the credentials exist it shows a
"Setup required" screen listing exactly what's missing.

Browsing is public: visitors can view the shop and add items to an order
request without an account. Google sign-in is **optional** for customers
(it saves their details and links requests to their profile) and **required
only for the admin dashboard**.

### One-time Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Authentication → Providers → enable **Google** (Google Cloud OAuth client,
   redirect URI `https://<ref>.supabase.co/auth/v1/callback`).
4. Authentication → URL Configuration → Site URL `http://localhost:5173`,
   Redirect URLs `http://localhost:5173/auth/callback`.
5. Fill `.env` with the Supabase URL/anon/service-role keys (both `SUPABASE_*`
   and `VITE_SUPABASE_*` copies) and restart.
6. Sign in with Google once, then promote yourself:
   `select public.promote_admin('you@gmail.com');`
   (or set `ADMIN_EMAILS=you@gmail.com` in `.env`).

### Mailgun (optional at first)

Fill `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` and `CONTACT_EMAIL`.
Without them the app still works — notification e-mails are logged and skipped.

### WhatsApp

Set `WHATSAPP_NUMBER` / `VITE_WHATSAPP_NUMBER` (international format,
e.g. `2348031234567`). The demo default in `src/brand.ts` is a placeholder.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | API (`tsx watch`) + Vite dev server together |
| `npm run build` | Typecheck (`tsc --noEmit`) + production bundle |
| `npm start` | Serve API + built SPA (after `npm run build`) |
| `npm run typecheck` | Typecheck only |

## Structure

```
supabase/         schema.sql (tables, RLS, triggers, storage) + seed.sql (demo data)
server/           Express API: config, auth middleware, orders, delivery, admin, Mailgun
src/
  brand.ts        Brand name, colours, WhatsApp number — rebrand here
  context/        Auth (Google session) + Cart (localStorage)
  components/     Navbar, Footer, product cards, UI primitives, icons
  pages/          Home, Shop, Category, Product, Cart, Delivery, Contact, SignIn, Setup
  pages/admin/    Dashboard, Products, Categories, Banners, Orders, Deliveries
shared/           Types + helpers shared by client and server
```

## Key rules encoded in the app

- Sign-in is required site-wide; only `profiles.is_admin` (or `ADMIN_EMAILS`)
  users can open `/admin` — enforced again server-side on every admin route.
- Photocopying/printing is labelled **Ogoja only**; other products ship by
  requested delivery with **no fixed delivery prices**.
- Products can show a price or **"Contact for Price"**; availability and
  featured status are managed from the dashboard.
