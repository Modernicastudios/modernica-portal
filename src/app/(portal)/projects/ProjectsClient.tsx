'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUSES = [
  { key: 'backlog', label: 'Backlog', color: 'var(--muted)' },
  { key: 'in_progress', label: 'In uitvoering', color: 'var(--accent1)' },
  { key: 'review', label: 'Review', color: 'var(--accent4)' },
  { key: 'approved', label: 'Goedgekeurd', color: 'var(--accent3)' },
  { key: 'archived', label: 'Archief', color: 'var(--muted)' },
]

const PRIORITIES = ['normal', 'high', 'urgent']
const CATEGORIES = ['Paid Ads', 'Social', 'Content', 'SEO', 'Design', 'Strategy']

interface Props {
  projects: any[]
  clients: any[]
  agencyId: string
  currentUserId: string
  isAdmin: boolean
}

export default function ProjectsClient({ projects: initialProjects, clients, agencyId, currentUserId, isAdmin }: Props) {
  const [projects, setProjects] = useState(initialProjects)
  const [filter, setFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'backlog', priority: 'normal', category: '', client_id: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  const columns = STATUSES.map(s => ({
    ...s,
    items: filtered.filter(p => p.status === s.key),
  }))

  async function createProject() {
    if (!newProject.title.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...newProject, agency_id: agencyId, client_id: newProject.client_id || null })
      .select('*, clients(company_name), project_todos(id, done)')
      .single()

    if (!error && data) {
      setProjects(prev => [data, ...prev])
      setNewProject({ title: '', description: '', status: 'backlog', priority: 'normal', category: '', client_id: '' })
      setShowAddModal(false)
      showToast('Project aangemaakt!')
    }
    setLoading(false)
  }

  async function updateStatus(projectId: string, newStatus: string) {
    await supabase.from('projects').update({ status: newStatus }).eq('id', projectId)
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))
  }

  function priorityBadge(priority: string) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      normal: { label: 'Normaal', bg: 'rgba(107,120,168,.12)', color: 'var(--muted)' },
      high: { label: 'Hoog', bg: 'rgba(255,122,48,.12)', color: 'var(--accent4)' },
      urgent: { label: 'Urgent', bg: 'rgba(229,57,53,.12)', color: '#e53935' },
    }
    const c = map[priority] || map.normal
    return (
      <span style={{ fontSize: '.65rem', padding: '2px 7px', borderRadius: '50px', background: c.bg, color: c.color, fontWeight: 600 }}>
        {c.label}
      </span>
    )
  }

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }
  const labelStyle = { fontSize: '.8rem', fontWeight: 600 as const, display: 'block' as const, marginBottom: '5px' }

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[{ key: 'all', label: 'Alles' }, ...STATUSES].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              style={{
                padding: '6px 14px', borderRadius: '50px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === s.key ? 'var(--accent1)' : 'var(--card)',
                color: filter === s.key ? '#fff' : 'var(--muted)',
                boxShadow: filter === s.key ? '0 2px 8px rgba(26,63,228,.25)' : 'none',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{ background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          >
            + Nieuw project
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px', alignItems: 'flex-start', minHeight: '500px' }}>
        {columns.map(col => (
          <div key={col.key} style={{
            width: '280px', minWidth: '280px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '16px', boxShadow: '0 2px 10px rgba(26,63,228,.06)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.85rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                {col.label}
              </div>
              <span style={{ background: 'var(--card2)', fontSize: '.7rem', padding: '2px 8px', borderRadius: '50px', color: 'var(--muted)' }}>
                {col.items.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {col.items.map(project => {
                const todos = project.project_todos || []
                const doneTodos = todos.filter((t: any) => t.done).length
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    style={{
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '14px', cursor: 'pointer',
                      transition: 'transform .15s, box-shadow .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(26,63,228,.12)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
                  >
                    {project.category && (
                      <span style={{ fontSize: '.65rem', padding: '2px 8px', borderRadius: '50px', background: 'rgba(26,63,228,.08)', color: 'var(--accent1)', fontWeight: 600, display: 'inline-block', marginBottom: '8px' }}>
                        {project.category}
                      </span>
                    )}
                    <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '6px', lineHeight: 1.4 }}>{project.title}</div>
                    {project.description && (
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {project.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {priorityBadge(project.priority)}
                      {todos.length > 0 && (
                        <span style={{ fontSize: '.65rem', color: 'var(--accent1)', background: 'rgba(26,63,228,.08)', padding: '2px 7px', borderRadius: '50px' }}>
                          ✓ {doneTodos}/{todos.length}
                        </span>
                      )}
                    </div>
                    {project.clients && (
                      <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '8px' }}>
                        👤 {project.clients.company_name}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Project detail modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onStatusChange={(id, status) => { updateStatus(id, status); setSelectedProject((p: any) => ({ ...p, status })) }}
          isAdmin={isAdmin}
        />
      )}

      {/* Add project modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Nieuw project</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Titel *</label>
                <input value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} placeholder="Projectnaam" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Omschrijving</label>
                <textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Beschrijving..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={newProject.status} onChange={e => setNewProject(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Prioriteit</label>
                  <select value={newProject.priority} onChange={e => setNewProject(p => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p === 'normal' ? 'Normaal' : p === 'high' ? 'Hoog' : 'Urgent'}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Categorie</label>
                  <select value={newProject.category} onChange={e => setNewProject(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                    <option value="">Geen</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Klant</label>
                  <select value={newProject.client_id} onChange={e => setNewProject(p => ({ ...p, client_id: e.target.value }))} style={inputStyle}>
                    <option value="">Intern</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer' }}>Annuleren</button>
              <button onClick={createProject} disabled={loading} style={{ flex: 1, padding: '10px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                {loading ? 'Aanmaken...' : 'Project aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectModal({ project, onClose, onStatusChange, isAdmin }: { project: any; onClose: () => void; onStatusChange: (id: string, status: string) => void; isAdmin: boolean }) {
  const [todos, setTodos] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [newNote, setNewNote] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const [loaded, setLoaded] = useState(false)
  const supabase = createClient()

  async function loadData() {
    if (loaded) return
    const [{ data: t }, { data: n }] = await Promise.all([
      supabase.from('project_todos').select('*').eq('project_id', project.id).order('created_at'),
      supabase.from('project_notes').select('*').eq('project_id', project.id).order('created_at'),
    ])
    setTodos(t || [])
    setNotes(n || [])
    setLoaded(true)
  }

  useState(() => { loadData() })

  async function addTodo() {
    if (!newTodo.trim()) return
    const { data } = await supabase.from('project_todos').insert({ project_id: project.id, title: newTodo, done: false }).select().single()
    if (data) { setTodos(prev => [...prev, data]); setNewTodo('') }
  }

  async function toggleTodo(todo: any) {
    await supabase.from('project_todos').update({ done: !todo.done }).eq('id', todo.id)
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
  }

  async function addNote() {
    if (!newNote.trim()) return
    const { data } = await supabase.from('project_notes').insert({ project_id: project.id, content: newNote }).select().single()
    if (data) { setNotes(prev => [...prev, data]); setNewNote('') }
  }

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: active ? 700 : 400,
    color: active ? 'var(--accent1)' : 'var(--muted)', borderBottom: active ? '2px solid var(--accent1)' : '2px solid transparent',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>{project.title}</h3>
              {project.clients && <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '4px' }}>👤 {project.clients.company_name}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
          </div>
          {/* Status selector */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button
                  key={s.key}
                  onClick={() => onStatusChange(project.id, s.key)}
                  style={{
                    padding: '4px 12px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: project.status === s.key ? s.color : 'var(--card2)',
                    color: project.status === s.key ? '#fff' : 'var(--muted)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {/* Tabs */}
          <div style={{ display: 'flex' }}>
            {['details', 'taken', 'notities'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
                {tab === 'details' ? 'Details' : tab === 'taken' ? `Taken (${todos.length})` : `Notities (${notes.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'details' && (
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6 }}>{project.description || 'Geen omschrijving'}</p>
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Categorie', value: project.category || '-' },
                  { label: 'Prioriteit', value: project.priority },
                  { label: 'Aangemaakt', value: new Date(project.created_at).toLocaleDateString('nl-NL') },
                  { label: 'Bijgewerkt', value: new Date(project.updated_at || project.created_at).toLocaleDateString('nl-NL') },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--bg)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'taken' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} placeholder="Nieuwe taak..." style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }} />
                <button onClick={addTodo} style={{ padding: '8px 16px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>+</button>
              </div>
              {todos.map(todo => (
                <div key={todo.id} onClick={() => toggleTodo(todo)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: '6px', background: 'var(--bg)' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${todo.done ? 'var(--accent3)' : 'var(--border)'}`, background: todo.done ? 'var(--accent3)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {todo.done && <span style={{ color: '#fff', fontSize: '.7rem' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '.85rem', textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? 'var(--muted)' : 'var(--text)' }}>{todo.title}</span>
                </div>
              ))}
              {todos.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Nog geen taken</p>}
            </div>
          )}

          {activeTab === 'notities' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Notitie toevoegen..." rows={2} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none', resize: 'vertical' }} />
                <button onClick={addNote} style={{ padding: '8px 16px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-end' }}>+</button>
              </div>
              {notes.map(note => (
                <div key={note.id} style={{ background: 'var(--bg)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                  <p style={{ fontSize: '.85rem', lineHeight: 1.6 }}>{note.content}</p>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '6px' }}>{new Date(note.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
              {notes.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Nog geen notities</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
