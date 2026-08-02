'use client'

import { useState, useEffect, useCallback } from 'react'
import { Phone, Globe, Mail, MapPin, ChevronRight, Check, X, Clock, Calendar, FileText, ArrowRight, Loader2, PhoneCall } from 'lucide-react'
import { CALL_OUTCOMES, PIPELINE_STAGES, type CallOutcome } from '@/types/leadmachine'

interface Lead {
  id: string
  company_id: string
  contact_id: string | null
  service: string | null
  opening_line: string | null
  pipeline_stage: string
  next_action_at: string | null
  next_action_note: string | null
  last_contacted_at: string | null
  lead_companies: {
    id: string
    name: string
    domain: string | null
    phone: string | null
    website_url: string | null
    city: string | null
    industry: string | null
    notes: string | null
  } | null
  lead_contacts: {
    id: string
    first_name: string | null
    last_name: string | null
    full_name: string | null
    email: string | null
    phone: string | null
    role: string | null
  } | null
}

interface Stats {
  by_stage: Record<string, number>
  callbacks_due: number
}

export default function BellenClient({ userName, userId }: { userName: string; userId: string }) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  const [callActive, setCallActive] = useState(false)
  const [callStart, setCallStart] = useState<number | null>(null)
  const [duration, setDuration] = useState(0)
  const [showOutcome, setShowOutcome] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(null)
  const [notes, setNotes] = useState('')
  const [callbackDate, setCallbackDate] = useState('')
  const [callbackTime, setCallbackTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [showEditContact, setShowEditContact] = useState(false)

  const loadNext = useCallback(async () => {
    setLoading(true)
    setLead(null); setShowOutcome(false); setSelectedOutcome(null)
    setNotes(''); setCallbackDate(''); setCallbackTime('')
    setCallActive(false); setCallStart(null); setDuration(0)
    try {
      const [nextR, statsR] = await Promise.all([
        fetch('/api/leads/crm?action=next_lead'),
        fetch('/api/leads/crm?action=queue_stats'),
      ])
      const nextD = await nextR.json()
      const statsD = await statsR.json()
      setLead(nextD.lead || null)
      setReason(nextD.reason || '')
      setStats(statsD)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadNext() }, [loadNext])

  // Call timer
  useEffect(() => {
    if (!callActive || !callStart) return
    const id = setInterval(() => setDuration(Math.floor((Date.now() - callStart) / 1000)), 1000)
    return () => clearInterval(id)
  }, [callActive, callStart])

  function startCall() {
    setCallActive(true)
    setCallStart(Date.now())
    setDuration(0)
    setShowOutcome(true)
  }

  async function saveOutcome() {
    if (!selectedOutcome || !lead) return
    setSaving(true)
    try {
      let callbackIso: string | null = null
      if (callbackDate) {
        const iso = new Date(`${callbackDate}T${callbackTime || '09:00'}`).toISOString()
        callbackIso = iso
      }
      await fetch('/api/leads/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_call',
          payload: {
            outreach_id: lead.id,
            company_id: lead.company_id,
            contact_id: lead.contact_id,
            outcome: selectedOutcome,
            notes: notes.trim() || null,
            callback_at: callbackIso,
            duration_seconds: duration || null,
          },
        }),
      })
      await loadNext()
    } catch (e) { console.error(e); alert('Fout bij opslaan') }
    setSaving(false)
  }

  async function skipLead() {
    if (!lead) return
    await fetch('/api/leads/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_outreach',
        payload: { outreach_id: lead.id, updates: { priority: 1 } },
      }),
    })
    await loadNext()
  }

  const outcomeRequiresCallback = selectedOutcome
    && ['geen_gehoor','voicemail','niet_beschikbaar','callback_gevraagd'].includes(selectedOutcome)

  const stage = lead ? PIPELINE_STAGES.find(s => s.key === lead.pipeline_stage) : null

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!lead) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Geen leads meer</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 30 }}>
          Er staan geen leads te bellen. Nieuwe leads komen automatisch binnen als callbacks aan tijd zijn.
        </p>
        <button onClick={loadNext} style={btnPrimary}>Opnieuw checken</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 12px 100px', minHeight: '100vh' }}>
      {/* Top: user + stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--foreground)' }}>{userName}</strong>
          {stats && ` · ${stats.callbacks_due} callbacks vandaag`}
        </div>
        <span style={{
          background: reason === 'callback_due' ? '#3F06E3' : '#F1ECFF',
          color: reason === 'callback_due' ? 'white' : '#3F06E3',
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
        }}>
          {reason === 'callback_due' && '📞 CALLBACK TIJD'}
          {reason === 'assigned' && 'Toegewezen'}
          {reason === 'fresh' && 'Nieuw'}
        </span>
      </div>

      {/* Lead card */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 20, marginBottom: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #E7E2F4',
      }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{
            display: 'inline-block', padding: '4px 10px', borderRadius: 100,
            background: stage?.color + '20', color: stage?.color, fontSize: 11, fontWeight: 700,
          }}>{stage?.label}</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
          {lead.lead_companies?.name}
        </h1>

        {lead.lead_companies?.industry && (
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>{lead.lead_companies.industry}</div>
        )}
        {lead.lead_companies?.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
            <MapPin size={14} /> {lead.lead_companies.city}
          </div>
        )}

        {/* Contact info */}
        {lead.lead_contacts && (
          <div style={{ padding: '12px 14px', background: '#F6F3FF', borderRadius: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  {lead.lead_contacts.full_name || `${lead.lead_contacts.first_name || ''} ${lead.lead_contacts.last_name || ''}`.trim() || 'Onbekend'}
                </div>
                {lead.lead_contacts.role && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{lead.lead_contacts.role}</div>
                )}
                {lead.lead_contacts.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3F06E3' }}>
                    <Mail size={12} /> {lead.lead_contacts.email}
                  </div>
                )}
              </div>
              <button onClick={() => setShowEditContact(true)} style={{
                background: 'transparent', border: '1px solid #E7E2F4', padding: '6px 10px',
                borderRadius: 8, fontSize: 12, cursor: 'pointer', color: 'var(--muted)',
              }}>Bewerk</button>
            </div>
          </div>
        )}

        {/* Website link */}
        {lead.lead_companies?.website_url && (
          <a href={lead.lead_companies.website_url} target="_blank" rel="noopener"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F8F7FF',
              borderRadius: 10, fontSize: 13, color: '#3F06E3', textDecoration: 'none', marginBottom: 8 }}>
            <Globe size={14} /> {lead.lead_companies.domain || lead.lead_companies.website_url}
          </a>
        )}

        {/* Opening line context */}
        {lead.opening_line && (
          <div style={{ padding: 10, background: '#FFF9EF', border: '1px solid #FCD34D', borderRadius: 10, marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Openingsregel uit mail</div>
            <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.4 }}>&ldquo;{lead.opening_line}&rdquo;</div>
          </div>
        )}

        {/* Notes */}
        {lead.lead_companies?.notes && (
          <div style={{ padding: 10, background: '#F0FDF4', borderRadius: 10, marginTop: 10, fontSize: 13, lineHeight: 1.4 }}>
            <strong style={{ color: '#059669', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aantekening</strong>
            <div style={{ marginTop: 4 }}>{lead.lead_companies.notes}</div>
          </div>
        )}
      </div>

      {/* Call action */}
      {!showOutcome && (
        <>
          {lead.lead_companies?.phone ? (
            <a href={`tel:${lead.lead_companies.phone}`} onClick={startCall} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'linear-gradient(135deg, #3F06E3, #6D3EEB)', color: 'white',
              padding: '20px', borderRadius: 20, fontWeight: 800, fontSize: 22, textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(63, 6, 227, 0.35)',
            }}>
              <PhoneCall size={26} /> {lead.lead_companies.phone}
            </a>
          ) : (
            <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, textAlign: 'center', color: '#991B1B' }}>
              Geen telefoonnummer bekend
              <button onClick={() => setShowEditContact(true)} style={{ ...btnSecondary, marginTop: 10, width: '100%' }}>Nummer toevoegen</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <button onClick={() => setShowOutcome(true)} style={btnSecondary}>Log zonder bellen</button>
            <button onClick={skipLead} style={btnGhost}>Skip →</button>
          </div>
        </>
      )}

      {/* Outcome flow */}
      {showOutcome && (
        <div style={{
          background: 'white', borderRadius: 20, padding: 20, marginTop: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #E7E2F4',
        }}>
          {callActive && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, padding: 10, background: '#F0FDF4', borderRadius: 10, color: '#059669', fontWeight: 700 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'pulse 1.5s infinite' }} />
              In gesprek — {formatDuration(duration)}
            </div>
          )}

          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Wat is er gebeurd?</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {CALL_OUTCOMES.map(o => (
              <button key={o.key}
                onClick={() => setSelectedOutcome(o.key)}
                style={{
                  padding: '14px 10px', borderRadius: 12, textAlign: 'left', fontSize: 13, fontWeight: 600,
                  border: `2px solid ${selectedOutcome === o.key ? '#3F06E3' : '#E7E2F4'}`,
                  background: selectedOutcome === o.key ? '#F1ECFF' : 'white',
                  color: selectedOutcome === o.key ? '#3F06E3' : '#1A1730',
                  cursor: 'pointer',
                }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{o.emoji}</div>
                {o.label}
              </button>
            ))}
          </div>

          {selectedOutcome && (
            <>
              {outcomeRequiresCallback && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'block' }}>Wanneer terugbellen?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input type="date" value={callbackDate} onChange={e => setCallbackDate(e.target.value)}
                      style={inputStyle} min={new Date().toISOString().split('T')[0]} />
                    <input type="time" value={callbackTime} onChange={e => setCallbackTime(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {quickCallbacks.map(q => (
                      <button key={q.label} onClick={() => setQuickCallback(q.hours, setCallbackDate, setCallbackTime)}
                        style={{ ...btnGhost, padding: '8px 12px', fontSize: 12 }}>{q.label}</button>
                    ))}
                  </div>
                </div>
              )}

              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Notities uit gesprek (optioneel)..." rows={4}
                style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />

              <button onClick={saveOutcome} disabled={saving}
                style={{ ...btnPrimary, marginTop: 14, width: '100%', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Opslaan...' : 'Opslaan + volgende lead →'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit contact modal */}
      {showEditContact && lead && (
        <EditContactModal
          lead={lead}
          onClose={() => setShowEditContact(false)}
          onSave={async (updates) => {
            const companyUpdates: any = {}
            const contactUpdates: any = {}
            for (const k of ['name', 'phone', 'website_url', 'city', 'industry']) {
              if (k in updates) companyUpdates[k] = updates[k]
            }
            for (const k of ['first_name', 'last_name', 'email', 'phone', 'role']) {
              if (`c_${k}` in updates) contactUpdates[k] = updates[`c_${k}`]
            }
            if (Object.keys(companyUpdates).length) {
              await fetch('/api/leads/crm', { method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ action: 'update_company', payload: { company_id: lead.company_id, updates: companyUpdates }})})
            }
            if (Object.keys(contactUpdates).length && lead.contact_id) {
              await fetch('/api/leads/crm', { method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ action: 'update_contact', payload: { contact_id: lead.contact_id, updates: contactUpdates }})})
            }
            setShowEditContact(false)
            await loadNext()
          }}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

const quickCallbacks = [
  { label: '1u', hours: 1 },
  { label: '3u', hours: 3 },
  { label: 'Morgen', hours: 24 },
  { label: 'Week', hours: 168 },
]

function setQuickCallback(hours: number, setD: (s: string) => void, setT: (s: string) => void) {
  const d = new Date(Date.now() + hours * 3600 * 1000)
  setD(d.toISOString().split('T')[0])
  setT(d.toTimeString().slice(0, 5))
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const btnPrimary: React.CSSProperties = {
  background: '#3F06E3', color: 'white', border: 'none', padding: '14px 20px',
  borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  background: 'white', color: '#3F06E3', border: '1px solid #3F06E3', padding: '12px 16px',
  borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#5F5A72', border: '1px solid #E7E2F4', padding: '12px 16px',
  borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer',
}
const inputStyle: React.CSSProperties = {
  padding: '10px 12px', border: '1px solid #E7E2F4', borderRadius: 10, fontSize: 14, outline: 'none',
}

function EditContactModal({ lead, onClose, onSave }: { lead: Lead, onClose: () => void, onSave: (u: any) => void }) {
  const c = lead.lead_companies
  const p = lead.lead_contacts
  const [form, setForm] = useState({
    name: c?.name || '', phone: c?.phone || '', website_url: c?.website_url || '', city: c?.city || '', industry: c?.industry || '',
    c_first_name: p?.first_name || '', c_last_name: p?.last_name || '', c_email: p?.email || '', c_phone: p?.phone || '', c_role: p?.role || '',
  })
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Bewerk lead</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Bedrijf</div>
        {[
          { k: 'name', label: 'Bedrijfsnaam' },
          { k: 'phone', label: 'Telefoon', type: 'tel' },
          { k: 'website_url', label: 'Website' },
          { k: 'city', label: 'Stad' },
          { k: 'industry', label: 'Branche' },
        ].map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input type={f.type || 'text'} value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
              style={{ ...inputStyle, width: '100%' }} />
          </div>
        ))}

        <div style={{ fontSize: 12, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '18px 0 8px' }}>Contactpersoon</div>
        {[
          { k: 'c_first_name', label: 'Voornaam' },
          { k: 'c_last_name', label: 'Achternaam' },
          { k: 'c_email', label: 'Email', type: 'email' },
          { k: 'c_phone', label: 'Direct telefoon', type: 'tel' },
          { k: 'c_role', label: 'Functie' },
        ].map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input type={f.type || 'text'} value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
              style={{ ...inputStyle, width: '100%' }} />
          </div>
        ))}

        <button onClick={() => onSave(form)} style={{ ...btnPrimary, width: '100%', marginTop: 14 }}>Opslaan</button>
      </div>
    </div>
  )
}
