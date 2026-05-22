import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

const APP_URL = 'https://fit-nation-gym.vercel.app'
const OG_IMAGE = `${APP_URL}/icons/og-image.png`

export const metadata: Metadata = {
  title: 'Fit Nation Gym — Member Management',
  description: 'Official member & fee management system for Fit Nation Gym Ladies & Gents, Main GT Road, Wazirabad.',
  manifest: '/manifest.json',

  // Open Graph (Facebook, WhatsApp, LinkedIn, etc.)
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'Fit Nation Gym',
    title: 'Fit Nation Gym — Ladies & Gents',
    description: 'Member & fee management for Fit Nation Gym, First Floor Soneri Bank, Main GT Rd, Wazirabad. Call: 0300 6213362',
    images: [
      {
        url: OG_IMAGE,
        width: 1024,
        height: 1024,
        alt: 'Fit Nation Gym — Ladies & Gents, Wazirabad',
      },
    ],
    locale: 'en_PK',
  },

  // Twitter / X card
  twitter: {
    card: 'summary_large_image',
    title: 'Fit Nation Gym — Ladies & Gents',
    description: 'Member & fee management — First Floor Soneri Bank, Main GT Rd, Wazirabad. Call: 0300 6213362',
    images: [OG_IMAGE],
  },

  // Favicon + app icons
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/favicon-32.png',
  },

  // PWA / Apple
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fit Nation',
  },

  // Additional meta
  keywords: ['gym', 'fitness', 'Wazirabad', 'Fit Nation', 'ladies gym', 'gents gym', 'fee management'],
  robots: 'noindex, nofollow', // internal tool — keep it off search engines
}

export const viewport: Viewport = {
  themeColor: '#1B3FCC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set data-theme before React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('fit-nation-theme')||(window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);})()` }} />
        {/* Windows tile */}
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <meta name="msapplication-TileColor" content="#1B3FCC" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
