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
- **Tailwind CSS** — light mode only (`darkMode: false`). There is no dark theme and no toggle.
- **React Router v7** — `createBrowserRouter`, all routes in `src/routes/index.tsx`
- **Supabase** — auth for `/admin`, guest list, RSVP responses
- **Vercel** — hosting; auto-deploys on push to `main`

## Design rules (never break these)

- Black, white, gray only. No color accents except status indicators in admin (emerald/rose/amber).
- No floral graphics, no script fonts (except Great Vibes for the SJ monogram only), no gold gradients, no hearts, no wedding clichés.
- Light mode only. No dark theme, no toggle — the site looks the same on every device regardless of OS appearance.
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
| `/admin` | `src/pages/admin/Dashboard.tsx` | Live — planner home, see below |
| `/admin/guests` | `src/pages/admin/Guests.tsx` | Live — households, guests, side, addresses |
| `/admin/seating` | `src/pages/admin/Seating.tsx` | Live — drag-and-drop floor plan |
| `/admin/checklist` | `src/pages/admin/Checklist.tsx` | Live — seeds from `CHECKLIST_TEMPLATE` once a date is set |
| `/admin/timeline` | `src/pages/admin/Timeline.tsx` | Live — day-of running order |
| `/admin/budget` | `src/pages/admin/Budget.tsx` | Live — estimates vs. actuals |
| `/admin/vendors` | `src/pages/admin/Vendors.tsx` | Live — considering/booked/declined |
| `/admin/exports` | `src/pages/admin/Exports.tsx` | Live — addresses, catering, seating chart as copy/print text |
| `/admin/settings` | `src/pages/admin/Settings.tsx` | Live — wedding date, venue, RSVP deadline, meal options |

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

Four arrays are currently empty. Fill them in when details are confirmed. Meal
choices used to be a fifth (`MEAL_CHOICES`) — that one moved to the
`wedding_meals` table, managed at `/admin/settings`, because a hardcoded empty
array meant the RSVP meal step had nothing to offer and RSVP could not be
completed. See "The planner" below.

- `FAQ_ITEMS` — accordion FAQ (`id`, `category`, `question`, `answer`)
- `TRAVEL_RECOMMENDATIONS` — hotels + transport (`type: 'hotel' | 'transport'`, `name`, `address`, `url`, `note`, `priceRange`, `bookingCode`)
- `REGISTRY_LINKS` — store name + URL (`id`, `store`, `url`, `note`)
- `WEDDING_EVENTS` — ceremony/cocktail/reception (`id`, `name`, `time`, `endTime`, `location`, `address`, `description`, `dresscode`)

## Supabase schema

Core tables in `public` (the planner adds several more — see "The planner" below):

**`households`** — one row per invited party
- `id` uuid PK
- `name` text (e.g. "The Johnson Family")
- `invite_code` text unique (e.g. "AB7KQ2") — null until the invitation actually goes out
- `max_guests` int
- `side` text nullable — `'bride' | 'groom' | 'both'`, checked. Null means undecided. `'both'` is for people the couple share, and shows under either side when filtering.
- `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country` text nullable — mailing address, entered in `/admin/guests`
- `invitation_sent_at` timestamptz nullable — separate fact from having an invite code; a code being minted doesn't mean it went in the mail
- `notes` text nullable
- `created_at` timestamptz

**`guests`** — individual guests within a household
- `id` uuid PK
- `household_id` uuid FK → households (cascade delete)
- `first_name`, `last_name` text
- `email`, `phone` text nullable
- `is_child` boolean not null default false — children are counted and catered for separately
- `created_at` timestamptz

**`rsvp_responses`** — one row per guest, unique on `guest_id`
- `id` uuid PK
- `household_id`, `guest_id` uuid FK
- `attending` boolean
- `meal_choice_id` text (matches an id in `wedding_meals`)
- `dietary_restrictions`, `song_request`, `notes` text nullable
- `submitted_at` timestamptz

**RLS policies:**
- `households` + `guests`: anyone can SELECT, only authenticated can INSERT/UPDATE/DELETE
- `rsvp_responses`: anyone can INSERT + UPDATE (guests submitting/updating), only authenticated can SELECT + DELETE

Guests can re-submit their RSVP to update it — uses `upsert` with `onConflict: 'guest_id'`.

## Admin (`/admin`)

Protected by Supabase auth (all of `/admin/*`). Login: `jason.huey1@gmail.com`.

`/admin` itself is the **planner home** — not a guest list. It pulls one number
from each module and puts them next to each other, because no single module
can see the others: days to the wedding, seats allotted vs. table capacity
(flags red when over), cost per head, budget outstanding, response rate,
overdue/upcoming checklist tasks, seats by side, and — since nowhere else
surfaces them — RSVP song requests and notes. Guest and household management
lives at `/admin/guests`, not here; don't reintroduce it on the Dashboard.

## The planner

Six more tables back the planning suite, all admin-only (RLS requires
`auth.role() = 'authenticated'`) except where noted, all accessed through
`src/lib/planning.ts` (see "Admin writes must report failure" below):

- **`wedding_settings`** — one row, `id = true` enforced by a check constraint.
  `wedding_date`, `ceremony_time`, `venue_name`, `venue_address`,
  `rsvp_deadline`, `guest_target`, `notes`. This is the fixed point the whole
  planner measures from — without a date the checklist can't say what's
  overdue and the Dashboard can't show days-to-go. Set at `/admin/settings`.
  **Does not drive the public site** — `src/config.ts` does, and the two are
  not wired together (see below).
