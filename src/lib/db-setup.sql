-- Run this in Supabase SQL editor to set up the database

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  father_name TEXT,
  phone_country_code TEXT NOT NULL DEFAULT '+92',
  phone_number TEXT NOT NULL,
  email TEXT,
  address TEXT,
  gender TEXT NOT NULL DEFAULT 'Male' CHECK (gender IN ('Male', 'Female')),
  fee_amount INTEGER NOT NULL DEFAULT 3000 CHECK (fee_amount >= 1500 AND fee_amount <= 5000),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_country_code, phone_number)
);

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "authenticated_full_access_members" ON members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access_fee_payments" ON fee_payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: members with last payment info
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

-- Grant view access
GRANT SELECT ON members_with_payment_status TO authenticated;
