'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PLATFORMS = [
  { key: 'all', label: 'Alles', icon: '🌐', color: 'var(--accent1)' },
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#000' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077b5' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', color: '#ff0000' },
  { key: 'facebook', label: 'Facebook', icon: '📘', color: '#1877f2' },
]

const CONTENT_TYPES = ['Post', 'Story', 'Reel', 'Carousel', 'Video', 'Artikel']

interface Props {
  posts: any[]
  clients: any[]
  agencyId: string
  isAdmin: boolean
}

export default function ContentClient({ posts: initialPosts, clients, agencyId, isAdmin }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [platform, setPlatform] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [form, setForm] = useState({ title: '', platform: 'instagram', content_type: 'Post', scheduled_at: '', client_id: '', status: 'concept', approval_status: 'pending' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = platform === 'all' ? posts : posts.filter(p => p.platform === platform)

  // Build calendar days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function postsOnDay(day: number) {
    return filtered.filter(p => {
      if (!p.scheduled_at) return false
      const d = new Date(p.scheduled_at)
      return d.getDate() === day && d.getMonth() === viewMonth && d.getFullYear() === viewYear
    })
  }

  function openNewPost(day?: number) {
    const date = day ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T09:00` : ''
    setForm({ title: '', platform: 'instagram', content_type: 'Post', scheduled_at: date, client_id: '', status: 'concept', approval_status: 'pending' })
    setEditingPost(null)
    setShowModal(true)
  }

  async function savePost() {
    setLoading(true)
    if (editingPost) {
      const { data } = await supabase.from('content_posts').update(form).eq('id', editingPost.id).select('*, clients(company_name)').single()
      if (data) { setPosts(prev => prev.map(p => p.id === data.id ? data : p)); showToast('Post bijgewerkt!') }
    } else {
      const { data } = await supabase.from('content_posts').insert({ ...form, agency_id: agencyId, client_id: form.client_id || null }).select('*, clients(company_name)').single()
      if (data) { setPosts(prev => [...prev, data]); showToast('Post gepland!') }
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

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })

  const platformIcon = (p: string) => PLATFORMS.find(pl => pl.key === p)?.icon || '📱'
  const platformColor = (p: string) => PLATFORMS.find(pl => pl.key === p)?.color || 'var(--accent1)'

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}>‹</button>
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>{monthName}</span>
          <button onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()) }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer' }}>›</button>
        </div>

        {/* Platform filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PLATFORMS.map(pl => (
            <button key={pl.key} onClick={() => setPlatform(pl.key)} style={{
              padding: '5px 12px', borderRadius: '50px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', border: 'none',
              background: platform === pl.key ? pl.color : 'var(--card)',
              color: platform === pl.key ? '#fff' : 'var(--muted)',
            }}>
              {pl.icon} {pl.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button onClick={() => openNewPost()} style={{ background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}>
            + Post plannen
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(d => (
            <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{d}</div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {/* Empty cells for first day offset */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: '100px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--card2)' }} />
          ))}
          {calendarDays.map(day => {
            const dayPosts = postsOnDay(day)
            const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear()
            return (
              <div
                key={day}
                onClick={() => isAdmin && openNewPost(day)}
                style={{
                  minHeight: '100px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                  padding: '8px', cursor: isAdmin ? 'pointer' : 'default',
                  background: isToday ? 'rgba(26,63,228,.04)' : 'var(--card)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => isAdmin && ((e.currentTarget as HTMLElement).style.background = 'rgba(26,63,228,.06)')}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(26,63,228,.04)' : 'var(--card)'}
              >
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.82rem', fontWeight: isToday ? 800 : 500, marginBottom: '4px',
                  background: isToday ? 'var(--accent1)' : 'none',
                  color: isToday ? '#fff' : 'var(--text)',
                }}>
                  {day}
                </div>
                {dayPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={e => { e.stopPropagation(); setEditingPost(post); setForm({ title: post.title || '', platform: post.platform, content_type: post.content_type || 'Post', scheduled_at: post.scheduled_at?.slice(0, 16) || '', client_id: post.client_id || '', status: post.status, approval_status: post.approval_status }); setShowModal(true) }}
                    style={{
                      background: platformColor(post.platform), color: '#fff',
                      borderRadius: '4px', padding: '2px 6px', fontSize: '.68rem', fontWeight: 600,
                      marginBottom: '3px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {platformIcon(post.platform)} {post.title || post.content_type}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Post modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
                {editingPost ? 'Post bewerken' : 'Post plannen'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Titel</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Post titel..." style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Platform</label>
                  <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }}>
                    {PLATFORMS.filter(p => p.key !== 'all').map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Type</label>
                  <select value={form.content_type} onChange={e => setForm(p => ({ ...p, content_type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }}>
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Datum & tijd</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Klant</label>
                <select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }}>
                  <option value="">Geen / Intern</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              {editingPost && (
                <button onClick={() => deletePost(editingPost.id)} style={{ padding: '10px 16px', background: 'rgba(229,57,53,.1)', color: '#e53935', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  Verwijderen
                </button>
              )}
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer' }}>Annuleren</button>
              <button onClick={savePost} disabled={loading} style={{ flex: 1, padding: '10px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                {loading ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
