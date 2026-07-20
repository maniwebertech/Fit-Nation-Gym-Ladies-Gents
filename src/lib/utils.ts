import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, addMonths, format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPKR(amount: number) {
  return `PKR ${amount.toLocaleString('en-PK')}`
}

export function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return format(parseISO(date), 'dd MMM yyyy')
}

export function getNextDueDate(lastPaymentDate: string | null, registrationDate: string): string {
  const base = lastPaymentDate ?? registrationDate
  return format(addMonths(parseISO(base), 1), 'yyyy-MM-dd')
}

// Returns current date as YYYY-MM-DD string in Pakistan Standard Time (UTC+5)
export function getPKTDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
}

export function getDaysRemaining(nextDueDate: string): number {
  return differenceInDays(parseISO(nextDueDate), parseISO(getPKTDateString()))
}

export type PeriodFilter = 'current_month' | 'last_month' | 'last_6_months' | 'last_year' | 'custom'

export function getPeriodDates(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string
): { start: string; end: string } {
  if (period === 'custom') {
    return { start: customStart || '', end: customEnd || '' }
  }

  const today = getPKTDateString()
  const [y, m] = today.split('-').map(Number)

  if (period === 'current_month') {
    const lastDay = new Date(y, m, 0).getDate()
    return {
      start: `${y}-${String(m).padStart(2, '0')}-01`,
      end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }
  if (period === 'last_month') {
    const d = new Date(y, m - 2, 1)
    const ly = d.getFullYear(), lm = d.getMonth() + 1
    const lastDay = new Date(ly, lm, 0).getDate()
    return {
      start: `${ly}-${String(lm).padStart(2, '0')}-01`,
      end: `${ly}-${String(lm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }
  if (period === 'last_6_months') {
    const d = new Date(y, m - 7, 1)
    const sy = d.getFullYear(), sm = d.getMonth() + 1
    return {
      start: `${sy}-${String(sm).padStart(2, '0')}-01`,
      end: today,
    }
  }
  // last_year: 12 months ago to today
  const d = new Date(y, m - 13, 1)
  const sy = d.getFullYear(), sm = d.getMonth() + 1
  return {
    start: `${sy}-${String(sm).padStart(2, '0')}-01`,
    end: today,
  }
}

// A payment is "advance" when its coverage month (payment_date) is later than the
// month the cash was actually collected (collected_on) — i.e. the member paid ahead.
// YYYY-MM string comparison is safe lexicographically.
export function isAdvancePayment(paymentDate: string, collectedOn: string): boolean {
  if (!paymentDate || !collectedOn) return false
  return paymentDate.slice(0, 7) > collectedOn.slice(0, 7)
}

// A member is currently "in advance" when their latest paid coverage month is beyond
// the current month (they have prepaid into a future month).
export function isMemberInAdvance(lastPaymentDate: string | null | undefined): boolean {
  if (!lastPaymentDate) return false
  return lastPaymentDate.slice(0, 7) > getPKTDateString().slice(0, 7)
}

export function buildWhatsAppUrl(countryCode: string, phoneNumber: string | null): string {
  if (!phoneNumber) return '#'
  const digits = countryCode.replace('+', '') + phoneNumber.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

export const COUNTRY_CODES = [
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+98', flag: '🇮🇷', name: 'Iran' },
  { code: '+93', flag: '🇦🇫', name: 'Afghanistan' },
]
