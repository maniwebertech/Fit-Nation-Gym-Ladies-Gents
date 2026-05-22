'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Member } from '@/types'

interface Props {
  preselectedMember?: Member
  onClose: () => void
  onSuccess: () => void
}

export default function AddFeeModal({ preselectedMember, onClose, onSuccess }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<Member[]>([])
  const [selected, setSelected] = useState<Member | null>(preselectedMember?.id ? preselectedMember : null)
  const [amount, setAmount] = useState<number>(preselectedMember?.fee_amount ?? 3000)
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!selected) searchRef.current?.focus()
  }, [selected])

  useEffect(() => {
    if (!search.trim() || selected) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      const q = search.toLowerCase()
      const { data } = await supabase.from('members').select('*')
        .or(`full_name.ilike.%${q}%,phone_number.ilike.%${q}%`)
        .limit(6)
      setSuggestions(data || [])
    }, 250)
    return () => clearTimeout(t)
  }, [search, selected, supabase])

  function selectMember(m: Member) {
    setSelected(m)
    setAmount(m.fee_amount)
    setSearch('')
    setSuggestions([])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceipt(file)
    const reader = new FileReader()
    reader.onload = ev => setReceiptPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeReceipt() {
    setReceipt(null)
    setReceiptPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) { setError('Please select a member.'); return }
    setLoading(true)
    setError('')

    let receiptUrl: string | null = null

    // Upload receipt image if provided
    if (receipt) {
      const ext = receipt.name.split('.').pop()
      const path = `${selected.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(path, receipt, { contentType: receipt.type, upsert: false })
      if (uploadErr) {
        setError(`Receipt upload failed: ${uploadErr.message}`)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path)
      receiptUrl = urlData.publicUrl
    }

    const { error: err } = await supabase.from('fee_payments').insert({
      member_id: selected.id,
      amount: Number(amount),
      payment_date: date,
      notes: notes.trim() || null,
      receipt_url: receiptUrl,
    })
    if (err) { setError(err.message); setLoading(false) }
    else { setSuccess(true); setLoading(false) }
  }

  if (success) return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="gym-card p-8 max-w-sm w-full text-center animate-fade-slide-up" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3" style={{ color: '#39FF14' }}>✓</div>
        <h3 className="text-xl mb-1" style={{ fontFamily: 'Rajdhani', color: '#39FF14' }}>PAYMENT RECORDED!</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          PKR {Number(amount).toLocaleString()} recorded for {selected?.full_name}
          {receipt && <span className="block mt-1" style={{ color: 'var(--text-muted)' }}>Receipt attached</span>}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setSelected(null); setSearch(''); setAmount(3000); setDate(today); setNotes(''); setReceipt(null); setReceiptPreview(null) }} className="btn-ghost">
            Add Another
          </button>
          <button onClick={onSuccess} className="btn-green">Done</button>
        </div>
      </div>
    </div>
  )

  const labelStyle = { display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '0.4rem' } as React.CSSProperties

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="gym-card p-5 md:p-6 max-w-md w-full animate-fade-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>RECORD FEE PAYMENT</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.4rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Search / Selected */}
          <div>
            <label style={labelStyle}>MEMBER *</label>
            {selected ? (
              <div className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'rgba(27,63,204,0.1)', border: '1px solid rgba(27,63,204,0.3)' }}>
                <div>
                  <div className="font-semibold text-sm">{selected.full_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selected.phone_number ? `${selected.phone_country_code} ${selected.phone_number}` : selected.email || 'No contact info'}
                  </div>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input ref={searchRef} className="gym-input" placeholder="Search member by name or phone..."
                  value={search} onChange={e => setSearch(e.target.value)} />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg z-10 overflow-hidden"
                    style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {suggestions.map(m => (
                      <button key={m.id} type="button" onClick={() => selectMember(m)}
                        className="w-full text-left px-4 py-3 text-sm transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div className="font-semibold">{m.full_name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {m.phone_number ? `${m.phone_country_code} ${m.phone_number}` : m.email || 'No contact'} · {m.gender}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>AMOUNT (PKR)</label>
            <input type="number" className="gym-input" min={1} value={amount}
              onChange={e => setAmount(Number(e.target.value))} required />
          </div>

          <div>
            <label style={labelStyle}>PAYMENT DATE</label>
            <input type="date" className="gym-input" value={date}
              onChange={e => setDate(e.target.value)} required />
          </div>

          <div>
            <label style={labelStyle}>DESCRIPTION / TRANSACTION ID (OPTIONAL)</label>
            <input className="gym-input" placeholder="e.g. TXN-20240522, Easypaisa #12345, advance..." value={notes}
              onChange={e => setNotes(e.target.value)} />
          </div>

          {/* Receipt Image */}
          <div>
            <label style={labelStyle}>RECEIPT / PROOF (OPTIONAL)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {receiptPreview ? (
              <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                    Change
                  </button>
                  <button type="button" onClick={removeReceipt}
                    className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem', color: '#FF3B5C' }}>
                    Remove
                  </button>
                </div>
                <div className="px-3 py-1.5 text-xs truncate" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                  {receipt?.name}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-3 transition-colors"
                style={{ border: '1.5px dashed var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1B3FCC'; e.currentTarget.style.color = '#6B8FFF' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Attach receipt image or PDF
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.3)', color: '#FF3B5C' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-green flex-1 justify-center" disabled={loading || !selected}>
              {loading ? (receipt ? 'Uploading...' : 'Recording...') : 'RECORD PAYMENT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
