const CACHE = 'fit-nation-v2'

// Only pre-cache truly static assets — NOT HTML routes (they require auth/redirect)
const SHELL = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // Use allSettled so a single 404 or auth-redirect never aborts SW install
      .then(cache =>
        Promise.allSettled(SHELL.map(url => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip: non-GET, non-http, Supabase API calls, Next.js internals, API routes
  if (
    request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/')
  ) return

  // Static assets (images, fonts, manifest): cache-first
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
      )
    )
    return
  }

  // Navigation (HTML pages): network-first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request) || caches.match('/login'))
    )
  }
})
