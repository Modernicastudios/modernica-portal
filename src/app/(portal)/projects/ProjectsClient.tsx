'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUSES = [
  { key: 'backlog', label: 'Backlog', color: '#6b7280', bg: 'rgba(107,114,128,.08)' },
  { key: 'in_progress', label: 'In uitvoering', color: '#1a3fe4', bg: 'rgba(26,63,228,.08)' },
  { key: 'waiting_feedback', label: 'Wachten op reactie', color: '#ff7a30', bg: 'rgba(255,122,48,.08)' },
  { key: 'blocked', label: 'Geblokkeerd', color: '#e53935', bg: 'rgba(229,57,53,.08)' },
  { key: 'review', label: 'Review', color: '#9c27b0', bg: 'rgba(156,39,176,.08)' },
  { key: 'approved', label: 'Goedgekeurd', color: '#00b89c', bg: 'rgba(0,184,156,.08)' },
  { key: 'archived', label: 'Archief', color: '#9ca3af', bg: 'rgba(156,163,175,.08)' },
]

const PRIORITIES: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  normal: { label: 'Normaal', color: '#6b7280', bg: 'rgba(107,114,128,.1)', dot: '#6b7280' },
  high: { label: 'Hoog', color: '#ff7a30', bg: 'rgba(255,122,48,.12)', dot: '#ff7a30' },
  urgent: { label: 'Urgent', color: '#e53935', bg: 'rgba(229,57,53,.12)', dot: '#e53935' },
}

const CATEGORIES = ['Paid Ads', 'Social', 'Content', 'SEO', 'Design', 'Strategy', 'Development']

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]))

interface Props {
  projects: any[]
  clients: any[]
  agencyId: string
  currentUserId: string
  isAdmin: boolean
}

