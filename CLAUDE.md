# Union — Claude Context

Internal codename: **Union**. Public-facing name: **Sally & Jason**. Never show "Union" to guests.

## What this is

A full wedding website for sallyjason.com. Built with React + Vite + TypeScript + Tailwind CSS. Deployed on Vercel. Guest data and RSVPs stored in Supabase.

## Site modes

Controlled live from `/admin/settings` → **Site status** — `wedding_settings.site_mode`,
publicly readable, no deploy needed to flip it:

- `'coming-soon'` — shows a minimal landing page with the SJ monogram and "Coming Soon" label. Nav is hidden. No Notify Me button (removed — it was a no-op).
- `'live'` — shows the full multi-page site with nav.

**Do not flip to `'live'` until all wedding details are filled in and guests are added.**

`src/config.ts` still has a `SITE_MODE` constant, but nothing reads it any more
— see "The public site is database-driven" below.

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
| `/` | `src/pages/Home.tsx` | Live — reads `wedding_settings` |
| `/story` | `src/pages/StoryPage.tsx` | Placeholder — needs real story + photo (not database-backed yet) |
| `/save-the-date` | `src/pages/SaveTheDate.tsx` | Live — reads `wedding_settings`; still needs an engagement photo |
| `/invitation` | `src/pages/Invitation.tsx` | Live — reads `wedding_settings` + `wedding_events` |
| `/rsvp` | `src/pages/RsvpPage.tsx` | Live — reads/writes Supabase |
| `/i/:inviteCode` | `src/pages/InviteCode.tsx` | Live — personalized invite landing |
| `/schedule` | `src/pages/SchedulePage.tsx` | Live — reads `wedding_events` |
| `/travel` | `src/pages/TravelPage.tsx` | Live — reads `wedding_travel` |
| `/registry` | `src/pages/RegistryPage.tsx` | Live — reads `wedding_registry` |
| `/faq` | `src/pages/FaqPage.tsx` | Live — reads `wedding_faq` |
| `/photos` | `src/pages/PhotosPage.tsx` | Placeholder |
| `/guestbook` | `src/pages/GuestbookPage.tsx` | Placeholder |
| `/admin` | `src/pages/admin/Dashboard.tsx` | Live — planner home, see below |
| `/admin/guests` | `src/pages/admin/Guests.tsx` | Live — households, guests, side, addresses |
| `/admin/seating` | `src/pages/admin/Seating.tsx` | Live — drag-and-drop floor plan |
| `/admin/checklist` | `src/pages/admin/Checklist.tsx` | Live — seeds from `CHECKLIST_TEMPLATE` once a date is set |
| `/admin/timeline` | `src/pages/admin/Timeline.tsx` | Live — day-of running order (internal, not shown to guests) |
| `/admin/budget` | `src/pages/admin/Budget.tsx` | Live — estimates vs. actuals |
| `/admin/vendors` | `src/pages/admin/Vendors.tsx` | Live — considering/booked/declined |
| `/admin/gifts` | `src/pages/admin/Gifts.tsx` | Live — red envelope / cash gift tracker |
| `/admin/content` | `src/pages/admin/Content.tsx` | Live — edits FAQ, Travel, Registry, and the public Schedule |
| `/admin/exports` | `src/pages/admin/Exports.tsx` | Live — addresses, catering, seating chart as copy/print text |
| `/admin/settings` | `src/pages/admin/Settings.tsx` | Live — site status, wedding date, venue, RSVP deadline, meal options |

Nav order: Our Story · Save the Date · Invite · RSVP · Schedule · Travel · Registry · FAQ

## Key files

