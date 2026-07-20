'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState('Hafiz Abdul Saboor')
  const [userRole, setUserRole] = useState('Manager / Instructor')
  const [pwaPrompt, setPwaPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [pwaInstalled, setPwaInstalled] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true)
      return
    }
    // Pick up prompt captured in head script, or listen for it
    const cached = (window as unknown as { __pwaPrompt?: BeforeInstallPromptEvent }).__pwaPrompt
    if (cached) { setPwaPrompt(cached); return }
    const handler = (e: Event) => {
      e.preventDefault()
      setPwaPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      if (meta?.full_name) setUserName(meta.full_name)
      if (meta?.role) setUserRole(meta.role)
    })
  }, [supabase])

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'DASHBOARD',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      href: '/dashboard/members',
      label: 'MEMBERS',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      href: '/dashboard/register',
      label: 'ADD MEMBER',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
      ),
    },
    {
      href: '/dashboard/reports',
      label: 'REPORTS',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          <line x1="3" y1="20" x2="21" y2="20"/>
        </svg>
      ),
    },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex flex-col items-center py-8 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3 shadow-[0_0_20px_rgba(27,63,204,0.5)]">
          <Image src="/LOGO.jpg" alt="Fit Nation" fill style={{ objectFit: 'cover' }} />
        </div>
        <h1 className="text-sm text-center leading-tight" style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--green-neon)', textShadow: '0 0 10px rgba(57,255,20,0.4)' }}>
          FIT NATION GYM
        </h1>
        <p className="text-xs text-center mt-0.5" style={{ color: 'var(--text-muted)' }}>Ladies &amp; Gents</p>
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
              }}>
              <span style={{ color: active ? 'var(--green-neon)' : 'inherit' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Theme toggle + Logout */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-xs mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{userName}</div>
          <div>{userRole}</div>
        </div>
        <div className="flex gap-2 mb-2">
          <button onClick={toggle} className="btn-ghost flex-1 justify-center" style={{ fontSize: '0.8rem' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
        {/* Install App button — shown when browser has the install prompt ready */}
        {!pwaInstalled && pwaPrompt && (
          <button
            onClick={async () => {
              await pwaPrompt.prompt()
              const { outcome } = await pwaPrompt.userChoice
              if (outcome === 'accepted') { setPwaPrompt(null); setPwaInstalled(true) }
            }}
            className="w-full flex items-center justify-center gap-2 mb-2 rounded-lg py-2 text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #1B3FCC, #2A52E8)', color: '#fff', fontFamily: 'Rajdhani', letterSpacing: '0.06em', border: 'none', cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            INSTALL APP
          </button>
        )}
        <button onClick={handleLogout} disabled={loggingOut} className="btn-ghost w-full justify-center" style={{ fontSize: '0.85rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-dark)' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — drawer on mobile, static on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col sidebar-drawer${mobileOpen ? ' is-open' : ''}`}
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Page content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 py-3 md:hidden"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setMobileOpen(true)} className="btn-ghost" style={{ padding: '0.4rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', color: 'var(--green-neon)' }}>FIT NATION GYM</span>
          <div className="flex items-center gap-1">
            {!pwaInstalled && pwaPrompt && (
              <button
                onClick={async () => {
                  await pwaPrompt.prompt()
                  const { outcome } = await pwaPrompt.userChoice
                  if (outcome === 'accepted') { setPwaPrompt(null); setPwaInstalled(true) }
                }}
                className="btn-ghost" style={{ padding: '0.4rem' }} title="Install App"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#39FF14" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            )}
            <button onClick={toggle} className="btn-ghost" style={{ padding: '0.4rem' }}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
