'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [iosShow, setIosShow] = useState(false)

  useEffect(() => {
    // Already dismissed?
    if (localStorage.getItem('pwa-dismissed')) return

    // Check iOS Safari (no beforeinstallprompt — needs manual share sheet)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as { standalone?: boolean }).standalone
    if (ios) {
      setIsIOS(true)
      setIosShow(true)
      return
    }

    // Chrome / Edge / Firefox Android — listen for browser prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setShow(false)
    setIosShow(false)
  }

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
      setPrompt(null)
    }
  }

  // iOS instructions banner
  if (isIOS && iosShow) {
    return (
      <div className="fixed bottom-4 left-3 right-3 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-slide-up">
        <div className="gym-card p-4" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45)', border: '1px solid rgba(27,63,204,0.35)' }}>
          <div className="flex items-start gap-3">
            <img src="/icons/icon-192.png" alt="" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm mb-0.5" style={{ fontFamily: 'Rajdhani', letterSpacing: '0.05em', color: 'var(--green-neon)' }}>
                INSTALL FIT NATION
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Tap{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#6B8FFF', fontWeight: 600 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share
                </span>{' '}
                then <strong>Add to Home Screen</strong>
              </div>
            </div>
            <button onClick={dismiss} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Chrome/Edge/Android — native prompt trigger
  if (!show) return null

  return (
    <div className="fixed bottom-4 left-3 right-3 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-slide-up">
      <div className="gym-card p-4" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45)', border: '1px solid rgba(27,63,204,0.35)' }}>
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm" style={{ fontFamily: 'Rajdhani', letterSpacing: '0.05em', color: 'var(--green-neon)' }}>
              INSTALL FIT NATION
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Add to home screen for quick access
            </div>
          </div>
          <button onClick={dismiss} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, alignSelf: 'flex-start', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={dismiss} className="btn-ghost flex-1 justify-center" style={{ fontSize: '0.82rem', padding: '0.4rem' }}>
            Not now
          </button>
          <button onClick={handleInstall} className="btn-green flex-1 justify-center" style={{ fontSize: '0.82rem', padding: '0.4rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Install App
          </button>
        </div>
      </div>
    </div>
  )
}
