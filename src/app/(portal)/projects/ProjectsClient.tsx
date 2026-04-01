'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useClientFilter } from '@/components/layout/ClientFilter'
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
  const [newProject, setNewProject]       = useState({ title: '', description: '', status: 'backlog', priority: 'normal', category: '', client_id: '', deadline: '' })
  const [loading, setLoading]             = useState(false)
  const [toast, setToast]                 = useState<string | null>(null)
  const [dragId, setDragId]               = useState<string | null>(null)
  const [dragOver, setDragOver]           = useState<string | null>(null)
  const [viewMode, setViewMode]           = useState<ViewMode>('board')

  const supabase = createClient()
  const { selectedClientId } = useClientFilter()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // Apply global client filter
  const visibleProjects = selectedClientId
    ? projects.filter(p => p.client_id === selectedClientId)
    : projects

  const columns = STATUSES.map(s => ({
    ...s,
    items: visibleProjects.filter(p => p.status === s.key),
  }))

  async function createProject() {
    if (!newProject.title.trim()) return
    setLoading(true)
    const payload = { ...newProject, status: addToStatus, agency_id: agencyId, client_id: newProject.client_id || null, deadline: newProject.deadline || null }
    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select('*, clients(company_name), project_todos(id, done)')
      .single()
    if (!error && data) {
      setProjects(prev => [data, ...prev])
      setNewProject({ title: '', description: '', status: 'backlog', priority: 'normal', category: '', client_id: '', deadline: '' })
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
    setNewProject({ title: '', description: '', status, priority: 'normal', category: '', client_id: '', deadline: '' })
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
            {visibleProjects.length} projecten{selectedClientId ? ' voor deze klant' : ''} · Sleep kaarten om status te wijzigen
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
                minWidth: '260px', maxWidth: '300px', flex: '1 1 260px', display: 'flex', flexDirection: 'column',
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
          {visibleProjects.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>Geen projecten gevonden</div>
          )}
          {visibleProjects.map((project, i) => {
            const st = STATUS_MAP[project.status] || STATUSES[0]
            const pr = PRIORITIES[project.priority] || PRIORITIES.normal
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '13px 20px', cursor: 'pointer',
                  borderBottom: i < visibleProjects.length - 1 ? '1px solid var(--border)' : 'none',
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
              <div>
                <label style={labelStyle}>Deadline <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optioneel)</span></label>
                <input
                  type="date"
                  value={newProject.deadline}
                  onChange={e => setNewProject(p => ({ ...p, deadline: e.target.value }))}
                  style={inputStyle}
                />
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

// ── Deadline helper ────────────────────────────────────────────────────────────
function DeadlineChip({ deadline }: { deadline: string | null }) {
  if (!deadline) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(deadline); due.setHours(0,0,0,0)
  const diff  = Math.round((due.getTime() - today.getTime()) / 86400000)

  let bg = 'rgba(107,114,128,.1)', color = '#6b7280', label = ''
  if (diff < 0) {
    bg = 'rgba(229,57,53,.1)'; color = '#e53935'
    label = `${Math.abs(diff)}d te laat`
  } else if (diff === 0) {
    bg = 'rgba(229,57,53,.12)'; color = '#e53935'
    label = 'Vandaag!'
  } else if (diff <= 3) {
    bg = 'rgba(255,122,48,.1)'; color = '#ff7a30'
    label = `nog ${diff}d`
  } else {
    label = due.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

  return (
    <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', background: bg, color, border: `1px solid ${color}33`, whiteSpace: 'nowrap' }}>
      📅 {label}
    </span>
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
        <div style={{ fontWeight: 700, fontSize: '.88rem', lineHeight: 1.4, marginBottom: '6px', color: 'var(--text)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
            wordBreak: 'break-word', overflowWrap: 'break-word',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '6px' }}>
          <DeadlineChip deadline={project.deadline || null} />
          <span style={{ fontSize: '.65rem', color: 'var(--muted)', marginLeft: 'auto' }}>
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
  const [loaded, setLoaded]           = useState(false)
  const [currentStatus, setCurrentStatus] = useState(project.status)
  const [currentPriority, setCurrentPriority] = useState(project.priority || 'normal')
  const [currentClientId, setCurrentClientId] = useState(project.client_id || '')
  const [currentDeadline, setCurrentDeadline] = useState<string>(project.deadline || '')
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

  async function changeDeadline(date: string) {
    setCurrentDeadline(date)
    await supabase.from('projects').update({ deadline: date || null }).eq('id', project.id)
    onUpdate({ id: project.id, deadline: date || null })
  }

  const doneTodos   = todos.filter(t => t.done).length
  const progressPct = todos.length > 0 ? Math.round((doneTodos / todos.length) * 100) : 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg)', borderRadius: 'var(--radius)', width: '92vw', maxWidth: '960px',
        height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,.25)',
      }}>

        {/* Sticky header bar */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
          padding: '20px 24px 16px', background: 'var(--card)', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
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
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.3, color: 'var(--text)', margin: 0 }}>
              {project.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: left + right columns */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT COLUMN — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', minWidth: 0 }}>

            {/* Omschrijving */}
            <div style={{ marginBottom: '28px' }}>
              <div style={sectionHeaderStyle}>Omschrijving</div>
              {project.description ? (
                <p style={{ fontSize: '.88rem', lineHeight: 1.7, color: 'var(--text)', margin: 0 }}>{project.description}</p>
              ) : (
                <p style={{ fontSize: '.88rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen omschrijving</p>
              )}
            </div>

            {/* Taken section */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={sectionHeaderStyle}>Taken</span>
                <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '1px 8px', borderRadius: '50px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                  {todos.length}
                </span>
              </div>
              {todos.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{doneTodos} van {todos.length} afgerond</span>
                    <span style={{ fontSize: '.78rem', fontWeight: 800, color: progressPct === 100 ? '#00b89c' : 'var(--accent1)', fontFamily: 'var(--font-syne), sans-serif' }}>{progressPct}%</span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: progressPct === 100 ? '#00b89c' : 'var(--accent1)', borderRadius: '3px', width: `${progressPct}%`, transition: 'width .4s ease' }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                {!loaded && todos.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: '.83rem', padding: '8px 0' }}>Laden...</div>
                )}
                {loaded && todos.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: '.83rem', padding: '8px 0', fontStyle: 'italic' }}>Nog geen taken.</div>
                )}
                {todos.map(todo => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div
                      onClick={() => toggleTodo(todo)}
                      style={{
                        width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                        border: `2px solid ${todo.done ? '#00b89c' : 'var(--border)'}`,
                        background: todo.done ? '#00b89c' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all .15s',
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
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTodo()}
                  placeholder="Voeg taak toe..."
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none', color: 'var(--text)' }}
                />
                <button
                  onClick={addTodo}
                  style={{ padding: '9px 16px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '.88rem', flexShrink: 0 }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Notities section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={sectionHeaderStyle}>Notities</span>
                <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '1px 8px', borderRadius: '50px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                  {notes.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Notitie toevoegen..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none', resize: 'none', fontFamily: 'inherit', color: 'var(--text)', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={addNote}
                    style={{ padding: '8px 20px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '.85rem' }}
                  >
                    Toevoegen
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loaded && notes.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: '.83rem', fontStyle: 'italic' }}>Nog geen notities.</div>
                )}
                {notes.map(note => (
                  <div key={note.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent1)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '6px' }}>
                      {new Date(note.created_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p style={{ fontSize: '.85rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'var(--text)', margin: 0 }}>{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — fixed 280px sidebar */}
          <div style={{ width: '280px', flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)', overflowY: 'auto' }}>
            <div style={{ padding: '20px', flex: 1 }}>
              <div style={{ fontSize: '.67rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '20px' }}>
                Projectinfo
              </div>

              {/* Status */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sidebarLabelStyle}>Status</div>
                <select
                  value={currentStatus}
                  onChange={e => changeStatus(e.target.value)}
                  style={{ ...sidebarSelectStyle, color: statusCfg.color }}
                >
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>

              {/* Prioriteit */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sidebarLabelStyle}>Prioriteit</div>
                <select
                  value={currentPriority}
                  onChange={e => changePriority(e.target.value)}
                  style={{ ...sidebarSelectStyle, color: prio.color }}
                >
                  {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {/* Klant */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sidebarLabelStyle}>Klant</div>
                <select
                  value={currentClientId}
                  onChange={e => changeClient(e.target.value)}
                  style={sidebarSelectStyle}
                >
                  <option value="">Intern</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>

              {/* Categorie */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sidebarLabelStyle}>Categorie</div>
                <span style={{ fontSize: '.82rem', color: 'var(--text)' }}>{project.category || '—'}</span>
              </div>

              {/* Aangemaakt */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sidebarLabelStyle}>Aangemaakt</div>
                <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                  {new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Bijgewerkt */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sidebarLabelStyle}>Bijgewerkt</div>
                <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                  {new Date(project.updated_at || project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Deadline */}
              <div style={{ marginBottom: '16px' }}>
                <div style={sidebarLabelStyle}>Deadline <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optioneel)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="date"
                    value={currentDeadline}
                    onChange={e => changeDeadline(e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.78rem', background: 'var(--bg)', outline: 'none', color: 'var(--text)' }}
                  />
                  {currentDeadline && (
                    <button
                      onClick={() => changeDeadline('')}
                      title="Deadline wissen"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: '4px', flexShrink: 0 }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {currentDeadline && (
                  <div style={{ marginTop: '5px' }}>
                    <DeadlineChip deadline={currentDeadline} />
                  </div>
                )}
              </div>

              {/* Taken progress */}
              <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={sidebarLabelStyle}>Taken</div>
                <span style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>
                  {doneTodos} / {todos.length} afgerond
                </span>
              </div>
            </div>

            {/* Delete button pinned at bottom for admin */}
            {isAdmin && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => onDelete(project.id)}
                  style={{
                    width: '100%', padding: '9px', background: 'none', border: '1px solid rgba(229,57,53,.35)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#e53935',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontSize: '.8rem', fontWeight: 700, transition: 'background .12s, border-color .12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(229,57,53,.08)'; (e.currentTarget as HTMLElement).style.borderColor = '#e53935' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,57,53,.35)' }}
                >
                  <Trash2 size={13} /> Verwijderen
                </button>
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

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '.72rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' as const,
  letterSpacing: '.08em', marginBottom: '10px', display: 'block',
}

const sidebarSelectStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)',
  outline: 'none', cursor: 'pointer', color: 'var(--text)',
}
