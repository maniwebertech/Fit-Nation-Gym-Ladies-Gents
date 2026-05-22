-- ============================================================
-- Fit Nation Gym — Sample Data (100 members + fee payments)
-- Run in Supabase SQL Editor AFTER running db-setup.sql
-- Covers: Gents, Ladies, Overdue, Due Soon, Paid, No Phone
-- ============================================================

DO $$
DECLARE
  m_id UUID;
  pay_date DATE;
  i INT;
BEGIN

-- ─── GENTS — PAID (last payment ~2 weeks ago) ───────────────
FOR i IN 1..25 LOOP
  INSERT INTO members (full_name, father_name, phone_country_code, phone_number, gender, fee_amount, registration_date)
  VALUES (
    CASE i
      WHEN 1  THEN 'Muhammad Ali Khan'       WHEN 2  THEN 'Ahmad Hassan Shah'
      WHEN 3  THEN 'Usman Farooq'            WHEN 4  THEN 'Bilal Mahmood'
      WHEN 5  THEN 'Zafar Iqbal'             WHEN 6  THEN 'Tariq Mehmood'
      WHEN 7  THEN 'Kamran Akbar'            WHEN 8  THEN 'Shahid Nawaz'
      WHEN 9  THEN 'Imran Butt'              WHEN 10 THEN 'Asad Raza'
      WHEN 11 THEN 'Waqas Javed'             WHEN 12 THEN 'Naveed Akhtar'
      WHEN 13 THEN 'Sajid Hussain'           WHEN 14 THEN 'Faisal Chaudhry'
      WHEN 15 THEN 'Danish Anwar'            WHEN 16 THEN 'Khurram Shahzad'
      WHEN 17 THEN 'Adeel Aslam'             WHEN 18 THEN 'Rizwan Malik'
      WHEN 19 THEN 'Junaid Bashir'           WHEN 20 THEN 'Hamza Rauf'
      WHEN 21 THEN 'Sohail Tanveer'          WHEN 22 THEN 'Amir Shehzad'
      WHEN 23 THEN 'Umar Farhan'             WHEN 24 THEN 'Noman Qadir'
      ELSE 'Waseem Abbas'
    END,
    'Abdul Rehman',
    '+92',
    '30' || LPAD((i * 7919 + 10000000)::TEXT, 8, '0'),
    'Male',
    CASE WHEN i % 3 = 0 THEN 3500 WHEN i % 3 = 1 THEN 3000 ELSE 4000 END,
    CURRENT_DATE - INTERVAL '6 months'
  )
  RETURNING id INTO m_id;
  -- Paid 2 weeks ago → next due in ~2 weeks → PAID status
  INSERT INTO fee_payments (member_id, amount, payment_date)
  VALUES (m_id, CASE WHEN i % 3 = 0 THEN 3500 WHEN i % 3 = 1 THEN 3000 ELSE 4000 END,
          CURRENT_DATE - INTERVAL '14 days');
END LOOP;

-- ─── LADIES — PAID ──────────────────────────────────────────
FOR i IN 1..20 LOOP
  INSERT INTO members (full_name, father_name, phone_country_code, phone_number, gender, fee_amount, registration_date)
  VALUES (
    CASE i
      WHEN 1  THEN 'Ayesha Siddiqui'         WHEN 2  THEN 'Fatima Malik'
      WHEN 3  THEN 'Sana Rehman'             WHEN 4  THEN 'Nadia Bashir'
      WHEN 5  THEN 'Hira Ijaz'              WHEN 6  THEN 'Sara Ahmed'
      WHEN 7  THEN 'Maryam Khalid'           WHEN 8  THEN 'Zainab Hassan'
      WHEN 9  THEN 'Iqra Nawaz'              WHEN 10 THEN 'Amna Tariq'
      WHEN 11 THEN 'Rabia Farooq'            WHEN 12 THEN 'Sobia Aslam'
      WHEN 13 THEN 'Kiran Shahzad'           WHEN 14 THEN 'Rukhsana Bibi'
      WHEN 15 THEN 'Mehwish Akhtar'          WHEN 16 THEN 'Uzma Javed'
      WHEN 17 THEN 'Noor Zafar'             WHEN 18 THEN 'Shaista Butt'
      WHEN 19 THEN 'Tahira Raza'             ELSE 'Fariha Anwar'
    END,
    'Muhammad Saleem',
    '+92',
    '31' || LPAD((i * 6271 + 10000000)::TEXT, 8, '0'),
    'Female',
    CASE WHEN i % 2 = 0 THEN 3000 ELSE 2500 END,
    CURRENT_DATE - INTERVAL '4 months'
  )
  RETURNING id INTO m_id;
  INSERT INTO fee_payments (member_id, amount, payment_date)
  VALUES (m_id, CASE WHEN i % 2 = 0 THEN 3000 ELSE 2500 END,
          CURRENT_DATE - INTERVAL '10 days');
END LOOP;

