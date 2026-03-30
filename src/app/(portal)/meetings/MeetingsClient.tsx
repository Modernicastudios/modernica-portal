'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Meeting {
  id: string
  title: string
  meeting_date: string
  client_id: string | null
  attendees: string | null
  agenda: string | null
  notes: string | null
  summary: string | null
  action_items: string | null
  status: 'gepland' | 'afgerond' | 'geannuleerd'
  created_at: string
  clients?: { company_name: string } | null
}

interface Props {
  meetings: Meeting[]
  clients: any[]
  projects: any[]
  agencyId: string
  userId: string
  userName: string
  isAdmin: boolean
}

const STATUS_CFG = {
  gepland: { label: 'Gepland', color: '#1a3fe4', bg: 'rgba(26,63,228,.1)' },
  afgerond: { label: 'Afgerond', color: '#00b89c', bg: 'rgba(0,184,156,.1)' },
  geannuleerd: { label: 'Geannuleerd', color: '#9ca3af', bg: 'rgba(156,163,175,.1)' },
}

const EMPTY_FORM = {
  title: '',
  meeting_date: new Date().toISOString().slice(0, 16),
  client_id: '',
  attendees: '',
  agenda: '',
  notes: '',
  summary: '',
  action_items: '',
  status: 'gepland' as const,
}

