'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin,
  Kanban, CheckSquare, Plus, X, ChevronRight, Calendar,
  Edit2, Save, Trash2,
} from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; strip: string }> = {
  backlog:          { label: 'Backlog',             color: '#6b7280', bg: 'rgba(107,114,128,.1)', strip: '#d1d5db' },
  in_progress:      { label: 'In uitvoering',       color: '#1a3fe4', bg: 'rgba(26,63,228,.1)',   strip: '#1a3fe4' },
  waiting_feedback: { label: 'Wachten op reactie',  color: '#ff7a30', bg: 'rgba(255,122,48,.1)',  strip: '#ff7a30' },
  blocked:          { label: 'Geblokkeerd',         color: '#e53935', bg: 'rgba(229,57,53,.1)',   strip: '#e53935' },
  review:           { label: 'Review',              color: '#9c27b0', bg: 'rgba(156,39,176,.1)',  strip: '#9c27b0' },
  approved:         { label: 'Goedgekeurd',         color: '#00b89c', bg: 'rgba(0,184,156,.1)',   strip: '#00b89c' },
  archived:         { label: 'Archief',             color: '#9ca3af', bg: 'rgba(156,163,175,.1)', strip: '#9ca3af' },
}

const TASK_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: 'Te doen',      color: '#6b7280', bg: 'rgba(107,114,128,.1)' },
  in_progress: { label: 'Bezig',        color: '#1a3fe4', bg: 'rgba(26,63,228,.1)'  },
  waiting:     { label: 'Wachtend',     color: '#ff7a30', bg: 'rgba(255,122,48,.1)' },
  done:        { label: 'Klaar',        color: '#00b89c', bg: 'rgba(0,184,156,.1)'  },
}

interface Props {
  client: any
  projects: any[]
  tasks: any[]
  teamMembers: any[]
  agencyId: string
  currentUserId: string
  isAdmin: boolean
}

