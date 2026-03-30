'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PLATFORMS: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  instagram: { label: 'Instagram', color: '#e1306c', bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', textColor: '#fff' },
  tiktok: { label: 'TikTok', color: '#010101', bg: 'linear-gradient(135deg,#010101,#69c9d0)', textColor: '#fff' },
  linkedin: { label: 'LinkedIn', color: '#0077b5', bg: '#0077b5', textColor: '#fff' },
  youtube: { label: 'YouTube', color: '#ff0000', bg: '#ff0000', textColor: '#fff' },
  facebook: { label: 'Facebook', color: '#1877f2', bg: '#1877f2', textColor: '#fff' },
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', tiktok: '🎵', linkedin: '💼', youtube: '▶️', facebook: '📘',
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
  const [view, setView] = useState<'board' | 'calendar' | 'queue' | 'grid'>('board')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [activityTab, setActivityTab] = useState<'privaat' | 'publiek'>('privaat')
  const [activityMsg, setActivityMsg] = useState('')

  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const supabase = createClient()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = platformFilter === 'all' ? posts : posts.filter(p => p.platform === platformFilter)

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
      const { data } = await supabase.from('content_posts').update(payload).eq('id', editingPost.id).select('*, clients(company_name)').single()
      if (data) { setPosts(prev => prev.map(p => p.id === data.id ? data : p)); showToast('Post bijgewerkt!') }
    } else {
      const { data } = await supabase.from('content_posts').insert({ ...payload, agency_id: agencyId }).select('*, clients(company_name)').single()
      if (data) { setPosts(prev => [...prev, data]); showToast('Post aangemaakt! 🗓️') }
    }
    setShowModal(false)
    setLoading(false)
  }

  async function deletePost(id: string) {
    await supabase.from('content_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    setShowModal(false)
    showToast('Post verwijderd')
  }

  async function movePost(id: string, newStatus: string) {
    await supabase.from('content_posts').update({ status: newStatus }).eq('id', id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
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

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 2000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View tabs */}
          <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px', gap: '2px' }}>
            {([
              { key: 'board', label: 'Board', icon: '⊞' },
              { key: 'calendar', label: 'Kalender', icon: '📅' },
              { key: 'queue', label: 'Wachtrij', icon: '📋' },
              { key: 'grid', label: 'Grid', icon: '⬛' },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{
                padding: '5px 14px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600,
                background: view === v.key ? 'var(--accent1)' : 'none',
                color: view === v.key ? '#fff' : 'var(--muted)',
                transition: 'all .15s',
              }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          {/* Platform filter pills */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[{ key: 'all', label: 'Alle', color: 'var(--accent1)' }, ...Object.entries(PLATFORMS).map(([k, v]) => ({ key: k, label: v.label, color: v.color }))].map(pl => (
              <button key={pl.key} onClick={() => setPlatformFilter(pl.key)} style={{
                padding: '4px 12px', borderRadius: '50px', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${platformFilter === pl.key ? pl.color : 'var(--border)'}`,
                background: platformFilter === pl.key ? pl.color : 'transparent',
                color: platformFilter === pl.key ? '#fff' : 'var(--muted)',
                transition: 'all .15s',
              }}>
                {pl.key !== 'all' && PLATFORM_ICONS[pl.key] + ' '}{pl.label}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <button onClick={() => openPost()} style={{
            background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '9px 20px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26,63,228,.3)', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            + Inhoud aanmaken
          </button>
        )}
      </div>

      {/* ====== BOARD VIEW ====== */}
      {view === 'board' && (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'flex-start' }}>
          {BOARD_COLUMNS.map(col => {
            const colPosts = filtered.filter(p => p.status === col.key)
            return (
              <div key={col.key} style={{ minWidth: '280px', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: col.headerBg,
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.1em', color: col.color, textTransform: 'uppercase' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', background: 'var(--card)', borderRadius: '50px', padding: '1px 8px' }}>{colPosts.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px' }}>
                  {colPosts.map(post => (
                    <BoardCard key={post.id} post={post} onClick={() => openPost(post)} />
                  ))}
                </div>

                {/* Add button */}
                {isAdmin && (
                  <button
                    onClick={() => openPost(undefined, col.key)}
                    style={{
                      marginTop: '10px', width: '100%', padding: '9px', border: '1.5px dashed var(--border)',
                      borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer',
                      fontSize: '.8rem', color: 'var(--muted)', fontWeight: 500, transition: 'all .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = col.dotColor; (e.currentTarget as HTMLElement).style.color = col.color }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                  >
                    + Inhoud toevoegen
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
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(26,63,228,.04)' : isWeekend ? 'rgba(0,0,0,.012)' : 'var(--card)'}
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
                          {PLATFORM_ICONS[post.platform]} {post.title || post.content_type}
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

      {/* ====== QUEUE VIEW ====== */}
      {view === 'queue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ background: 'var(--accent1)', color: '#fff', borderRadius: '50px', padding: '3px 12px', fontSize: '.72rem', fontWeight: 700 }}>GEPLAND</span>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{upcomingPosts.length} posts</span>
              {isAdmin && <button onClick={() => openPost()} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', cursor: 'pointer', fontSize: '.78rem', color: 'var(--muted)' }}>+ Toevoegen</button>}
            </div>
            {upcomingPosts.length === 0 ? (
              <EmptyState label="Geen geplande posts" icon="📭" />
            ) : upcomingPosts.map(post => <QueueCard key={post.id} post={post} onClick={() => openPost(post)} />)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ background: 'var(--accent3)', color: '#fff', borderRadius: '50px', padding: '3px 12px', fontSize: '.72rem', fontWeight: 700 }}>GEPUBLICEERD</span>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{pastPosts.length} posts</span>
            </div>
            {pastPosts.length === 0 ? (
              <EmptyState label="Nog niets gepubliceerd" icon="📤" />
            ) : pastPosts.map(post => <QueueCard key={post.id} post={post} past onClick={() => openPost(post)} />)}
          </div>
        </div>
      )}

      {/* ====== GRID VIEW ====== */}
      {view === 'grid' && (
        <div>
          {filtered.length === 0 ? (
            <EmptyState label="Geen content gevonden" icon="🖼️" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {filtered.map(post => {
                const pl = PLATFORMS[post.platform] || PLATFORMS.instagram
                const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.concept
                return (
                  <div key={post.id} onClick={() => openPost(post)} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ height: '90px', background: pl.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', position: 'relative' }}>
                      <span>{PLATFORM_ICONS[post.platform]}</span>
                      <span style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '.65rem', fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.35)', borderRadius: '50px', padding: '1px 7px' }}>{post.content_type || 'Post'}</span>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.title || 'Geen titel'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: '50px', background: sc.bg, color: sc.color, fontWeight: 700 }}>{sc.label}</span>
                        <span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>
                          {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== DETAIL MODAL (Rella-style 3-column) ====== */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background: 'var(--bg)', borderRadius: '12px', width: '100%', maxWidth: '1020px',
            height: '88vh', display: 'flex', overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,.25)',
          }}>
            {/* LEFT: Media */}
            <div style={{ width: '260px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
                <button style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--accent1)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '2px solid var(--accent1)', paddingBottom: '2px' }}>Media</button>
                <button style={{ fontSize: '.82rem', fontWeight: 500, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Preview</button>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', color: 'var(--muted)' }}>
                <div style={{
                  width: '100%', aspectRatio: '1', maxHeight: '180px', border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', cursor: 'pointer', background: 'var(--bg)',
                  transition: 'border-color .15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent1)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                >
                  <span style={{ fontSize: '2rem' }}>🖼️</span>
                  <span style={{ fontSize: '.75rem', textAlign: 'center', lineHeight: 1.4 }}>Selecteer media om te uploaden</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '52px', height: '52px', border: '2px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>+</div>
                </div>
              </div>
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', fontSize: '.72rem', color: 'var(--muted)', textAlign: 'center' }}>
                Media wordt gebruikt voor publicatie. Gebruik bestanden voor referentie.
              </div>
            </div>

            {/* CENTER: Fields */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {/* Title bar */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={editingPost ? 'Post titel...' : 'Nieuwe inhoud'}
                  style={{ flex: 1, fontSize: '1.1rem', fontWeight: 700, border: 'none', background: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-syne), sans-serif' }}
                />
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)', padding: '4px', borderRadius: '4px' }}>✕</button>
              </div>

              {/* Fields */}
              <div style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
                {[
                  {
                    icon: '👤', label: 'Klant',
                    content: (
                      <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} style={fieldSelectStyle}>
                        <option value="">Geen / Intern</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                      </select>
                    )
                  },
                  {
                    icon: '🔵', label: 'Status',
                    content: (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <button key={k} onClick={() => setForm(p => ({ ...p, status: k }))} style={{
                            padding: '3px 12px', borderRadius: '50px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
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
                    icon: '📡', label: 'Platform',
                    content: (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {Object.entries(PLATFORMS).map(([k, v]) => (
                          <button key={k} onClick={() => setForm(p => ({ ...p, platform: k }))} style={{
                            padding: '3px 12px', borderRadius: '50px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                            border: `1.5px solid ${form.platform === k ? v.color : 'var(--border)'}`,
                            background: form.platform === k ? `${v.color}18` : 'transparent',
                            color: form.platform === k ? v.color : 'var(--muted)',
                          }}>
                            {PLATFORM_ICONS[k]} {v.label}
                          </button>
                        ))}
                      </div>
                    )
                  },
                  {
                    icon: '🗂️', label: 'Type',
                    content: (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {CONTENT_TYPES.map(t => (
                          <button key={t} onClick={() => setForm(p => ({ ...p, content_type: t }))} style={{
                            padding: '3px 10px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 600, cursor: 'pointer',
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
                    icon: '🗓️', label: 'Inplannen',
                    content: <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} style={fieldInputStyle} />
                  },
                  {
                    icon: '💬', label: 'Caption',
                    content: <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="Schrijf je caption hier..." rows={4} style={{ ...fieldInputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                  },
                  {
                    icon: '#️⃣', label: 'Hashtags',
                    content: <input value={form.hashtags} onChange={e => setForm(p => ({ ...p, hashtags: e.target.value }))} placeholder="#hashtag1 #hashtag2 ..." style={fieldInputStyle} />
                  },
                  {
                    icon: '📝', label: 'Notities',
                    content: <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Briefing, aandachtspunten..." rows={2} style={{ ...fieldInputStyle, resize: 'none', fontFamily: 'inherit' }} />
                  },
                ].map(({ icon, label, content }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0', borderBottom: '1px solid var(--border)', minHeight: '44px' }}>
                    <div style={{ width: '140px', flexShrink: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '.9rem' }}>{icon}</span>
                      <span style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
                    </div>
                    <div style={{ flex: 1, padding: '10px 16px 10px 0', display: 'flex', alignItems: 'center' }}>
                      {content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom action bar */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', background: 'var(--card)' }}>
                {editingPost && isAdmin && (
                  <button onClick={() => deletePost(editingPost.id)} style={{ padding: '9px 14px', background: 'rgba(229,57,53,.1)', color: '#e53935', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem' }}>
                    🗑️
                  </button>
                )}
                {editingPost && isAdmin && (
                  <select value={editingPost?.status} onChange={e => { movePost(editingPost.id, e.target.value); setForm(p => ({ ...p, status: e.target.value })) }} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)', cursor: 'pointer' }}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                )}
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '9px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', fontSize: '.85rem' }}>Annuleren</button>
                {isAdmin && (
                  <button onClick={savePost} disabled={loading} style={{ flex: 2, padding: '9px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '.9rem', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Opslaan...' : editingPost ? 'Bijwerken' : '+ Aanmaken'}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: Activity */}
            <div style={{ width: '260px', flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--card)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0' }}>
                <button onClick={() => setActivityTab('privaat')} style={{ flex: 1, padding: '5px', fontSize: '.8rem', fontWeight: activityTab === 'privaat' ? 700 : 400, color: activityTab === 'privaat' ? 'var(--text)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activityTab === 'privaat' ? '2px solid var(--accent1)' : '2px solid transparent' }}>Privaat</button>
                <button onClick={() => setActivityTab('publiek')} style={{ flex: 1, padding: '5px', fontSize: '.8rem', fontWeight: activityTab === 'publiek' ? 700 : 400, color: activityTab === 'publiek' ? 'var(--text)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activityTab === 'publiek' ? '2px solid var(--accent1)' : '2px solid transparent' }}>Publiek</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {editingPost ? (
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Inhoud aangemaakt</div>
                      <div>{new Date(editingPost.created_at).toLocaleString('nl-NL')}</div>
                    </div>
                    {editingPost.updated_at && editingPost.updated_at !== editingPost.created_at && (
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Bijgewerkt</div>
                        <div>{new Date(editingPost.updated_at).toLocaleString('nl-NL')}</div>
                      </div>
                    )}
                    {editingPost.scheduled_at && (
                      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>Ingepland voor</div>
                        <div>{new Date(editingPost.scheduled_at).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem', marginTop: '20px' }}>
                    Activiteit verschijnt na aanmaken
                  </div>
                )}
              </div>

              <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={activityMsg}
                    onChange={e => setActivityMsg(e.target.value)}
                    placeholder="Typ een bericht..."
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.8rem', background: 'var(--bg)', outline: 'none' }}
                  />
                  <button
                    onClick={() => { if (activityMsg.trim()) { showToast('Bericht verstuurd'); setActivityMsg('') } }}
                    disabled={!activityMsg.trim()}
                    style={{ padding: '8px 12px', background: activityMsg.trim() ? 'var(--accent1)' : 'var(--border)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: activityMsg.trim() ? 'pointer' : 'not-allowed', fontSize: '.9rem' }}
                  >
                    ➤
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
  width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: '.85rem', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box',
}

const fieldSelectStyle: React.CSSProperties = {
  padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: '.82rem', background: 'var(--bg)', outline: 'none', cursor: 'pointer',
}

function BoardCard({ post, onClick }: { post: any; onClick: () => void }) {
  const pl = PLATFORMS[post.platform] || PLATFORMS.instagram
  const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.concept
  const dateStr = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        padding: '0', cursor: 'pointer', overflow: 'hidden',
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
    >
      {/* Colored top strip */}
      <div style={{ height: '3px', background: pl.bg }} />

      <div style={{ padding: '10px 12px' }}>
        {/* Title */}
        <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '8px', lineHeight: 1.35, color: 'var(--text)' }}>
          {post.title || post.content_type || 'Geen titel'}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {/* Person icon */}
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', color: 'var(--muted)' }}>
            👤
          </div>
          {dateStr && (
            <span style={{ fontSize: '.68rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              📅 {dateStr}
            </span>
          )}
          {post.clients?.company_name && (
            <span style={{ fontSize: '.66rem', color: 'var(--muted)', background: 'var(--bg)', borderRadius: '50px', padding: '1px 7px', marginLeft: 'auto' }}>
              {post.clients.company_name}
            </span>
          )}
        </div>

        {/* Platform badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: '50px',
            background: `${pl.color}15`, color: pl.color === '#010101' ? '#333' : pl.color,
            border: `1px solid ${pl.color}30`,
          }}>
            {PLATFORM_ICONS[post.platform]} {pl.label} {post.content_type || 'Post'}
          </span>
        </div>
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
    <div onClick={onClick} style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: '12px 14px', marginBottom: '6px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
      opacity: past ? 0.7 : 1, borderLeft: `3px solid ${pl.color}`, transition: 'transform .1s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: pl.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
        {PLATFORM_ICONS[post.platform]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.title || post.content_type || 'Geen titel'}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '2px' }}>{dateStr}</div>
      </div>
      {post.clients?.company_name && (
        <span style={{ fontSize: '.68rem', color: 'var(--muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: '50px', flexShrink: 0 }}>
          {post.clients.company_name}
        </span>
      )}
    </div>
  )
}

function EmptyState({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontWeight: 500 }}>{label}</div>
    </div>
  )
}
