'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

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
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background.png"
          alt="Fit Nation Gym"
          fill
          style={{ objectFit: 'cover' }}
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-[#070B18]/75 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070B18]/40 via-transparent to-[#070B18]/60" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-[0_0_40px_rgba(27,63,204,0.6),0_0_80px_rgba(57,255,20,0.2)]">
            <Image src="/LOGO.jpg" alt="Fit Nation Gym" fill style={{ objectFit: 'cover' }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-green mb-1">FIT NATION GYM</h1>
          <p className="text-[var(--text-secondary)] text-sm tracking-widest uppercase">Ladies & Gents · Wazirabad</p>
        </div>

        {/* Card */}
        <div className="gym-card p-8" style={{ background: 'rgba(12,18,41,0.92)', backdropFilter: 'blur(16px)' }}>
          <h2 className="text-xl text-center mb-6" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani', letterSpacing: '0.1em' }}>
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
              <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(255,59,92,0.12)', border: '1px solid rgba(255,59,92,0.3)', color: '#FF3B5C' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center mt-2" style={{ padding: '0.75rem', fontSize: '1.05rem' }} disabled={loading}>
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

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          First Floor, Soneri Bank, Main GT Rd, Wazirabad · 0300 6213362
        </p>
      </div>
    </div>
  )
}
