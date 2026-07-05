# Union — Claude Context

Internal codename: **Union**. Public-facing name: **Sally & Jason**. Never show "Union" to guests.

## What this is

A full wedding website for sallyjason.com. Built with React + Vite + TypeScript + Tailwind CSS. Deployed on Vercel. Guest data and RSVPs stored in Supabase.

## Site modes

Controlled by a single line in `src/config.ts`:

```ts
export const SITE_MODE: SiteMode = 'coming-soon' // or 'live'
```

- `'coming-soon'` — shows a minimal landing page with the SJ monogram and "Coming Soon" label. Nav is hidden. No Notify Me button (removed — it was a no-op).
- `'live'` — shows the full multi-page site with nav.

**Do not flip to `'live'` until all wedding details are filled in and guests are added.**

## Stack

- **React 18 + Vite 5 + TypeScript** (strict mode)
- **Tailwind CSS** — dark mode via `prefers-color-scheme` (system preference, not a toggle)
- **React Router v7** — `createBrowserRouter`, all routes in `src/routes/index.tsx`
- **Supabase** — auth for `/admin`, guest list, RSVP responses
- **Vercel** — hosting; auto-deploys on push to `main`

## Design rules (never break these)

- Black, white, gray only. No color accents except status indicators in admin (emerald/rose/amber).
- No floral graphics, no script fonts (except Great Vibes for the SJ monogram only), no gold gradients, no hearts, no wedding clichés.
- Dark mode by default, light mode supported.
- All buttons: `rounded-[2px]` (nearly square corners).
- Max content width: `700px` (admin: `900px`).
- Section labels: `text-[10px] tracking-[0.3em] uppercase`.
- Font: Inter everywhere except the SJ monogram (Great Vibes).

## Pages

| Route | File | Status |
|-------|------|--------|
| `/` | `src/pages/Home.tsx` | Done |
| `/story` | `src/pages/StoryPage.tsx` | Placeholder — needs real story + photo |
| `/save-the-date` | `src/pages/SaveTheDate.tsx` | Placeholder — needs date + photo |
| `/invitation` | `src/pages/Invitation.tsx` | Placeholder — needs date/venue/dresscode |
| `/rsvp` | `src/pages/RsvpPage.tsx` | Live — reads/writes Supabase |
| `/i/:inviteCode` | `src/pages/InviteCode.tsx` | Live — personalized invite landing |
| `/schedule` | `src/pages/SchedulePage.tsx` | Empty state shown — needs `WEDDING_EVENTS` filled in |
| `/travel` | `src/pages/TravelPage.tsx` | Empty state shown — needs `TRAVEL_RECOMMENDATIONS` filled in |
| `/registry` | `src/pages/RegistryPage.tsx` | Empty state shown — needs `REGISTRY_LINKS` filled in |
| `/faq` | `src/pages/FaqPage.tsx` | Empty state shown — needs `FAQ_ITEMS` filled in |
| `/photos` | `src/pages/PhotosPage.tsx` | Placeholder |
| `/guestbook` | `src/pages/GuestbookPage.tsx` | Placeholder |
| `/admin` | `src/pages/admin/Dashboard.tsx` | Live — Supabase auth + guest management |

Nav order: Our Story · Save the Date · Invite · RSVP · Schedule · Travel · Registry · FAQ

## Key files

| File | Purpose |
|------|---------|
| `src/config.ts` | `SITE_MODE`, `SITE_PHASE`, `WEDDING_DATE`, all wedding details |
| `src/data/mock.ts` | Static content arrays — all currently empty, fill in when details confirmed |
| `src/types/index.ts` | All TypeScript types |
| `src/lib/supabase.ts` | Supabase client (uses `VITE_SUPABASE_*` env vars) |
| `src/routes/index.tsx` | All routes |
| `src/layouts/AdminLayout.tsx` | Auth gate for `/admin` — checks Supabase session, shows Login or Dashboard |
| `src/pages/admin/Login.tsx` | Admin login form (Supabase email/password) |
| `src/components/Hero.tsx` | Home page hero, mode-aware |
| `src/components/Nav.tsx` | Top nav, hidden in coming-soon mode |
| `src/utils/index.ts` | `getCountdown`, `formatDate`, `generateInviteCode` |
| `vercel.json` | SPA rewrite — all routes → `/index.html` |

