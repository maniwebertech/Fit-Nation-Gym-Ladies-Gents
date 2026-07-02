'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPKR, formatDate, buildWhatsAppUrl } from '@/lib/utils'
import type { Member } from '@/types'
import AddFeeModal from '@/components/AddFeeModal'
import EditMemberModal from '@/components/EditMemberModal'
import MemberDetailModal from '@/components/MemberDetailModal'
import MemberAvatar from '@/components/MemberAvatar'
import Link from 'next/link'

type Filter = 'all' | 'overdue' | 'paid' | 'due_soon' | 'male' | 'female'
type SortField = 'full_name' | 'phone_number' | 'gender' | 'fee_amount' | 'last_payment_date' | 'next_due_date' | 'days_remaining' | 'is_overdue' | 'last_activity'

// Most-recent activity timestamp for a member: latest of a detail update (member added
// or edited) and their latest fee (added). Used for the default "recently updated" sort.
// Falls back to updated_at when the view hasn't been migrated to expose last_activity yet.
function activityTime(m: Member): number {
  const t = m.last_activity ?? m.updated_at
  const ms = t ? Date.parse(t) : NaN
  return Number.isNaN(ms) ? 0 : ms
}

const PAGE_SIZE = 20

function getStatus(m: Member) {
  if (m.is_overdue) return 'overdue'
  if ((m.days_remaining ?? 999) <= 7) return 'due_soon'
  return 'paid'
}

function StatusBadge({ m }: { m: Member }) {
  const s = getStatus(m)
  return (
    <span className={s === 'overdue' ? 'badge-overdue' : s === 'due_soon' ? 'badge-due-soon' : 'badge-paid'}>
      {s === 'overdue' ? 'OVERDUE' : s === 'due_soon' ? 'DUE SOON' : 'PAID'}
    </span>
  )
}

