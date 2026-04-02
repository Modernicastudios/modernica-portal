'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const STATUS_CONFIG = {
  todo: { label: 'Te doen', color: 'var(--muted)', bg: 'rgba(107,120,168,.1)' },
  in_progress: { label: 'In uitvoering', color: 'var(--accent1)', bg: 'rgba(26,63,228,.1)' },
  waiting: { label: 'Wachtend', color: 'var(--accent4)', bg: 'rgba(255,122,48,.1)' },
  done: { label: 'Klaar', color: 'var(--accent3)', bg: 'rgba(0,184,156,.1)' },
}

const PRIORITY_CONFIG = {
  low: { label: 'Laag', color: 'var(--muted)' },
  medium: { label: 'Normaal', color: 'var(--accent1)' },
  high: { label: 'Hoog', color: 'var(--accent4)' },
  urgent: { label: 'Urgent', color: '#e53935' },
}

interface Props {
  client: any
  tasks: any[]
  teamMembers: any[]
  agencyId: string
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
}

export default function ClientTasksClient({ client, tasks: initialTasks, teamMembers, agencyId, currentUserId, currentUserName, isAdmin }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState<Record<string, string>>({})
  const [savingDesc, setSavingDesc] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const openCount = tasks.filter(t => t.status !== 'done').length
  const doneCount = tasks.filter(t => t.status === 'done').length

  async function addTask() {
    if (!form.title.trim()) return
    setLoading(true)
    const { data } = await supabase.from('client_tasks').insert({
      ...form,
      agency_id: agencyId,
      client_id: client.id,
      created_by: currentUserId,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      status: 'todo',
    }).select('*, user_profiles!created_by(full_name), assignee:user_profiles!assigned_to(full_name)').single()

    if (data) {
      setTasks(prev => [...prev, data])
      setForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' })
      setShowAdd(false)
      showToast('Taak toegevoegd!')
    }
    setLoading(false)
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const update: any = { status: newStatus }
    if (newStatus === 'done') update.completed_at = new Date().toISOString()
    await supabase.from('client_tasks').update(update).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...update } : t))
  }

  async function deleteTask(taskId: string) {
    if (!isAdmin) return
    await supabase.from('client_tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    showToast('Taak verwijderd')
  }

  async function saveDescription(taskId: string) {
    if (!isAdmin) return
    setSavingDesc(taskId)
    const desc = editDesc[taskId] ?? ''
    await supabase.from('client_tasks').update({ description: desc || null }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, description: desc || null } : t))
    setSavingDesc(null)
    showToast('Omschrijving opgeslagen')
  }

  function toggleExpand(taskId: string, currentDesc: string | null) {
    if (expandedId === taskId) {
      setExpandedId(null)
    } else {
      setExpandedId(taskId)
      setEditDesc(prev => ({ ...prev, [taskId]: currentDesc || '' }))
    }
  }

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '.82rem', color: 'var(--muted)' }}>
        <Link href="/clients" style={{ color: 'var(--accent1)', textDecoration: 'none' }}>Klanten</Link>
        <span>›</span>
        <span>{client.company_name}</span>
        <span>›</span>
        <span>Taken</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.4rem' }}>
            Taken — {client.company_name}
          </h2>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '.82rem', color: 'var(--muted)' }}>
            <span>📋 {openCount} open</span>
            <span>✅ {doneCount} klaar</span>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
        >
          + Taak toevoegen
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[{ key: 'all', label: 'Alles' }, ...Object.entries(STATUS_CONFIG).map(([key, v]) => ({ key, label: v.label }))].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '6px 14px', borderRadius: '50px', fontSize: '.8rem', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: filter === key ? 'var(--accent1)' : 'var(--card)',
            color: filter === key ? '#fff' : 'var(--muted)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(task => {
          const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
          const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
          const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

          const isExpanded = expandedId === task.id
          return (
            <div key={task.id} style={{
              background: 'var(--card)', border: `1px solid ${task.status === 'done' ? 'rgba(0,184,156,.15)' : isExpanded ? 'rgba(26,63,228,.2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', overflow: 'hidden',
              opacity: task.status === 'done' ? .75 : 1,
              boxShadow: isExpanded ? '0 4px 16px rgba(26,63,228,.1)' : '0 1px 6px rgba(26,63,228,.05)',
              transition: 'border-color .15s, box-shadow .15s',
            }}>
              {/* Main row */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Checkbox */}
                <button
                  onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                  style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    border: `2px solid ${task.status === 'done' ? 'var(--accent3)' : 'var(--border)'}`,
                    background: task.status === 'done' ? 'var(--accent3)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', marginTop: '2px',
                  }}
                >
                  {task.status === 'done' && <span style={{ color: '#fff', fontSize: '.8rem' }}>✓</span>}
                </button>

                {/* Content — click to expand */}
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleExpand(task.id, task.description)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, fontSize: '.92rem', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                      {task.title}
                    </span>
                    <span style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: '50px', background: statusCfg.bg, color: statusCfg.color, fontWeight: 600 }}>
                      {statusCfg.label}
                    </span>
                    <span style={{ fontSize: '.68rem', fontWeight: 600, color: priorityCfg.color }}>
                      {priorityCfg.label}
                    </span>
                    {isOverdue && (
                      <span style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: '50px', background: 'rgba(229,57,53,.1)', color: '#e53935', fontWeight: 600 }}>
                        Verlopen
                      </span>
                    )}
                  </div>
                  {task.description && !isExpanded && (
                    <div style={{ fontSize: '.78rem', color: 'var(--muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '420px' }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '.72rem', color: 'var(--muted)', marginTop: '4px' }}>
                    {task.assignee && <span>→ {task.assignee.full_name}</span>}
                    {task.due_date && (
                      <span style={{ color: isOverdue ? '#e53935' : 'var(--muted)' }}>
                        {new Date(task.due_date).toLocaleDateString('nl-NL')}
                      </span>
                    )}
                    <span style={{ color: 'var(--accent1)', fontSize: '.68rem' }}>{isExpanded ? '▲ Inklappen' : '▼ Details'}</span>
                  </div>
                </div>

                {/* Status + delete */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <select
                    value={task.status}
                    onChange={e => updateTaskStatus(task.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '.75rem', background: 'var(--bg)', cursor: 'pointer' }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
                  </select>
                  {(isAdmin || task.created_by === currentUserId) && (
                    <button onClick={() => deleteTask(task.id)} style={{ padding: '5px 10px', background: 'rgba(229,57,53,.08)', color: '#e53935', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.75rem' }}>
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded: editable description */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px 52px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '8px' }}>
                    Omschrijving / extra info
                  </div>
                  <textarea
                    value={editDesc[task.id] ?? task.description ?? ''}
                    onChange={e => setEditDesc(prev => ({ ...prev, [task.id]: e.target.value }))}
                    placeholder="Voeg een omschrijving, instructies of context toe..."
                    rows={3}
                    style={{
                      width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)',
                      outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                      color: 'var(--text)', boxSizing: 'border-box', lineHeight: 1.55,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      onClick={() => saveDescription(task.id)}
                      disabled={savingDesc === task.id}
                      style={{
                        padding: '7px 18px', background: 'var(--accent1)', color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        fontWeight: 700, fontSize: '.82rem', opacity: savingDesc === task.id ? .7 : 1,
                      }}
                    >
                      {savingDesc === task.id ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✅</div>
            <div style={{ fontWeight: 600 }}>Geen taken{filter !== 'all' ? ' in deze categorie' : ''}</div>
          </div>
        )}
      </div>

      {/* Add task modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Taak toevoegen</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Taak *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Beschrijf de taak..." style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Toelichting</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optionele details..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Prioriteit</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Deadline</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Toewijzen aan</label>
                  <select value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} style={inputStyle}>
                    <option value="">Niemand</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer' }}>Annuleren</button>
              <button onClick={addTask} disabled={loading} style={{ flex: 1, padding: '10px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                {loading ? 'Toevoegen...' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