| File | Purpose |
|------|---------|
| `src/config.ts` | **Dead.** `SITE_MODE`/`SITE_PHASE`/`WEDDING`/`WEDDING_DATE` are no longer read anywhere — see "The public site is database-driven" |
| `src/data/mock.ts` | **Dead.** `MEAL_CHOICES`/`FAQ_ITEMS`/`TRAVEL_RECOMMENDATIONS`/`REGISTRY_LINKS`/`WEDDING_EVENTS` are no longer read anywhere — their tables replaced them |
| `src/lib/siteContent.tsx` | Fetches `wedding_settings` + the four content tables once at the `RootLayout` root; `useSiteContent()` hook hands it to every public page |
| `src/lib/dates.ts` | Pure date helpers, usable from the public site — `planning.ts` re-exports these for admin |
| `src/types/index.ts` | All TypeScript types |
| `src/lib/supabase.ts` | Supabase client (uses `VITE_SUPABASE_*` env vars) |
| `src/routes/index.tsx` | All routes |
| `src/layouts/RootLayout.tsx` | Wraps every public route in `SiteContentProvider` |
| `src/layouts/AdminLayout.tsx` | Auth gate for `/admin` — checks Supabase session, shows Login or Dashboard |
| `src/pages/admin/Login.tsx` | Admin login form (Supabase email/password) |
| `src/components/Hero.tsx` | Home page hero, mode-aware |
| `src/components/Nav.tsx` | Top nav, hidden in coming-soon mode |
| `src/utils/index.ts` | `getCountdown`, `formatDate`, `generateInviteCode` |
| `vercel.json` | SPA rewrite — all routes → `/index.html` |

`src/components/sections/*` (`Details`, `Rsvp`, `Registry`, `Schedule`,
`Travel`) is unused dead code from an earlier single-page design — no route
imports any of them. Left alone; don't wire these up by mistake instead of the
real pages listed above.

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

Seven more tables back the planning suite, all admin-only (RLS requires
`auth.role() = 'authenticated'`) except where noted, all accessed through
`src/lib/planning.ts` (see "Admin writes must report failure" below):

- **`wedding_settings`** — one row, `id = true` enforced by a check constraint.
  `site_mode` (`'coming-soon' | 'live'`, checked), `couple_names`,
  `wedding_date`, `ceremony_time`, `venue_name`, `venue_address`, `venue_city`,
  `venue_maps_url`, `dress_code`, `rsvp_deadline`, `guest_target`, `notes`,
  `single_menu`. This is the fixed point the whole planner measures from —
  without a date the checklist can't say what's overdue and the Dashboard
  can't show days-to-go. **Also drives the public site directly** — publicly
  readable, admin-only to write, edited at `/admin/settings`. See "The public
  site is database-driven" below.
- **`wedding_meals`** — meal options for the RSVP flow. `id` (slug), `label`,
  `description`, `dietary_tags[]`, `is_child_meal`, `position`. Publicly
  readable (guests need it during RSVP, which is unauthenticated), admin-only
  to write. Managed at `/admin/settings`. `RsvpPage.tsx` fetches this directly
  from Supabase rather than through `planning.ts`, since it's on the public
  site. **Not used at all** when `wedding_settings.single_menu` is on — see
  "Banquet style" below.
- **`wedding_tasks`** — the checklist. Seeded from `CHECKLIST_TEMPLATE` in
  `src/lib/checklistTemplate.ts`, a ~60-item standard wedding list (including a
  Tea Ceremony thread — see below) expressed as day-offsets before the wedding
  (`{ days: 90, title: '...', category: '...' }`). Seeding is additive and
  keyed on title — safe to re-run after the date moves or after adding tasks
  by hand; it tops up rather than replaces.
- **`wedding_timeline`** — day-of running order. Times are stored as a bare
  `time`, not a timestamp — the schedule is relative to the day, not a timezone.
- **`wedding_budget`** — line items, `estimated`/`actual`/`paid`, optionally
  tied to a vendor.
- **`wedding_vendors`** — directory, `status: considering | booked | declined`.
- **`wedding_gifts`** — red envelope / cash gift log. `household_id` nullable
  with a `given_by` text fallback (a gift can arrive from someone not on the
  guest list), `amount`, `currency` (defaults `'USD'`, free entry — sums are
  grouped per currency rather than blindly added together), `note`,
  `received_at`. Fully admin-only, no public policy — this is money. Managed
  at `/admin/gifts`; totalled on the Dashboard.
- **`wedding_tables`** / **`wedding_seat_assignments`** — the seating floor
  plan (already existed before this section was written up).

### The public site is database-driven

`src/config.ts` and `src/data/mock.ts` are **dead code** — nothing imports
from them any more. The site reads live from four public-readable,
admin-write tables (edited at `/admin/content`), plus `wedding_settings`:

- **`wedding_faq`** — `question`, `answer`, `category`, `position`. Backs `/faq`.
- **`wedding_travel`** — `type` (`hotel | transport | activity | restaurant`,
  checked), `name`, `address`, `url`, `note`, `price_range`, `booking_code`,
  `position`. Backs `/travel`.
