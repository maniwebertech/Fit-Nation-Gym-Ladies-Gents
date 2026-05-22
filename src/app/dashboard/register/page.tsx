'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { COUNTRY_CODES } from '@/lib/utils'
import { format } from 'date-fns'

export default function RegisterPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    full_name: '', father_name: '', phone_country_code: '+92', phone_number: '',
    email: '', address: '', gender: 'Male', fee_amount: 3000,
    registration_date: today,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    setLoading(true)
    const payload = {
      full_name: form.full_name.trim(),
      father_name: form.father_name.trim() || null,
      phone_country_code: form.phone_country_code,
      phone_number: form.phone_number.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      gender: form.gender,
      fee_amount: Number(form.fee_amount),
      registration_date: form.registration_date,
    }
    const { error: err } = await supabase.from('members').insert(payload)
    if (err) {
      if (err.code === '23505') setError('A member with this phone number already exists.')
      else setError(err.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  function reset() {
    setSuccess(false)
    setForm({ full_name: '', father_name: '', phone_country_code: '+92', phone_number: '', email: '', address: '', gender: 'Male', fee_amount: 3000, registration_date: today })
    setError('')
  }

  if (success) return (
    <div className="p-6 max-w-lg mx-auto mt-12 text-center animate-fade-slide-up">
      <div className="gym-card p-10">
        <div className="text-5xl mb-4" style={{ color: '#39FF14' }}>✓</div>
        <h2 className="text-2xl mb-2" style={{ fontFamily: 'Rajdhani', color: '#39FF14' }}>MEMBER REGISTERED!</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{form.full_name} has been added successfully.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-green">Add Another</button>
          <button onClick={() => router.push('/dashboard/members')} className="btn-primary">View Members</button>
        </div>
      </div>
    </div>
  )

  const labelStyle = { display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.4rem' } as React.CSSProperties

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>ADD NEW MEMBER</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fill in the member details below</p>
      </div>

      <div className="gym-card p-5 md:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}
          <div>
            <label style={labelStyle}>FULL NAME *</label>
            <input className="gym-input" placeholder="e.g. Muhammad Ali Khan" value={form.full_name}
              onChange={e => set('full_name', e.target.value)} required />
          </div>

          {/* Father Name */}
          <div>
            <label style={labelStyle}>FATHER NAME</label>
            <input className="gym-input" placeholder="e.g. Muhammad Akbar Khan" value={form.father_name}
              onChange={e => set('father_name', e.target.value)} />
          </div>

          {/* Gender */}
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

          {/* Phone (optional) */}
          <div>
            <label style={labelStyle}>PHONE NUMBER <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(OPTIONAL)</span></label>
            <div className="flex gap-2">
              <select className="gym-input" style={{ width: 150, flexShrink: 0 }}
                value={form.phone_country_code} onChange={e => set('phone_country_code', e.target.value)}>
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} {c.name}</option>
                ))}
              </select>
              <input className="gym-input" placeholder={form.phone_country_code === '+92' ? '3001234567' : 'Phone number'}
                value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
            </div>
            {form.phone_country_code === '+92' && form.phone_number && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Enter without leading 0 — e.g. 3001234567
              </p>
            )}
          </div>

          {/* Fee Amount */}
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

          {/* Registration Date */}
          <div>
            <label style={labelStyle}>REGISTRATION DATE *</label>
            <input type="date" className="gym-input" value={form.registration_date}
              onChange={e => set('registration_date', e.target.value)} required />
          </div>

          {/* Email (optional) */}
          <div>
            <label style={labelStyle}>EMAIL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(OPTIONAL)</span></label>
            <input type="email" className="gym-input" placeholder="member@example.com" value={form.email}
              onChange={e => set('email', e.target.value)} />
          </div>

          {/* Address (optional) */}
          <div>
            <label style={labelStyle}>ADDRESS <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(OPTIONAL)</span></label>
            <input className="gym-input" placeholder="House #, Street, Area..." value={form.address}
              onChange={e => set('address', e.target.value)} />
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: '#FF3B5C' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-green flex-1 justify-center" disabled={loading}>
              {loading ? 'Registering...' : 'REGISTER MEMBER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
