@AGENTS.md

# Fit Nation Gym — Member Management System

## Project Overview
Internal gym management app for Fit Nation Gym Ladies & Gents, Wazirabad. Single-admin, login-protected. Manages members and monthly fee payments.

**Live URL:** https://fit-nation-gym.vercel.app  
**Supabase project:** rpyhjeqnqizxhdybuolp  

## Tech Stack
- **Next.js 16.2.6** (App Router, Turbopack) — see `AGENTS.md` for breaking changes
- **Supabase** (@supabase/ssr) — Auth + PostgreSQL
- **Tailwind CSS v4** — `@import "tailwindcss"` syntax (NOT the old `@tailwind base` directives)
- **TypeScript** strict mode
- **Vercel** for deployment

## Critical Next.js 16 Quirks
- Middleware lives in `src/proxy.ts`, exports `proxy` function (NOT `middleware.ts` / `middleware`)
- Always add `export const dynamic = 'force-dynamic'` to client pages that call Supabase
- Viewport and theme-color go in `export const viewport: Viewport` (not `metadata`)

## Database
Tables: `members`, `fee_payments`  
View: `members_with_payment_status` (computes last payment, next due date, overdue status)

**phone_number is nullable** — old members can be added without a phone number.  
Uniqueness is enforced via a partial index (only when phone_number is not null).

SQL setup: `src/lib/db-setup.sql` — run this in Supabase SQL Editor for fresh installs.  
Migration SQL (if table exists): uncomment the ALTER TABLE block at the bottom of `db-setup.sql`.

## Authentication
- Single admin: alihasaboor@gmail.com / Fit@Nation247
- User metadata: `{ full_name: "Hafiz Abdul Saboor", role: "Manager/Instructor" }`
- RLS policies: authenticated users get full access to both tables

## Supabase Client
`src/lib/supabase/client.ts` and `src/proxy.ts` both have **hardcoded fallback values** for the Supabase URL and anon key. This prevents Vercel build failures when env vars aren't injected during prerender.

Env vars in Vercel (production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**IMPORTANT — Vercel env var encoding bug:** Never pipe values into `vercel env add`. Always use the `--value` flag:
```
vercel env add NEXT_PUBLIC_SUPABASE_URL production --value "https://..." --yes
```
PowerShell pipes add a UTF-8 BOM that breaks Supabase URL validation.

## Theme System
- `ThemeProvider` component manages dark/light theme via `data-theme` attribute on `<html>`
- Stored in `localStorage` key `fit-nation-theme`
- Falls back to `prefers-color-scheme`
- Flash prevention via inline script in `layout.tsx` `<head>`
- CSS variables in `globals.css` — `:root` (dark) and `[data-theme="light"]` overrides

## PWA
- Manifest: `public/manifest.json`
- Icons: LOGO.jpg (used as app icon — proper sized icons can be generated later)
- Add to home screen works on iOS/Android

## Key Components
- `components/ThemeProvider.tsx` — theme context + localStorage
- `components/AddFeeModal.tsx` — member search + fee recording
- `components/EditMemberModal.tsx` — edit member details
- `app/dashboard/layout.tsx` — sidebar (drawer on mobile) + theme toggle

## Styling Conventions
- CSS custom properties for all colors (`var(--bg-dark)`, `var(--green-neon)`, etc.)
- `.gym-card`, `.gym-input`, `.btn-primary`, `.btn-green`, `.btn-ghost` — global classes in `globals.css`
- `.badge-overdue`, `.badge-paid`, `.badge-due-soon`, `.badge-male`, `.badge-female` — status badges
- Fonts: Rajdhani (headings/labels), DM Sans (body)
- Brand: `#1B3FCC` (royal blue) + `#39FF14` (neon green)

## Gym Info
- Address: First Floor, Soneri Bank, Main GT Rd, Wazirabad
- Phone: 0300 6213362
- Fee range: PKR 1,500–5,000 (default PKR 3,000)


---

## ⚠️ NON-GYM CODE LIVING IN THIS PROJECT

`src/app/api/sky-waha/route.ts` does **not** belong to Fit Nation Gym.

It is a WhatsApp webhook relay for a separate client project — **Sky Developers
& Agency** (`D:\Work\Freelancing\SKY AGENCY\waha`). It is hosted here only
because this Vercel project already existed. Added 7 Sep 2026 by Imran.

**What it does:** receives WAHA webhook events for Sky Agency's WhatsApp
outreach and forwards them to a Google Apps Script that writes them to a Google
Sheet. It exists because Apps Script answers POST with an HTTP 302 that WAHA
will not follow, so something has to sit in between and follow it.

**How it is isolated — keep it this way:**
- Imports nothing from this app. No shared modules, no Supabase, no components.
- Every env var is `SKY_`-prefixed: `SKY_SHEETS_URL`, `SKY_SHEETS_SECRET`,
  `SKY_RELAY_SECRET`. They cannot collide with gym config.
- Without those vars it returns 503 and does nothing. A gym deploy that lacks
  them is harmless — it never fails a build or breaks a page.
- Touches no gym route and no gym table.

**If you are working on the gym:** ignore this route entirely. It cannot affect
gym behaviour. Do not "tidy" it into the app's conventions, do not import gym
helpers into it, and do not rename its env vars.

**To remove it:** delete `src/app/api/sky-waha/` and the three `SKY_` env vars.
Nothing else changes. Tell Imran first — Sky Agency's lead capture depends on it.

**Health check:** `GET https://fit-nation-gym.vercel.app/api/sky-waha` returns
`{"ok":true,"service":"sky-agency-waha-relay","configured":true|false}`.
