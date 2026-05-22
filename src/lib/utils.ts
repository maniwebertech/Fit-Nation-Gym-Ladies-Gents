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

export function getDaysRemaining(nextDueDate: string): number {
  return differenceInDays(parseISO(nextDueDate), new Date())
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
