'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPKR, formatDate, buildWhatsAppUrl } from '@/lib/utils'
import type { Member } from '@/types'
import AddFeeModal from '@/components/AddFeeModal'
import EditMemberModal from '@/components/EditMemberModal'
import Link from 'next/link'

type Filter = 'all' | 'overdue' | 'paid' | 'due_soon' | 'male' | 'female'

function getStatus(m: Member) {
  if (m.is_overdue) return 'overdue'
  if ((m.days_remaining ?? 999) <= 7) return 'due_soon'
  return 'paid'
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sortField, setSortField] = useState<string>('is_overdue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [feeModal, setFeeModal] = useState<Member | null>(null)
  const [editModal, setEditModal] = useState<Member | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('members_with_payment_status').select('*')
    setMembers(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.full_name.toLowerCase().includes(q) || m.phone_number.includes(q) || (m.father_name || '').toLowerCase().includes(q)
    const status = getStatus(m)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'overdue' ? m.is_overdue :
      filter === 'paid' ? status === 'paid' :
      filter === 'due_soon' ? status === 'due_soon' :
      filter === 'male' ? m.gender === 'Male' :
      filter === 'female' ? m.gender === 'Female' : true
    return matchSearch && matchFilter
  }).sort((a, b) => {
    let va: string | number = sortField === 'is_overdue' ? (a.is_overdue ? 1 : 0) : ((a[sortField as keyof Member] ?? '') as string | number)
    let vb: string | number = sortField === 'is_overdue' ? (b.is_overdue ? 1 : 0) : ((b[sortField as keyof Member] ?? '') as string | number)
    if (va === null || va === undefined) va = ''
    if (vb === null || vb === undefined) vb = ''
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'desc' ? -cmp : cmp
  })

  const filterCounts = {
    all: members.length,
    overdue: members.filter(m => m.is_overdue).length,
    due_soon: members.filter(m => getStatus(m) === 'due_soon').length,
    paid: members.filter(m => getStatus(m) === 'paid').length,
    male: members.filter(m => m.gender === 'Male').length,
    female: members.filter(m => m.gender === 'Female').length,
  }

  const filters: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#6B8FFF' },
    { key: 'overdue', label: 'Overdue', color: '#FF3B5C' },
    { key: 'due_soon', label: 'Due Soon', color: '#FFA500' },
    { key: 'paid', label: 'Paid', color: '#39FF14' },
    { key: 'male', label: 'Gents', color: '#6B8FFF' },
    { key: 'female', label: 'Ladies', color: '#FF64B4' },
  ]

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>↕</span>
    return <span style={{ color: '#6B8FFF', fontSize: 10 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`Delete member "${name}"? This will also delete all their fee records.`)) return
    await supabase.from('members').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-6 max-w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>MEMBERS</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{filtered.length} of {members.length} members</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setFeeModal({} as Member)} className="btn-green">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            ADD FEE
          </button>
          <Link href="/dashboard/register" className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            ADD MEMBER
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="gym-input" style={{ paddingLeft: '2.5rem' }} placeholder="Search by name or phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="text-xs px-3 py-2 rounded-lg border transition-all"
              style={{
                fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.05em',
                background: filter === f.key ? `rgba(${f.key === 'overdue' ? '255,59,92' : f.key === 'due_soon' ? '255,165,0' : f.key === 'female' ? '255,100,180' : '27,63,204'},0.18)` : 'transparent',
                borderColor: filter === f.key ? f.color : 'var(--border)',
                color: filter === f.key ? f.color : 'var(--text-muted)',
              }}>
              {f.label} ({filterCounts[f.key]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <table className="gym-table" style={{ minWidth: 1100 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { field: 'full_name', label: 'MEMBER' },
                { field: 'phone_number', label: 'PHONE' },
                { field: 'gender', label: 'GENDER' },
                { field: 'fee_amount', label: 'FEE/MO' },
                { field: 'last_payment_date', label: 'LAST PAID' },
                { field: 'last_payment_amount', label: 'LAST AMOUNT' },
                { field: 'next_due_date', label: 'NEXT DUE' },
                { field: 'days_remaining', label: 'DAYS LEFT' },
                { field: 'is_overdue', label: 'STATUS' },
                { field: '', label: 'ACTIONS' },
              ].map(col => (
                <th key={col.field} onClick={() => col.field && toggleSort(col.field)}
                  className={col.field ? 'cursor-pointer select-none' : ''}
                  style={{ paddingTop: 12, paddingBottom: 12, background: 'var(--bg-card2)' }}>
                  <span className="flex items-center gap-1">
                    {col.label} {col.field && <SortIcon field={col.field} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading members...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No members found.</td></tr>
            )}
            {!loading && filtered.map(m => {
              const status = getStatus(m)
              return (
                <tr key={m.id}>
                  <td>
                    <div className="font-semibold text-sm">{m.full_name}</div>
                    {m.father_name && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>S/O {m.father_name}</div>}
                    {m.address && <div className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.address}</div>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.phone_country_code} {m.phone_number}</span>
                      <a href={buildWhatsAppUrl(m.phone_country_code, m.phone_number)} target="_blank" rel="noopener noreferrer"
                        title="Open WhatsApp" className="shrink-0"
                        style={{ color: '#25D366' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                      {m.email && (
                        <a href={`mailto:${m.email}`} title={m.email} style={{ color: '#6B8FFF' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={m.gender === 'Male' ? 'badge-male' : 'badge-female'}>{m.gender}</span>
                  </td>
                  <td><span className="text-sm font-semibold" style={{ color: '#6B8FFF' }}>{formatPKR(m.fee_amount)}</span></td>
                  <td><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(m.last_payment_date)}</span></td>
                  <td><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.last_payment_amount ? formatPKR(m.last_payment_amount) : '—'}</span></td>
                  <td><span className="text-sm" style={{ color: m.is_overdue ? '#FF3B5C' : 'var(--text-secondary)' }}>{formatDate(m.next_due_date)}</span></td>
                  <td>
                    {m.days_remaining !== null && m.days_remaining !== undefined ? (
                      <span className="text-sm font-semibold" style={{ color: m.days_remaining < 0 ? '#FF3B5C' : m.days_remaining <= 7 ? '#FFA500' : '#39FF14' }}>
                        {m.days_remaining < 0 ? `${Math.abs(m.days_remaining)}d overdue` : `${m.days_remaining}d`}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className={status === 'overdue' ? 'badge-overdue' : status === 'due_soon' ? 'badge-due-soon' : 'badge-paid'}>
                      {status === 'overdue' ? 'OVERDUE' : status === 'due_soon' ? 'DUE SOON' : 'PAID'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setFeeModal(m)} title="Add Fee Payment"
                        className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(57,255,20,0.1)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.2)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                      </button>
                      <button onClick={() => setEditModal(m)} title="Edit Member"
                        className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(27,63,204,0.12)', color: '#6B8FFF', border: '1px solid rgba(27,63,204,0.2)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => deleteMember(m.id, m.full_name)} title="Delete Member"
                        className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(255,59,92,0.1)', color: '#FF3B5C', border: '1px solid rgba(255,59,92,0.2)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
