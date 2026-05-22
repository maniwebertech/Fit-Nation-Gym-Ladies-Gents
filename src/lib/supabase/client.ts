import { createBrowserClient } from '@supabase/ssr'

// Fallbacks prevent build-time prerender errors when env vars aren't injected yet.
// At runtime on the browser, the real values are always present.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rpyhjeqnqizxhdybuolp.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweWhqZXFucWl6eGhkeWJ1b2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzY1MTAsImV4cCI6MjA5NTAxMjUxMH0._d7Nm1u_ARQ-miehnNIMU_EkUBj2ukt7aDGwIhbkPKw'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
