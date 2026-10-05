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

## Google sign-in (one-time setup)

The app signs in through Supabase OAuth with a deep link redirect. Add
these to **Supabase dashboard → Authentication → URL Configuration →
Redirect URLs**:

- `bikoom://auth/callback` — production / dev builds
- `exp://**` — development via Expo Go (remove before release)

The Google Cloud OAuth client needs no change: Supabase's own
`/auth/v1/callback` is already authorized.

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
