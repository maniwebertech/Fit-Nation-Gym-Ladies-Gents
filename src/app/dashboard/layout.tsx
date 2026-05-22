'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'DASHBOARD', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )},
    { href: '/dashboard/members', label: 'MEMBERS', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )},
    { href: '/dashboard/register', label: 'ADD MEMBER', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    )},
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="flex flex-col items-center py-8 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3 shadow-[0_0_20px_rgba(27,63,204,0.5)]">
            <Image src="/LOGO.jpg" alt="Fit Nation" fill style={{ objectFit: 'cover' }} />
          </div>
          <h1 className="text-sm text-center leading-tight" style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--green-neon)', textShadow: '0 0 10px rgba(57,255,20,0.4)' }}>
            FIT NATION GYM
          </h1>
          <p className="text-xs text-center mt-0.5" style={{ color: 'var(--text-muted)' }}>Ladies & Gents</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all"
                style={{
                  fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.06em',
                  background: active ? 'linear-gradient(135deg, rgba(27,63,204,0.25), rgba(42,82,232,0.15))' : 'transparent',
                  color: active ? '#6B8FFF' : 'var(--text-secondary)',
                  borderLeft: active ? '3px solid var(--blue-royal)' : '3px solid transparent',
                }}
              >
                <span style={{ color: active ? 'var(--green-neon)' : 'inherit' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-xs mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Hafiz Abdul Saboor</div>
            <div>Manager / Instructor</div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="btn-ghost w-full justify-center" style={{ fontSize: '0.85rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
