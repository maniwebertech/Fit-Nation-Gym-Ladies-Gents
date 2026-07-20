// Migration: add fee_payments.collected_on (actual date cash was received)
//
// payment_date stays as the COVERAGE month (which month the fee is for — drives
// next-due / overdue logic). collected_on is the day the money actually arrived,
// so period/collection reports stop counting advance fees in the wrong month.
//
// Backfill rule: collected_on = LEAST(payment_date, created_at::date)
//   - advance payment  (payment_date in the future)  -> cash arrived when entered (created_at)
//   - back-dated entry (payment_date in the past)     -> cash arrived in its coverage month
//   - normal same-day  (both equal)                   -> either
//
// Run: node scripts/add-collected-on.mjs
import postgres from 'postgres'

const sql = postgres({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.rpyhjeqnqizxhdybuolp',
  password: 'Fit@Nation247',
  database: 'postgres',
  ssl: 'require',
})

async function migrate() {
  console.log('Adding collected_on to fee_payments...')

  await sql`ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS collected_on DATE`
  console.log('✓ column added')

  const res = await sql`
    UPDATE fee_payments
    SET collected_on = LEAST(payment_date, (created_at AT TIME ZONE 'Asia/Karachi')::date)
    WHERE collected_on IS NULL
  `
  console.log(`✓ backfilled ${res.count} rows`)

  await sql`ALTER TABLE fee_payments ALTER COLUMN collected_on SET DEFAULT CURRENT_DATE`
  await sql`ALTER TABLE fee_payments ALTER COLUMN collected_on SET NOT NULL`
  console.log('✓ default = CURRENT_DATE, NOT NULL')

  await sql`CREATE INDEX IF NOT EXISTS fee_payments_collected_on_idx ON fee_payments (collected_on)`
  console.log('✓ index created')

  // Sanity check: 18-20 July counted both ways
  const [byCoverage] = await sql`
    SELECT count(*)::int AS n FROM fee_payments
    WHERE payment_date BETWEEN '2026-07-18' AND '2026-07-20'`
  const [byCash] = await sql`
    SELECT count(*)::int AS n FROM fee_payments
    WHERE collected_on BETWEEN '2026-07-18' AND '2026-07-20'`
  const [advJul] = await sql`
    SELECT count(*)::int AS n FROM fee_payments
    WHERE collected_on BETWEEN '2026-07-18' AND '2026-07-20'
      AND date_trunc('month', payment_date) > date_trunc('month', collected_on)`
  console.log(`\n18-20 July  by coverage(payment_date): ${byCoverage.n}`)
  console.log(`18-20 July  by cash(collected_on)    : ${byCash.n}  (advance in window: ${advJul.n})`)

  console.log('\n✅ Migration complete!')
  await sql.end()
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1) })
