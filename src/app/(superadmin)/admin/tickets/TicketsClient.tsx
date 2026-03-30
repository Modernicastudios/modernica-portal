'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ticket {
  id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  admin_reply: string | null
  created_at: string
  agencies?: { name: string } | null
  user_profiles?: { full_name: string; email: string } | null
}

const STATUS_COLORS = {
  open: '#e53935',
  in_progress: 'var(--accent4)',
  resolved: 'var(--accent3)',
}
const STATUS_LABELS = {
  open: '🔴 Open',
  in_progress: '🟡 In behandeling',
  resolved: '✅ Opgelost',
}
const PRIORITY_COLORS = {
  low: 'var(--muted)',
  normal: 'var(--accent2)',
  high: 'var(--accent4)',
  urgent: '#e53935',
}

export default function TicketsClient({ tickets: initial }: { tickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initial)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  async function updateTicket(id: string, updates: Partial<Ticket>) {
    setSaving(true)
    await supabase.from('support_tickets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updates } : null)
    setSaving(false)
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    await updateTicket(selected.id, {
      admin_reply: reply,
      status: 'in_progress',
      replied_at: new Date().toISOString(),
    } as any)
    setReply('')
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '6px' }}>
          💬 Support Tickets
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Beheer alle klantenservice verzoeken</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {([
          { label: 'Totaal', count: tickets.length, color: 'var(--accent1)' },
          { label: 'Open', count: tickets.filter(t => t.status === 'open').length, color: '#e53935' },
          { label: 'In behandeling', count: tickets.filter(t => t.status === 'in_progress').length, color: 'var(--accent4)' },
          { label: 'Opgelost', count: tickets.filter(t => t.status === 'resolved').length, color: 'var(--accent3)' },
        ]).map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.6rem', color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        {/* Ticket list */}
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 12px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                fontSize: '.78rem', fontWeight: 600,
                background: filter === f ? 'var(--accent1)' : 'var(--card)',
                color: filter === f ? '#fff' : 'var(--muted)',
              }}>
                {f === 'all' ? 'Alle' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                Geen tickets
              </div>
            )}
            {filtered.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => { setSelected(ticket); setReply(ticket.admin_reply || '') }}
                style={{
                  background: 'var(--card)', border: `1px solid ${selected?.id === ticket.id ? 'var(--accent1)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '14px 16px', cursor: 'pointer',
                  boxShadow: selected?.id === ticket.id ? '0 0 0 2px rgba(26,63,228,.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '.88rem', fontWeight: 600, flex: 1 }}>{ticket.subject}</div>
                  <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: '50px', background: `${PRIORITY_COLORS[ticket.priority]}20`, color: PRIORITY_COLORS[ticket.priority], fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
                    {ticket.priority}
                  </span>
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '8px' }}>
                  {(ticket.agencies as any)?.name} · {(ticket.user_profiles as any)?.full_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.72rem', color: STATUS_COLORS[ticket.status], fontWeight: 600 }}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                    {new Date(ticket.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket detail */}
        <div>
          {!selected ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
              Selecteer een ticket om te bekijken
            </div>
          ) : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>
                  {selected.subject}
                </h3>
                <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '12px' }}>
                  Van: <strong>{(selected.user_profiles as any)?.full_name}</strong> ({(selected.user_profiles as any)?.email}) ·{' '}
                  {(selected.agencies as any)?.name} · {new Date(selected.created_at).toLocaleString('nl-NL')}
                </div>

                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '14px', fontSize: '.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selected.message}
                </div>
              </div>

              {/* Status controls */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Status wijzigen</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['open', 'in_progress', 'resolved'] as const).map(s => (
                    <button key={s} onClick={() => updateTicket(selected.id, { status: s })} style={{
                      flex: 1, padding: '7px', border: `2px solid ${selected.status === s ? STATUS_COLORS[s] : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600,
                      background: selected.status === s ? `${STATUS_COLORS[s]}15` : 'var(--bg)',
                      color: selected.status === s ? STATUS_COLORS[s] : 'var(--muted)',
                    }}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply */}
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  {selected.admin_reply ? 'Antwoord bewerken' : 'Antwoord sturen'}
                </label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Typ je antwoord hier..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '10px' }}
                />
                <button
                  onClick={sendReply}
                  disabled={saving || !reply.trim()}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--accent1)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '.9rem',
                    cursor: saving || !reply.trim() ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Opslaan...' : '📨 Antwoord opslaan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