function DaysLeft({ m }: { m: Member }) {
  if (m.days_remaining === null || m.days_remaining === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const d = m.days_remaining
  return (
    <span style={{ fontWeight: 700, color: d < 0 ? '#FF3B5C' : d <= 7 ? '#FFA500' : '#39FF14', fontFamily: 'Rajdhani', fontSize: '0.9rem' }}>
      {d < 0 ? `${Math.abs(d)}d late` : `${d}d left`}
    </span>
  )
}

function PhoneCell({ m }: { m: Member }) {
  if (!m.phone_number) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.phone_country_code} {m.phone_number}</span>
      <a href={buildWhatsAppUrl(m.phone_country_code, m.phone_number)} target="_blank" rel="noopener noreferrer"
        title="Open WhatsApp" style={{ color: '#25D366', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      {m.email && (
        <a href={`mailto:${m.email}`} title={m.email} style={{ color: '#6B8FFF', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </a>
      )}
    </div>
  )
}

function ActionButtons({ m, onView, onFee, onEdit, onDelete }: { m: Member; onView: () => void; onFee: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onView} title="View fee history"
        className="p-2 rounded-lg transition-colors"
        style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.25)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
      <button onClick={onFee} title="Add Fee"
        className="p-2 rounded-lg transition-colors"
        style={{ background: 'rgba(57,255,20,0.1)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.2)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </button>
      <button onClick={onEdit} title="Edit"
        className="p-2 rounded-lg transition-colors"
        style={{ background: 'rgba(27,63,204,0.12)', color: '#6B8FFF', border: '1px solid rgba(27,63,204,0.2)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button onClick={onDelete} title="Delete member and all fee records"
        className="p-2 rounded-lg transition-colors"
        style={{ background: 'rgba(255,59,92,0.1)', color: '#FF3B5C', border: '1px solid rgba(255,59,92,0.2)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
        </svg>
      </button>
    </div>
  )
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-4">
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button className="pagination-btn" onClick={() => onChange(page - 1)} disabled={page === 1}>‹</button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>…</span>
          ) : (
            <button key={p} className={`pagination-btn${page === p ? ' active' : ''}`} onClick={() => onChange(p as number)}>{p}</button>
          )
        )}
        <button className="pagination-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}>›</button>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sortField, setSortField] = useState<SortField>('last_activity')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  // Advanced filter (who paid within a date range + status) — draft values, applied on "Filter"
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [rangeStatus, setRangeStatus] = useState<'all' | 'overdue' | 'due_soon' | 'paid'>('all')
  const [applied, setApplied] = useState<{ start: string; end: string; status: 'all' | 'overdue' | 'due_soon' | 'paid' } | null>(null)
  // Member IDs who have a fee payment within the applied date range (null = no date range applied)
  const [paidIds, setPaidIds] = useState<Set<string> | null>(null)
  const [applying, setApplying] = useState(false)
  const [feeModal, setFeeModal] = useState<Member | null>(null)
  const [editModal, setEditModal] = useState<Member | null>(null)
  const [detailModal, setDetailModal] = useState<Member | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('members_with_payment_status').select('*')
    setMembers(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filter, search])

  async function applyRange() {
    setApplying(true)
    // If a date range is given, find members who paid within it
    if (rangeStart || rangeEnd) {
      let query = supabase.from('fee_payments').select('member_id')
      if (rangeStart) query = query.gte('payment_date', rangeStart)
      if (rangeEnd) query = query.lte('payment_date', rangeEnd)
      const { data } = await query
      setPaidIds(new Set((data || []).map(r => r.member_id as string)))
    } else {
      setPaidIds(null)
    }
    setApplied({ start: rangeStart, end: rangeEnd, status: rangeStatus })
    setPage(1)
    setApplying(false)
  }

  function clearRange() {
    setRangeStart('')
    setRangeEnd('')
    setRangeStatus('all')
    setApplied(null)
    setPaidIds(null)
    setPage(1)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      m.full_name.toLowerCase().includes(q) ||
      (m.phone_number || '').includes(q) ||
      (m.father_name || '').toLowerCase().includes(q)
    const status = getStatus(m)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'overdue' ? !!m.is_overdue :
      filter === 'paid' ? status === 'paid' :
      filter === 'due_soon' ? status === 'due_soon' :
      filter === 'male' ? m.gender === 'Male' :
      filter === 'female' ? m.gender === 'Female' : true

    let matchRange = true
    if (applied) {
      // Members who paid within the selected date range
      if (paidIds) matchRange = matchRange && paidIds.has(m.id)
      if (applied.status === 'overdue') matchRange = matchRange && !!m.is_overdue
      else if (applied.status === 'paid') matchRange = matchRange && status === 'paid'
      else if (applied.status === 'due_soon') matchRange = matchRange && status === 'due_soon'
    }
    return matchSearch && matchFilter && matchRange
  }).sort((a, b) => {
    let va: string | number
    let vb: string | number
    if (sortField === 'last_activity') {
      va = activityTime(a)
      vb = activityTime(b)
    } else if (sortField === 'is_overdue') {
      va = a.is_overdue ? 1 : 0
      vb = b.is_overdue ? 1 : 0
    } else {
      va = (a[sortField as keyof Member] ?? '') as string | number
      vb = (b[sortField as keyof Member] ?? '') as string | number
    }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'desc' ? -cmp : cmp
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    all: members.length,
    overdue: members.filter(m => m.is_overdue).length,
    due_soon: members.filter(m => getStatus(m) === 'due_soon').length,
    paid: members.filter(m => getStatus(m) === 'paid').length,
    male: members.filter(m => m.gender === 'Male').length,
    female: members.filter(m => m.gender === 'Female').length,
  }

  const filterList: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#6B8FFF' },
    { key: 'overdue', label: 'Overdue', color: '#FF3B5C' },
    { key: 'due_soon', label: 'Due Soon', color: '#FFA500' },
    { key: 'paid', label: 'Paid', color: '#39FF14' },
    { key: 'male', label: 'Gents', color: '#6B8FFF' },
    { key: 'female', label: 'Ladies', color: '#FF64B4' },
  ]

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>↕</span>
    return <span style={{ color: '#6B8FFF', fontSize: 9 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Delete "${name}"?\n\nAll their fee payment records will also be permanently deleted.`)) return
    await supabase.from('members').delete().eq('id', id)
    setDetailModal(null)
    load()
  }

  const ThCol = ({ field, label }: { field: SortField; label: string }) => (
    <th className="cursor-pointer select-none" onClick={() => toggleSort(field)}
      style={{ paddingTop: 10, paddingBottom: 10, background: 'var(--bg-card2)', userSelect: 'none' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label} <SortIcon field={field} />
      </span>
    </th>
  )

  return (
    <div className="p-4 md:p-6 max-w-full animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>MEMBERS</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} of {members.length} members
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFeeModal({} as Member)} className="btn-green" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            ADD FEE
          </button>
          <Link href="/dashboard/register" className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            ADD MEMBER
          </Link>
        </div>
      </div>

      {/* ── Search + Filters ────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative" style={{ maxWidth: 380 }}>
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="gym-input" style={{ paddingLeft: '2.375rem', fontSize: '0.875rem' }}
            placeholder="Search name, phone, father name..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {filterList.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.05em',
                padding: '4px 12px', borderRadius: 20, border: '1px solid',
                cursor: 'pointer', transition: 'all 0.15s',
                background: filter === f.key ? `${f.color}22` : 'transparent',
                borderColor: filter === f.key ? f.color : 'var(--border)',
                color: filter === f.key ? f.color : 'var(--text-muted)',
              }}>
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {/* ── Advanced filter: who paid within a date range + status ── */}
        <div className="gym-card flex flex-wrap items-end gap-3 p-3">
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.7rem', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>PAID FROM</label>
            <input type="date" className="gym-input" style={{ fontSize: '0.85rem', width: 'auto' }}
              value={rangeStart} max={rangeEnd || undefined} onChange={e => setRangeStart(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.7rem', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>PAID TO</label>
            <input type="date" className="gym-input" style={{ fontSize: '0.85rem', width: 'auto' }}
              value={rangeEnd} min={rangeStart || undefined} onChange={e => setRangeEnd(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.7rem', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600 }}>STATUS</label>
            <select className="gym-input" style={{ fontSize: '0.85rem', width: 'auto' }}
              value={rangeStatus} onChange={e => setRangeStatus(e.target.value as typeof rangeStatus)}>
              <option value="all">All</option>
              <option value="overdue">Overdue</option>
              <option value="due_soon">Due Soon</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <button onClick={applyRange} disabled={applying} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}>
            {applying ? 'Filtering…' : 'Filter'}
          </button>
          <button onClick={clearRange} className="btn-ghost" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            disabled={!applied && !rangeStart && !rangeEnd && rangeStatus === 'all'}>
            Clear
          </button>
          {applied && (
            <span style={{
              display: 'flex', alignItems: 'center', height: 38, alignSelf: 'flex-end',
              fontSize: '0.78rem', color: '#39FF14', fontFamily: 'Rajdhani', fontWeight: 600,
            }}>
              Filter active — {filtered.length} match{filtered.length === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      </div>

      {/* ── Desktop Table (hidden on mobile) ───────────────── */}
      <div className="hidden md:block">
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="gym-table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <ThCol field="full_name" label="MEMBER" />
                  <ThCol field="phone_number" label="PHONE" />
                  <ThCol field="gender" label="GENDER" />
                  <ThCol field="fee_amount" label="FEE/MO" />
                  <ThCol field="last_payment_date" label="LAST PAID" />
                  <ThCol field="next_due_date" label="NEXT DUE" />
                  <ThCol field="days_remaining" label="DAYS" />
                  <ThCol field="is_overdue" label="STATUS" />
                  <th style={{ paddingTop: 10, paddingBottom: 10, background: 'var(--bg-card2)', color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.09em' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                    Loading members...
                  </td></tr>
                )}
                {!loading && paginated.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                    No members found.
                  </td></tr>
                )}
                {!loading && paginated.map(m => (
                  <tr key={m.id}>
                    <td>
                      <button onClick={() => setDetailModal(m)} className="text-left group flex items-center gap-2.5"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <MemberAvatar member={m} size={34} style={{ flexShrink: 0 }} />
                        <div>
                          <div className="font-semibold text-sm group-hover:underline" style={{ color: 'var(--text-primary)', textDecorationColor: '#6B8FFF' }}>
                            {m.full_name}
                          </div>
                          {m.father_name && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>S/O {m.father_name}</div>}
                        </div>
                      </button>
                    </td>
                    <td><PhoneCell m={m} /></td>
                    <td><span className={m.gender === 'Male' ? 'badge-male' : 'badge-female'}>{m.gender}</span></td>
                    <td><span style={{ color: '#6B8FFF', fontWeight: 600, fontSize: '0.85rem' }}>{formatPKR(m.fee_amount)}</span></td>
                    <td><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(m.last_payment_date)}</span></td>
                    <td><span style={{ color: m.is_overdue ? '#FF3B5C' : 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(m.next_due_date)}</span></td>
                    <td><DaysLeft m={m} /></td>
                    <td><StatusBadge m={m} /></td>
                    <td>
                      <ActionButtons
                        m={m}
                        onView={() => setDetailModal(m)}
                        onFee={() => setFeeModal(m)}
                        onEdit={() => setEditModal(m)}
                        onDelete={() => deleteMember(m.id, m.full_name)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '0 1rem' }}>
              <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Cards (hidden on desktop) ───────────────── */}
      <div className="md:hidden">
        {loading && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Loading members...</div>
        )}
        {!loading && paginated.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>No members found.</div>
        )}
        <div className="space-y-3">
          {!loading && paginated.map(m => {
            const status = getStatus(m)
            return (
              <div key={m.id} className="gym-card p-4"
                style={{ borderLeft: `3px solid ${status === 'overdue' ? '#FF3B5C' : status === 'due_soon' ? '#FFA500' : '#39FF14'}` }}>

                {/* Name row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <button onClick={() => setDetailModal(m)} className="text-left flex items-center gap-2.5"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <MemberAvatar member={m} size={42} style={{ flexShrink: 0 }} />
                    <div>
                      <div className="font-semibold" style={{ fontSize: '0.975rem', color: 'var(--text-primary)' }}>{m.full_name}</div>
                      {m.father_name && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>S/O {m.father_name}</div>
                      )}
                    </div>
                  </button>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge m={m} />
                    <span className={m.gender === 'Male' ? 'badge-male' : 'badge-female'}>{m.gender}</span>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Fee/Month</span>
                    <div style={{ color: '#6B8FFF', fontWeight: 700, fontSize: '0.9rem' }}>{formatPKR(m.fee_amount)}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Days</span>
                    <div><DaysLeft m={m} /></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Last Paid</span>
                    <div>{formatDate(m.last_payment_date)}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Next Due</span>
                    <div style={{ color: m.is_overdue ? '#FF3B5C' : 'inherit' }}>{formatDate(m.next_due_date)}</div>
                  </div>
                </div>

                {/* Phone row */}
                {m.phone_number && (
                  <div className="mb-3 text-sm">
                    <PhoneCell m={m} />
                  </div>
                )}
                {m.email && !m.phone_number && (
                  <div className="mb-3">
                    <a href={`mailto:${m.email}`} style={{ color: '#6B8FFF', fontSize: '0.8rem' }}>{m.email}</a>
                  </div>
                )}

                {/* Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <ActionButtons
                    m={m}
                    onView={() => setDetailModal(m)}
                    onFee={() => setFeeModal(m)}
                    onEdit={() => setEditModal(m)}
                    onDelete={() => deleteMember(m.id, m.full_name)}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      {detailModal && (
        <MemberDetailModal
          member={detailModal}
          onClose={() => setDetailModal(null)}
          onFeeAdded={() => {
            setDetailModal(null)
            setFeeModal(detailModal)
          }}
        />
      )}
      {feeModal && (
        <AddFeeModal
          preselectedMember={feeModal.id ? feeModal : undefined}
          onClose={() => setFeeModal(null)}
          onSuccess={() => { setFeeModal(null); load() }}
        />
      )}
      {editModal && (
        <EditMemberModal
          member={editModal}
          onClose={() => setEditModal(null)}
          onSuccess={() => { setEditModal(null); load() }}
        />
      )}
    </div>
  )
}