export default function ProjectsClient({ projects: initialProjects, clients, agencyId, currentUserId, isAdmin }: Props) {
  const [projects, setProjects] = useState(initialProjects)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addToStatus, setAddToStatus] = useState('backlog')
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'backlog', priority: 'normal', category: '', client_id: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const supabase = createClient()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const columns = STATUSES.map(s => ({
    ...s,
    items: projects.filter(p => p.status === s.key),
  }))

  async function createProject() {
    if (!newProject.title.trim()) return
    setLoading(true)
    const payload = { ...newProject, status: addToStatus, agency_id: agencyId, client_id: newProject.client_id || null }
    const { data, error } = await supabase.from('projects').insert(payload).select('*, clients(company_name), project_todos(id, done)').single()
    if (!error && data) {
      setProjects(prev => [data, ...prev])
      setNewProject({ title: '', description: '', status: 'backlog', priority: 'normal', category: '', client_id: '' })
      setShowAddModal(false)
      showToast('Project aangemaakt!')
    }
    setLoading(false)
  }

  async function moveProject(id: string, newStatus: string) {
    await supabase.from('projects').update({ status: newStatus }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
    if (selectedProject?.id === id) setSelectedProject((p: any) => ({ ...p, status: newStatus }))
  }

  function openAdd(status: string) {
    setAddToStatus(status)
    setNewProject({ title: '', description: '', status, priority: 'normal', category: '', client_id: '' })
    setShowAddModal(true)
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    if (dragId && dragId !== colKey) {
      moveProject(dragId, colKey)
    }
    setDragId(null)
    setDragOver(null)
  }

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 2000, background: '#1a3fe4', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '2px' }}>Project Board</h1>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{projects.length} projecten · Sleep kaarten om status te wijzigen</p>
        </div>
        {isAdmin && (
          <button onClick={() => openAdd('backlog')} style={{ background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,63,228,.3)' }}>
            + Nieuw project
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start' }}>
        {columns.map(col => (
          <div
            key={col.key}
            onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, col.key)}
            style={{
              minWidth: '272px', maxWidth: '272px', display: 'flex', flexDirection: 'column',
              background: dragOver === col.key ? col.bg : 'transparent',
              borderRadius: '10px', transition: 'background .15s',
            }}
          >
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px 10px', borderRadius: '8px', background: col.bg }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em', color: col.color, textTransform: 'uppercase', flex: 1 }}>{col.label}</span>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', background: 'var(--card)', borderRadius: '50px', padding: '1px 8px', border: '1px solid var(--border)' }}>{col.items.length}</span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {col.items.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                  onDragStart={e => handleDragStart(e, project.id)}
                  isDragging={dragId === project.id}
                />
              ))}
            </div>

            {/* Add button */}
            {isAdmin && (
              <button
                onClick={() => openAdd(col.key)}
                style={{
                  marginTop: '8px', width: '100%', padding: '8px', border: '1.5px dashed var(--border)',
                  borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '.78rem',
                  color: 'var(--muted)', fontWeight: 500, transition: 'all .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = col.color; (e.currentTarget as HTMLElement).style.color = col.color }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
              >
                + Toevoegen
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Project detail */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          clients={clients}
          onClose={() => setSelectedProject(null)}
          onMove={moveProject}
          onUpdate={updated => setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))}
          isAdmin={isAdmin}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>Nieuw project</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Titel *</label>
                <input autoFocus value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && createProject()} placeholder="Projectnaam..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Omschrijving</label>
                <textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Korte beschrijving..." rows={2} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Prioriteit</label>
                  <select value={newProject.priority} onChange={e => setNewProject(p => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                    {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Categorie</label>
                  <select value={newProject.category} onChange={e => setNewProject(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                    <option value="">Geen</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Klant</label>
                <select value={newProject.client_id} onChange={e => setNewProject(p => ({ ...p, client_id: e.target.value }))} style={inputStyle}>
                  <option value="">Intern</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '.88rem' }}>Annuleren</button>
              <button onClick={createProject} disabled={loading || !newProject.title.trim()} style={{ flex: 2, padding: '10px', background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '.88rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Aanmaken...' : 'Project aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onClick, onDragStart, isDragging }: { project: any; onClick: () => void; onDragStart: (e: React.DragEvent) => void; isDragging: boolean }) {
  const todos = project.project_todos || []
  const doneTodos = todos.filter((t: any) => t.done).length
  const prio = PRIORITIES[project.priority] || PRIORITIES.normal
  const statusCfg = STATUS_MAP[project.status] || STATUSES[0]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
        padding: '0', cursor: 'grab', overflow: 'hidden',
        opacity: isDragging ? 0.45 : 1,
        transform: isDragging ? 'rotate(2deg) scale(.97)' : 'none',
        transition: 'box-shadow .15s, transform .15s, opacity .15s',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}
      onMouseEnter={e => { if (!isDragging) { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(26,63,228,.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'; (e.currentTarget as HTMLElement).style.transform = isDragging ? 'rotate(2deg) scale(.97)' : 'none' }}
    >
      {/* Priority top strip */}
      <div style={{ height: '3px', background: prio.dot === '#6b7280' ? 'var(--border)' : prio.dot }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Category + priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {project.category && (
            <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: 'rgba(26,63,228,.08)', color: '#1a3fe4', letterSpacing: '.04em' }}>
              {project.category}
            </span>
          )}
          <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: prio.bg, color: prio.color }}>
            {prio.label}
          </span>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 600, fontSize: '.88rem', lineHeight: 1.4, marginBottom: '8px', color: 'var(--text)' }}>
          {project.title}
        </div>

        {/* Description preview */}
        {project.description && (
          <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '10px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {project.description}
          </div>
        )}

        {/* Progress bar for todos */}
        {todos.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>Voortgang</span>
              <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>{doneTodos}/{todos.length}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: doneTodos === todos.length ? '#00b89c' : '#1a3fe4', borderRadius: '2px', width: `${todos.length > 0 ? (doneTodos / todos.length) * 100 : 0}%`, transition: 'width .3s' }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem' }}>
              👤
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {project.clients?.company_name && (
              <span style={{ fontSize: '.65rem', color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '50px', border: '1px solid var(--border)' }}>
                {project.clients.company_name}
              </span>
            )}
            <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>
              {new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectModal({ project, clients, onClose, onMove, onUpdate, isAdmin }: {
  project: any; clients: any[]; onClose: () => void;
  onMove: (id: string, status: string) => void;
  onUpdate: (updated: any) => void;
  isAdmin: boolean;
}) {
  const [todos, setTodos] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [newNote, setNewNote] = useState('')
  const [activeTab, setActiveTab] = useState<'taken' | 'notities' | 'details'>('taken')
  const [loaded, setLoaded] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(project.status)
  const supabase = createClient()

  const statusCfg = STATUS_MAP[currentStatus] || STATUSES[0]
  const prio = PRIORITIES[project.priority] || PRIORITIES.normal

  useState(() => {
    async function load() {
      const [{ data: t }, { data: n }] = await Promise.all([
        supabase.from('project_todos').select('*').eq('project_id', project.id).order('created_at'),
        supabase.from('project_notes').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      ])
      setTodos(t || [])
      setNotes(n || [])
      setLoaded(true)
    }
    load()
  })

  async function addTodo() {
    if (!newTodo.trim()) return
    const { data } = await supabase.from('project_todos').insert({ project_id: project.id, title: newTodo, done: false }).select().single()
    if (data) { setTodos(prev => [...prev, data]); setNewTodo('') }
  }

  async function toggleTodo(todo: any) {
    await supabase.from('project_todos').update({ done: !todo.done }).eq('id', todo.id)
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
  }

  async function deleteTodo(id: string) {
    await supabase.from('project_todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  async function addNote() {
    if (!newNote.trim()) return
    const { data } = await supabase.from('project_notes').insert({ project_id: project.id, content: newNote }).select().single()
    if (data) { setNotes(prev => [data, ...prev]); setNewNote('') }
  }

  async function changeStatus(newStatus: string) {
    setCurrentStatus(newStatus)
    onMove(project.id, newStatus)
  }

  const doneTodos = todos.filter(t => t.done).length
  const progressPct = todos.length > 0 ? Math.round((doneTodos / todos.length) * 100) : 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg)', borderRadius: '12px', width: '100%', maxWidth: '880px', height: '84vh', display: 'flex', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>

        {/* LEFT: Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Title bar */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.3, marginBottom: '4px' }}>{project.title}</h2>
                {project.clients?.company_name && (
                  <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>👤 {project.clients.company_name}</span>
                )}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>✕</button>
            </div>

            {/* Status pills */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s.key} onClick={() => changeStatus(s.key)} style={{
                    padding: '3px 12px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${currentStatus === s.key ? s.color : 'var(--border)'}`,
                    background: currentStatus === s.key ? s.bg : 'transparent',
                    color: currentStatus === s.key ? s.color : 'var(--muted)',
                    transition: 'all .12s',
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--card)', padding: '0 20px' }}>
            {([
              { key: 'taken', label: `Taken (${todos.length})` },
              { key: 'notities', label: `Notities (${notes.length})` },
              { key: 'details', label: 'Details' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '.82rem', fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? '#1a3fe4' : 'var(--muted)',
                borderBottom: activeTab === tab.key ? '2px solid #1a3fe4' : '2px solid transparent',
                marginBottom: '-1px',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {activeTab === 'taken' && (
              <div>
                {todos.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{doneTodos} van {todos.length} afgerond</span>
                      <span style={{ fontSize: '.78rem', fontWeight: 700, color: progressPct === 100 ? '#00b89c' : '#1a3fe4' }}>{progressPct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: progressPct === 100 ? '#00b89c' : '#1a3fe4', borderRadius: '3px', width: `${progressPct}%`, transition: 'width .4s ease' }} />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    value={newTodo}
                    onChange={e => setNewTodo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                    placeholder="Nieuwe taak toevoegen..."
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }}
                  />
                  <button onClick={addTodo} style={{ padding: '9px 16px', background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem' }}>+</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {todos.map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', group: 'todo' }}>
                      <div
                        onClick={() => toggleTodo(todo)}
                        style={{
                          width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${todo.done ? '#00b89c' : 'var(--border)'}`,
                          background: todo.done ? '#00b89c' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, cursor: 'pointer', transition: 'all .15s',
                        }}
                      >
                        {todo.done && <span style={{ color: '#fff', fontSize: '.65rem', fontWeight: 900 }}>✓</span>}
                      </div>
                      <span
                        onClick={() => toggleTodo(todo)}
                        style={{ flex: 1, fontSize: '.85rem', cursor: 'pointer', textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? 'var(--muted)' : 'var(--text)', transition: 'color .15s' }}
                      >
                        {todo.title}
                      </span>
                      <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.8rem', opacity: 0, padding: '2px 6px', borderRadius: '4px' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {todos.length === 0 && !loaded && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px', fontSize: '.85rem' }}>Laden...</div>
                  )}
                  {todos.length === 0 && loaded && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px', fontSize: '.85rem' }}>Geen taken nog. Voeg de eerste toe.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notities' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Notitie toevoegen..."
                    rows={3}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '.85rem', background: 'var(--bg)', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <button onClick={addNote} style={{ padding: '10px 16px', background: '#1a3fe4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, alignSelf: 'flex-end', fontSize: '.85rem' }}>+</button>
                </div>
                {notes.map(note => (
                  <div key={note.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: '10px', marginBottom: '10px', borderLeft: '3px solid #1a3fe4' }}>
                    <p style={{ fontSize: '.85rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{note.content}</p>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '8px' }}>
                      {new Date(note.created_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {notes.length === 0 && loaded && (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px', fontSize: '.85rem' }}>Nog geen notities</div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.description && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>Omschrijving</div>
                    <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: 'var(--text)' }}>{project.description}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Categorie', value: project.category || '—' },
                    { label: 'Prioriteit', value: prio.label },
                    { label: 'Aangemaakt', value: new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Bijgewerkt', value: new Date(project.updated_at || project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)', overflowY: 'auto' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '14px' }}>Info</div>

            {[
              {
                icon: '🔵', label: 'Status',
                content: (
                  <span style={{ fontSize: '.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', background: statusCfg.bg, color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                )
              },
              {
                icon: '⚡', label: 'Prioriteit',
                content: (
                  <span style={{ fontSize: '.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', background: prio.bg, color: prio.color }}>
                    {prio.label}
                  </span>
                )
              },
              { icon: '🗂️', label: 'Categorie', content: <span style={{ fontSize: '.82rem', color: 'var(--text)' }}>{project.category || '—'}</span> },
              {
                icon: '👤', label: 'Klant',
                content: <span style={{ fontSize: '.82rem', color: 'var(--text)' }}>{project.clients?.company_name || 'Intern'}</span>
              },
              {
                icon: '📅', label: 'Aangemaakt',
                content: <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
              },
            ].map(({ icon, label, content }) => (
              <div key={label} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>{icon}</span> {label}
                </div>
                {content}
              </div>
            ))}

            {todos.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Voortgang</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-syne), sans-serif', color: progressPct === 100 ? '#00b89c' : '#1a3fe4', marginBottom: '6px' }}>{progressPct}%</div>
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: progressPct === 100 ? '#00b89c' : '#1a3fe4', borderRadius: '3px', width: `${progressPct}%` }} />
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '4px' }}>{doneTodos}/{todos.length} taken</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px',
  fontSize: '.85rem', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: '5px', color: 'var(--text)',
}
