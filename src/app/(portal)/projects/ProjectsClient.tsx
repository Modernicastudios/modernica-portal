'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, LayoutGrid, List, Trash2 } from 'lucide-react'

const STATUSES = [
  { key: 'backlog',          label: 'Backlog',             color: '#6b7280', bg: 'rgba(107,114,128,.08)', strip: '#d1d5db' },
  { key: 'in_progress',      label: 'In uitvoering',       color: '#1a3fe4', bg: 'rgba(26,63,228,.08)',   strip: '#1a3fe4' },
  { key: 'waiting_feedback', label: 'Wachten op reactie',  color: '#ff7a30', bg: 'rgba(255,122,48,.08)',  strip: '#ff7a30' },
  { key: 'blocked',          label: 'Geblokkeerd',         color: '#e53935', bg: 'rgba(229,57,53,.08)',   strip: '#e53935' },
  { key: 'review',           label: 'Review',              color: '#9c27b0', bg: 'rgba(156,39,176,.08)',  strip: '#9c27b0' },
  { key: 'approved',         label: 'Goedgekeurd',         color: '#00b89c', bg: 'rgba(0,184,156,.08)',   strip: '#00b89c' },
  { key: 'archived',         label: 'Archief',             color: '#9ca3af', bg: 'rgba(156,163,175,.08)', strip: '#9ca3af' },
]

const PRIORITIES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  normal: { label: 'Normaal', color: '#6b7280', bg: 'rgba(107,114,128,.08)', border: 'rgba(107,114,128,.2)' },
  high:   { label: 'Hoog',    color: '#ff7a30', bg: 'rgba(255,122,48,.1)',   border: 'rgba(255,122,48,.25)' },
  urgent: { label: 'Urgent',  color: '#e53935', bg: 'rgba(229,57,53,.1)',    border: 'rgba(229,57,53,.25)' },
}