- **`wedding_meals`** — meal options for the RSVP flow. `id` (slug), `label`,
  `description`, `dietary_tags[]`, `is_child_meal`, `position`. Publicly
  readable (guests need it during RSVP, which is unauthenticated), admin-only
  to write. Managed at `/admin/settings`. `RsvpPage.tsx` fetches this directly
  from Supabase rather than through `planning.ts`, since it's on the public
  site.
- **`wedding_tasks`** — the checklist. Seeded from `CHECKLIST_TEMPLATE` in
  `src/lib/checklistTemplate.ts`, a ~55-item standard wedding list expressed as
  day-offsets before the wedding (`{ days: 90, title: '...', category: '...' }`).
  Seeding is additive and keyed on title — safe to re-run after the date moves
  or after adding tasks by hand; it tops up rather than replaces.
- **`wedding_timeline`** — day-of running order. Times are stored as a bare
  `time`, not a timestamp — the schedule is relative to the day, not a timezone.
- **`wedding_budget`** — line items, `estimated`/`actual`/`paid`, optionally
  tied to a vendor.
- **`wedding_vendors`** — directory, `status: considering | booked | declined`.
- **`wedding_tables`** / **`wedding_seat_assignments`** — the seating floor
  plan (already existed before this section was written up).

### Date math

`src/lib/planning.ts` has the date helpers everything above uses:
`parseDay`/`toISODay` (parse and format a bare `'YYYY-MM-DD'` in **local**
time — `new Date('2027-05-08')` parses as UTC midnight, which reads as the
previous day anywhere west of Greenwich), `daysUntil`, `shiftDay`,
`relativeDay` ("in 3 weeks" / "2 days ago"), `formatDay`. Use these rather than
hand-rolling date math against the bare-date columns.

### Exports (`/admin/exports`)

Three copy/print views built from the live data — no CSV download, since a
downloaded file lands in a folder and is never seen again, while these get
pasted into an email or printed:
- **Addresses** — one block per household with an address, name(s) plus the
  mailing address, for a calligrapher or label sheet.
- **Catering** — headcount (adults/children), meal counts by
  `wedding_meals.label`, dietary requirements. Falls back to *everyone
  invited* until any RSVP has come in, rather than reading zero.
- **Seating chart** — one section per table with who's seated, from the same
  data as `/admin/seating`.

### `src/config.ts` is still separate

The guest-facing site (`Hero`, `Nav`, `Details`, `Rsvp`, `Schedule`, `Travel`,
`Registry` sections, `Invitation`, `SaveTheDate`) reads `WEDDING`/`WEDDING_DATE`
from `config.ts` synchronously in about a dozen components — it is **not**
wired to `wedding_settings`. `/admin/settings` has a "For the public site"
panel that generates the exact lines to paste into `config.ts` from what's
saved in `wedding_settings`, so the two don't drift silently. Copy it in and
deploy when details are final; don't assume changing one changes the other.

## Side and children

Every household carries a `side` — bride, groom, both, or undecided — and every
guest carries `is_child`. Both are set in `/admin/guests`:

- The household header has a Side dropdown; the add-household form at the top
  carries a Side too, and it stays put between adds because households arrive in
  family batches.
- Each guest row has a `Child` toggle — lit means child, dim means adult. The
  add-guest form has a Children checkbox that applies to the whole comma-separated
  batch.
- Filter chips scope the list to one side, or to households with no side yet.
- The stats show seats per side. **Seats, not names**, is the figure the two
  families compare — seats are what has been committed to, and named guests lag
  behind while the list is still being built.

`/admin/seating` picks both up: a bride/groom filter on the unseated tray (with
`both` households showing under either), and a dashed chip outline for children
so a kids' table is visible at a glance. No colour — the admin palette stays
grayscale.

Neither field is shown on the guest-facing site.

## Admin writes must report failure

supabase-js puts a rejected write in the result rather than throwing, so a
caller that only reads `data` never learns it failed. Every admin mutation goes
through `insertRow` / `updateRow` / `deleteRow` in `src/lib/planning.ts`, which
surface the failure as a toast (the reporter is registered in `AdminLayout`).
Never call `supabase.from(...).insert(...)` directly from an admin page — the
`guests.email` column being absent went unnoticed for exactly this reason: the
insert was rejected every time, the form cleared, and it looked like success.

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

1. Set the wedding date and venue at `/admin/settings`, then paste the generated lines into `src/config.ts` (see "`src/config.ts` is still separate")
2. Add meal options at `/admin/settings` — RSVP can't be completed without at least one
3. Fill in `src/data/mock.ts` — FAQs, travel, registry, events
4. Add engagement photo to Story page (`src/pages/StoryPage.tsx`) and Save the Date (`src/pages/SaveTheDate.tsx`)
5. Write the real story in `src/pages/StoryPage.tsx` (three placeholder sections)
6. Add guests via `/admin/guests`; addresses if invitations are going out by mail
7. Set custom domain `sallyjason.com` in Vercel dashboard
8. Flip `SITE_MODE` to `'live'` in `src/config.ts`

## Commit and push after every change

Always `git push` after making changes so Vercel stays in sync.
