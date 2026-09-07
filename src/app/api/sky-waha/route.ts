// ─────────────────────────────────────────────────────────────────────────────
// SKY AGENCY — WhatsApp webhook relay.   *** NOT PART OF THE GYM APP ***
//
// This route belongs to a DIFFERENT project (Sky Developers & Agency WhatsApp
// outreach). It is hosted here only because this Vercel project already exists.
// It shares no code, no database and no environment variables with Fit Nation
// Gym, and it must stay that way.
//
//   WhatsApp reply  →  WAHA webhook  →  THIS ROUTE  →  Google Apps Script  →  Sheet
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// Google Apps Script answers every POST to /exec with an HTTP 302. WAHA does
// not follow redirects, so posting to Apps Script directly failed silently and
// burned all 15 retries (confirmed 3 Sep 2026 — WAHA held the reply, the Sheet
// stayed empty). This relay follows the redirect and validates that the reply
// really came from doPost, retrying when it does not.
//
// ── SAFETY RULES FOR THIS FILE ──────────────────────────────────────────────
//  1. Imports NOTHING from the gym app. Zero dependencies. Self-contained.
//  2. Every env var is SKY_-prefixed so it can never collide with gym config.
//  3. If its env vars are absent it returns 503 and does nothing — a gym deploy
//     without them is harmless, never a build or runtime failure.
//  4. Touches no gym route, no Supabase table, no shared module.
//  5. Deleting this folder removes it completely, with no effect on the gym.
//
// ── ENV VARS (Vercel → this project → Settings → Environment Variables) ─────
//   SKY_SHEETS_URL     the Apps Script /exec URL
//   SKY_SHEETS_SECRET  SHARED_SECRET from the Apps Script properties
//   SKY_RELAY_SECRET   a separate secret WAHA must present to use this relay
//
// WAHA webhook URL:  https://fit-nation-gym.vercel.app/api/sky-waha?key=<SKY_RELAY_SECRET>
// Events:            message, poll.vote
//
// The relay secret is deliberately NOT the Apps Script secret: WAHA's config
// holds only the relay key, so the Sheets secret is never stored in WAHA.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Fields the Apps Script doPost handler actually returns. */
type SheetResult = {
  ok?: boolean
  added?: number
  duplicates?: number
  upgraded?: number
  rejected_not_recipient?: number
  ignored?: string
  error?: string
}

/**
 * A reply only counts if it carries a field doPost produces.
 *
 * Two things masquerade as a valid response: Google's HTML interstitial, and
 * doGet's own output (following a 302 turns POST into GET, so the request can
 * land on doGet). Neither means a row was written.
 */
function isRealResult(j: unknown): j is SheetResult {
  if (!j || typeof j !== 'object') return false
  const o = j as Record<string, unknown>
  return (
    'added' in o || 'duplicates' in o || 'upgraded' in o ||
    'rejected_not_recipient' in o || 'ignored' in o || 'error' in o
  )
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function forwardToSheet(body: string, tries = 5): Promise<SheetResult> {
  const url = process.env.SKY_SHEETS_URL
  const secret = process.env.SKY_SHEETS_SECRET
  if (!url || !secret) return { ok: false, error: 'relay not configured' }

  const target = `${url}?key=${encodeURIComponent(secret)}`
  let last: SheetResult = { ok: false, error: 'no doPost result' }

  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        cache: 'no-store',
      })
      const text = await res.text()
      try {
        const parsed: unknown = JSON.parse(text)
        if (isRealResult(parsed)) return parsed
      } catch {
        /* HTML interstitial — retry */
      }
    } catch (e) {
      last = { ok: false, error: e instanceof Error ? e.message : 'fetch failed' }
    }
    if (i < tries) await sleep(Math.min(600 * i, 3000))
  }
  return last
}

export async function POST(req: NextRequest) {
  const relaySecret = process.env.SKY_RELAY_SECRET
  if (!relaySecret || !process.env.SKY_SHEETS_URL || !process.env.SKY_SHEETS_SECRET) {
    // Not configured for Sky Agency on this deployment — do nothing, quietly.
    return NextResponse.json({ ok: false, error: 'relay not configured' }, { status: 503 })
  }

  if (req.nextUrl.searchParams.get('key') !== relaySecret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return NextResponse.json({ ok: false, error: 'unreadable body' }, { status: 400 })
  }

  // Only forward the two events we record. Anything else is acknowledged so
  // WAHA does not retry it 15 times.
  let event = ''
  try {
    const parsed = JSON.parse(raw) as { event?: unknown }
    event = typeof parsed.event === 'string' ? parsed.event : ''
  } catch {
    return NextResponse.json({ ok: true, ignored: 'unparseable' })
  }

  if (event !== 'message' && event !== 'poll.vote') {
    return NextResponse.json({ ok: true, ignored: event || 'no event' })
  }

  const result = await forwardToSheet(raw)

  // Always 200 once we have handled it. A non-2xx makes WAHA retry, and the
  // Apps Script already dedupes — retries would add load without adding rows.
  return NextResponse.json({ ok: true, relayed: true, sheet: result })
}

/** Health check — confirms the relay is deployed and configured. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sky-agency-waha-relay',
    note: 'Sky Agency WhatsApp relay. Not part of Fit Nation Gym.',
    configured: Boolean(
      process.env.SKY_RELAY_SECRET &&
      process.env.SKY_SHEETS_URL &&
      process.env.SKY_SHEETS_SECRET
    ),
  })
}