- **`wedding_registry`** — `store`, `url`, `note`, `position`. Backs `/registry`.
- **`wedding_events`** — the **guest-facing** schedule shown on `/schedule` and
  `/invitation`: `name`, `time_label`, `end_time_label` (free-text display
  strings like `"5:00 PM"`, not real `time` columns — this is what a guest
  reads, not something sorted or computed on), `location`, `address`,
  `description`, `dresscode`, `position`. **Distinct from `wedding_timeline`**,
  the internal day-of running order, which can carry vendor call times and
  other detail not meant for guests — don't conflate the two.

All four: RLS `select using (true)`, admin `for all using (auth.role() =
'authenticated')` — same shape as `wedding_meals`. `position` is set to the
list length at insert time (append order); there's no drag-to-reorder yet.

`src/lib/siteContent.tsx` fetches `wedding_settings` + all four content tables
once, at the `RootLayout` root (mounted for every public route, not `/admin`).
`SiteContentProvider` renders `null` while that first fetch is in flight —
same gate `AdminLayout` uses for the auth session — so a visitor never sees a
flash of `coming-soon` before the real `site_mode` lands. `useSiteContent()`
hands back `{ isLive, wedding, events, travel, registry, faq }`; `wedding` is
shaped to match the old `config.ts` `WEDDING` object closely (`coupleNames`,
`date`, `dateShort`, `time`, `dateTimeISO`, `rsvpDeadline`, `dressCode`,
`venue: { name, address, city, mapsUrl }`) so the display components barely
changed. Pure formatting (`formatDay`, `formatDayShort`, `formatTime`) lives
in `src/lib/dates.ts`, not `planning.ts` — that module is admin-only (reads
`supabase` with the assumption of an authenticated caller) and must not be
imported from public pages.

Editing `wedding_settings` or any of the four content tables at
`/admin/settings` / `/admin/content` takes effect on the live site immediately
— no deploy, no waiting on Vercel.

### Banquet style (`wedding_settings.single_menu`)

Off by default (per-guest meal choice, Western plated service). On means one
fixed menu served to every table — the norm for a Chinese banquet — and:
- `RsvpPage.tsx` skips the "Meal Selection" step entirely; guests only confirm
  attendance and leave dietary notes.
- `/admin/exports`'s catering report swaps the per-meal breakdown for a table
  count (see `tablesNeeded()` below) instead of counts by `wedding_meals.label`.
- `/admin/settings` grays out the Meal options manager with a note, but leaves
  the data in place in case the toggle goes back off.

### Table math

`tablesNeeded(seats, tables)` in `planning.ts` estimates how many banquet
tables a seat count needs — averaging the capacity of whatever's actually on
the floor plan, or `DEFAULT_TABLE_SIZE` (10, the standard Chinese-banquet
round table) if no tables exist yet. Backs "Tables needed" and "Cost per
table" on the Dashboard and the catering export's table count under Banquet
style — the number a banquet hall actually quotes against, not cost per head.

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
- **Catering** — headcount (adults/children), then either meal counts by
  `wedding_meals.label` or a table count (`tablesNeeded()`) under Banquet
  style, then dietary requirements. Falls back to *everyone invited* until any
  RSVP has come in, rather than reading zero.
- **Seating chart** — one section per table with who's seated, from the same
  data as `/admin/seating`.

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

1. Set the wedding date, venue, dress code at `/admin/settings`
2. Add meal options at `/admin/settings` — RSVP can't be completed without at least one (unless Banquet style is on)
3. Fill in FAQ, Travel, Registry, and Schedule at `/admin/content`
4. Add engagement photo to Story page (`src/pages/StoryPage.tsx`) and Save the Date (`src/pages/SaveTheDate.tsx`) — no image-upload path exists yet, this is still a code change
5. Write the real story in `src/pages/StoryPage.tsx` (three placeholder sections) — also still static, not database-backed
6. Add guests via `/admin/guests`; addresses if invitations are going out by mail
7. ~~Set custom domain~~ — done: `sallyjason.com` is live and pointed at the `union` Vercel project
8. Flip **Site status** to Live at `/admin/settings` — takes effect immediately, no deploy

## Commit and push after every change

Always `git push` after making changes so Vercel stays in sync.
