export interface Member {
  id: string
  full_name: string
  father_name: string | null
  phone_country_code: string
  phone_number: string | null
  email: string | null
  address: string | null
  gender: 'Male' | 'Female'
  fee_amount: number
  registration_date: string
  profile_image_url?: string | null
  created_at: string
  updated_at: string
  last_payment_date?: string | null
  last_payment_amount?: number | null
  next_due_date?: string | null
  days_remaining?: number | null
  is_overdue?: boolean
  last_activity?: string | null
}

export interface FeePayment {
  id: string
  member_id: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
  member?: Member
}

export interface DashboardStats {
  total_members: number
  male_members: number
  female_members: number
  overdue_members: number
  paid_this_month: number
  total_revenue_this_month: number
}
