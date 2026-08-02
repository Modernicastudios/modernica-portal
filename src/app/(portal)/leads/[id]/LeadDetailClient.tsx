'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, Globe, Mail, MapPin, User, Building2, ArrowLeft, Edit3, Save, X, Calendar, PhoneCall, FileText, Clock, ChevronRight, MessageCircle, Send } from 'lucide-react'
import { PIPELINE_STAGES, CALL_OUTCOMES, type PipelineStage, type CallOutcome } from '@/types/leadmachine'

interface Props {
  outreach: any
  calls: any[]
  notes: any[]
  meetings: any[]
  activities: any[]
  contacts: any[]
  users: { id: string, full_name: string | null }[]
  currentUserId: string
}

type Tab = 'overview' | 'timeline' | 'calls' | 'notes' | 'meetings'

export default function LeadDetailClient({ outreach: initial, calls: initCalls, notes: initNotes, meetings: initMeetings, activities: initActs, contacts, users, currentUserId }: Props) {
  const [outreach, setOutreach] = useState<any>(initial)
  const [calls, setCalls] = useState(initCalls)
  const [notes, setNotes] = useState(initNotes)
  const [meetings, setMeetings] = useState(initMeetings)
  const [activities, setActivities] = useState(initActs)
  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState<'none' | 'company' | 'contact'>('none')
  const [newNote, setNewNote] = useState('')

  const co = outreach.lead_companies
  const ct = outreach.lead_contacts
  const stage = PIPELINE_STAGES.find(s => s.key === outreach.pipeline_stage) || PIPELINE_STAGES[0]

  async function api(action: string, payload: any) {
    const r = await fetch('/api/leads/crm', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action, payload }),
    })
    return r.json()
  }

  async function refresh() {
    const r = await fetch(`/api/leads/crm?action=lead&id=${outreach.id}`)
    const d = await r.json()
    if (d.outreach) {
      setOutreach(d.outreach)
      setCalls(d.calls)
      setNotes(d.notes)
      setMeetings(d.meetings)
      setActivities(d.activities)
    }
  }

  async function changeStage(newStage: PipelineStage) {
    await api('update_outreach', { outreach_id: outreach.id, updates: { pipeline_stage: newStage }})
    await refresh()
  }

  async function assignTo(userId: string | null) {
    await api('update_outreach', { outreach_id: outreach.id, updates: { assigned_to: userId }})
    await refresh()
  }

  async function addNote() {
    if (!newNote.trim()) return
    await api('add_note', { company_id: outreach.company_id, outreach_id: outreach.id, contact_id: outreach.contact_id, body: newNote.trim() })
    setNewNote('')
    await refresh()
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Link href="/leads" style={{ ...backBtn, textDecoration: 'none', display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Terug naar leads
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 16 }}>
        {/* MAIN */}
        <div>
          {/* Header card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: 100,
                  background: stage.color + '20', color: stage.color, fontSize: 11, fontWeight: 700, marginBottom: 8,
                }}>{stage.label}</span>
                <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>{co?.name}</h1>
                {co?.industry && <div style={{ fontSize: 14, color: 'var(--muted)' }}>{co.industry}</div>}
              </div>
              <button onClick={() => setEditing(editing === 'company' ? 'none' : 'company')} style={ghostBtn}>
                <Edit3 size={14} /> Bewerk
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 16 }}>
              {co?.phone && <InfoLine icon={<Phone size={14} />} label="Telefoon" value={co.phone} href={`tel:${co.phone}`} />}
              {co?.website_url && <InfoLine icon={<Globe size={14} />} label="Website" value={co.domain || co.website_url} href={co.website_url} />}
              {co?.city && <InfoLine icon={<MapPin size={14} />} label="Locatie" value={co.city} />}
              {co?.employee_count && <InfoLine icon={<Building2 size={14} />} label="Medewerkers" value={String(co.employee_count)} />}
            </div>

            {editing === 'company' && (
              <EditForm
                item={co}
                fields={[
                  { k: 'name', label: 'Bedrijfsnaam' },
                  { k: 'phone', label: 'Telefoon' },
                  { k: 'website_url', label: 'Website' },
                  { k: 'city', label: 'Stad' },
                  { k: 'postcode', label: 'Postcode' },
                  { k: 'industry', label: 'Branche' },
                  { k: 'employee_count', label: 'Medewerkers', type: 'number' },
                  { k: 'notes', label: 'Aantekening', textarea: true },
                ]}
                onSave={async (updates: Record<string, unknown>) => {
                  await api('update_company', { company_id: co.id, updates })
                  setEditing('none'); await refresh()
                }}
                onCancel={() => setEditing('none')}
              />
            )}
          </div>

          {/* Contact card */}
          {ct && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1ECFF', color: '#3F06E3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {(ct.first_name?.[0] || ct.full_name?.[0] || 'C').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{ct.full_name || `${ct.first_name || ''} ${ct.last_name || ''}`.trim() || 'Onbekend'}</div>
                    {ct.role && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{ct.role}</div>}
                  </div>
                </div>
                <button onClick={() => setEditing(editing === 'contact' ? 'none' : 'contact')} style={ghostBtn}>
                  <Edit3 size={14} /> Bewerk
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                {ct.email && <InfoLine icon={<Mail size={14} />} label="Email" value={ct.email} href={`mailto:${ct.email}`} />}
                {ct.phone && <InfoLine icon={<Phone size={14} />} label="Direct nummer" value={ct.phone} href={`tel:${ct.phone}`} />}
              </div>

              {editing === 'contact' && (
                <EditForm
                  item={ct}
                  fields={[
                    { k: 'first_name', label: 'Voornaam' },
                    { k: 'last_name', label: 'Achternaam' },
                    { k: 'email', label: 'Email', type: 'email' },
                    { k: 'phone', label: 'Telefoon' },
                    { k: 'role', label: 'Functie' },
                    { k: 'linkedin_url', label: 'LinkedIn' },
                  ]}
                  onSave={async (updates: Record<string, unknown>) => {
                    await api('update_contact', { contact_id: ct.id, updates })
                    setEditing('none'); await refresh()
                  }}
                  onCancel={() => setEditing('none')}
                />
              )}
            </div>
          )}

          {/* Tabs */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #E7E2F4' }}>
              {(['overview','timeline','calls','notes','meetings'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '10px 16px', background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${tab === t ? '#3F06E3' : 'transparent'}`,
                  color: tab === t ? '#3F06E3' : '#5F5A72', fontWeight: 600, cursor: 'pointer',
                  fontSize: 14, textTransform: 'capitalize',
                }}>{t === 'overview' ? 'Overzicht' : t}</button>
              ))}
            </div>

            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                <StatCard label="Belpogingen" value={calls.length} icon={<PhoneCall size={20} />} />
                <StatCard label="Notities" value={notes.length} icon={<FileText size={20} />} />
                <StatCard label="Afspraken" value={meetings.length} icon={<Calendar size={20} />} />
                <StatCard label="Activiteiten" value={activities.length} icon={<Clock size={20} />} />
              </div>
            )}

            {tab === 'timeline' && (
              <div>
                {activities.length === 0 && <EmptyState text="Nog geen activiteit" />}
                {activities.map(a => <ActivityItem key={a.id} act={a} users={users} />)}
              </div>
            )}

            {tab === 'calls' && (
              <div>
                {calls.length === 0 && <EmptyState text="Nog geen belpogingen" />}
                {calls.map(c => {
                  const outc = CALL_OUTCOMES.find(o => o.key === c.outcome)
                  return (
                    <div key={c.id} style={{ padding: 14, border: '1px solid #E7E2F4', borderRadius: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700 }}>{outc?.emoji} {outc?.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(c.called_at)}</span>
                      </div>
                      {c.duration_seconds && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Duur: {Math.floor(c.duration_seconds/60)}:{(c.duration_seconds%60).toString().padStart(2,'0')}</div>}
                      {c.notes && <div style={{ fontSize: 14, color: 'var(--foreground)', lineHeight: 1.5 }}>{c.notes}</div>}
                      {c.callback_at && (
                        <div style={{ fontSize: 12, color: '#3F06E3', marginTop: 6, fontWeight: 600 }}>
                          📞 Terugbellen: {formatDate(c.callback_at)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'notes' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                    placeholder="Nieuwe notitie..." rows={3}
                    style={{ ...inputStyle, width: '100%', fontFamily: 'inherit', resize: 'vertical' }} />
                  <button onClick={addNote} style={{ ...primaryBtn, marginTop: 8 }}>
                    <Send size={14} /> Opslaan
                  </button>
                </div>
                {notes.length === 0 && <EmptyState text="Nog geen notities" />}
                {notes.map(n => (
                  <div key={n.id} style={{ padding: 14, background: '#F6F3FF', borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{formatDate(n.created_at)}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'meetings' && (
              <div>
                {meetings.length === 0 && <EmptyState text="Nog geen afspraken" />}
                {meetings.map(m => (
                  <div key={m.id} style={{ padding: 14, border: '1px solid #E7E2F4', borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>📅 {m.meeting_type}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(m.scheduled_at)}</span>
                    </div>
                    {m.notes && <div style={{ fontSize: 14, marginTop: 6 }}>{m.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div>
          {/* Stage picker */}
          <div style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5F5A72', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>Stage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PIPELINE_STAGES.map(s => (
                <button key={s.key} onClick={() => changeStage(s.key)} style={{
                  padding: '8px 12px', borderRadius: 8, textAlign: 'left',
                  border: `1px solid ${outreach.pipeline_stage === s.key ? s.color : '#E7E2F4'}`,
                  background: outreach.pipeline_stage === s.key ? s.color + '15' : 'transparent',
                  color: outreach.pipeline_stage === s.key ? s.color : '#1A1730',
                  fontWeight: outreach.pipeline_stage === s.key ? 700 : 500,
                  fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>{s.label}</span>
                  {outreach.pipeline_stage === s.key && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment */}
          <div style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5F5A72', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>Toegewezen aan</div>
            <select value={outreach.assigned_to || ''} onChange={e => assignTo(e.target.value || null)} style={{ ...inputStyle, width: '100%' }}>
              <option value="">Niemand</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 6)}</option>)}
            </select>
          </div>

          {/* Next action */}
          {outreach.next_action_at && (
            <div style={{ ...cardStyle, background: '#F1ECFF', border: '1px solid #3F06E3' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', marginBottom: 6 }}>Volgende actie</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{formatDate(outreach.next_action_at)}</div>
              {outreach.next_action_note && <div style={{ fontSize: 12, color: '#5F5A72', marginTop: 4 }}>{outreach.next_action_note}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoLine({ icon, label, value, href }: any) {
  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#3F06E3' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  )
  return href ? <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</a> : inner
}

function StatCard({ label, value, icon }: any) {
  return (
    <div style={{ padding: 16, background: '#F6F3FF', borderRadius: 12 }}>
      <div style={{ color: '#3F06E3', marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>{text}</div>
}

function ActivityItem({ act, users }: any) {
  const user = users.find((u: any) => u.id === act.actor_id)
  const icons: Record<string, string> = {
    call_logged: '📞', note_added: '📝', email_sent: '📤', email_opened: '👁️', email_replied: '💬',
    meeting_scheduled: '📅', meeting_held: '✅', stage_changed: '🔄', assigned: '👤', imported: '⬇️',
    contact_updated: '✏️', company_updated: '✏️',
  }
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F6F3FF' }}>
      <div style={{ fontSize: 20 }}>{icons[act.type] || '•'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{act.summary}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
          {user?.full_name || 'systeem'} · {formatDate(act.created_at)}
        </div>
      </div>
    </div>
  )
}

function EditForm({ item, fields, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>(fields.reduce((a: any, f: any) => ({ ...a, [f.k]: item?.[f.k] || '' }), {}))
  return (
    <div style={{ padding: 16, background: '#FAFAFF', borderRadius: 10, marginTop: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {fields.map((f: any) => (
          <div key={f.k}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{f.label}</label>
            {f.textarea ? (
              <textarea rows={3} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                style={{ ...inputStyle, width: '100%', fontFamily: 'inherit' }} />
            ) : (
              <input type={f.type || 'text'} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                style={{ ...inputStyle, width: '100%' }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => onSave(form)} style={primaryBtn}><Save size={14} /> Opslaan</button>
        <button onClick={onCancel} style={ghostBtn}><X size={14} /> Annuleer</button>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3600000
  if (diffH < 1) return `${Math.floor(diffH * 60)} min geleden`
  if (diffH < 24) return `${Math.floor(diffH)}u geleden`
  return d.toLocaleString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const cardStyle: React.CSSProperties = {
  background: 'white', border: '1px solid #E7E2F4', borderRadius: 16,
  padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
}
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #E7E2F4', borderRadius: 8, fontSize: 14, outline: 'none',
}
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
  background: '#3F06E3', color: 'white', border: 'none', borderRadius: 8,
  fontWeight: 600, fontSize: 13, cursor: 'pointer',
}
const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
  background: 'transparent', color: '#5F5A72', border: '1px solid #E7E2F4', borderRadius: 8,
  fontSize: 12, cursor: 'pointer',
}
const backBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
  background: 'transparent', color: '#5F5A72', border: '1px solid #E7E2F4', borderRadius: 8,
  fontSize: 13, cursor: 'pointer',
}
