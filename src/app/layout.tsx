import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fit Nation Gym — Member Management',
  description: 'Fee & member management for Fit Nation Gym Ladies & Gents, Wazirabad',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