const PRIORITY_STRIP: Record<string, string> = {
  normal: 'var(--border)',
  high:   '#ff7a30',
  urgent: '#e53935',
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

type ViewMode = 'board' | 'list'

export default function ProjectsClient({ projects: initialProjects, clients, agencyId, currentUserId, isAdmin }: Props) {
  const [projects, setProjects]           = useState(initialProjects)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [addToStatus, setAddToStatus]     = useState('backlog')
  const [newProject, setNewProject]       = useState({ title: '', description: '', status: 'backlog', priority: 'normal', category: '', client_id: '' })
  const [loading, setLoading]             = useState(false)
  const [toast, setToast]                 = useState<string | null>(null)
  const [dragId, setDragId]               = useState<string | null>(null)
  const [dragOver, setDragOver]           = useState<string | null>(null)
  const [viewMode, setViewMode]           = useState<ViewMode>('board')

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
    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
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

  async function deleteProject(id: string) {
    if (!confirm('Project verwijderen? Dit verwijdert ook alle taken en notities van dit project.')) return
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
    setSelectedProject(null)
    showToast('Project verwijderd')
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
    if (dragId && dragId !== colKey) moveProject(dragId, colKey)
    setDragId(null)
    setDragOver(null)
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
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '4px' }}>
            Project Board
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
            {projects.length} projecten · Sleep kaarten om status te wijzigen
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', padding: '3px', gap: '2px' }}>
            {([{ key: 'board', label: 'Board' }, { key: 'list', label: 'Lijst' }] as const).map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                style={{
                  padding: '5px 14px', border: 'none', borderRadius: '5px', cursor: 'pointer',
                  fontSize: '.78rem', fontWeight: 600, transition: 'all .15s',
                  background: viewMode === v.key ? 'var(--card)' : 'transparent',
                  color: viewMode === v.key ? 'var(--text)' : 'var(--muted)',
                  boxShadow: viewMode === v.key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => openAdd('backlog')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--accent1)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '10px 20px',
                fontSize: '.88rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(26,63,228,.3)',
              }}
            >
              <Plus size={16} /> Nieuw project
            </button>
          )}
        </div>
      </div>

      {/* Board view */}
      {viewMode === 'board' && (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start' }}>
          {columns.map(col => (
            <div
              key={col.key}
              onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.key)}
              style={{
                minWidth: '284px', maxWidth: '284px', display: 'flex', flexDirection: 'column',
                background: dragOver === col.key ? col.bg : 'transparent',
                borderRadius: 'var(--radius)', transition: 'background .15s',
              }}
            >
              {/* Column header */}
              <div style={{
                borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                marginBottom: '12px', border: '1px solid var(--border)',
                background: 'var(--card)', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
              }}>
                <div style={{ height: '3px', background: col.strip }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em', color: col.color, textTransform: 'uppercase', flex: 1, fontFamily: 'var(--font-syne), sans-serif' }}>
                    {col.label}
                  </span>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, color: col.color, background: col.bg, borderRadius: '50px', padding: '1px 9px', border: `1px solid ${col.color}33` }}>
                    {col.items.length}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => openAdd(col.key)}
                      title="Toevoegen"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)', fontSize: '1rem', lineHeight: 1,
                        padding: '0 2px', fontWeight: 600, transition: 'color .12s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = col.color }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                    >
                      +
                    </button>
                  )}
                </div>
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
                {col.items.length === 0 && (
                  <div style={{
                    border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                    padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '.75rem',
                  }}>
                    Geen projecten
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            {['Project', 'Status', 'Prioriteit', 'Klant', 'Datum'].map(h => (
              <span key={h} style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</span>
            ))}
          </div>
          {projects.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>Geen projecten gevonden</div>
          )}
          {projects.map((project, i) => {
            const st = STATUS_MAP[project.status] || STATUSES[0]
            const pr = PRIORITIES[project.priority] || PRIORITIES.normal
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '13px 20px', cursor: 'pointer',
                  borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)' }}>{project.title}</div>
                  {project.description && (
                    <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '260px' }}>
                      {project.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', background: pr.bg, color: pr.color, border: `1px solid ${pr.border}` }}>{pr.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{project.clients?.company_name || 'Intern'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                    {new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Project detail modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          clients={clients}
          onClose={() => setSelectedProject(null)}
          onMove={moveProject}
          onUpdate={updated => setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))}
          onDelete={deleteProject}
          isAdmin={isAdmin}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>Nieuw project</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Titel *</label>
                <input
                  autoFocus
                  value={newProject.title}
                  onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && createProject()}
                  placeholder="Projectnaam..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Omschrijving</label>
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                  placeholder="Korte beschrijving..."
                  rows={2}
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                />
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', fontSize: '.88rem' }}
              >
                Annuleren
              </button>
              <button
                onClick={createProject}
                disabled={loading || !newProject.title.trim()}
                style={{
                  flex: 2, padding: '10px', background: 'var(--accent1)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '.88rem', opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Aanmaken...' : 'Project aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ProjectCard ────────────────────────────────────────────────────────────────
function cardHoverIn(el: HTMLElement) {
  el.style.boxShadow = '0 8px 24px rgba(26,63,228,.13)'
  el.style.transform = 'translateY(-2px)'
}
function cardHoverOut(el: HTMLElement) {
  el.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'
  el.style.transform = 'none'
}

function ProjectCard({ project, onClick, onDragStart, isDragging }: {
  project: any
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  isDragging: boolean
}) {
  const todos     = project.project_todos || []
  const doneTodos = todos.filter((t: any) => t.done).length
  const prio      = PRIORITIES[project.priority as string] || PRIORITIES.normal
  const stripColor = PRIORITY_STRIP[project.priority as string] ?? 'var(--border)'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '0', cursor: 'grab', overflow: 'hidden',
        opacity: isDragging ? 0.45 : 1,
        transform: isDragging ? 'rotate(2deg) scale(.97)' : 'none',
        transition: 'box-shadow .15s, transform .15s, opacity .15s',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}
      onMouseEnter={e => { if (!isDragging) cardHoverIn(e.currentTarget as HTMLElement) }}
      onMouseLeave={e => { cardHoverOut(e.currentTarget as HTMLElement) }}
    >
      {/* Priority strip */}
      <div style={{ height: '3px', background: stripColor }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Category + priority chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {project.category && (
            <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: 'rgba(26,63,228,.08)', color: 'var(--accent1)', letterSpacing: '.03em' }}>
              {project.category}
            </span>
          )}
          <span style={{ fontSize: '.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: prio.bg, color: prio.color, border: `1px solid ${prio.border}` }}>
            {prio.label}
          </span>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 700, fontSize: '.88rem', lineHeight: 1.4, marginBottom: '6px', color: 'var(--text)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {project.title}
        </div>

        {/* Client badge */}
        {project.clients?.company_name && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '50px', background: 'rgba(0,184,156,.1)', color: '#00b89c', border: '1px solid rgba(0,184,156,.2)' }}>
              {project.clients.company_name}
            </span>
          </div>
        )}

        {/* Description preview */}
        {project.description && (
          <div style={{
            fontSize: '.74rem', color: 'var(--muted)', marginBottom: '10px', lineHeight: 1.55,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {project.description}
          </div>
        )}

        {/* Todo progress */}
        {todos.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '.65rem', color: 'var(--muted)', fontWeight: 500 }}>
                {doneTodos}/{todos.length} taken
              </span>
              <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>
                {todos.length > 0 ? Math.round((doneTodos / todos.length) * 100) : 0}%
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '2px', transition: 'width .3s',
                background: doneTodos === todos.length ? '#00b89c' : 'var(--accent1)',
                width: `${todos.length > 0 ? (doneTodos / todos.length) * 100 : 0}%`,
              }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '4px' }}>
          <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>
            {new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── ProjectModal ───────────────────────────────────────────────────────────────
function ProjectModal({ project, clients, onClose, onMove, onUpdate, onDelete, isAdmin }: {
  project: any
  clients: any[]
  onClose: () => void
  onMove: (id: string, status: string) => void
  onUpdate: (updated: any) => void
  onDelete: (id: string) => void
  isAdmin: boolean
}) {
  const [todos, setTodos]             = useState<any[]>([])
  const [notes, setNotes]             = useState<any[]>([])
  const [newTodo, setNewTodo]         = useState('')
  const [newNote, setNewNote]         = useState('')
  const [activeTab, setActiveTab]     = useState<'taken' | 'notities' | 'details'>('taken')
  const [loaded, setLoaded]           = useState(false)
  const [currentStatus, setCurrentStatus] = useState(project.status)
  const [currentPriority, setCurrentPriority] = useState(project.priority || 'normal')
  const [currentClientId, setCurrentClientId] = useState(project.client_id || '')
  const supabase = createClient()

  const statusCfg = STATUS_MAP[currentStatus] || STATUSES[0]
  const prio      = PRIORITIES[currentPriority as string] || PRIORITIES.normal

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
    const { data } = await supabase
      .from('project_todos')
      .insert({ project_id: project.id, title: newTodo, done: false })
      .select()
      .single()
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
    const { data } = await supabase
      .from('project_notes')
      .insert({ project_id: project.id, content: newNote })
      .select()
      .single()
    if (data) { setNotes(prev => [data, ...prev]); setNewNote('') }
  }

  async function changeStatus(newStatus: string) {
    setCurrentStatus(newStatus)
    onMove(project.id, newStatus)
  }

  async function changePriority(newPrio: string) {
    setCurrentPriority(newPrio)
    await supabase.from('projects').update({ priority: newPrio }).eq('id', project.id)
    onUpdate({ id: project.id, priority: newPrio })
  }

  async function changeClient(clientId: string) {
    setCurrentClientId(clientId)
    await supabase.from('projects').update({ client_id: clientId || null }).eq('id', project.id)
    const clientData = clients.find(c => c.id === clientId)
    onUpdate({ id: project.id, client_id: clientId || null, clients: clientData ? { company_name: clientData.company_name } : null })
  }

  const doneTodos   = todos.filter(t => t.done).length
  const progressPct = todos.length > 0 ? Math.round((doneTodos / todos.length) * 100) : 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', width: '100%', maxWidth: '900px', height: '84vh', display: 'flex', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>

        {/* LEFT: Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Title bar */}
          <div style={{ padding: '24px 28px 0', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '50px', background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}33` }}>
                    {statusCfg.label}
                  </span>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '50px', background: prio.bg, color: prio.color, border: `1px solid ${prio.border}` }}>
                    {prio.label}
                  </span>
                  {project.clients?.company_name && (
                    <span style={{ fontSize: '.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: '50px', background: 'rgba(0,184,156,.1)', color: '#00b89c', border: '1px solid rgba(0,184,156,.2)' }}>
                      {project.clients.company_name}
                    </span>
                  )}
                </div>
                <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.3, color: 'var(--text)' }}>
                  {project.title}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {isAdmin && (
                  <button
                    onClick={() => onDelete(project.id)}
                    title="Project verwijderen"
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#e53935', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.75rem', fontWeight: 600 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(229,57,53,.08)'; (e.currentTarget as HTMLElement).style.borderColor = '#e53935' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                  >
                    <Trash2 size={13} /> Verwijderen
                  </button>
                )}
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0' }}>
              {([
                { key: 'taken',    label: `Taken (${todos.length})` },
                { key: 'notities', label: `Notities (${notes.length})` },
                { key: 'details',  label: 'Details' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '.82rem', fontWeight: activeTab === tab.key ? 700 : 500,
                    color: activeTab === tab.key ? 'var(--accent1)' : 'var(--muted)',
                    borderBottom: activeTab === tab.key ? '2px solid var(--accent1)' : '2px solid transparent',
                    marginBottom: '-1px', transition: 'color .12s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {activeTab === 'taken' && (
              <div>
                {todos.length > 0 && (
                  <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{doneTodos} van {todos.length} afgerond</span>
                      <span style={{ fontSize: '.8rem', fontWeight: 800, color: progressPct === 100 ? '#00b89c' : 'var(--accent1)', fontFamily: 'var(--font-syne), sans-serif' }}>{progressPct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: progressPct === 100 ? '#00b89c' : 'var(--accent1)', borderRadius: '3px', width: `${progressPct}%`, transition: 'width .4s ease' }} />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    value={newTodo}
                    onChange={e => setNewTodo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                    placeholder="Nieuwe taak toevoegen..."
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }}
                  />
                  <button
                    onClick={addTodo}
                    style={{ padding: '9px 16px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem' }}
                  >
                    +
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {todos.map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <div
                        onClick={() => toggleTodo(todo)}
                        style={{
                          width: '18px', height: '18px', borderRadius: '5px',
                          border: `2px solid ${todo.done ? '#00b89c' : 'var(--border)'}`,
                          background: todo.done ? '#00b89c' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1rem', opacity: 0, padding: '2px 6px', borderRadius: '4px', transition: 'opacity .12s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {todos.length === 0 && !loaded && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px', fontSize: '.85rem' }}>Laden...</div>
                  )}
                  {todos.length === 0 && loaded && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px', fontSize: '.85rem' }}>
                      Geen taken nog. Voeg de eerste toe.
                    </div>
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
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={addNote}
                    style={{ padding: '10px 16px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, alignSelf: 'flex-end', fontSize: '.85rem' }}
                  >
                    +
                  </button>
                </div>
                {notes.map(note => (
                  <div key={note.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '10px', borderLeft: '3px solid var(--accent1)' }}>
                    <p style={{ fontSize: '.85rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{note.content}</p>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '8px' }}>
                      {new Date(note.created_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {notes.length === 0 && loaded && (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px', fontSize: '.85rem' }}>Nog geen notities</div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.description && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Omschrijving</div>
                    <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: 'var(--text)' }}>{project.description}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {([
                    { label: 'Categorie',  value: project.category || '—' },
                    { label: 'Aangemaakt', value: new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Bijgewerkt', value: new Date(project.updated_at || project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Taken',      value: `${doneTodos}/${todos.length} afgerond` },
                  ]).map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div style={{ width: '240px', flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)', overflowY: 'auto' }}>
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '18px' }}>
              Projectinfo
            </div>

            {/* Status select */}
            <div style={{ marginBottom: '16px' }}>
              <div style={sidebarLabelStyle}>Status</div>
              {isAdmin ? (
                <select
                  value={currentStatus}
                  onChange={e => changeStatus(e.target.value)}
                  style={{ ...sidebarSelectStyle, color: statusCfg.color }}
                >
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: '.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '50px', background: statusCfg.bg, color: statusCfg.color, display: 'inline-block' }}>
                  {statusCfg.label}
                </span>
              )}
            </div>

            {/* Priority select */}
            <div style={{ marginBottom: '16px' }}>
              <div style={sidebarLabelStyle}>Prioriteit</div>
              {isAdmin ? (
                <select
                  value={currentPriority}
                  onChange={e => changePriority(e.target.value)}
                  style={{ ...sidebarSelectStyle, color: prio.color }}
                >
                  {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: '.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '50px', background: prio.bg, color: prio.color, border: `1px solid ${prio.border}`, display: 'inline-block' }}>
                  {prio.label}
                </span>
              )}
            </div>

            {/* Client select */}
            <div style={{ marginBottom: '16px' }}>
              <div style={sidebarLabelStyle}>Klant</div>
              {isAdmin ? (
                <select
                  value={currentClientId}
                  onChange={e => changeClient(e.target.value)}
                  style={sidebarSelectStyle}
                >
                  <option value="">Intern</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: '.82rem', color: 'var(--text)' }}>
                  {project.clients?.company_name || 'Intern'}
                </span>
              )}
            </div>

            {/* Category */}
            <div style={{ marginBottom: '16px' }}>
              <div style={sidebarLabelStyle}>Categorie</div>
              <span style={{ fontSize: '.82rem', color: 'var(--text)' }}>{project.category || '—'}</span>
            </div>

            {/* Date */}
            <div style={{ marginBottom: '16px' }}>
              <div style={sidebarLabelStyle}>Aangemaakt</div>
              <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                {new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Progress */}
            {todos.length > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>Voortgang</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-syne), sans-serif', color: progressPct === 100 ? '#00b89c' : 'var(--accent1)', lineHeight: 1 }}>{progressPct}%</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{doneTodos}/{todos.length} taken</span>
                </div>
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: progressPct === 100 ? '#00b89c' : 'var(--accent1)', borderRadius: '3px', width: `${progressPct}%`, transition: 'width .4s' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)',
  outline: 'none', boxSizing: 'border-box', color: 'var(--text)',
}

const labelStyle: React.CSSProperties = {
  fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: '5px', color: 'var(--text)',
}

const sidebarLabelStyle: React.CSSProperties = {
  fontSize: '.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '.07em', marginBottom: '6px',
}

const sidebarSelectStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)',
  outline: 'none', cursor: 'pointer', color: 'var(--text)',
}
