'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  agencyId: string
  userId: string
}

const CATEGORIES = [
  'Technisch probleem',
  'Facturering / abonnement',
  'Social media koppelingen',
  'Feature verzoek',
  'Account / toegang',
  'Anders',
]

export default function SupportButton({ agencyId, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('support_tickets').insert({
      agency_id: agencyId,
      submitted_by: userId,
      subject: `[${category}] ${subject}`,
      message,
      priority,
      status: 'open',
    })

    if (!error) {
      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setSubject('')
        setMessage('')
        setPriority('normal')
        setCategory(CATEGORIES[0])
      }, 2500)
    }
    setSubmitting(false)
  }

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--accent1)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.2rem',
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(26,63,228,.4)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform .2s',
        }}
        title="Support"
      >
        ?
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300, padding: '20px',
        }} onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div style={{
            background: 'var(--card)', borderRadius: 'var(--radius)',
            padding: '32px', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 60px rgba(0,0,0,.2)',
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
                <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, marginBottom: '8px' }}>
                  Ticket ingediend!
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
                  We reageren zo snel mogelijk, meestal binnen 24 uur.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
                    💬 Support aanvragen
                  </h2>
                  <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Categorie</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Onderwerp</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Kort omschrijf het probleem"
                      required
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Beschrijving</label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Beschrijf het probleem zo gedetailleerd mogelijk..."
                      required
                      rows={4}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Prioriteit</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {([
                        { value: 'normal', label: '🟢 Normaal' },
                        { value: 'high', label: '🟡 Hoog' },
                        { value: 'urgent', label: '🔴 Urgent' },
                      ] as const).map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          style={{
                            flex: 1, padding: '8px', border: `2px solid ${priority === p.value ? 'var(--accent1)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
                            background: priority === p.value ? 'rgba(26,63,228,.08)' : 'var(--bg)',
                            color: priority === p.value ? 'var(--accent1)' : 'var(--muted)',
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '12px', background: 'var(--accent1)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700,
                      fontSize: '.95rem', cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1, marginTop: '4px',
                    }}
                  >
                    {submitting ? 'Versturen...' : 'Ticket indienen →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