## static content in `src/data/mock.ts`

All five arrays are currently empty. Fill them in when details are confirmed:

- `MEAL_CHOICES` — menu options guests pick during RSVP (`id`, `label`, `description`, `dietaryTags`)
- `FAQ_ITEMS` — accordion FAQ (`id`, `category`, `question`, `answer`)
- `TRAVEL_RECOMMENDATIONS` — hotels + transport (`type: 'hotel' | 'transport'`, `name`, `address`, `url`, `note`, `priceRange`, `bookingCode`)
- `REGISTRY_LINKS` — store name + URL (`id`, `store`, `url`, `note`)
- `WEDDING_EVENTS` — ceremony/cocktail/reception (`id`, `name`, `time`, `endTime`, `location`, `address`, `description`, `dresscode`)

## Supabase schema

Three tables in `public`:

**`households`** — one row per invited party
- `id` uuid PK
- `name` text (e.g. "The Johnson Family")
- `invite_code` text unique (e.g. "AB7KQ2")
- `max_guests` int
- `notes` text nullable
- `created_at` timestamptz

**`guests`** — individual guests within a household
- `id` uuid PK
- `household_id` uuid FK → households (cascade delete)
- `first_name`, `last_name` text
- `email`, `phone` text nullable
- `created_at` timestamptz

**`rsvp_responses`** — one row per guest, unique on `guest_id`
- `id` uuid PK
- `household_id`, `guest_id` uuid FK
- `attending` boolean
- `meal_choice_id` text (matches IDs in `MEAL_CHOICES`)
- `dietary_restrictions`, `song_request`, `notes` text nullable
- `submitted_at` timestamptz

**RLS policies:**
- `households` + `guests`: anyone can SELECT, only authenticated can INSERT/UPDATE/DELETE
- `rsvp_responses`: anyone can INSERT + UPDATE (guests submitting/updating), only authenticated can SELECT + DELETE

Guests can re-submit their RSVP to update it — uses `upsert` with `onConflict: 'guest_id'`.

## Admin dashboard (`/admin`)

Protected by Supabase auth. Login: `jason.huey1@gmail.com`.

Features:
- Live stats: total invited, RSVP'd, attending, not attending, pending, response rate
- Guest list: add households (with auto-generated invite codes), add guests per household, delete either
- Meal counts, dietary restrictions, song requests, guest notes — all live from Supabase
- RSVP responses table

## Supabase auth

The `AdminLayout` checks session on mount. No session → shows `Login` component. Session → shows dashboard with Sign Out button.

**Important:** always use `supabase.functions.invoke()` for Edge Functions, not raw `fetch`. The `sb_publishable_*` key format is not a JWT and fails Bearer auth — use the `eyJ...` anon key (already set in `.env` and Vercel).

## Env vars

`.env` (local, gitignored):
```
VITE_SUPABASE_URL=https://rsbvddlhismetljqoqre.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Same vars must be set in Vercel dashboard → Settings → Environment Variables → Production.

## Deployment

```bash
npm run build   # verify before pushing
git push        # Vercel auto-deploys
```

No manual `vercel --prod` needed. `vercel.json` has a catch-all rewrite for React Router SPA routing.

## TypeScript conventions

- Supabase row types use **snake_case** to match DB column names (`first_name`, `invite_code`, `household_id`, etc.)
- All other types use camelCase
- Strict mode on — no unused locals/parameters
- `vite/client` is in `tsconfig.json` types for `import.meta.env`

## What still needs to be done before going live

1. Fill in `src/config.ts` — date, venue, dress code, RSVP deadline, countdown date
2. Fill in `src/data/mock.ts` — meal choices, FAQs, travel, registry, events
3. Add engagement photo to Story page (`src/pages/StoryPage.tsx`) and Save the Date (`src/pages/SaveTheDate.tsx`)
4. Write the real story in `src/pages/StoryPage.tsx` (three placeholder sections)
5. Add guests via `/admin`
6. Set custom domain `sallyjason.com` in Vercel dashboard
7. Flip `SITE_MODE` to `'live'` in `src/config.ts`

## Commit and push after every change

Always `git push` after making changes so Vercel stays in sync.
