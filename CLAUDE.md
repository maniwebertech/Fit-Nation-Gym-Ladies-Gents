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
