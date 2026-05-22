'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatPKR } from '@/lib/utils'
import AddFeeModal from '@/components/AddFeeModal'

interface Stats {
  total: number
  male: number
  female: number
  overdue: number
  paid_this_month: number
  revenue_this_month: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, male: 0, female: 0, overdue: 0, paid_this_month: 0, revenue_this_month: 0 })
  const [loading, setLoading] = useState(true)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [membersRes, paymentsRes] = await Promise.all([
        supabase.from('members_with_payment_status').select('*'),
        supabase.from('fee_payments').select('amount, payment_date').gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ])
      const members = membersRes.data || []
      const payments = paymentsRes.data || []
      setStats({
        total: members.length,
        male: members.filter(m => m.gender === 'Male').length,
        female: members.filter(m => m.gender === 'Female').length,
        overdue: members.filter(m => m.is_overdue).length,
        paid_this_month: payments.length,
        revenue_this_month: payments.reduce((s, p) => s + (p.amount || 0), 0)
      })
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Members', value: stats.total, icon: '👥', color: '#6B8FFF', bg: 'rgba(27,63,204,0.12)' },
    { label: 'Gents', value: stats.male, icon: '♂', color: '#6B8FFF', bg: 'rgba(27,63,204,0.08)' },
    { label: 'Ladies', value: stats.female, icon: '♀', color: '#FF64B4', bg: 'rgba(255,100,180,0.08)' },
    { label: 'Overdue', value: stats.overdue, icon: '⚠', color: '#FF3B5C', bg: 'rgba(255,59,92,0.10)' },
    { label: 'Paid This Month', value: stats.paid_this_month, icon: '✓', color: '#39FF14', bg: 'rgba(57,255,20,0.08)' },
    { label: 'Revenue This Month', value: formatPKR(stats.revenue_this_month), icon: '₨', color: '#39FF14', bg: 'rgba(57,255,20,0.08)', wide: true },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>
            DASHBOARD
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className={`gym-card p-5 ${card.wide ? 'lg:col-span-2' : ''}`}
            style={{ background: card.bg }}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani', color: card.color }}>
              {loading ? '—' : card.value}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="gym-card p-6">
          <h3 className="text-lg mb-4" style={{ fontFamily: 'Rajdhani', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>QUICK ACTIONS</h3>
          <div className="space-y-3">
            <button onClick={() => setShowFeeModal(true)} className="btn-green w-full justify-center">
              Record Fee Payment
            </button>
            <Link href="/dashboard/register" className="btn-primary w-full justify-center" style={{ display: 'flex' }}>
              Register New Member
            </Link>
            <Link href="/dashboard/members" className="btn-ghost w-full justify-center">
              View All Members
            </Link>
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

      {showFeeModal && <AddFeeModal onClose={() => setShowFeeModal(false)} onSuccess={() => { setShowFeeModal(false) }} />}
    </div>
  )
}
