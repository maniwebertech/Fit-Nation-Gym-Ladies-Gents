'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPKR, formatDate, getPeriodDates, isAdvancePayment, buildWhatsAppUrl, type PeriodFilter } from '@/lib/utils'

// One payment row joined with its member (collection reports read collected_on).
interface RptPayment {
  id: string
  amount: number
  payment_date: string   // coverage month
  collected_on: string   // actual cash date
  notes: string | null
  member: {
    id: string
    full_name: string
    father_name: string | null
    phone_country_code: string
    phone_number: string | null
  } | null
}

interface Bucket {
  key: string            // YYYY-MM-DD (day) or YYYY-MM (month)
  label: string
  count: number
  amount: number
  advance: number
  advanceAmount: number
  payments: RptPayment[]
}

type GroupBy = 'day' | 'month'

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'current_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom' },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodFilter>('current_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [payments, setPayments] = useState<RptPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeBucket, setActiveBucket] = useState<Bucket | null>(null)

  useEffect(() => {
    if (period === 'custom' && (!customStart || !customEnd)) { setPayments([]); setLoading(false); return }
    const { start, end } = getPeriodDates(period, customStart, customEnd)
    if (!start || !end) { setPayments([]); setLoading(false); return }

    let cancelled = false
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('fee_payments')
      .select('id, amount, payment_date, collected_on, notes, member:members(id, full_name, father_name, phone_country_code, phone_number)')
      .gte('collected_on', start)
      .lte('collected_on', end)
      .order('collected_on', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        // supabase returns the embedded member as an object for a to-one relation
        const rows = (data || []).map((r) => {
          const rec = r as unknown as Omit<RptPayment, 'member'> & { member: RptPayment['member'] | RptPayment['member'][] }
          const member = Array.isArray(rec.member) ? rec.member[0] ?? null : rec.member
          return { ...rec, member } as RptPayment
        })
        setPayments(rows)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [period, customStart, customEnd])

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>()
    for (const p of payments) {
      const key = groupBy === 'day' ? p.collected_on.slice(0, 10) : p.collected_on.slice(0, 7)
      let b = map.get(key)
      if (!b) {
        b = { key, label: groupBy === 'day' ? formatDate(key) : monthLabel(key), count: 0, amount: 0, advance: 0, advanceAmount: 0, payments: [] }
        map.set(key, b)
      }
      b.count++
      b.amount += p.amount || 0
      b.payments.push(p)
      if (isAdvancePayment(p.payment_date, p.collected_on)) { b.advance++; b.advanceAmount += p.amount || 0 }
    }
    // newest first
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0))
  }, [payments, groupBy])

  const totals = useMemo(() => ({
    count: payments.length,
    amount: payments.reduce((s, p) => s + (p.amount || 0), 0),
    advance: payments.filter(p => isAdvancePayment(p.payment_date, p.collected_on)).length,
    advanceAmount: payments.filter(p => isAdvancePayment(p.payment_date, p.collected_on)).reduce((s, p) => s + (p.amount || 0), 0),
  }), [payments])

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label ?? ''
  const needCustom = period === 'custom' && (!customStart || !customEnd)

  function exportCsv() {
    const header = [groupBy === 'day' ? 'Date' : 'Month', 'Payments', 'Amount (PKR)', 'Advance', 'Advance Amount (PKR)']
    const lines = buckets.map(b => [b.label, b.count, b.amount, b.advance, b.advanceAmount].join(','))
    const total = ['Total', totals.count, totals.amount, totals.advance, totals.advanceAmount].join(',')
    const csv = [header.join(','), ...lines, total].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `fit-nation-collections-${getPeriodDates(period, customStart, customEnd).start}_to_${getPeriodDates(period, customStart, customEnd).end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>REPORTS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Fee collections by {groupBy === 'day' ? 'day' : 'month'} · {periodLabel}</p>
        </div>
        <button onClick={exportCsv} disabled={loading || buckets.length === 0} className="btn-ghost shrink-0" style={{ fontSize: '0.82rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="gym-card p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: 'Rajdhani', letterSpacing: '0.06em',
                background: period === opt.value ? 'rgba(27,63,204,0.35)' : 'transparent',
                color: period === opt.value ? '#8FA3FF' : 'var(--text-muted)',
                border: period === opt.value ? '1px solid rgba(27,63,204,0.6)' : '1px solid var(--border)',
              }}>
              {opt.label}
            </button>
          ))}
          <div className="ml-auto flex gap-1 rounded-lg p-0.5" style={{ border: '1px solid var(--border)' }}>
            {(['day', 'month'] as GroupBy[]).map(g => (
              <button key={g} onClick={() => setGroupBy(g)}
                className="text-xs font-semibold px-3 py-1 rounded-md transition-all"
                style={{
                  fontFamily: 'Rajdhani', letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: groupBy === g ? 'rgba(57,255,20,0.15)' : 'transparent',
                  color: groupBy === g ? '#39FF14' : 'var(--text-muted)',
                }}>
                By {g}
              </button>
            ))}
          </div>
        </div>
        {period === 'custom' && (
          <div className="flex flex-wrap gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', letterSpacing: '0.06em' }}>FROM</span>
              <input type="date" className="gym-input" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                value={customStart} max={customEnd || undefined} onChange={e => setCustomStart(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', letterSpacing: '0.06em' }}>TO</span>
              <input type="date" className="gym-input" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                value={customEnd} min={customStart || undefined} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {([
          { label: 'Total Payments', value: loading ? '—' : totals.count, color: '#39FF14' },
          { label: 'Total Collected', value: loading ? '—' : formatPKR(totals.amount), color: '#39FF14' },
          { label: 'Advance', value: loading ? '—' : `${totals.advance} · ${formatPKR(totals.advanceAmount)}`, color: '#A78BFA' },
        ] as const).map(t => (
          <div key={t.label} className="gym-card p-4">
            <div className="text-xl font-bold" style={{ fontFamily: 'Rajdhani', color: t.color }}>{t.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Report table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="gym-table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ padding: '0.7rem 1.25rem', background: 'var(--bg-card2)' }}>{groupBy === 'day' ? 'DATE' : 'MONTH'}</th>
                <th style={{ padding: '0.7rem 1rem', background: 'var(--bg-card2)' }}>PAYMENTS</th>
                <th style={{ padding: '0.7rem 1rem', background: 'var(--bg-card2)' }}>AMOUNT</th>
                <th style={{ padding: '0.7rem 1rem', background: 'var(--bg-card2)' }}>ADVANCE</th>
                <th style={{ padding: '0.7rem 1rem', background: 'var(--bg-card2)', width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="text-center py-14" style={{ color: 'var(--text-muted)' }}>Loading…</td></tr>
              )}
              {!loading && needCustom && (
                <tr><td colSpan={5} className="text-center py-14" style={{ color: 'var(--text-muted)' }}>Pick a start and end date.</td></tr>
              )}
              {!loading && !needCustom && buckets.length === 0 && (
                <tr><td colSpan={5} className="text-center py-14" style={{ color: 'var(--text-muted)' }}>No collections in this period.</td></tr>
              )}
              {!loading && buckets.map(b => (
                <tr key={b.key} onClick={() => setActiveBucket(b)} className="cursor-pointer"
                  style={{ transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <span className="font-semibold" style={{ fontSize: '0.9rem' }}>{b.label}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ color: '#6B8FFF', fontWeight: 700, fontFamily: 'Rajdhani', fontSize: '1rem', textDecoration: 'underline', textDecorationColor: 'rgba(107,143,255,0.4)', textUnderlineOffset: 3 }}>
                      {b.count}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ color: '#39FF14', fontWeight: 700, fontFamily: 'Rajdhani', fontSize: '0.95rem' }}>{formatPKR(b.amount)}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {b.advance > 0
                      ? <span style={{ color: '#A78BFA', fontWeight: 600, fontSize: '0.85rem' }}>{b.advance} · {formatPKR(b.advanceAmount)}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>View →</span>
                  </td>
                </tr>
              ))}
            </tbody>
            {!loading && buckets.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-card2)' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.95rem' }}>TOTAL</td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'Rajdhani', fontWeight: 700, color: '#6B8FFF', fontSize: '1rem' }}>{totals.count}</td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'Rajdhani', fontWeight: 700, color: '#39FF14', fontSize: '1rem' }}>{formatPKR(totals.amount)}</td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'Rajdhani', fontWeight: 700, color: '#A78BFA', fontSize: '0.9rem' }}>
                    {totals.advance > 0 ? `${totals.advance} · ${formatPKR(totals.advanceAmount)}` : '—'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {activeBucket && <BucketModal bucket={activeBucket} onClose={() => setActiveBucket(null)} />}
    </div>
  )
}

// ── Searchable modal listing every payment inside a day/month bucket ──
function BucketModal({ bucket, onClose }: { bucket: Bucket; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const rows = bucket.payments
    .filter(p => {
      if (!q) return true
      const m = p.member
      return (m?.full_name || '').toLowerCase().includes(q)
        || (m?.father_name || '').toLowerCase().includes(q)
        || (m?.phone_number || '').includes(q)
    })
    .sort((a, b) => (a.member?.full_name || '').localeCompare(b.member?.full_name || ''))

  const shownAmount = rows.reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="gym-card w-full animate-fade-slide-up flex flex-col"
        style={{ maxWidth: 620, maxHeight: '90vh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>{bucket.label}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {bucket.count} payment{bucket.count === 1 ? '' : 's'} · {formatPKR(bucket.amount)}
              {bucket.advance > 0 && <span style={{ color: '#A78BFA' }}> · {bucket.advance} advance</span>}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost shrink-0" style={{ padding: '0.4rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input autoFocus className="gym-input" style={{ paddingLeft: '2.375rem', fontSize: '0.875rem' }}
              placeholder="Search member by name, father name, phone…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No match.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {rows.map(p => {
                const advance = isAdvancePayment(p.payment_date, p.collected_on)
                const m = p.member
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{m?.full_name || 'Unknown member'}</div>
                      <div className="text-xs mt-0.5 flex flex-wrap items-center gap-x-2" style={{ color: 'var(--text-muted)' }}>
                        {m?.father_name && <span>S/O {m.father_name}</span>}
                        <span>Fee for {formatDate(p.payment_date)}</span>
                        {advance && <span style={{ color: '#A78BFA', fontWeight: 600 }}>· ADVANCE</span>}
                        {p.notes && <span className="truncate">· {p.notes}</span>}
                      </div>
                    </div>
                    {m?.phone_number && (
                      <a href={buildWhatsAppUrl(m.phone_country_code, m.phone_number)} target="_blank" rel="noopener noreferrer"
                        title="WhatsApp" style={{ color: '#25D366', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                        </svg>
                      </a>
                    )}
                    <span style={{ color: '#39FF14', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>
                      {formatPKR(p.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer total (reflects search filter) */}
        <div className="px-5 py-3 shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {rows.length} of {bucket.count} shown
          </span>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: '#39FF14' }}>{formatPKR(shownAmount)}</span>
        </div>
      </div>
    </div>
  )
}
