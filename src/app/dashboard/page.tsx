'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatPKR, getPeriodDates, type PeriodFilter } from '@/lib/utils'
import AddFeeModal from '@/components/AddFeeModal'

interface GlobalStats { total: number; male: number; female: number }
interface FilteredStats { overdue: number; paid: number; revenue: number; due_soon: number }

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'current_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom' },
]

export default function DashboardPage() {
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ total: 0, male: 0, female: 0 })
  const [filteredStats, setFilteredStats] = useState<FilteredStats>({ overdue: 0, paid: 0, revenue: 0, due_soon: 0 })
  const [period, setPeriod] = useState<PeriodFilter>('current_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [globalLoading, setGlobalLoading] = useState(true)
  const [filteredLoading, setFilteredLoading] = useState(true)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label ?? ''

  // Global stats — total/gents/ladies never change with period filter
  useEffect(() => {
    const supabase = createClient()
    supabase.from('members').select('gender').then(({ data }) => {
      const members = (data || []) as Array<{ gender: string }>
      setGlobalStats({
        total: members.length,
        male: members.filter(m => m.gender === 'Male').length,
        female: members.filter(m => m.gender === 'Female').length,
      })
      setGlobalLoading(false)
    })
  }, [refreshKey])

  // Filtered stats — reload when period, custom dates, or refreshKey changes
  useEffect(() => {
    if (period === 'custom' && (!customStart || !customEnd)) {
      setFilteredLoading(false)
      return
    }
    const { start, end } = getPeriodDates(period, customStart, customEnd)
    if (!start || !end) { setFilteredLoading(false); return }

    let cancelled = false
    setFilteredLoading(true)
    const supabase = createClient()

    Promise.all([
      supabase.from('members_with_payment_status').select('is_overdue, days_remaining'),
      supabase.from('fee_payments').select('amount').gte('payment_date', start).lte('payment_date', end),
    ]).then(([membersRes, paymentsRes]) => {
      if (cancelled) return
      const members = (membersRes.data || []) as Array<{ is_overdue: boolean; days_remaining: number | null }>
      const payments = (paymentsRes.data || []) as Array<{ amount: number }>
      setFilteredStats({
        overdue: members.filter(m => m.is_overdue).length,
        paid: payments.length,
        revenue: payments.reduce((s, p) => s + (p.amount || 0), 0),
        due_soon: members.filter(m => m.days_remaining !== null && m.days_remaining >= 0 && m.days_remaining <= 7).length,
      })
      setFilteredLoading(false)
    })
    return () => { cancelled = true }
  }, [period, customStart, customEnd, refreshKey])

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>DASHBOARD</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Karachi' })}
            </p>
          </div>
          <div className="hidden md:flex gap-3 shrink-0">
            <button onClick={() => setShowFeeModal(true)} className="btn-green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              ADD FEE
            </button>
            <Link href="/dashboard/register" className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              ADD MEMBER
            </Link>
          </div>
        </div>
        <div className="flex gap-3 md:hidden">
          <button onClick={() => setShowFeeModal(true)} className="btn-green flex-1 justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            ADD FEE
          </button>
          <Link href="/dashboard/register" className="btn-primary flex-1 justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            ADD MEMBER
          </Link>
        </div>
      </div>

      {/* ── Global Stats — always overall count, no filter ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {([
          { label: 'Total Members', value: globalStats.total, icon: '👥', color: '#6B8FFF', bg: 'rgba(27,63,204,0.12)' },
          { label: 'Gents', value: globalStats.male, icon: '♂', color: '#6B8FFF', bg: 'rgba(27,63,204,0.08)' },
          { label: 'Ladies', value: globalStats.female, icon: '♀', color: '#FF64B4', bg: 'rgba(255,100,180,0.08)' },
        ] as const).map(card => (
          <div key={card.label} className="gym-card p-5" style={{ background: card.bg }}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani', color: card.color }}>
              {globalLoading ? '—' : card.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Period Filter ── */}
      <div className="gym-card p-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: 'Rajdhani',
                letterSpacing: '0.06em',
                background: period === opt.value ? 'rgba(27,63,204,0.35)' : 'transparent',
                color: period === opt.value ? '#8FA3FF' : 'var(--text-muted)',
                border: period === opt.value ? '1px solid rgba(27,63,204,0.6)' : '1px solid var(--border)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>FROM</span>
              <input
                type="date"
                className="gym-input"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>TO</span>
              <input
                type="date"
                className="gym-input"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Filtered Stats — change with period ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {([
          { label: 'Overdue', sub: 'Currently', value: filteredStats.overdue, icon: '⚠', color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)' },
          { label: 'Paid', sub: periodLabel, value: filteredStats.paid, icon: '✓', color: '#39FF14', bg: 'rgba(57,255,20,0.08)' },
          { label: 'Revenue', sub: periodLabel, value: formatPKR(filteredStats.revenue), icon: '₨', color: '#39FF14', bg: 'rgba(57,255,20,0.08)' },
          { label: 'Due Soon', sub: 'Next 7 days', value: filteredStats.due_soon, icon: '🔔', color: '#FFB800', bg: 'rgba(255,184,0,0.10)' },
        ] as const).map(card => (
          <div key={card.label} className="gym-card p-5" style={{ background: card.bg }}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani', color: card.color }}>
              {filteredLoading ? '—' : card.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              {card.label}
              <span className="ml-1" style={{ opacity: 0.65 }}>· {card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Gym Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gym-card p-6">
          <h3 className="text-lg mb-4" style={{ fontFamily: 'Rajdhani', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>QUICK ACTIONS</h3>
          <div className="space-y-3">
            <button onClick={() => setShowFeeModal(true)} className="btn-green w-full justify-center">Record Fee Payment</button>
            <Link href="/dashboard/register" className="btn-primary w-full justify-center" style={{ display: 'flex' }}>Register New Member</Link>
            <Link href="/dashboard/members" className="btn-ghost w-full justify-center">View All Members</Link>
          </div>
        </div>
        <div className="gym-card p-6">
          <h3 className="text-lg mb-4" style={{ fontFamily: 'Rajdhani', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>GYM INFO</h3>
          <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" style={{ color: '#6B8FFF' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              First Floor, Soneri Bank, Main GT Rd, Wazirabad
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#39FF14' }}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.06 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              0300 6213362
            </div>
          </div>
        </div>
      </div>

      {showFeeModal && (
        <AddFeeModal
          onClose={() => setShowFeeModal(false)}
          onSuccess={() => { setShowFeeModal(false); setRefreshKey(k => k + 1) }}
        />
      )}
    </div>
  )
}
