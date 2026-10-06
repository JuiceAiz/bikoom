# Bikoom Stores — mobile app (React Native + Expo)

The store in your pocket: customers browse, search, cart and send order /
waybill requests on WhatsApp — and staff manage products, categories,
banners and order requests. Every change on the website shows up in the
app instantly and vice versa, via **Supabase Realtime**.

## Run it

```bash
cd mobile
npm install          # once
cp .env.example .env # fill in (the repo's .env already matches production)
npx expo start       # scan the QR code with Expo Go
```

- Press `i` for the iOS simulator, `a` for an Android emulator, or scan the
  QR code with the **Expo Go** app on your phone (same Wi-Fi network).
- Realtime sync only works once the realtime SQL has been applied to the
  project `elqsaigcplovujdgvdak` (see the repo root docs / schema.sql
  "Realtime" section). Without it the app still works — it just refreshes
  on pull/manual loads.

## Google sign-in (how it works)

Supabase Auth **rejects any redirect URL whose host is a non-loopback IP
address before it ever checks the Redirect URLs allow list** — and Expo
Go always produces `exp://<LAN-IP>:8081/...`. That is why editing the
Supabase redirect URLs never helped: the browser silently fell back to
the Site URL (the website) after Google.

The app therefore sends the OAuth flow through the site's hop endpoint
instead:

1. App opens `…/api/mobile-auth?next=<deep link>` (allowed — same host
   as the Site URL).
2. Google → Supabase → the hop page, carrying the PKCE `code`.
3. The hop page redirects to `next` (e.g. `exp://…/--/auth/callback?code=…`
   in Expo Go, `bikoom://auth/callback?code=…` in a build).
4. `openAuthSessionAsync` receives the deep link, the app exchanges the
   code, and the session is stored in AsyncStorage.

No Supabase Redirect URLs entries are required for this anymore (the
Site URL host always passes validation). `bikoom://auth/callback` and
`exp://**` may stay on the allow list — they are harmless — and cover a
direct deep-link redirect if you ever choose to bypass the hop.

Server side: `server/index.ts` (`GET /api/mobile-auth`) + `api/mobile-auth.ts`.

Admin accounts also need `profiles.is_admin = true` (SQL editor:
`select public.promote_admin('your@email.com');`) — otherwise the admin
tab stays hidden even if the API would accept them.

## How sync works

| Direction | Mechanism |
|---|---|
| Website → app | `postgres_changes` subscriptions on `products`, `categories`, `banners`, `order_requests`, `delivery_requests` (RLS-filtered) trigger silent reloads. |
| App → website | App writes go through the same Express API (`/api/admin/*`, `/api/orders`, `/api/delivery`) → Postgres → the website's realtime hooks refresh. |
| Catalog reads | Supabase REST with the publishable (anon) key — same as the website. |
| Admin ops | Express API + Supabase access token, identical auth to the web dashboard. |

Key files: `src/lib/realtime.ts` (subscriptions), `src/lib/api.ts`
(API client), `src/context/` (auth + cart).

## Notes

- Sessions persist in AsyncStorage (expo-secure-store caps values at 2KB;
  Supabase sessions exceed that).
- `EXPO_PUBLIC_*` values are public by design — they ship in the bundle.
- The WhatsApp number placeholder (`2348000000000`) is replaced via
  `EXPO_PUBLIC_WHATSAPP_NUMBER`.
