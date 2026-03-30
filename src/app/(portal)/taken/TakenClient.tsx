'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, List, LayoutGrid, CheckSquare } from 'lucide-react'

interface Todo {
  id: string
  title: string
  done: boolean
  due_date: string | null
  priority: string | null
  created_at: string
  project_id: string | null
  meeting_id: string | null
  projects?: { id: string; title: string; agency_id?: string; clients?: { company_name: string } | null } | null
  meeting_notes?: { id: string; title: string; agency_id?: string } | null
}

interface Project {
  id: string
  title: string
  clients?: { company_name: string } | null
}

interface Meeting {
  id: string
  title: string
}

interface Props {
  todos: Todo[]
  projects: Project[]
  meetings: Meeting[]
  agencyId: string
  isAdmin: boolean
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  return { toasts, addToast }
}

const PRIORITY_LABEL: Record<string, string> = { urgent: 'Urgent', hoog: 'Hoog', normaal: 'Normaal' }
const PRIORITY_COLOR: Record<string, string> = { urgent: '#ef4444', hoog: '#f97316', normaal: '#94a3b8' }
const PRIORITY_BORDER: Record<string, string> = { urgent: '3px solid #ef4444', hoog: '3px solid #f97316', normaal: 'none' }

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function isOverdue(dateStr: string | null, done: boolean) {
  if (!dateStr || done) return false
  return new Date(dateStr) < new Date()
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function dueDateColor(dateStr: string | null, done: boolean) {
  if (!dateStr || done) return 'var(--muted)'
  if (isOverdue(dateStr, done)) return '#ef4444'
  if (isToday(dateStr)) return '#f97316'
  return 'var(--muted)'
}

export default function TakenClient({ todos: initialTodos, projects, meetings, agencyId, isAdmin }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [filterStatus, setFilterStatus] = useState<'alle' | 'open' | 'afgerond'>('alle')
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [view, setView] = useState<'lijst' | 'kanban'>('lijst')
  const [showModal, setShowModal] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const { toasts, addToast } = useToasts()

  // Modal state
  const [modalTitle, setModalTitle] = useState('')
  const [modalProject, setModalProject] = useState('')
  const [modalPriority, setModalPriority] = useState('normaal')
  const [modalDueDate, setModalDueDate] = useState('')
  const [modalDone, setModalDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  function openAddModal() {
    setEditingTodo(null)
    setModalTitle('')
    setModalProject('')
    setModalPriority('normaal')
    setModalDueDate('')
    setModalDone(false)
    setShowModal(true)
  }

  function openEditModal(todo: Todo) {
    setEditingTodo(todo)
    setModalTitle(todo.title)
    setModalProject(todo.project_id || '')
    setModalPriority(todo.priority || 'normaal')
    setModalDueDate(todo.due_date ? todo.due_date.slice(0, 16) : '')
    setModalDone(todo.done)
    setShowModal(true)
  }

  async function toggleDone(todo: Todo) {
    const newDone = !todo.done
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: newDone } : t)))
    const { error } = await supabase.from('project_todos').update({ done: newDone }).eq('id', todo.id)
    if (error) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: todo.done } : t)))
      addToast('Fout bij opslaan', 'error')
    } else {
      addToast(newDone ? 'Taak afgerond!' : 'Taak heropend')
    }
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    const { error } = await supabase.from('project_todos').delete().eq('id', id)
    if (error) {
      addToast('Fout bij verwijderen', 'error')
    } else {
      addToast('Taak verwijderd')
    }
  }

  async function saveModal() {
    if (!modalTitle.trim()) return
    setSaving(true)
    if (editingTodo) {
      const { error } = await supabase.from('project_todos').update({
        title: modalTitle.trim(),
        project_id: modalProject || null,
        priority: modalPriority,
        due_date: modalDueDate || null,
        done: modalDone,
      }).eq('id', editingTodo.id)
      if (error) {
        addToast('Fout bij opslaan', 'error')
      } else {
        setTodos((prev) => prev.map((t) =>
          t.id === editingTodo.id
            ? { ...t, title: modalTitle.trim(), project_id: modalProject || null, priority: modalPriority, due_date: modalDueDate || null, done: modalDone }
            : t
        ))
        addToast('Taak opgeslagen')
        setShowModal(false)
      }
    } else {
      const { data, error } = await supabase.from('project_todos').insert({
        title: modalTitle.trim(),
        project_id: modalProject || null,
        priority: modalPriority,
        due_date: modalDueDate || null,
        done: false,
      }).select('id,title,done,due_date,priority,created_at,project_id,meeting_id').single()
      if (error || !data) {
        addToast('Fout bij aanmaken', 'error')
      } else {
        const project = projects.find((p) => p.id === data.project_id) || null
        const newTodo: Todo = {
          ...data,
          projects: project ? { id: project.id, title: project.title, clients: project.clients } : null,
          meeting_notes: null,
        }
        setTodos((prev) => [newTodo, ...prev])
        addToast('Taak aangemaakt')
        setShowModal(false)
      }
    }
    setSaving(false)
  }

  // Drag & drop for kanban
  function handleDragStart(e: React.DragEvent, todoId: string) {
    e.dataTransfer.setData('todoId', todoId)
  }

  async function handleDrop(e: React.DragEvent, colDone: boolean) {
    e.preventDefault()
    const todoId = e.dataTransfer.getData('todoId')
    setDragOverCol(null)
    const todo = todos.find((t) => t.id === todoId)
    if (!todo || todo.done === colDone) return
    setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, done: colDone } : t)))
    const { error } = await supabase.from('project_todos').update({ done: colDone }).eq('id', todoId)
    if (error) {
      setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, done: todo.done } : t)))
      addToast('Fout bij verplaatsen', 'error')
    } else {
      addToast(colDone ? 'Taak afgerond!' : 'Taak heropend')
    }
  }

  // Filtered todos
  const filtered = todos.filter((t) => {
    if (filterStatus === 'open' && t.done) return false
    if (filterStatus === 'afgerond' && !t.done) return false
    if (filterProject && t.project_id !== filterProject) return false
    if (filterPriority && (t.priority || 'normaal') !== filterPriority) return false
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const openCount = todos.filter((t) => !t.done).length
  const doneCount = todos.filter((t) => t.done).length

  // Group by project for list view
  function getGroupKey(t: Todo) {
    if (t.projects) return t.projects.id
    if (t.meeting_notes) return 'meeting_' + t.meeting_notes.id
    return 'loose'
  }

  function getGroupLabel(t: Todo) {
    if (t.projects) return t.projects.title
    if (t.meeting_notes) return t.meeting_notes.title
    return 'Losse taken'
  }

  function getGroupClient(t: Todo) {
    if (t.projects?.clients?.company_name) return t.projects.clients.company_name
    return null
  }

  const groups: Map<string, Todo[]> = new Map()
  for (const t of filtered) {
    const key = getGroupKey(t)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{
            background: toast.type === 'error' ? '#ef4444' : '#22c55e',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '.875rem',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,.15)',
            animation: 'fadeInUp .2s ease',
          }}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-syne), sans-serif', margin: 0 }}>Taken</h1>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', margin: '4px 0 12px' }}>Alle openstaande actiepunten</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: '.78rem', color: 'var(--text)' }}>
              <strong>{openCount}</strong> open
            </span>
            <span style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: '.78rem', color: 'var(--muted)' }}>
              <strong>{doneCount}</strong> afgerond
            </span>
            <span style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: '.78rem', color: 'var(--muted)' }}>
              <strong>{todos.length}</strong> totaal
            </span>
          </div>
        </div>
        <button
          onClick={openAddModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent1)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 20px',
            fontSize: '.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            marginTop: 4,
          }}
        >
          <Plus size={16} /> Nieuwe taak
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {(['alle', 'open', 'afgerond'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              background: filterStatus === s ? 'var(--accent1)' : 'var(--card)',
              color: filterStatus === s ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              fontSize: '.84rem',
              fontWeight: filterStatus === s ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          style={{
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            fontSize: '.84rem',
            cursor: 'pointer',
          }}
        >
          <option value="">Alle projecten</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            fontSize: '.84rem',
            cursor: 'pointer',
          }}
        >
          <option value="">Alle prioriteiten</option>
          <option value="normaal">Normaal</option>
          <option value="hoog">Hoog</option>
          <option value="urgent">Urgent</option>
        </select>

        <input
          type="text"
          placeholder="Zoek taken…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            fontSize: '.84rem',
            outline: 'none',
            minWidth: 160,
          }}
        />

        {/* View toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {(['lijst', 'kanban'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? 'var(--accent1)' : 'transparent',
                color: view === v ? '#fff' : 'var(--muted)',
                border: 'none',
                padding: '6px 14px',
                fontSize: '.84rem',
                fontWeight: view === v ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '72px 24px', color: 'var(--muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, opacity: 0.4 }}><CheckSquare size={48} /></div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Geen taken gevonden</div>
          <div style={{ fontSize: '.9rem', marginBottom: 20 }}>Voeg een nieuwe taak toe om te beginnen</div>
          <button
            onClick={openAddModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={16} /> Nieuwe taak
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'lijst' && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Array.from(groups.entries()).map(([key, groupTodos]) => {
            const rep = groupTodos[0]
            const groupLabel = getGroupLabel(rep)
            const clientName = getGroupClient(rep)
            return (
              <div key={key}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {groupLabel}
                  </span>
                  {clientName && (
                    <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>— {clientName}</span>
                  )}
                  <span style={{ fontSize: '.72rem', background: 'var(--border)', borderRadius: 20, padding: '1px 7px', color: 'var(--muted)' }}>
                    {groupTodos.length}
                  </span>
                </div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {groupTodos.map((todo, idx) => (
                    <TodoRow
                      key={todo.id}
                      todo={todo}
                      isLast={idx === groupTodos.length - 1}
                      isAdmin={isAdmin}
                      onToggle={toggleDone}
                      onDelete={deleteTodo}
                      onEdit={openEditModal}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === 'kanban' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Te doen', done: false, color: '#3b82f6' },
            { label: 'In uitvoering', done: false, color: '#f97316' },
            { label: 'Afgerond', done: true, color: '#22c55e' },
          ].map((col, colIdx) => {
            const colTodos = colIdx === 2
              ? filtered.filter((t) => t.done)
              : colIdx === 0
              ? filtered.filter((t) => !t.done && !(t.priority === 'urgent'))
              : filtered.filter((t) => !t.done && t.priority === 'urgent')

            return (
              <div
                key={col.label}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.label) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.done)}
                style={{
                  background: dragOverCol === col.label ? 'rgba(0,0,0,.04)' : 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  minHeight: 200,
                  transition: 'background .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>{col.label}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)', marginLeft: 'auto' }}>{colTodos.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colTodos.map((todo) => (
                    <KanbanCard
                      key={todo.id}
                      todo={todo}
                      onDragStart={handleDragStart}
                      onEdit={openEditModal}
                    />
                  ))}
                  {colTodos.length === 0 && (
                    <div style={{ color: 'var(--muted)', fontSize: '.8rem', textAlign: 'center', padding: '24px 0' }}>Geen taken</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.45)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 16px 48px rgba(0,0,0,.18)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif' }}>
              {editingTodo ? 'Taak bewerken' : 'Nieuwe taak'}
            </h2>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Titel *</span>
              <input
                type="text"
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                placeholder="Taakomschrijving…"
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '.9rem',
                  color: 'var(--text)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Project</span>
              <select
                value={modalProject}
                onChange={(e) => setModalProject(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '.9rem',
                  color: 'var(--text)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Geen project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>

            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Prioriteit</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['normaal', 'hoog', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setModalPriority(p)}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      border: '1px solid',
                      borderColor: modalPriority === p ? PRIORITY_COLOR[p] : 'var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: modalPriority === p ? PRIORITY_COLOR[p] : 'var(--bg)',
                      color: modalPriority === p ? '#fff' : 'var(--text)',
                      fontSize: '.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {PRIORITY_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Deadline</span>
              <input
                type="datetime-local"
                value={modalDueDate}
                onChange={(e) => setModalDueDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '.9rem',
                  color: 'var(--text)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            {editingTodo && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={modalDone}
                  onChange={(e) => setModalDone(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: '.9rem', color: 'var(--text)' }}>Taak is afgerond</span>
              </label>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 18px', fontSize: '.9rem', cursor: 'pointer' }}
              >
                Annuleren
              </button>
              <button
                onClick={saveModal}
                disabled={saving || !modalTitle.trim()}
                style={{
                  background: 'var(--accent1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 20px',
                  fontSize: '.9rem',
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving || !modalTitle.trim() ? 0.6 : 1,
                }}
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TodoRow({
  todo,
  isLast,
  isAdmin,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo
  isLast: boolean
  isAdmin: boolean
  onToggle: (t: Todo) => void
  onDelete: (id: string) => void
  onEdit: (t: Todo) => void
}) {
  const [hovered, setHovered] = useState(false)
  const priority = todo.priority || 'normaal'
  const overdue = isOverdue(todo.due_date, todo.done)
  const dateColor = dueDateColor(todo.due_date, todo.done)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderLeft: PRIORITY_BORDER[priority],
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: hovered ? 'rgba(0,0,0,.02)' : 'transparent',
        cursor: 'pointer',
        transition: 'background .12s',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(todo) }}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: todo.done ? 'none' : '2px solid var(--border)',
          background: todo.done ? '#22c55e' : 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '.7rem',
        }}
      >
        {todo.done ? '✓' : ''}
      </button>

      {/* Title */}
      <span
        onClick={() => onEdit(todo)}
        style={{
          flex: 1,
          fontSize: '.9rem',
          color: todo.done ? 'var(--muted)' : 'var(--text)',
          textDecoration: todo.done ? 'line-through' : 'none',
          fontWeight: 500,
        }}
      >
        {todo.title}
      </span>

      {/* Priority chip — only if not normaal */}
      {priority !== 'normaal' && (
        <span style={{
          fontSize: '.72rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 20,
          background: priority === 'urgent' ? '#fef2f2' : '#fff7ed',
          color: PRIORITY_COLOR[priority],
          flexShrink: 0,
        }}>
          {PRIORITY_LABEL[priority]}
        </span>
      )}

      {/* Source badge */}
      {todo.projects && (
        <span style={{ fontSize: '.72rem', padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {todo.projects.title}
        </span>
      )}
      {todo.meeting_notes && (
        <span style={{ fontSize: '.72rem', padding: '2px 8px', borderRadius: 20, background: '#f0fdfa', color: '#0d9488', flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {todo.meeting_notes.title}
        </span>
      )}

      {/* Due date */}
      {todo.due_date && (
        <span style={{ fontSize: '.78rem', color: dateColor, flexShrink: 0 }}>
          {formatDate(todo.due_date)}
        </span>
      )}

      {/* Delete — admin only, on hover */}
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id) }}
          style={{
            opacity: hovered ? 1 : 0,
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '0 4px',
            transition: 'opacity .15s',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Verwijder taak"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

function KanbanCard({
  todo,
  onDragStart,
  onEdit,
}: {
  todo: Todo
  onDragStart: (e: React.DragEvent, id: string) => void
  onEdit: (t: Todo) => void
}) {
  const priority = todo.priority || 'normaal'
  const dateColor = dueDateColor(todo.due_date, todo.done)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, todo.id)}
      onClick={() => onEdit(todo)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: PRIORITY_BORDER[priority] !== 'none' ? PRIORITY_BORDER[priority] : '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: '.875rem', fontWeight: 500, color: todo.done ? 'var(--muted)' : 'var(--text)', textDecoration: todo.done ? 'line-through' : 'none', marginBottom: 8 }}>
        {todo.title}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {priority !== 'normaal' && (
          <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: priority === 'urgent' ? '#fef2f2' : '#fff7ed', color: PRIORITY_COLOR[priority] }}>
            {PRIORITY_LABEL[priority]}
          </span>
        )}
        {todo.projects && (
          <span style={{ fontSize: '.68rem', padding: '1px 7px', borderRadius: 20, background: '#eff6ff', color: '#2563eb' }}>
            {todo.projects.title}
          </span>
        )}
        {todo.meeting_notes && (
          <span style={{ fontSize: '.68rem', padding: '1px 7px', borderRadius: 20, background: '#f0fdfa', color: '#0d9488' }}>
            {todo.meeting_notes.title}
          </span>
        )}
        {todo.due_date && (
          <span style={{ fontSize: '.72rem', color: dateColor, marginLeft: 'auto' }}>
            {formatDate(todo.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}
