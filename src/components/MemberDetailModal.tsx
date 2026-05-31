'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPKR, formatDate, buildWhatsAppUrl } from '@/lib/utils'
import type { Member } from '@/types'
import MemberAvatar from '@/components/MemberAvatar'

interface FeeRecord {
  id: string
  amount: number
  payment_date: string
  notes: string | null
  receipt_url: string | null
  created_at: string
}

interface Props {
  member: Member
  onClose: () => void
  onFeeAdded: () => void
}

function getStatus(m: Member) {
  if (m.is_overdue) return 'overdue'
  if ((m.days_remaining ?? 999) <= 7) return 'due_soon'
  return 'paid'
}

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf')
}

function ReceiptThumb({ url, onClick }: { url: string; onClick: () => void }) {
  if (isPdf(url)) {
    return (
      <button onClick={onClick} title="View receipt"
        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
        style={{ background: 'rgba(107,143,255,0.12)', color: '#6B8FFF', border: '1px solid rgba(107,143,255,0.25)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,143,255,0.22)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,143,255,0.12)'}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        PDF
      </button>
    )
  }
  return (
    <button onClick={onClick} title="View receipt"
      className="rounded-lg overflow-hidden transition-opacity hover:opacity-80"
      style={{ width: 36, height: 36, flexShrink: 0 }}>
      <img src={url} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </button>
  )
}

export default function MemberDetailModal({ member, onClose, onFeeAdded }: Props) {
  const [payments, setPayments] = useState<FeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const PAGE_SIZE = 15
  const supabase = createClient()

  async function loadPayments() {
    setLoading(true)
    const { data } = await supabase
      .from('fee_payments')
      .select('id, amount, payment_date, notes, receipt_url, created_at')
      .eq('member_id', member.id)
      .order('payment_date', { ascending: false })
    setPayments(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPayments() }, [member.id])

  async function deletePayment(id: string, receiptUrl: string | null) {
    if (!confirm('Delete this payment record?')) return
    setDeletingId(id)
    // Delete storage object if a receipt was attached
    if (receiptUrl) {
      try {
        const url = new URL(receiptUrl)
        // Path after /storage/v1/object/public/receipts/
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/receipts\/(.+)/)
        if (pathMatch) {
          await supabase.storage.from('receipts').remove([pathMatch[1]])
        }
      } catch {
        // ignore storage delete errors
      }
    }
    await supabase.from('fee_payments').delete().eq('id', id)
    await loadPayments()
    onFeeAdded()
    setDeletingId(null)
  }

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE))
  const paginated = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const status = getStatus(member)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const thisYear = new Date().getFullYear()
  const paidThisYear = payments
    .filter(p => new Date(p.payment_date).getFullYear() === thisYear)
    .reduce((s, p) => s + p.amount, 0)

  const labelStyle = { fontSize: '0.7rem', fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: '0.09em', color: 'var(--text-muted)' } as React.CSSProperties

  return (
    <>
      <div className="modal-overlay animate-fade-in" onClick={onClose}>
        <div
          className="gym-card w-full animate-fade-slide-up flex flex-col"
          style={{ maxWidth: 720, maxHeight: '92vh', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────────────── */}
          <div className="p-5 md:p-6 flex items-start justify-between gap-4 shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <MemberAvatar member={member} size={64} style={{ flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl md:text-2xl truncate" style={{ fontFamily: 'Rajdhani', fontWeight: 700 }}>
                    {member.full_name}
                  </h2>
                  <span className={member.gender === 'Male' ? 'badge-male' : 'badge-female'}>{member.gender}</span>
                  <span className={status === 'overdue' ? 'badge-overdue' : status === 'due_soon' ? 'badge-due-soon' : 'badge-paid'}>
                    {status === 'overdue' ? 'OVERDUE' : status === 'due_soon' ? 'DUE SOON' : 'PAID'}
                  </span>
                </div>
                {member.father_name && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>S/O {member.father_name}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost shrink-0" style={{ padding: '0.4rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* ── Member Info ──────────────────────────────────── */}
          <div className="px-5 md:px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p style={labelStyle}>MONTHLY FEE</p>
                <p className="font-bold mt-0.5" style={{ color: '#6B8FFF', fontFamily: 'Rajdhani', fontSize: '1.05rem' }}>
                  {formatPKR(member.fee_amount)}
                </p>
              </div>
              <div>
                <p style={labelStyle}>LAST PAID</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{formatDate(member.last_payment_date)}</p>
              </div>
              <div>
                <p style={labelStyle}>NEXT DUE</p>
                <p className="text-sm mt-0.5" style={{ color: member.is_overdue ? '#FF3B5C' : 'var(--text-secondary)' }}>
                  {formatDate(member.next_due_date)}
                </p>
              </div>
              <div>
                <p style={labelStyle}>MEMBER SINCE</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{formatDate(member.registration_date)}</p>
              </div>
            </div>

            {/* Contact */}
            {(member.phone_number || member.email || member.address) && (
              <div className="flex flex-wrap gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {member.phone_number && (
                  <a href={buildWhatsAppUrl(member.phone_country_code, member.phone_number)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm" style={{ color: '#25D366' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {member.phone_country_code} {member.phone_number}
                  </a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-sm" style={{ color: '#6B8FFF' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {member.email}
                  </a>
                )}
                {member.address && (
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {member.address}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Payment Summary ──────────────────────────────── */}
          <div className="px-5 md:px-6 py-3 shrink-0 flex flex-wrap gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={labelStyle}>TOTAL PAYMENTS</p>
              <p className="font-bold mt-0.5" style={{ fontFamily: 'Rajdhani', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {loading ? '—' : payments.length} payments
              </p>
            </div>
            <div>
              <p style={labelStyle}>PAID THIS YEAR ({thisYear})</p>
              <p className="font-bold mt-0.5" style={{ fontFamily: 'Rajdhani', fontSize: '1.1rem', color: '#39FF14' }}>
                {loading ? '—' : formatPKR(paidThisYear)}
              </p>
            </div>
            <div>
              <p style={labelStyle}>TOTAL ALL TIME</p>
              <p className="font-bold mt-0.5" style={{ fontFamily: 'Rajdhani', fontSize: '1.1rem', color: '#6B8FFF' }}>
                {loading ? '—' : formatPKR(totalPaid)}
              </p>
            </div>
          </div>

          {/* ── Fee History ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10"
              style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ ...labelStyle, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                FEE PAYMENT HISTORY
              </p>
              <button onClick={onFeeAdded} className="btn-green" style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}>
                + Add Payment
              </button>
            </div>

            {loading && (
              <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
            )}

            {!loading && payments.length === 0 && (
              <div className="py-12 text-center">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No fee payments recorded yet.</p>
                <button onClick={onFeeAdded} className="btn-green mt-4" style={{ fontSize: '0.85rem' }}>
                  Record First Payment
                </button>
              </div>
            )}

            {!loading && payments.length > 0 && (
              <div>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="gym-table">
                    <thead>
                      <tr>
                        <th style={{ background: 'var(--bg-card2)', padding: '0.6rem 1.5rem' }}>#</th>
                        <th style={{ background: 'var(--bg-card2)', padding: '0.6rem 1rem' }}>DATE</th>
                        <th style={{ background: 'var(--bg-card2)', padding: '0.6rem 1rem' }}>AMOUNT</th>
                        <th style={{ background: 'var(--bg-card2)', padding: '0.6rem 1rem' }}>DESCRIPTION</th>
                        <th style={{ background: 'var(--bg-card2)', padding: '0.6rem 1rem' }}>RECEIPT</th>
                        <th style={{ background: 'var(--bg-card2)', padding: '0.6rem 1rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((p, i) => {
                        const globalIdx = payments.length - ((page - 1) * PAGE_SIZE + i)
                        return (
                          <tr key={p.id}>
                            <td style={{ padding: '0.75rem 1.5rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.85rem' }}>
                                #{globalIdx}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span className="font-semibold" style={{ fontSize: '0.9rem' }}>{formatDate(p.payment_date)}</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{ color: '#39FF14', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem' }}>
                                {formatPKR(p.amount)}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', maxWidth: 160 }}>
                              <span className="truncate block" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.notes || '—'}</span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              {p.receipt_url ? (
                                <ReceiptThumb url={p.receipt_url} onClick={() => setLightbox(p.receipt_url)} />
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <button
                                onClick={() => deletePayment(p.id, p.receipt_url)}
                                disabled={deletingId === p.id}
                                title="Delete payment"
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ background: 'rgba(255,59,92,0.1)', color: '#FF3B5C', border: '1px solid rgba(255,59,92,0.2)', opacity: deletingId === p.id ? 0.5 : 1 }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                  <path d="M10 11v6"/><path d="M14 11v6"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                  {paginated.map((p, i) => {
                    const globalIdx = payments.length - ((page - 1) * PAGE_SIZE + i)
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.8rem', minWidth: 28 }}>
                          #{globalIdx}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{formatDate(p.payment_date)}</span>
                            <span style={{ color: '#39FF14', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem' }}>
                              {formatPKR(p.amount)}
                            </span>
                          </div>
                          {p.notes && <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.notes}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.receipt_url && (
                            <ReceiptThumb url={p.receipt_url} onClick={() => setLightbox(p.receipt_url)} />
                          )}
                          <button
                            onClick={() => deletePayment(p.id, p.receipt_url)}
                            disabled={deletingId === p.id}
                            className="p-1.5 rounded-lg"
                            style={{ background: 'rgba(255,59,92,0.1)', color: '#FF3B5C', border: '1px solid rgba(255,59,92,0.2)' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 md:px-6 py-3"
                    style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, payments.length)} of {payments.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} className={`pagination-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                      ))}
                      <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 rounded-full flex items-center justify-center"
            style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {isPdf(lightbox) ? (
            <div onClick={e => e.stopPropagation()} style={{ width: '90vw', maxWidth: 800, height: '85vh' }}>
              <iframe src={lightbox} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }} />
            </div>
          ) : (
            <img
              src={lightbox}
              alt="Receipt"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 48px rgba(0,0,0,0.6)' }}
            />
          )}
          <a
            href={lightbox}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="absolute bottom-4 flex items-center gap-2 text-sm px-4 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Open full size
          </a>
        </div>
      )}
    </>
  )
}
