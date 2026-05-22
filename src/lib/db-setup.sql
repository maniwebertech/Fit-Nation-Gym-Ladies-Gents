-- ============================================================
-- Fit Nation Gym — Full Database Setup
-- Run this in Supabase SQL Editor (fresh install)
-- ============================================================

-- Members table (phone_number is optional — allows adding old members without phone)
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  father_name TEXT,
  phone_country_code TEXT NOT NULL DEFAULT '+92',
  phone_number TEXT,                              -- nullable: old members may not have a phone
  email TEXT,
  address TEXT,
  gender TEXT NOT NULL DEFAULT 'Male' CHECK (gender IN ('Male', 'Female')),
  fee_amount INTEGER NOT NULL DEFAULT 3000 CHECK (fee_amount >= 1500 AND fee_amount <= 5000),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: only enforce uniqueness when phone_number is actually provided
CREATE UNIQUE INDEX IF NOT EXISTS members_phone_unique
  ON members (phone_country_code, phone_number)
  WHERE phone_number IS NOT NULL AND phone_number <> '';

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "authenticated_full_access_members" ON members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access_fee_payments" ON fee_payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- View: members with last payment info and payment status
CREATE OR REPLACE VIEW members_with_payment_status AS
SELECT
  m.*,
  fp.payment_date AS last_payment_date,
  fp.amount AS last_payment_amount,
  (fp.payment_date + INTERVAL '1 month')::DATE AS next_due_date,
  EXTRACT(DAY FROM (fp.payment_date + INTERVAL '1 month') - CURRENT_DATE)::INTEGER AS days_remaining,
  CASE
    WHEN fp.payment_date IS NULL THEN TRUE
    WHEN (fp.payment_date + INTERVAL '1 month')::DATE < CURRENT_DATE THEN TRUE
    ELSE FALSE
  END AS is_overdue
FROM members m
LEFT JOIN LATERAL (
  SELECT payment_date, amount
  FROM fee_payments
  WHERE member_id = m.id
  ORDER BY payment_date DESC
  LIMIT 1
) fp ON true;

GRANT SELECT ON members_with_payment_status TO authenticated;

-- ============================================================
-- MIGRATION: make phone optional (skip if fresh install)
-- ============================================================
-- ALTER TABLE members ALTER COLUMN phone_number DROP NOT NULL;
-- ALTER TABLE members DROP CONSTRAINT IF EXISTS members_phone_country_code_phone_number_key;
-- CREATE UNIQUE INDEX IF NOT EXISTS members_phone_unique
--   ON members (phone_country_code, phone_number)
--   WHERE phone_number IS NOT NULL AND phone_number <> '';

-- ============================================================
-- MIGRATION: add receipt image support
-- Run this in Supabase SQL Editor if the table already exists
-- ============================================================
-- Step 1: Add receipt_url column
-- ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;
--
-- Step 2: Create receipts storage bucket (run in SQL Editor)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('receipts', 'receipts', true, 5242880,
--   ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
-- ON CONFLICT (id) DO NOTHING;
--
-- Step 3: Storage RLS policies
-- CREATE POLICY "auth_upload_receipts" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
-- CREATE POLICY "auth_read_receipts" ON storage.objects
--   FOR SELECT TO authenticated USING (bucket_id = 'receipts');
-- CREATE POLICY "auth_delete_receipts" ON storage.objects
--   FOR DELETE TO authenticated USING (bucket_id = 'receipts');
