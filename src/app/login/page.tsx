'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggle } = useTheme()

  const isDark = theme === 'dark'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">

      {/* Background image + theme-aware overlay */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background.png"
          alt="Fit Nation Gym"
          fill
          style={{ objectFit: 'cover' }}
          quality={90}
          priority
        />
        {/* Primary overlay — dark/light tint */}
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{ background: isDark ? 'rgba(7,11,24,0.78)' : 'rgba(238,240,250,0.82)', backdropFilter: 'blur(2px)' }}
        />
        {/* Gradient vignette */}
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom, rgba(7,11,24,0.4) 0%, transparent 40%, rgba(7,11,24,0.55) 100%)'
              : 'linear-gradient(to bottom, rgba(238,240,250,0.3) 0%, transparent 40%, rgba(238,240,250,0.4) 100%)',
          }}
        />
      </div>

      {/* Theme toggle — top right */}
      <button
        onClick={toggle}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
        style={{
          background: isDark ? 'rgba(12,18,41,0.85)' : 'rgba(255,255,255,0.88)',
          border: '1px solid var(--border)',
          color: isDark ? 'var(--green-neon)' : 'var(--blue-royal)',
          backdropFilter: 'blur(8px)',
          fontSize: '0.8rem',
          fontFamily: 'Rajdhani',
          fontWeight: 600,
          letterSpacing: '0.05em',
          boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(27,63,204,0.12)',
        }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      </button>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md animate-fade-slide-up">

        {/* Logo */}
        <div className="flex justify-center mb-7">
          <div
            className="relative w-28 h-28 rounded-full overflow-hidden transition-shadow duration-300"
            style={{
              boxShadow: isDark
                ? '0 0 40px rgba(27,63,204,0.6), 0 0 80px rgba(57,255,20,0.2)'
                : '0 0 30px rgba(27,63,204,0.3), 0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <Image src="/LOGO.jpg" alt="Fit Nation Gym" fill style={{ objectFit: 'cover' }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-7">
          <h1 className="text-4xl font-bold neon-green mb-1">FIT NATION GYM</h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
            Ladies &amp; Gents · Wazirabad
          </p>
        </div>

        {/* Form card */}
        <div
          className="gym-card p-8 transition-all duration-300"
          style={{
            background: isDark ? 'rgba(12,18,41,0.92)' : 'rgba(255,255,255,0.93)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(27,63,204,0.3)' : 'rgba(27,63,204,0.15)',
            boxShadow: isDark
              ? '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 8px 40px rgba(27,63,204,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <h2
            className="text-xl text-center mb-6"
            style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani', letterSpacing: '0.1em' }}
          >
            MANAGEMENT LOGIN
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                className="gym-input"
                placeholder="admin@fitnationgym.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani' }}>
                PASSWORD
              </label>
              <input
                type="password"
                className="gym-input"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="rounded-lg p-3 text-sm"
                style={{ background: 'rgba(255,59,92,0.12)', border: '1px solid rgba(255,59,92,0.3)', color: '#FF3B5C' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2"
              style={{ padding: '0.75rem', fontSize: '1.05rem' }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Logging in...
                </span>
              ) : 'LOGIN'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(10,15,40,0.45)' }}>
          First Floor, Soneri Bank, Main GT Rd, Wazirabad · 0300 6213362
        </p>
      </div>
    </div>
  )
}