-- ─── GENTS — OVERDUE (no payment for > 1 month) ─────────────
FOR i IN 1..15 LOOP
  INSERT INTO members (full_name, father_name, phone_country_code, phone_number, gender, fee_amount, registration_date)
  VALUES (
    CASE i
      WHEN 1  THEN 'Khalid Mahmood'          WHEN 2  THEN 'Arshad Mehmood'
      WHEN 3  THEN 'Pervaiz Ahmed'           WHEN 4  THEN 'Ghulam Mustafa'
      WHEN 5  THEN 'Shafiq ur Rehman'        WHEN 6  THEN 'Bashir Ahmad'
      WHEN 7  THEN 'Liaqat Ali'              WHEN 8  THEN 'Manzoor Hussain'
      WHEN 9  THEN 'Iftikhar Haider'         WHEN 10 THEN 'Zulfiqar Ali'
      WHEN 11 THEN 'Qaiser Malik'            WHEN 12 THEN 'Sarfraz Ahmed'
      WHEN 13 THEN 'Tanveer Alam'            WHEN 14 THEN 'Mukhtar Ahmad'
      ELSE 'Shakeel Baig'
    END,
    'Haji Muhammad',
    '+92',
    '32' || LPAD((i * 5381 + 10000000)::TEXT, 8, '0'),
    'Male',
    3000,
    CURRENT_DATE - INTERVAL '8 months'
  )
  RETURNING id INTO m_id;
  -- Last paid 45 days ago → overdue
  INSERT INTO fee_payments (member_id, amount, payment_date)
  VALUES (m_id, 3000, CURRENT_DATE - INTERVAL '45 days');
END LOOP;

-- ─── LADIES — OVERDUE ───────────────────────────────────────
FOR i IN 1..10 LOOP
  INSERT INTO members (full_name, father_name, phone_country_code, phone_number, gender, fee_amount, registration_date)
  VALUES (
    CASE i
      WHEN 1 THEN 'Parveen Akhtar'   WHEN 2 THEN 'Naseem Bano'
      WHEN 3 THEN 'Shamim Ara'       WHEN 4 THEN 'Fareeda Hussain'
      WHEN 5 THEN 'Bilquis Begum'    WHEN 6 THEN 'Sughra Bibi'
      WHEN 7 THEN 'Zubaida Khatoon'  WHEN 8 THEN 'Hajra Bibi'
      WHEN 9 THEN 'Razia Sultana'    ELSE 'Azra Parveen'
    END,
    'Ghulam Hussain',
    '+92',
    '33' || LPAD((i * 4793 + 10000000)::TEXT, 8, '0'),
    'Female',
    2500,
    CURRENT_DATE - INTERVAL '5 months'
  )
  RETURNING id INTO m_id;
  INSERT INTO fee_payments (member_id, amount, payment_date)
  VALUES (m_id, 2500, CURRENT_DATE - INTERVAL '40 days');
END LOOP;

-- ─── DUE SOON (3–7 days left) ───────────────────────────────
FOR i IN 1..10 LOOP
  INSERT INTO members (full_name, father_name, phone_country_code, phone_number, gender, fee_amount, registration_date)
  VALUES (
    CASE i
      WHEN 1 THEN 'Fahad Mirza'        WHEN 2 THEN 'Saad Qureshi'
      WHEN 3 THEN 'Yasir Shah'         WHEN 4 THEN 'Hassan Rauf'
      WHEN 5 THEN 'Aliya Mustafa'      WHEN 6 THEN 'Sadia Latif'
      WHEN 7 THEN 'Lubna Ghaffar'      WHEN 8 THEN 'Nadia Sattar'
      WHEN 9 THEN 'Rehan Chaudhry'     ELSE 'Zohaib Rana'
    END,
    'Rana Muhammad',
    '+92',
    '34' || LPAD((i * 3571 + 10000000)::TEXT, 8, '0'),
    CASE WHEN i > 4 THEN 'Female' ELSE 'Male' END,
    3000,
    CURRENT_DATE - INTERVAL '3 months'
  )
  RETURNING id INTO m_id;
  -- Paid 24–26 days ago → 4–6 days remaining → DUE SOON
  INSERT INTO fee_payments (member_id, amount, payment_date)
  VALUES (m_id, 3000, CURRENT_DATE - INTERVAL '25 days');
END LOOP;

-- ─── NO PHONE (old members, no contact info) ────────────────
FOR i IN 1..10 LOOP
  INSERT INTO members (full_name, father_name, phone_country_code, phone_number, gender, fee_amount, registration_date)
  VALUES (
    CASE i
      WHEN 1 THEN 'Haji Barkat Ali'    WHEN 2 THEN 'Chaudhry Fazal Din'
      WHEN 3 THEN 'Rana Gul Hassan'    WHEN 4 THEN 'Malik Sher Ahmed'
      WHEN 5 THEN 'Mistri Aslam'       WHEN 6 THEN 'Bibi Zuhra'
      WHEN 7 THEN 'Amma Sakina'        WHEN 8 THEN 'Phupho Zeenat'
      WHEN 9 THEN 'Dada Abdul Sattar'  ELSE 'Nana Rehmat Ali'
    END,
    'Old Member',
    '+92',
    NULL,  -- no phone
    CASE WHEN i > 5 THEN 'Female' ELSE 'Male' END,
    1500,
    CURRENT_DATE - INTERVAL '2 years'
  )
  RETURNING id INTO m_id;
  -- Some have payments, some don't
  IF i % 2 = 0 THEN
    INSERT INTO fee_payments (member_id, amount, payment_date)
    VALUES (m_id, 1500, CURRENT_DATE - INTERVAL '20 days');
  END IF;
END LOOP;

-- ─── Add multiple historical payments to first 5 Gents ───────
-- (to test the fee history pagination)
FOR i IN 1..5 LOOP
  SELECT id INTO m_id FROM members WHERE gender = 'Male' AND phone_number IS NOT NULL ORDER BY created_at LIMIT 1 OFFSET (i - 1);
  FOR pay_date IN
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '24 months',
      CURRENT_DATE - INTERVAL '1 month',
      INTERVAL '1 month'
    )::DATE
  LOOP
    INSERT INTO fee_payments (member_id, amount, payment_date, notes)
    VALUES (m_id, 3000, pay_date, 'Monthly fee')
    ON CONFLICT DO NOTHING;
  END LOOP;
END LOOP;

END $$;