export default function ClientWorkspaceClient({
  client: initialClient, projects: initialProjects, tasks, agencyId, currentUserId, isAdmin
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [client, setClient] = useState(initialClient)
  const [projects] = useState(initialProjects)
  const [toast, setToast] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    company_name: client.company_name || '',
    industry: client.industry || '',
    city: client.city || '',
    contact_email: client.contact_email || '',
    contact_name: client.contact_name || '',
    phone: client.phone || '',
    website: client.website || '',
    notes: client.notes || '',
  })
  const [saving, setSaving] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const initials = (client.company_name || '?').slice(0, 2).toUpperCase()

  const activeProjects = projects.filter(p => !['approved', 'archived'].includes(p.status))
  const doneProjects   = projects.filter(p => ['approved', 'archived'].includes(p.status))
  const openTasks      = tasks.filter(t => t.status !== 'done').length

  async function saveEdit() {
    setSaving(true)
    const { data, error } = await supabase
      .from('clients')
      .update(editForm)
      .eq('id', client.id)
      .select()
      .single()
    if (!error && data) {
      setClient(data)
      setEditMode(false)
      showToast('Klant bijgewerkt')
    }
    setSaving(false)
  }

  async function deleteClient() {
    if (!confirm(`Klant "${client.company_name}" definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    await supabase.from('clients').delete().eq('id', client.id)
    router.push('/clients')
  }

  return (
    <div className="animate-fade-up">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 2000,
          background: 'var(--accent1)', color: '#fff', padding: '12px 20px',
          borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(26,63,228,.3)',
        }}>{toast}</div>
      )}

      {/* Back + header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/clients" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '.82rem', textDecoration: 'none', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', transition: 'background .12s' }}>
            <ArrowLeft size={14} /> Klanten
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
                {client.company_name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
                {client.industry && <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{client.industry}</span>}
                {client.city && (
                  <>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '.75rem', color: 'var(--muted)' }}>
                      <MapPin size={11} /> {client.city}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.84rem', fontWeight: 600, color: 'var(--text)' }}
              >
                <Edit2 size={14} /> Bewerken
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.84rem', color: 'var(--muted)' }}
                >
                  <X size={14} /> Annuleren
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.84rem', fontWeight: 700, opacity: saving ? .7 : 1 }}
                >
                  <Save size={14} /> {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* LEFT: projects + tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { label: 'Actieve projecten', value: activeProjects.length, color: 'var(--accent1)' },
              { label: 'Afgeronde projecten', value: doneProjects.length, color: '#00b89c' },
              { label: 'Open taken', value: openTasks, color: '#ff7a30' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-syne), sans-serif', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Kanban size={16} style={{ color: 'var(--accent1)' }} />
                <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>Projecten</span>
                <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '1px 8px', borderRadius: '50px', background: 'rgba(26,63,228,.08)', color: 'var(--accent1)', border: '1px solid rgba(26,63,228,.15)' }}>{projects.length}</span>
              </div>
              <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.78rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                Alle projecten <ChevronRight size={13} />
              </Link>
            </div>

            {projects.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem', fontStyle: 'italic' }}>
                Geen projecten voor deze klant
              </div>
            )}

            {projects.map((project, i) => {
              const st = STATUS_MAP[project.status] || STATUS_MAP.backlog
              const todos = project.project_todos || []
              const done  = todos.filter((t: any) => t.done).length
              const pct   = todos.length > 0 ? Math.round((done / todos.length) * 100) : null
              return (
                <div
                  key={project.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 24px',
                    borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background .1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  onClick={() => router.push('/projects')}
                >
                  <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: st.strip, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: '3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{project.title}</div>
                    {pct !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', maxWidth: '120px' }}>
                          <div style={{ height: '100%', background: pct === 100 ? '#00b89c' : 'var(--accent1)', width: `${pct}%`, borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>{done}/{todos.length}</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', background: st.bg, color: st.color, flexShrink: 0 }}>
                    {st.label}
                  </span>
                  {project.deadline && (() => {
                    const today = new Date(); today.setHours(0,0,0,0)
                    const due   = new Date(project.deadline); due.setHours(0,0,0,0)
                    const diff  = Math.round((due.getTime() - today.getTime()) / 86400000)
                    if (diff < 0) return <span style={{ fontSize: '.65rem', color: '#e53935', fontWeight: 700, flexShrink: 0 }}>{Math.abs(diff)}d te laat</span>
                    if (diff <= 3) return <span style={{ fontSize: '.65rem', color: '#ff7a30', fontWeight: 700, flexShrink: 0 }}>nog {diff}d</span>
                    return null
                  })()}
                </div>
              )
            })}
          </div>

          {/* Tasks preview */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} style={{ color: '#00b89c' }} />
                <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>Taken</span>
                <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '1px 8px', borderRadius: '50px', background: 'rgba(0,184,156,.1)', color: '#00b89c', border: '1px solid rgba(0,184,156,.2)' }}>{tasks.length}</span>
              </div>
              <Link href={`/clients/${client.id}/tasks`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.78rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                Alle taken <ChevronRight size={13} />
              </Link>
            </div>

            {tasks.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem', fontStyle: 'italic' }}>
                Geen taken voor deze klant
              </div>
            )}

            {tasks.slice(0, 6).map((task, i) => {
              const st = TASK_STATUS[task.status] || TASK_STATUS.todo
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 24px',
                    borderBottom: i < Math.min(tasks.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                    border: `2px solid ${task.status === 'done' ? '#00b89c' : 'var(--border)'}`,
                    background: task.status === 'done' ? '#00b89c' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {task.status === 'done' && <span style={{ color: '#fff', fontSize: '.55rem', fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: '.85rem', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--muted)' : 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {task.title}
                  </span>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: st.bg, color: st.color, flexShrink: 0 }}>
                    {st.label}
                  </span>
                  {task.due_date && (
                    <span style={{ fontSize: '.68rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                      <Calendar size={10} />
                      {new Date(task.due_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              )
            })}

            {tasks.length > 6 && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
                <Link href={`/clients/${client.id}/tasks`} style={{ fontSize: '.8rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                  + {tasks.length - 6} meer taken bekijken
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: client info card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Contact info */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '16px' }}>
              Klantgegevens
            </div>

            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'company_name', label: 'Bedrijfsnaam', type: 'text' },
                  { key: 'industry',     label: 'Branche',       type: 'text' },
                  { key: 'city',         label: 'Stad',          type: 'text' },
                  { key: 'contact_name', label: 'Contactpersoon',type: 'text' },
                  { key: 'contact_email',label: 'E-mail',        type: 'email' },
                  { key: 'phone',        label: 'Telefoon',      type: 'text' },
                  { key: 'website',      label: 'Website',       type: 'url' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={(editForm as any)[f.key]}
                      onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Notities</label>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)', outline: 'none', resize: 'none', fontFamily: 'inherit', color: 'var(--text)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: <Building2 size={13} />, label: 'Branche',        value: client.industry },
                  { icon: <MapPin size={13} />,    label: 'Stad',           value: client.city },
                  { icon: <Mail size={13} />,      label: 'E-mail',         value: client.contact_email },
                  { icon: <Phone size={13} />,     label: 'Telefoon',       value: client.phone },
                  { icon: <Globe size={13} />,     label: 'Website',        value: client.website },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent1)', marginTop: '1px', flexShrink: 0 }}>{row.icon}</span>
                    <div>
                      <div style={{ fontSize: '.65rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{row.label}</div>
                      <div style={{ fontSize: '.82rem', color: 'var(--text)', marginTop: '1px', wordBreak: 'break-word' }}>{row.value}</div>
                    </div>
                  </div>
                ))}
                {!client.industry && !client.city && !client.contact_email && !client.phone && !client.website && (
                  <div style={{ fontSize: '.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>Geen contactgegevens ingevuld</div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {(client.notes || editMode) && !editMode && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>
                Notities
              </div>
              <p style={{ fontSize: '.83rem', lineHeight: 1.6, color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>{client.notes}</p>
            </div>
          )}

          {/* Quick links */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>
              Snelkoppelingen
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Link
                href={`/clients/${client.id}/tasks`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,184,156,.06)', border: '1px solid rgba(0,184,156,.15)', color: '#00b89c', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600, transition: 'background .12s' }}
              >
                <CheckSquare size={14} /> Takenlijst beheren
              </Link>
              <Link
                href="/projects"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(26,63,228,.06)', border: '1px solid rgba(26,63,228,.15)', color: 'var(--accent1)', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600, transition: 'background .12s' }}
              >
                <Kanban size={14} /> Project Board
              </Link>
            </div>
          </div>

          {/* Danger zone */}
          {isAdmin && (
            <div style={{ background: 'var(--card)', border: '1px solid rgba(229,57,53,.25)', borderRadius: 'var(--radius)', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 800, color: '#e53935', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>
                Gevarenzone
              </div>
              <button
                onClick={deleteClient}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', background: 'none', border: '1px solid rgba(229,57,53,.4)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#e53935', fontSize: '.8rem', fontWeight: 700, transition: 'background .12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(229,57,53,.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <Trash2 size={13} /> Klant verwijderen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
