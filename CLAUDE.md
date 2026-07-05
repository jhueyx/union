# Union — Claude Context

Internal codename: **Union**. Public-facing name: **Sally & Jason**. Never show "Union" to guests.

## What this is

A full wedding website for sallyjason.com. Built with React + Vite + TypeScript + Tailwind CSS. Deployed on Vercel. Guest data and RSVPs stored in Supabase.

## Site modes

Controlled by a single line in `src/config.ts`:

```ts
export const SITE_MODE: SiteMode = 'coming-soon' // or 'live'
```

- `'coming-soon'` — shows a minimal landing page with the SJ monogram and "Coming Soon" label. Nav is hidden.
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

## Key files

| File | Purpose |
|------|---------|
| `src/config.ts` | `SITE_MODE`, `SITE_PHASE`, `WEDDING_DATE`, all wedding details |
| `src/data/mock.ts` | Static content: meal choices, FAQs, travel, registry, events |
| `src/types/index.ts` | All TypeScript types |
| `src/lib/supabase.ts` | Supabase client (uses `VITE_SUPABASE_*` env vars) |
| `src/routes/index.tsx` | All routes |
| `src/layouts/AdminLayout.tsx` | Auth gate for `/admin` — checks Supabase session |
| `src/components/Hero.tsx` | Home page hero, mode-aware |
| `src/components/Nav.tsx` | Top nav, hidden in coming-soon mode |

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
- `household_id` uuid FK → households
- `first_name`, `last_name` text
- `email`, `phone` text nullable
- `created_at` timestamptz

**`rsvp_responses`** — one row per guest, unique on `guest_id`
- `id` uuid PK
- `household_id`, `guest_id` uuid FK
- `attending` boolean
- `meal_choice_id` text (matches IDs in `MEAL_CHOICES` in mock.ts)
- `dietary_restrictions`, `song_request`, `notes` text nullable
- `submitted_at` timestamptz

**RLS policies:**
- `households` + `guests`: anyone can SELECT, only authenticated can INSERT/UPDATE/DELETE
- `rsvp_responses`: anyone can INSERT + UPDATE (guests submitting), only authenticated can SELECT + DELETE

## Supabase auth

Admin login is `jason.huey1@gmail.com`. Password is in 1Password or wherever you store it.

The `AdminLayout` checks the session on mount. If no session → shows `Login` component. If session → shows the dashboard with a Sign Out button.

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

No manual `vercel --prod` needed — GitHub push triggers deployment.

`vercel.json` has a catch-all rewrite (`/(.*) → /index.html`) for React Router SPA routing.

## What still needs to be done before going live

1. Fill in `src/config.ts` — date, venue, dress code, RSVP deadline
2. Add guests via `/admin`
3. Update `src/data/mock.ts` — real registry URLs, hotel booking links, travel info
4. Add engagement photo to Save the Date page (`src/pages/SaveTheDate.tsx`)
5. Set custom domain `sallyjason.com` in Vercel dashboard
6. Flip `SITE_MODE` to `'live'` in `src/config.ts`

## TypeScript conventions

- Supabase row types use **snake_case** to match DB column names (`first_name`, `invite_code`, `household_id`, etc.)
- All other types use camelCase
- Strict mode on — no unused locals/parameters
- `vite/client` is in `tsconfig.json` types for `import.meta.env`

## Commit and push after every change

Always `git push` after making changes so Vercel stays in sync.
