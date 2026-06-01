'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useClientFilter } from '@/components/layout/ClientFilter'
import { Plus, Pencil, Trash2, Upload, X, LayoutGrid, Calendar, Table2, List, Link2, Inbox, Send, FileText, SendHorizonal } from 'lucide-react'
import { PlatformIcon, PlatformBadge, PLATFORM_COLORS, PLATFORM_LABELS } from '@/components/ui/PlatformIcon'

const PLATFORMS: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  instagram: { label: 'Instagram', color: '#e1306c', bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', textColor: '#fff' },
  tiktok: { label: 'TikTok', color: '#010101', bg: 'linear-gradient(135deg,#010101,#69c9d0)', textColor: '#fff' },
  linkedin: { label: 'LinkedIn', color: '#0077b5', bg: '#0077b5', textColor: '#fff' },
  youtube: { label: 'YouTube', color: '#ff0000', bg: '#ff0000', textColor: '#fff' },
  facebook: { label: 'Facebook', color: '#1877f2', bg: '#1877f2', textColor: '#fff' },
}

const CONTENT_TYPES = ['Post', 'Story', 'Reel', 'Carousel', 'Video', 'Artikel']

const BOARD_COLUMNS = [
  { key: 'concept', label: 'IDEE', color: '#6b7280', headerBg: '#f3f4f6', dotColor: '#6b7280' },
  { key: 'pending_approval', label: 'IN BEHANDELING', color: '#e53935', headerBg: 'rgba(229,57,53,.07)', dotColor: '#e53935' },
  { key: 'scheduled', label: 'GOEDGEKEURD', color: 'var(--accent1)', headerBg: 'rgba(26,63,228,.07)', dotColor: 'var(--accent1)' },
  { key: 'published', label: 'GEPUBLICEERD', color: 'var(--accent3)', headerBg: 'rgba(0,184,156,.07)', dotColor: 'var(--accent3)' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  concept: { label: 'Idee', color: '#6b7280', bg: 'rgba(107,114,128,.12)' },
  pending_approval: { label: 'In behandeling', color: '#e53935', bg: 'rgba(229,57,53,.1)' },
  scheduled: { label: 'Goedgekeurd', color: 'var(--accent1)', bg: 'rgba(26,63,228,.1)' },
  published: { label: 'Gepubliceerd', color: 'var(--accent3)', bg: 'rgba(0,184,156,.1)' },
}

interface Props {
  posts: any[]
  clients: any[]
  agencyId: string
  isAdmin: boolean
}

const EMPTY_FORM = {
  title: '', platform: 'instagram', content_type: 'Post',
  scheduled_at: '', client_id: '', status: 'concept',
  caption: '', hashtags: '', notes: '',
}

export default function ContentClient({ posts: initialPosts, clients, agencyId, isAdmin }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const { selectedClientId } = useClientFilter()
  const [view, setView] = useState<'board' | 'calendar' | 'table' | 'queue'>('board')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function copyShareLink(post: any) {
    if (!post?.share_token) return
    const url = `${window.location.origin}/review/${post.share_token}`
    navigator.clipboard.writeText(url).then(() => showToast('Link gekopieerd'))
  }
  const [activityTab, setActivityTab] = useState<'privaat' | 'publiek'>('privaat')
  const [activityMsg, setActivityMsg] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [tableStatusOpen, setTableStatusOpen] = useState<string | null>(null)

  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const supabase = createClient()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = posts
    .filter(p => platformFilter === 'all' || p.platform === platformFilter)
    .filter(p => !selectedClientId || p.client_id === selectedClientId)

  function openPost(post?: any, defaultStatus?: string) {
    if (post) {
      setEditingPost(post)
      setForm({
        title: post.title || '', platform: post.platform || 'instagram',
        content_type: post.content_type || 'Post', scheduled_at: post.scheduled_at?.slice(0, 16) || '',
        client_id: post.client_id || '', status: post.status || 'concept',
        caption: post.caption || '', hashtags: post.hashtags || '', notes: post.notes || '',
      })
    } else {
      setEditingPost(null)
      setForm({ ...EMPTY_FORM, status: defaultStatus || 'concept' })
    }
    setShowModal(true)
  }

  async function savePost() {
    setLoading(true)
    const payload = { ...form, client_id: form.client_id || null }
    if (editingPost) {
      const { data, error } = await supabase.from('content_posts').update(payload).eq('id', editingPost.id).select('*, clients(company_name)').single()
      if (data) { setPosts(prev => prev.map(p => p.id === data.id ? data : p)); setShowModal(false); showToast('Post bijgewerkt!') }
      else { showToast(`Fout: ${error?.message || 'Opslaan mislukt'}`) }
    } else {
      const { data, error } = await supabase.from('content_posts').insert({ ...payload, agency_id: agencyId }).select('*, clients(company_name)').single()
      if (data) { setPosts(prev => [...prev, data]); setShowModal(false); showToast('Post aangemaakt!') }
      else { showToast(`Fout: ${error?.message || 'Opslaan mislukt'}`) }
    }
    setLoading(false)
  }

  async function deletePost(id: string) {
    if (!isAdmin) return
    await supabase.from('content_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    setShowModal(false)
    showToast('Post verwijderd')
  }

  async function movePost(id: string, newStatus: string) {
    if (!isAdmin) return
    await supabase.from('content_posts').update({ status: newStatus }).eq('id', id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
    if (editingPost?.id === id) setForm(f => ({ ...f, status: newStatus }))
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    if (dragId) movePost(dragId, colKey)
    setDragId(null)
    setDragOver(null)
  }

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()

  function postsOnDay(day: number) {
    return filtered.filter(p => {
      if (!p.scheduled_at) return false
      const d = new Date(p.scheduled_at)
      return d.getDate() === day && d.getMonth() === viewMonth && d.getFullYear() === viewYear
    })
  }

  const upcomingPosts = [...filtered].filter(p => p.scheduled_at && new Date(p.scheduled_at) >= now).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const pastPosts = [...filtered].filter(p => p.scheduled_at && new Date(p.scheduled_at) < now).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  const views: { key: 'board' | 'calendar' | 'table' | 'queue'; label: string }[] = [
    { key: 'board', label: 'Board' },
    { key: 'calendar', label: 'Kalender' },
    { key: 'table', label: 'Tabel' },
    { key: 'queue', label: 'Wachtrij' },
  ]

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 2000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        {/* Top row: title + action */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px 0', letterSpacing: '-.02em' }}>
              Content
            </h1>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', margin: 0 }}>
              {filtered.length} {filtered.length === 1 ? 'post' : 'posts'} deze maand
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openPost()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 22px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(26,63,228,.25)', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              <Plus size={16} /> Nieuw
            </button>
          )}
        </div>

        {/* Bottom row: platform filters + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Platform filter pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[{ key: 'all', label: 'Alle' }, ...Object.entries(PLATFORMS).map(([k, v]) => ({ key: k, label: v.label }))].map(pl => {
              const isActive = platformFilter === pl.key
              const color = pl.key === 'all' ? 'var(--accent1)' : (PLATFORMS[pl.key]?.color ?? 'var(--accent1)')
              return (
                <button
                  key={pl.key}
                  onClick={() => setPlatformFilter(pl.key)}
                  style={{
                    padding: '5px 14px', borderRadius: '50px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${isActive ? color : 'var(--border)'}`,
                    background: isActive ? color : 'transparent',
                    color: isActive ? '#fff' : 'var(--muted)',
                    transition: 'all .15s',
                  }}
                >
                  {pl.key !== 'all' && <PlatformIcon platform={pl.key} size={14} color={isActive ? '#fff' : undefined} />} {pl.label}
                </button>
              )
            })}
          </div>

          {/* View toggle — pill tabs */}
          <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '50px', padding: '3px', gap: '2px', flexShrink: 0 }}>
            {views.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                style={{
                  padding: '5px 16px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                  fontSize: '.78rem', fontWeight: 600,
                  background: view === v.key ? 'var(--accent1)' : 'transparent',
                  color: view === v.key ? '#fff' : 'var(--muted)',
                  transition: 'all .15s',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ====== BOARD VIEW ====== */}
      {view === 'board' && (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'flex-start' }}>
          {BOARD_COLUMNS.map(col => {
            const colPosts = filtered.filter(p => p.status === col.key)
            return (
              <div
                key={col.key}
                onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.key)}
                style={{ minWidth: '280px', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0', borderRadius: '12px', transition: 'background .15s', background: dragOver === col.key ? col.headerBg : 'transparent' }}
              >
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: col.headerBg,
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: col.dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '.7rem', fontWeight: 800, letterSpacing: '.1em', color: col.color, textTransform: 'uppercase' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', background: 'var(--card)', borderRadius: '50px', padding: '1px 8px', border: '1px solid var(--border)' }}>{colPosts.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px' }}>
                  {colPosts.map(post => (
                    <BoardCard
                      key={post.id}
                      post={post}
                      onClick={() => openPost(post)}
                      onDragStart={e => handleDragStart(e, post.id)}
                      isDragging={dragId === post.id}
                    />
                  ))}
                </div>

                {/* Add button */}
                {isAdmin && (
                  <button
                    onClick={() => openPost(undefined, col.key)}
                    style={{
                      marginTop: '10px', width: '100%', padding: '10px', border: '1.5px dashed var(--border)',
                      borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer',
                      fontSize: '.78rem', color: 'var(--muted)', fontWeight: 500, transition: 'all .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = col.dotColor; (e.currentTarget as HTMLElement).style.color = col.color }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                  >
                    + Toevoegen
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ====== CALENDAR VIEW ====== */}
      {view === 'calendar' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>‹</button>
            <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize', minWidth: '180px', textAlign: 'center' }}>{monthName}</span>
            <button onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>›</button>
            <button onClick={() => { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()) }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer', fontSize: '.78rem', color: 'var(--muted)' }}>Vandaag</button>
            {isAdmin && <button onClick={() => openPost()} style={{ marginLeft: 'auto', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '7px 16px', cursor: 'pointer', fontSize: '.82rem', fontWeight: 700 }}>+ Post plannen</button>}
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid var(--border)' }}>
              {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(d => (
                <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`e${i}`} style={{ minHeight: '100px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,.02)' }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayPosts = postsOnDay(day)
                const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear()
                const isWeekend = (new Date(viewYear, viewMonth, day).getDay() % 6 === 0)
                return (
                  <div
                    key={day}
                    onClick={() => isAdmin && openPost()}
                    style={{
                      minHeight: '100px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                      padding: '6px', cursor: isAdmin ? 'pointer' : 'default',
                      background: isToday ? 'rgba(26,63,228,.04)' : isWeekend ? 'rgba(0,0,0,.012)' : 'var(--card)',
                    }}
                    onMouseEnter={e => isAdmin && ((e.currentTarget as HTMLElement).style.background = 'rgba(26,63,228,.06)')}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(26,63,228,.04)' : isWeekend ? 'rgba(0,0,0,.012)' : 'var(--card)' }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.72rem', fontWeight: isToday ? 800 : 400, marginBottom: '4px',
                      background: isToday ? 'var(--accent1)' : 'none',
                      color: isToday ? '#fff' : isWeekend ? 'var(--muted)' : 'var(--text)',
                    }}>
                      {day}
                    </div>
                    {dayPosts.slice(0, 3).map(post => {
                      const pl = PLATFORMS[post.platform] || PLATFORMS.instagram
                      return (
                        <div
                          key={post.id}
                          onClick={e => { e.stopPropagation(); openPost(post) }}
                          style={{
                            borderRadius: '4px', padding: '2px 7px', fontSize: '.66rem', fontWeight: 600,
                            marginBottom: '2px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            background: `${pl.color}1a`, borderLeft: `3px solid ${pl.color}`,
                            color: pl.color === '#010101' ? '#444' : pl.color,
                          }}
                        >
                          {post.title || post.content_type}
                        </div>
                      )
                    })}
                    {dayPosts.length > 3 && (
                      <div style={{ fontSize: '.62rem', color: 'var(--muted)', paddingLeft: '4px' }}>+{dayPosts.length - 3}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ====== TABLE VIEW ====== */}
      {view === 'table' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--muted)' }}>
              <FileText size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px', color: 'var(--text)' }}>Geen content gevonden</div>
              <div style={{ fontSize: '.85rem' }}>Maak een nieuwe post aan om te starten</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '32px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '120px' }} />
                <col />
                <col style={{ width: '140px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['', 'Status', 'Platform', 'Titel', 'Klant', 'Type', 'Datum', 'Acties'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', background: 'var(--bg)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(post => {
                  const pl = PLATFORMS[post.platform] || PLATFORMS.instagram
                  const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.concept
                  const dateStr = post.scheduled_at
                    ? new Date(post.scheduled_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })
                    : '—'
                  return (
                    <tr
                      key={post.id}
                      onClick={() => openPost(post)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.025)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Checkbox placeholder */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ width: '16px', height: '16px', border: '1.5px solid var(--border)', borderRadius: '4px' }} />
                      </td>

                      {/* Status pill — clickable dropdown */}
                      <td style={{ padding: '12px 14px' }} onClick={e => { e.stopPropagation(); setTableStatusOpen(tableStatusOpen === post.id ? null : post.id) }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700,
                            background: sc.bg, color: sc.color, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}>
                            {sc.label}
                          </span>
                          {tableStatusOpen === post.id && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: '4px',
                              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                              boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: '160px', overflow: 'hidden',
                            }}>
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <div
                                  key={k}
                                  onClick={e => { e.stopPropagation(); movePost(post.id, k); setTableStatusOpen(null) }}
                                  style={{
                                    padding: '9px 14px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
                                    color: v.color, background: post.status === k ? v.bg : 'transparent',
                                    transition: 'background .1s',
                                  }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = v.bg}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = post.status === k ? v.bg : 'transparent' }}
                                >
                                  {v.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Platform chip */}
                      <td style={{ padding: '12px 14px' }}>
                        <PlatformBadge platform={post.platform} />
                      </td>

                      {/* Title */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {post.title || 'Geen titel'}
                        </span>
                        {post.caption && (
                          <span style={{ fontSize: '.72rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', marginTop: '2px' }}>
                            {post.caption.slice(0, 55)}{post.caption.length > 55 ? '…' : ''}
                          </span>
                        )}
                      </td>

                      {/* Client */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '.8rem', color: post.clients?.company_name ? 'var(--text)' : 'var(--muted)' }}>
                          {post.clients?.company_name || '—'}
                        </span>
                      </td>

                      {/* Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '.78rem', color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '50px', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                          {post.content_type || 'Post'}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{dateStr}</span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => openPost(post)}
                            title="Bewerken"
                            style={{ padding: '5px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--muted)', transition: 'all .1s', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => deletePost(post.id)}
                              title="Verwijderen"
                              style={{ padding: '5px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--muted)', transition: 'all .1s', display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(229,57,53,.08)'; (e.currentTarget as HTMLElement).style.color = '#e53935'; (e.currentTarget as HTMLElement).style.borderColor = '#e53935' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ====== QUEUE VIEW ====== */}
      {view === 'queue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ background: 'var(--accent1)', color: '#fff', borderRadius: '50px', padding: '3px 12px', fontSize: '.72rem', fontWeight: 700 }}>GEPLAND</span>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{upcomingPosts.length} posts</span>
              {isAdmin && <button onClick={() => openPost()} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', cursor: 'pointer', fontSize: '.78rem', color: 'var(--muted)' }}>+ Toevoegen</button>}
            </div>
            {upcomingPosts.length === 0 ? (
              <EmptyState label="Geen geplande posts" icon="inbox" />
            ) : upcomingPosts.map(post => <QueueCard key={post.id} post={post} onClick={() => openPost(post)} />)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ background: 'var(--accent3)', color: '#fff', borderRadius: '50px', padding: '3px 12px', fontSize: '.72rem', fontWeight: 700 }}>GEPUBLICEERD</span>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{pastPosts.length} posts</span>
            </div>
            {pastPosts.length === 0 ? (
              <EmptyState label="Nog niets gepubliceerd" icon="send" />
            ) : pastPosts.map(post => <QueueCard key={post.id} post={post} past onClick={() => openPost(post)} />)}
          </div>
        </div>
      )}

      {/* ====== DETAIL MODAL (Rella-style 3-column) ====== */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background: 'var(--bg)', borderRadius: '14px', width: '100%', maxWidth: '1060px',
            height: '88vh', display: 'flex', overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,.22)',
          }}>
            {/* LEFT: Media upload */}
            <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
                <button style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--accent1)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '2px solid var(--accent1)', paddingBottom: '3px' }}>Media</button>
                <button style={{ fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '3px' }}>Preview</button>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '14px', overflowY: 'auto' }}>
                {/* Large upload area */}
                <div
                  style={{
                    width: '100%', aspectRatio: '4/3', border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', cursor: 'pointer', background: 'var(--bg)', transition: 'border-color .15s, background .15s', color: 'var(--muted)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent1)'; (e.currentTarget as HTMLElement).style.background = 'rgba(26,63,228,.03)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                >
                  <Upload size={24} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Upload media</div>
                    <div style={{ fontSize: '.72rem', lineHeight: 1.5 }}>Sleep bestanden hier<br />of klik om te selecteren</div>
                  </div>
                </div>

                {/* Thumbnail strip */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ width: '52px', height: '52px', border: '2px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--muted)', flexShrink: 0 }}>+</div>
                </div>

                {/* Platform preview indicator */}
                <div style={{ marginTop: 'auto', padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>Platform</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlatformIcon platform={form.platform} size={16} />
                    <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text)' }}>{PLATFORMS[form.platform]?.label || 'Instagram'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)', padding: '1px 8px', borderRadius: '50px' }}>{form.content_type}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Media wordt gebruikt voor publicatie
              </div>
            </div>

            {/* CENTER: Fields */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
              {/* Title bar */}
              <div style={{ padding: '18px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={editingPost ? 'Post titel...' : 'Nieuwe inhoud'}
                  style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-syne), sans-serif' }}
                />
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
              </div>

              {/* Fields rows */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {[
                  {
                    label: 'Klant',
                    content: (
                      <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} style={fieldSelectStyle}>
                        <option value="">Geen / Intern</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    )
                  },
                  {
                    label: 'Status',
                    content: (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <button key={k} onClick={() => setForm(p => ({ ...p, status: k }))} style={{
                            padding: '4px 12px', borderRadius: '50px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                            border: `1.5px solid ${form.status === k ? v.color : 'var(--border)'}`,
                            background: form.status === k ? v.bg : 'transparent',
                            color: form.status === k ? v.color : 'var(--muted)',
                          }}>
                            {v.label}
                          </button>
                        ))}
                      </div>
                    )
                  },
                  {
                    label: 'Platform',
                    content: (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {Object.entries(PLATFORMS).map(([k, v]) => (
                          <button key={k} onClick={() => setForm(p => ({ ...p, platform: k }))} style={{
                            padding: '4px 12px', borderRadius: '50px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                            border: `1.5px solid ${form.platform === k ? v.color : 'var(--border)'}`,
                            background: form.platform === k ? `${v.color}18` : 'transparent',
                            color: form.platform === k ? v.color : 'var(--muted)',
                          }}>
                            <PlatformIcon platform={k} size={13} color={form.platform === k ? v.color : '#9ca3af'} /> {v.label}
                          </button>
                        ))}
                      </div>
                    )
                  },
                  {
                    label: 'Type',
                    content: (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {CONTENT_TYPES.map(t => (
                          <button key={t} onClick={() => setForm(p => ({ ...p, content_type: t }))} style={{
                            padding: '4px 10px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${form.content_type === t ? 'var(--accent1)' : 'var(--border)'}`,
                            background: form.content_type === t ? 'rgba(26,63,228,.1)' : 'transparent',
                            color: form.content_type === t ? 'var(--accent1)' : 'var(--muted)',
                          }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    )
                  },
                  {
                    label: 'Inplannen',
                    content: <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} style={fieldInputStyle} />
                  },
                  {
                    label: 'Caption',
                    content: <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="Schrijf je caption hier..." rows={4} style={{ ...fieldInputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                  },
                  {
                    label: 'Hashtags',
                    content: <input value={form.hashtags} onChange={e => setForm(p => ({ ...p, hashtags: e.target.value }))} placeholder="#hashtag1 #hashtag2 ..." style={fieldInputStyle} />
                  },
                  {
                    label: 'Notities',
                    content: <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Briefing, aandachtspunten..." rows={2} style={{ ...fieldInputStyle, resize: 'none', fontFamily: 'inherit' }} />
                  },
                ].map(({ label, content }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', minHeight: '48px' }}>
                    <div style={{ width: '130px', flexShrink: 0, padding: '13px 18px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
                    </div>
                    <div style={{ flex: 1, padding: '11px 18px 11px 0', display: 'flex', alignItems: 'center' }}>
                      {content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom action bar */}
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', background: 'var(--card)', alignItems: 'center' }}>
                {editingPost && isAdmin && (
                  <button onClick={() => deletePost(editingPost.id)} title="Verwijderen" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 12px', background: 'rgba(229,57,53,.08)', color: '#e53935', border: '1px solid rgba(229,57,53,.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem' }}>
                    <Trash2 size={14} />
                  </button>
                )}
                {editingPost && editingPost.share_token && (
                  <button
                    onClick={() => copyShareLink(editingPost)}
                    title="Kopieer review link"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 12px', background: 'rgba(26,63,228,.07)', color: 'var(--accent1)', border: '1px solid rgba(26,63,228,.2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', whiteSpace: 'nowrap' }}
                  >
                    <Link2 size={14} /> Deel
                  </button>
                )}
                {editingPost && isAdmin && (
                  <select value={editingPost?.status} onChange={e => { movePost(editingPost.id, e.target.value); setForm(p => ({ ...p, status: e.target.value })) }} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)', cursor: 'pointer' }}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                )}
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '9px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', fontSize: '.85rem', color: 'var(--muted)' }}>Annuleren</button>
                {isAdmin && (
                  <button onClick={savePost} disabled={loading} style={{ flex: 2, padding: '9px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '.9rem', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Opslaan...' : editingPost ? 'Bijwerken' : '+ Aanmaken'}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: Activity feed */}
            <div style={{ width: '268px', flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0' }}>
                <button onClick={() => setActivityTab('privaat')} style={{ flex: 1, padding: '6px', fontSize: '.8rem', fontWeight: activityTab === 'privaat' ? 700 : 400, color: activityTab === 'privaat' ? 'var(--text)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activityTab === 'privaat' ? '2px solid var(--accent1)' : '2px solid transparent' }}>Privaat</button>
                <button onClick={() => setActivityTab('publiek')} style={{ flex: 1, padding: '6px', fontSize: '.8rem', fontWeight: activityTab === 'publiek' ? 700 : 400, color: activityTab === 'publiek' ? 'var(--text)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activityTab === 'publiek' ? '2px solid var(--accent1)' : '2px solid transparent' }}>Publiek</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {editingPost ? (
                  <>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Inhoud aangemaakt</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{new Date(editingPost.created_at).toLocaleString('nl-NL')}</div>
                    </div>
                    {editingPost.updated_at && editingPost.updated_at !== editingPost.created_at && (
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Bijgewerkt</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{new Date(editingPost.updated_at).toLocaleString('nl-NL')}</div>
                      </div>
                    )}
                    {editingPost.scheduled_at && (
                      <div style={{ background: 'rgba(26,63,228,.05)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid rgba(26,63,228,.15)' }}>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--accent1)', marginBottom: '4px' }}>Ingepland voor</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{new Date(editingPost.scheduled_at).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem', marginTop: '24px', lineHeight: 1.6 }}>
                    Activiteit verschijnt na aanmaken
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={activityMsg}
                    onChange={e => setActivityMsg(e.target.value)}
                    placeholder="Typ een bericht..."
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.8rem', background: 'var(--bg)', outline: 'none', color: 'var(--text)' }}
                  />
                  <button
                    onClick={() => { if (activityMsg.trim()) { showToast('Bericht verstuurd'); setActivityMsg('') } }}
                    disabled={!activityMsg.trim()}
                    style={{ padding: '8px 12px', background: activityMsg.trim() ? 'var(--accent1)' : 'var(--border)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: activityMsg.trim() ? 'pointer' : 'not-allowed', fontSize: '.9rem', transition: 'background .15s' }}
                  >
                    <SendHorizonal size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: '.85rem', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box', color: 'var(--text)',
}

const fieldSelectStyle: React.CSSProperties = {
  padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: '.82rem', background: 'var(--bg)', outline: 'none', cursor: 'pointer', color: 'var(--text)',
}

function BoardCard({ post, onClick, onDragStart, isDragging }: { post: any; onClick: () => void; onDragStart: (e: React.DragEvent) => void; isDragging: boolean }) {
  const pl = PLATFORMS[post.platform] || PLATFORMS.instagram
  const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.concept
  const dateStr = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${pl.color}`,
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        cursor: 'grab',
        overflow: 'hidden',
        opacity: isDragging ? 0.4 : 1,
        transform: isDragging ? 'rotate(1.5deg)' : 'none',
        transition: 'box-shadow .15s, transform .15s, opacity .15s',
        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
      }}
      onMouseEnter={e => { if (!isDragging) { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,.09)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,.04)'; (e.currentTarget as HTMLElement).style.transform = isDragging ? 'rotate(1.5deg)' : 'none' }}
    >
      {/* Top row: platform chip + type chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <PlatformBadge platform={post.platform} size={11} />
        <span style={{
          fontSize: '.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '50px',
          background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)',
        }}>
          {post.content_type || 'Post'}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '6px', lineHeight: 1.35, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {post.title || 'Geen titel'}
      </div>

      {/* Caption preview */}
      {post.caption && (
        <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
          {post.caption.slice(0, 60)}{post.caption.length > 60 ? '…' : ''}
        </div>
      )}

      {/* Bottom row: client + date + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        {post.clients?.company_name && (
          <span style={{ fontSize: '.65rem', color: 'var(--muted)', background: 'var(--bg)', borderRadius: '50px', padding: '1px 7px', border: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>
            {post.clients.company_name}
          </span>
        )}
        {dateStr && (
          <span style={{ fontSize: '.65rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {dateStr}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: '50px', background: sc.bg, color: sc.color, flexShrink: 0 }}>
          {sc.label}
        </span>
      </div>
    </div>
  )
}

function QueueCard({ post, past = false, onClick }: { post: any; past?: boolean; onClick: () => void }) {
  const pl = PLATFORMS[post.platform] || PLATFORMS.instagram
  const dateStr = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        padding: '12px 14px', marginBottom: '6px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
        opacity: past ? 0.7 : 1, borderLeft: `3px solid ${pl.color}`, transition: 'transform .1s, box-shadow .1s',
        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,.04)' }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: pl.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <PlatformIcon platform={post.platform} size={18} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
          {post.title || post.content_type || 'Geen titel'}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '2px' }}>{dateStr}</div>
      </div>
      {post.clients?.company_name && (
        <span style={{ fontSize: '.68rem', color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '50px', flexShrink: 0, border: '1px solid var(--border)' }}>
          {post.clients.company_name}
        </span>
      )}
    </div>
  )
}

function EmptyState({ label, icon }: { label: string; icon: 'inbox' | 'send' | 'file' }) {
  const IconEl = icon === 'inbox' ? Inbox : icon === 'send' ? Send : FileText
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 40px', textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.35 }}>
        <IconEl size={40} />
      </div>
      <div style={{ fontWeight: 600, fontSize: '.95rem', color: 'var(--text)' }}>{label}</div>
    </div>
  )
}
