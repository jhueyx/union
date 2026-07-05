# Union

Wedding website for Sally & Jason — built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Before going live

Work through this checklist before flipping `SITE_MODE` to `'live'`.

### 1. Fill in wedding details (`src/config.ts`)

```ts
export const WEDDING_DATE = '2026-10-11T17:00:00' // ISO string for the countdown
export const WEDDING = {
  date: 'Saturday, October 11, 2026',
  dateShort: '10 · 11 · 26',
  time: '5:00 PM',
  rsvpDeadline: 'September 1, 2026',
  dressCode: 'Black Tie Optional',
  venue: {
    name: 'Venue Name',
    address: '123 Main St',
    city: 'City, State',
    mapsUrl: 'https://maps.google.com/...',
  },
  ...
}
```

### 2. Add guests in the admin dashboard

Go to `/admin`, log in, and add each household with an invite code. Add guests within each household. The invite codes are what guests use to look themselves up on the RSVP page.

### 3. Update static content (`src/data/mock.ts`)

- **Registry links** — replace the `#` URLs with real store links
- **Travel recommendations** — update hotel names, addresses, booking URLs, and room block codes
- **Wedding events** — update ceremony/cocktail/reception times, locations, and addresses
- **FAQ answers** — update anything that references placeholder details

### 4. Add the engagement photo

In `src/pages/SaveTheDate.tsx`, find the photo placeholder box and replace it with your image. Add the file to `public/` and reference it as `/your-photo.jpg`.

### 5. Verify Vercel environment variables

In the Vercel dashboard under **Settings → Environment Variables**, confirm these are set for **Production**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 6. Set up the custom domain

In the Vercel dashboard under **Domains**, add `sallyjason.com` and follow the DNS instructions.

### 7. Flip the site live

In `src/config.ts`, change one line:

```ts
export const SITE_MODE: SiteMode = 'live'
```

Then commit and push — Vercel deploys automatically.

---

## Local development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
```

## Deployment

Push to `main` — Vercel auto-deploys on every push.

## Admin

Go to `/admin` on the live site. Login uses Supabase Auth — the account is `jason.huey1@gmail.com`.

## Stack

- **React + Vite + TypeScript** — frontend
- **Tailwind CSS** — styling, dark mode via `prefers-color-scheme`
- **React Router v7** — client-side routing
- **Supabase** — auth (admin login), guest list, RSVP responses
- **Vercel** — hosting and deployment