export default function MeetingsClient({ meetings: initial, clients, projects, agencyId, userId, userName, isAdmin }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>(initial)
  const [selected, setSelected] = useState<Meeting | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'gepland' | 'afgerond'>('all')
  const [activeTab, setActiveTab] = useState<'agenda' | 'notities' | 'actiepunten'>('notities')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [showSync, setShowSync] = useState(false)
  const [syncItems, setSyncItems] = useState<{ text: string; projectId: string; done: boolean }[]>([])
  const [syncing, setSyncing] = useState(false)

  const supabase = createClient()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = meetings.filter(m => filter === 'all' || m.status === filter)

  async function createMeeting() {
    if (!form.title.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('meeting_notes')
      .insert({ ...form, client_id: form.client_id || null, agency_id: agencyId, created_by: userId })
      .select('*, clients(company_name)')
      .single()
    if (!error && data) {
      setMeetings(prev => [data as Meeting, ...prev])
      setShowNew(false)
      setForm({ ...EMPTY_FORM })
      setSelected(data as Meeting)
      showToast('Vergadering aangemaakt!')
    }
    setLoading(false)
  }

  async function saveEdits() {
    if (!selected || !editForm) return
    setLoading(true)
    const { data } = await supabase
      .from('meeting_notes')
      .update({ ...editForm, client_id: editForm.client_id || null })
      .eq('id', selected.id)
      .select('*, clients(company_name)')
      .single()
    if (data) {
      setMeetings(prev => prev.map(m => m.id === data.id ? data as Meeting : m))
      setSelected(data as Meeting)
      setEditMode(false)
      showToast('Opgeslagen!')
    }
    setLoading(false)
  }

  async function deleteMeeting(id: string) {
    await supabase.from('meeting_notes').delete().eq('id', id)
    setMeetings(prev => prev.filter(m => m.id !== id))
    setSelected(null)
    showToast('Vergadering verwijderd')
  }

  function autoSummarize(meeting: Meeting) {
    setSummarizing(true)
    // Build summary from agenda + notes + action items
    const parts: string[] = []
    if (meeting.agenda?.trim()) parts.push(`Agenda:\n${meeting.agenda}`)
    if (meeting.notes?.trim()) parts.push(`Besproken:\n${meeting.notes}`)
    if (meeting.action_items?.trim()) parts.push(`Actiepunten:\n${meeting.action_items}`)

    const summary = parts.length > 0
      ? `Samenvatting vergadering "${meeting.title}" (${formatDate(meeting.meeting_date)})\n\n${parts.join('\n\n')}`
      : 'Voeg agenda, notities en actiepunten toe om een samenvatting te genereren.'

    setTimeout(async () => {
      const newSummary = summary
      await supabase.from('meeting_notes').update({ summary: newSummary }).eq('id', meeting.id)
      setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, summary: newSummary } : m))
      setSelected(prev => prev ? { ...prev, summary: newSummary } : null)
      if (editForm) setEditForm((f: any) => ({ ...f, summary: newSummary }))
      setSummarizing(false)
      showToast('Samenvatting gegenereerd!')
    }, 800)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

  function parseActionItems(text: string) {
    return text.split('\n')
      .filter(l => l.trim() && !l.trim().startsWith('#'))
      .map(l => ({
        text: l.replace(/^-\s*\[.\]\s*/, '').replace(/^-\s*/, '').trim(),
        projectId: '',
        done: l.includes('[x]') || l.includes('[X]'),
      }))
      .filter(item => item.text.length > 0)
  }

  function openSync() {
    if (!selected?.action_items) return
    setSyncItems(parseActionItems(selected.action_items))
    setShowSync(true)
  }

  async function syncToTasks() {
    setSyncing(true)
    const toCreate = syncItems.filter(item => !item.done)
    for (const item of toCreate) {
      await supabase.from('project_todos').insert({
        project_id: item.projectId || null,
        title: item.text,
        done: false,
        meeting_id: selected?.id,
      })
    }
    setSyncing(false)
    setShowSync(false)
    showToast(`${toCreate.length} actiepunten gesynchroniseerd naar taken! ✅`)
  }

  const upcoming = meetings.filter(m => m.status === 'gepland').length
  const done = meetings.filter(m => m.status === 'afgerond').length

  return (
    <div className="animate-fade-up" style={{ display: 'flex', gap: '0', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 2000, background: '#1a3fe4', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* LEFT SIDEBAR: Meeting list */}
      <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.15rem' }}>Vergaderingen</h1>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>{upcoming} gepland · {done} afgerond</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowNew(true)}
                style={{ background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                + Nieuw
              </button>
            )}
          </div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {([
              { key: 'all', label: 'Alle' },
              { key: 'gepland', label: 'Gepland' },
              { key: 'afgerond', label: 'Afgerond' },
            ] as const).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '4px 12px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === f.key ? '#1a3fe4' : 'var(--bg)',
                color: filter === f.key ? '#fff' : 'var(--muted)',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
              <div style={{ fontSize: '.85rem' }}>Geen vergaderingen</div>
            </div>
          ) : filtered.map(meeting => {
            const sc = STATUS_CFG[meeting.status] || STATUS_CFG.gepland
            const isSelected = selected?.id === meeting.id
            return (
              <div
                key={meeting.id}
                onClick={() => { setSelected(meeting); setEditMode(false); setActiveTab('notities') }}
                style={{
                  padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: isSelected ? 'rgba(26,63,228,.06)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #1a3fe4' : '3px solid transparent',
                  transition: 'all .1s',
                }}
                onMouseEnter={e => !isSelected && ((e.currentTarget as HTMLElement).style.background = 'var(--bg)')}
                onMouseLeave={e => !isSelected && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '5px' }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', lineHeight: 1.3, flex: 1 }}>{meeting.title}</div>
                  <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: sc.bg, color: sc.color, flexShrink: 0 }}>
                    {sc.label}
                  </span>
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>
                  📅 {formatDate(meeting.meeting_date)}
                </div>
                {meeting.clients?.company_name && (
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>👤 {meeting.clients.company_name}</div>
                )}
                {meeting.summary && (
                  <div style={{ fontSize: '.68rem', color: '#00b89c', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ✓ Samenvatting beschikbaar
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT: Meeting detail */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--bg)' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: '12px' }}>
            <div style={{ fontSize: '3rem' }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>Selecteer een vergadering</div>
            <div style={{ fontSize: '.85rem' }}>of maak een nieuwe aan</div>
            {isAdmin && (
              <button onClick={() => setShowNew(true)} style={{ marginTop: '8px', background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>
                + Nieuwe vergadering
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Meeting header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  {editMode ? (
                    <input
                      value={editForm?.title || ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
                      style={{ width: '100%', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.3rem', border: 'none', borderBottom: '2px solid #1a3fe4', background: 'none', outline: 'none', paddingBottom: '4px', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '4px' }}>{selected.title}</h2>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>📅 {formatDate(selected.meeting_date)}</span>
                    {selected.clients?.company_name && <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>👤 {selected.clients.company_name}</span>}
                    {selected.attendees && <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>👥 {selected.attendees}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {isAdmin && !editMode && (
                    <>
                      <button
                        onClick={() => autoSummarize(selected)}
                        disabled={summarizing}
                        style={{ padding: '8px 14px', background: 'rgba(0,184,156,.1)', color: '#00b89c', border: '1px solid rgba(0,184,156,.3)', borderRadius: '8px', cursor: summarizing ? 'not-allowed' : 'pointer', fontSize: '.8rem', fontWeight: 700, opacity: summarizing ? 0.7 : 1 }}
                      >
                        {summarizing ? '⏳ Genereren...' : '✨ Samenvatten'}
                      </button>
                      <button
                        onClick={() => { setEditMode(true); setEditForm({ ...selected, client_id: selected.client_id || '' }) }}
                        style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 }}
                      >
                        ✏️ Bewerken
                      </button>
                      <button
                        onClick={() => deleteMeeting(selected.id)}
                        style={{ padding: '8px 12px', background: 'rgba(229,57,53,.1)', color: '#e53935', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '.85rem' }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  {editMode && (
                    <>
                      <button onClick={() => setEditMode(false)} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem' }}>Annuleren</button>
                      <button onClick={saveEdits} disabled={loading} style={{ padding: '8px 18px', background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Opslaan...' : 'Opslaan'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status selector */}
              {editMode && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {(Object.entries(STATUS_CFG) as [string, { label: string; color: string; bg: string }][]).map(([k, v]) => (
                    <button key={k} onClick={() => setEditForm((f: any) => ({ ...f, status: k }))} style={{
                      padding: '4px 12px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${editForm?.status === k ? v.color : 'var(--border)'}`,
                      background: editForm?.status === k ? v.bg : 'transparent',
                      color: editForm?.status === k ? v.color : 'var(--muted)',
                    }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0', marginTop: '8px' }}>
                {([
                  { key: 'agenda', label: '📋 Agenda' },
                  { key: 'notities', label: '📝 Notities' },
                  { key: 'actiepunten', label: '✅ Actiepunten' },
                ] as const).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '.82rem', fontWeight: activeTab === tab.key ? 700 : 400,
                    color: activeTab === tab.key ? '#1a3fe4' : 'var(--muted)',
                    borderBottom: activeTab === tab.key ? '2px solid #1a3fe4' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Summary card - always show if available */}
              {selected.summary && (
                <div style={{ background: 'linear-gradient(135deg, rgba(26,63,228,.06), rgba(0,184,156,.06))', border: '1px solid rgba(26,63,228,.2)', borderRadius: '12px', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>✨</span>
                    <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#1a3fe4' }}>Automatische samenvatting</span>
                    {isAdmin && (
                      <button
                        onClick={() => autoSummarize(selected)}
                        style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#1a3fe4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Vernieuwen
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                    {editMode ? (
                      <textarea
                        value={editForm?.summary || ''}
                        onChange={e => setEditForm((f: any) => ({ ...f, summary: e.target.value }))}
                        rows={6}
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '.85rem', background: 'rgba(255,255,255,.5)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    ) : selected.summary}
                  </div>
                </div>
              )}

              {activeTab === 'agenda' && (
                <div>
                  <label style={labelStyle}>Agenda punten</label>
                  {editMode ? (
                    <textarea
                      value={editForm?.agenda || ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, agenda: e.target.value }))}
                      placeholder="1. Opening&#10;2. Terugkoppeling vorige vergadering&#10;3. Campagne update&#10;4. Vragen&#10;5. Afsluiting"
                      rows={10}
                      style={textareaStyle}
                    />
                  ) : (
                    <div style={contentBlockStyle}>
                      {selected.agenda ? (
                        <pre style={{ fontFamily: 'inherit', fontSize: '.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text)' }}>
                          {selected.agenda}
                        </pre>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Geen agenda ingesteld. Klik op Bewerken om toe te voegen.</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notities' && (
                <div>
                  <label style={labelStyle}>Vergadernotities</label>
                  {editMode ? (
                    <textarea
                      value={editForm?.notes || ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))}
                      placeholder="Wat is er besproken? Schrijf hier alle notities en beslissingen..."
                      rows={14}
                      style={textareaStyle}
                    />
                  ) : (
                    <div style={contentBlockStyle}>
                      {selected.notes ? (
                        <pre style={{ fontFamily: 'inherit', fontSize: '.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text)' }}>
                          {selected.notes}
                        </pre>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Geen notities. Klik op Bewerken om te beginnen.</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'actiepunten' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Actiepunten</label>
                    {selected.action_items && isAdmin && !editMode && (
                      <button
                        onClick={openSync}
                        style={{ padding: '6px 14px', background: 'rgba(0,184,156,.1)', color: '#00b89c', border: '1px solid rgba(0,184,156,.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700 }}
                      >
                        ➡️ Synchroniseer naar taken
                      </button>
                    )}
                  </div>
                  {editMode ? (
                    <textarea
                      value={editForm?.action_items || ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, action_items: e.target.value }))}
                      placeholder="- [ ] Jan maakt design klaar vóór vrijdag&#10;- [ ] Sarah stuurt offerte op&#10;- [ ] Klant levert logo aan"
                      rows={10}
                      style={textareaStyle}
                    />
                  ) : (
                    <div style={contentBlockStyle}>
                      {selected.action_items ? (
                        <ActionItems text={selected.action_items} />
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Geen actiepunten. Klik op Bewerken om toe te voegen.</span>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '10px', fontSize: '.78rem', color: 'var(--muted)' }}>
                    Tip: gebruik <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: '4px' }}>- [ ] taak</code> voor open taken en <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: '4px' }}>- [x] taak</code> voor afgerond
                  </div>
                </div>
              )}

              {/* Attendees & meta in edit mode */}
              {editMode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '8px' }}>
                  <div>
                    <label style={labelStyle}>Datum & tijd</label>
                    <input type="datetime-local" value={editForm?.meeting_date?.slice(0,16) || ''} onChange={e => setEditForm((f: any) => ({ ...f, meeting_date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Klant</label>
                    <select value={editForm?.client_id || ''} onChange={e => setEditForm((f: any) => ({ ...f, client_id: e.target.value }))} style={inputStyle}>
                      <option value="">Intern / Geen klant</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={labelStyle}>Deelnemers (namen, kommagescheiden)</label>
                    <input value={editForm?.attendees || ''} onChange={e => setEditForm((f: any) => ({ ...f, attendees: e.target.value }))} placeholder="Jan, Sarah, Klant naam..." style={inputStyle} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sync to tasks modal */}
      {showSync && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowSync(false)}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '560px', boxShadow: '0 24px 60px rgba(0,0,0,.22)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1rem' }}>➡️ Actiepunten naar taken</h3>
              <button onClick={() => setShowSync(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '16px' }}>
              Koppel elk actiepunt aan een project. Afgeronde items worden overgeslagen.
            </p>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {syncItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--bg)', borderRadius: '8px', border: `1px solid ${item.done ? 'var(--border)' : 'var(--accent3)'}`, opacity: item.done ? 0.5 : 1 }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${item.done ? '#00b89c' : 'var(--border)'}`, background: item.done ? '#00b89c' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.done && <span style={{ color: '#fff', fontSize: '.65rem' }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: '.85rem', textDecoration: item.done ? 'line-through' : 'none', color: 'var(--text)' }}>{item.text}</span>
                  {!item.done && (
                    <select
                      value={item.projectId}
                      onChange={e => setSyncItems(prev => prev.map((it, idx) => idx === i ? { ...it, projectId: e.target.value } : it))}
                      style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '.75rem', background: 'var(--card)', outline: 'none', maxWidth: '160px' }}
                    >
                      <option value="">Geen project</option>
                      {projects.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowSync(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '.88rem' }}>Annuleren</button>
              <button onClick={syncToTasks} disabled={syncing} style={{ flex: 2, padding: '10px', background: '#00b89c', color: '#fff', border: 'none', borderRadius: '8px', cursor: syncing ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '.88rem', opacity: syncing ? 0.7 : 1 }}>
                {syncing ? 'Synchroniseren...' : `✅ ${syncItems.filter(i => !i.done).length} taken aanmaken`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New meeting modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>Nieuwe vergadering</h3>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Titel *</label>
                <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && createMeeting()} placeholder="Bijv. Maandelijks klantoverleg..." style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Datum & tijd</label>
                  <input type="datetime-local" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Klant</label>
                  <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={inputStyle}>
                    <option value="">Intern / Geen klant</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Deelnemers</label>
                <input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="Jan, Sarah, Klant naam..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Agenda (optioneel)</label>
                <textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} placeholder="1. Opening&#10;2. ..." rows={3} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '.88rem' }}>Annuleren</button>
              <button onClick={createMeeting} disabled={loading || !form.title.trim()} style={{ flex: 2, padding: '10px', background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '.88rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Aanmaken...' : 'Vergadering aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionItems({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim())
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, i) => {
        const isDone = line.includes('[x]') || line.includes('[X]')
        const clean = line.replace(/^-\s*\[.\]\s*/, '').replace(/^-\s*/, '').trim()
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${isDone ? '#00b89c' : 'var(--border)'}`, background: isDone ? '#00b89c' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              {isDone && <span style={{ color: '#fff', fontSize: '.65rem', fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: '.88rem', lineHeight: 1.5, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--muted)' : 'var(--text)' }}>{clean}</span>
          </div>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px',
  fontSize: '.85rem', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '10px',
  fontSize: '.88rem', background: 'var(--bg)', outline: 'none', resize: 'vertical',
  fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box',
}

const contentBlockStyle: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
  padding: '16px 18px', minHeight: '120px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text)',
}
