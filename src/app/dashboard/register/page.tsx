'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { COUNTRY_CODES } from '@/lib/utils'
import { format } from 'date-fns'
import ProfileImageUpload from '@/components/ProfileImageUpload'

export default function RegisterPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    full_name: '', father_name: '', phone_country_code: '+92', phone_number: '',
    email: '', address: '', gender: 'Male', fee_amount: 3000,
    registration_date: today,
  })
  const [profileBlob, setProfileBlob] = useState<Blob | null>(null)
  const [recordPayment, setRecordPayment] = useState(true)
  const [paymentAmount, setPaymentAmount] = useState(3000)
  const [paymentDate, setPaymentDate] = useState(today)
  const [paymentNotes, setPaymentNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
    if (field === 'fee_amount') setPaymentAmount(value as number)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    if (recordPayment && (!paymentAmount || paymentAmount < 1)) {
      setError('Payment amount must be greater than 0.'); return
    }
    setLoading(true)

    // 1. Insert member
    const { data: newMember, error: memberErr } = await supabase
      .from('members')
      .insert({
        full_name: form.full_name.trim(),
        father_name: form.father_name.trim() || null,
        phone_country_code: form.phone_country_code,
        phone_number: form.phone_number.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        gender: form.gender,
        fee_amount: Number(form.fee_amount),
        registration_date: form.registration_date,
      })
      .select('id')
      .single()

    if (memberErr) {
      if (memberErr.code === '23505') setError('A member with this phone number already exists.')
      else setError(memberErr.message)
      setLoading(false)
      return
    }

    // 2. Upload profile photo if selected
    if (profileBlob && newMember) {
      const path = `${newMember.id}/profile.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('member-photos')
        .upload(path, profileBlob, { contentType: 'image/jpeg', upsert: true })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('member-photos').getPublicUrl(path)
        await supabase.from('members').update({ profile_image_url: publicUrl }).eq('id', newMember.id)
      }
    }

    // 3. Insert first fee payment if opted in
    if (recordPayment && newMember) {
      const { error: feeErr } = await supabase.from('fee_payments').insert({
        member_id: newMember.id,
        amount: Number(paymentAmount),
        payment_date: paymentDate,
        collected_on: paymentDate,   // first fee is collected at registration
        notes: paymentNotes.trim() || null,
      })
      if (feeErr) {
        setError(`Member registered but fee payment failed: ${feeErr.message}`)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  function reset() {
    setSuccess(false)
    setForm({ full_name: '', father_name: '', phone_country_code: '+92', phone_number: '', email: '', address: '', gender: 'Male', fee_amount: 3000, registration_date: today })
    setProfileBlob(null)
    setRecordPayment(true)
    setPaymentAmount(3000)
    setPaymentDate(today)
    setPaymentNotes('')
    setError('')
  }

  if (success) return (
    <div className="p-6 max-w-lg mx-auto mt-12 text-center animate-fade-slide-up">
      <div className="gym-card p-10">
        <div className="text-5xl mb-4" style={{ color: '#39FF14' }}>✓</div>
        <h2 className="text-2xl mb-2" style={{ fontFamily: 'Rajdhani', color: '#39FF14' }}>MEMBER REGISTERED!</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          {form.full_name} has been added successfully.
        </p>
        {recordPayment && (
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            First fee of PKR {Number(paymentAmount).toLocaleString()} recorded.
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-green">Add Another</button>
          <button onClick={() => router.push('/dashboard/members')} className="btn-primary">View Members</button>
        </div>
      </div>
    </div>
  )

  const labelStyle = {
    display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem',
    fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.4rem',
  } as React.CSSProperties

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>ADD NEW MEMBER</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fill in the details and optionally record the first payment</p>
      </div>

      <div className="gym-card p-5 md:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Member Details ─────────────────────────────── */}
          <div className="pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-xs mb-4" style={{ fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue-bright)' }}>
              MEMBER DETAILS
            </p>

            <div className="space-y-5">
              <div>
                <label style={labelStyle}>PROFILE PHOTO</label>
                <ProfileImageUpload
                  currentUrl={null}
                  gender={form.gender as 'Male' | 'Female'}
                  onChange={setProfileBlob}
                />
              </div>

              <div>
                <label style={labelStyle}>FULL NAME *</label>
                <input className="gym-input" placeholder="e.g. Muhammad Ali Khan" value={form.full_name}
                  onChange={e => set('full_name', e.target.value)} required />
              </div>

              <div>
                <label style={labelStyle}>FATHER NAME</label>
                <input className="gym-input" placeholder="e.g. Muhammad Akbar Khan" value={form.father_name}
                  onChange={e => set('father_name', e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>GENDER</label>
                <div className="flex gap-3">
                  {['Male', 'Female'].map(g => (
                    <button type="button" key={g} onClick={() => set('gender', g)}
                      className="flex-1 py-2.5 rounded-lg border text-sm transition-all"
                      style={{
                        fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer',
                        background: form.gender === g ? (g === 'Male' ? 'rgba(27,63,204,0.2)' : 'rgba(255,100,180,0.15)') : 'transparent',
                        borderColor: form.gender === g ? (g === 'Male' ? '#1B3FCC' : '#FF64B4') : 'var(--border)',
                        color: form.gender === g ? (g === 'Male' ? '#6B8FFF' : '#FF64B4') : 'var(--text-muted)',
                      }}>
                      {g === 'Male' ? '♂ MALE' : '♀ FEMALE'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>PHONE NUMBER <span style={{ fontWeight: 400 }}>(OPTIONAL)</span></label>
                <div className="flex gap-2">
                  <select className="gym-input" style={{ width: 150, flexShrink: 0 }}
                    value={form.phone_country_code} onChange={e => set('phone_country_code', e.target.value)}>
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} {c.name}</option>)}
                  </select>
                  <input className="gym-input" placeholder={form.phone_country_code === '+92' ? '3001234567' : 'Phone number'}
                    value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>MONTHLY FEE (PKR)</label>
                <input type="number" className="gym-input" min={1500} max={5000} step={100}
                  value={form.fee_amount} onChange={e => set('fee_amount', Number(e.target.value))} required />
                <input type="range" min={1500} max={5000} step={100} value={form.fee_amount}
                  onChange={e => set('fee_amount', Number(e.target.value))}
                  className="w-full mt-2" style={{ accentColor: '#39FF14' }} />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>PKR 1,500</span>
                  <span style={{ color: '#39FF14', fontWeight: 600 }}>PKR {Number(form.fee_amount).toLocaleString()}</span>
                  <span>PKR 5,000</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>REGISTRATION DATE *</label>
                <input type="date" className="gym-input" value={form.registration_date}
                  onChange={e => set('registration_date', e.target.value)} required />
              </div>

              <div>
                <label style={labelStyle}>EMAIL <span style={{ fontWeight: 400 }}>(OPTIONAL)</span></label>
                <input type="email" className="gym-input" placeholder="member@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>ADDRESS <span style={{ fontWeight: 400 }}>(OPTIONAL)</span></label>
                <input className="gym-input" placeholder="House #, Street, Area..." value={form.address}
                  onChange={e => set('address', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── First Fee Payment ──────────────────────────── */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none" style={{ marginBottom: recordPayment ? '1rem' : 0 }}>
              <div
                onClick={() => setRecordPayment(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: recordPayment ? 'var(--green-neon)' : 'var(--border)',
                  position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                }}>
                <div style={{
                  position: 'absolute', top: 3, left: recordPayment ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: recordPayment ? '#050A14' : 'var(--text-muted)',
                  transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                RECORD FIRST FEE PAYMENT
              </span>
            </label>

            {recordPayment && (
              <div className="rounded-xl p-4 space-y-4 animate-fade-in"
                style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.2)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={{ ...labelStyle, color: '#39FF14' }}>AMOUNT (PKR) *</label>
                    <input type="number" className="gym-input" min={1} value={paymentAmount}
                      onChange={e => setPaymentAmount(Number(e.target.value))} required={recordPayment} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: '#39FF14' }}>PAYMENT DATE *</label>
                    <input type="date" className="gym-input" value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)} required={recordPayment} />
                  </div>
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#39FF14' }}>NOTES <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(OPTIONAL)</span></label>
                  <input className="gym-input" placeholder="e.g. First month, advance..." value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: '#FF3B5C' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-green flex-1 justify-center" disabled={loading}>
              {loading ? 'Registering...' : recordPayment ? 'REGISTER + RECORD PAYMENT' : 'REGISTER MEMBER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
