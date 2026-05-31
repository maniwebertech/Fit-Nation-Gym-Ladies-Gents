'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/types'
import { COUNTRY_CODES } from '@/lib/utils'
import ProfileImageUpload from '@/components/ProfileImageUpload'

interface Props { member: Member; onClose: () => void; onSuccess: () => void }

export default function EditMemberModal({ member, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    full_name: member.full_name,
    father_name: member.father_name || '',
    phone_country_code: member.phone_country_code,
    phone_number: member.phone_number || '',
    email: member.email || '',
    address: member.address || '',
    gender: member.gender,
    fee_amount: member.fee_amount,
    registration_date: member.registration_date,
  })
  // undefined = no change, null = remove, Blob = new photo
  const [profileChange, setProfileChange] = useState<Blob | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    setLoading(true)
    const { error: err } = await supabase.from('members').update({
      full_name: form.full_name.trim(),
      father_name: form.father_name.trim() || null,
      phone_country_code: form.phone_country_code,
      phone_number: form.phone_number.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      gender: form.gender,
      fee_amount: Number(form.fee_amount),
      registration_date: form.registration_date,
    }).eq('id', member.id)
    if (err) {
      if (err.code === '23505') setError('Another member with this phone number already exists.')
      else setError(err.message)
      setLoading(false)
      return
    }

    // Handle profile image change
    if (profileChange instanceof Blob) {
      const path = `${member.id}/profile.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('member-photos')
        .upload(path, profileChange, { contentType: 'image/jpeg', upsert: true })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('member-photos').getPublicUrl(path)
        await supabase.from('members').update({ profile_image_url: publicUrl }).eq('id', member.id)
      }
    } else if (profileChange === null) {
      await supabase.storage.from('member-photos').remove([`${member.id}/profile.jpg`])
      await supabase.from('members').update({ profile_image_url: null }).eq('id', member.id)
    }

    onSuccess()
  }

  const labelStyle = { display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.4rem' } as React.CSSProperties

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="gym-card p-5 md:p-6 max-w-lg w-full animate-fade-slide-up overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>EDIT MEMBER</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.4rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelStyle}>PROFILE PHOTO</label>
            <ProfileImageUpload
              currentUrl={member.profile_image_url ?? null}
              gender={form.gender as 'Male' | 'Female'}
              onChange={blob => setProfileChange(blob)}
            />
          </div>

          <div>
            <label style={labelStyle}>FULL NAME *</label>
            <input className="gym-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>FATHER NAME</label>
            <input className="gym-input" value={form.father_name} onChange={e => set('father_name', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>PHONE NUMBER <span style={{ fontWeight: 400 }}>(OPTIONAL)</span></label>
            <div className="flex gap-2">
              <select className="gym-input" style={{ width: 140, flexShrink: 0 }} value={form.phone_country_code}
                onChange={e => set('phone_country_code', e.target.value)}>
                {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} {c.name}</option>)}
              </select>
              <input className="gym-input" value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)}
                placeholder={form.phone_country_code === '+92' ? '3001234567' : 'Phone number'} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>GENDER</label>
            <div className="flex gap-3">
              {['Male', 'Female'].map(g => (
                <button type="button" key={g} onClick={() => set('gender', g)}
                  className="flex-1 py-2.5 rounded-lg border text-sm transition-all"
                  style={{
                    fontFamily: 'Rajdhani', fontWeight: 600, cursor: 'pointer',
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
            <label style={labelStyle}>MONTHLY FEE (PKR)</label>
            <input type="number" className="gym-input" min={1500} max={5000} step={100}
              value={form.fee_amount} onChange={e => set('fee_amount', Number(e.target.value))} required />
          </div>

          <div>
            <label style={labelStyle}>REGISTRATION DATE</label>
            <input type="date" className="gym-input" value={form.registration_date}
              onChange={e => set('registration_date', e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>EMAIL (OPTIONAL)</label>
            <input type="email" className="gym-input" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>ADDRESS (OPTIONAL)</label>
            <input className="gym-input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: '#FF3B5C' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading ? 'Saving...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
