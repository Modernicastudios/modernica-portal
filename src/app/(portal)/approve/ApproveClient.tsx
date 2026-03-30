'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string
  title?: string
  content_type?: string
  platform: string
  caption?: string
  hashtags?: string
  notes?: string
  scheduled_at?: string
  status: string
  client_id: string
  agency_id: string
  clients?: { company_name: string }
}

interface Client {
  id: string
  company_name: string
}

interface Props {
  posts: Post[]
  clients: Client[]
  isAdmin: boolean
  clientId: string
  userId: string
  agencyId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#e1306c',
  tiktok: '#222',
  linkedin: '#0077b5',
  youtube: '#ff0000',
  facebook: '#1877f2',
  twitter: '#1da1f2',
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  tiktok: '🎵',
  linkedin: '💼',
  youtube: '▶️',
  facebook: '📘',
  twitter: '🐦',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApproveClient({ posts: initial, clients, isAdmin, clientId, userId, agencyId }: Props) {
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>(initial)
  const [selectedPost, setSelectedPost] = useState<Post | null>(initial[0] || null)
  const [filterClient, setFilterClient] = useState('all')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const filteredPosts = useMemo(
    () => filterClient === 'all' ? posts : posts.filter(p => p.client_id === filterClient),
    [posts, filterClient]
  )

  function removePost(id: string) {
    const remaining = filteredPosts.filter(p => p.id !== id)
    setPosts(prev => prev.filter(p => p.id !== id))
    setSelectedPost(remaining[0] || null)
  }

  // ── Approve (client) ─────────────────────────────────────────────────────

  async function handleApprove(post: Post) {
    setLoading(true)
    const { error } = await supabase
      .from('content_posts')
      .update({ status: 'scheduled' })
      .eq('id', post.id)

    if (!error) {
      // Insert notification — skip if table doesn't exist yet
      await supabase.from('notifications').insert({
        agency_id: agencyId,
        user_id: userId,
        type: 'approved',
        title: 'Content goedgekeurd',
        message: `"${post.title || post.content_type || 'Content'}" is goedgekeurd door ${post.clients?.company_name || 'klant'}`,
        link: '/content',
      })

      removePost(post.id)
      showToast('Goedgekeurd! 🎉 Content is ingepland.')
    } else {
      showToast('Er is een fout opgetreden', 'error')
    }
    setLoading(false)
  }

  // ── Request changes (client) ─────────────────────────────────────────────

  async function handleRequestChanges(post: Post) {
    if (!rejectNote.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('content_posts')
      .update({ status: 'concept', rejection_note: rejectNote })
      .eq('id', post.id)

    if (!error) {
      await supabase.from('notifications').insert({
        agency_id: agencyId,
        user_id: userId,
        type: 'rejected',
        title: 'Aanpassingen gevraagd',
        message: `"${post.title || post.content_type || 'Content'}": ${rejectNote}`,
        link: '/content',
      })

      removePost(post.id)
      setShowRejectModal(false)
      setRejectNote('')
      showToast('Feedback verstuurd naar agency')
    } else {
      showToast('Er is een fout opgetreden', 'error')
    }
    setLoading(false)
  }

  // ── Admin status change ──────────────────────────────────────────────────

  async function handleAdminChange(post: Post, status: string) {
    const { error } = await supabase
      .from('content_posts')
      .update({ status })
      .eq('id', post.id)

    if (!error) {
      removePost(post.id)
      showToast('Status bijgewerkt')
    } else {
      showToast('Er is een fout opgetreden', 'error')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const platformColor = selectedPost
    ? (PLATFORM_COLORS[selectedPost.platform?.toLowerCase()] || 'var(--accent1)')
    : 'var(--accent1)'

  return (
    <div className="animate-fade-up" style={{
      display: 'flex', gap: '0',
      height: 'calc(100vh - 80px)', overflow: 'hidden',
      margin: '-24px',
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .approve-list-item:hover { background: var(--bg) !important; }
        .approve-action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.18) !important; }
      `}</style>

      {/* ── TOAST ──────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'success' ? '#00b89c' : '#e53e3e',
          color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)',
          fontWeight: 700, fontSize: '.88rem',
          boxShadow: '0 4px 24px rgba(0,0,0,.18)',
          animation: 'fadeSlideUp .25s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div style={{
        width: '340px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--card)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 18px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <h1 style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 800, fontSize: '1.05rem', flex: 1,
            }}>
              Wachten op goedkeuring
            </h1>
            <span style={{
              background: filteredPosts.length > 0 ? 'rgba(255,122,48,1)' : '#00b89c',
              color: '#fff', borderRadius: '50px', padding: '2px 10px',
              fontSize: '.72rem', fontWeight: 700, minWidth: '24px', textAlign: 'center',
            }}>
              {filteredPosts.length}
            </span>
          </div>

          {!isAdmin && filteredPosts.length > 0 && (
            <div style={{
              background: 'rgba(255,122,48,.08)', border: '1px solid rgba(255,122,48,.25)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              fontSize: '.78rem', color: '#ff7a30', fontWeight: 600,
              marginBottom: '10px',
            }}>
              ⏳ {filteredPosts.length} item{filteredPosts.length !== 1 ? 's' : ''} wacht op jouw goedkeuring
            </div>
          )}

          {isAdmin && (
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: '.82rem', background: 'var(--bg)',
                color: 'var(--text)', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="all">Alle klanten</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Post list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredPosts.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--text)', marginBottom: '6px' }}>
                Alles bijgewerkt!
              </div>
              <div style={{ fontSize: '.82rem' }}>
                Geen content wacht op goedkeuring
              </div>
            </div>
          ) : filteredPosts.map(post => {
            const color = PLATFORM_COLORS[post.platform?.toLowerCase()] || 'var(--accent1)'
            const icon = PLATFORM_ICONS[post.platform?.toLowerCase()] || '📄'
            const isSelected = selectedPost?.id === post.id

            return (
              <div
                key={post.id}
                className="approve-list-item"
                onClick={() => setSelectedPost(post)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: isSelected ? `${color}0e` : 'transparent',
                  borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                  transition: 'all .12s',
                }}
              >
                {/* Color strip */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
                    background: `${color}20`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                    border: `1px solid ${color}30`,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '.86rem', color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: '3px',
                    }}>
                      {post.title || post.content_type || 'Geen titel'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '.68rem', fontWeight: 700, padding: '1px 7px',
                        borderRadius: '50px', background: `${color}18`, color,
                        border: `1px solid ${color}25`,
                      }}>
                        {post.platform?.charAt(0).toUpperCase() + post.platform?.slice(1)}
                      </span>
                      {post.clients?.company_name && (
                        <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>
                          {post.clients.company_name}
                        </span>
                      )}
                    </div>
                    {post.scheduled_at && (
                      <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '4px' }}>
                        📅 {new Date(post.scheduled_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  marginTop: '8px',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '.65rem', fontWeight: 700, padding: '2px 8px',
                  borderRadius: '50px',
                  background: 'rgba(255,122,48,.1)', color: '#ff7a30',
                  border: '1px solid rgba(255,122,48,.2)',
                }}>
                  ⏳ WACHT OP GOEDKEURING
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        {!selectedPost ? (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', gap: '14px', padding: '40px',
          }}>
            <div style={{ fontSize: '4rem', opacity: .4 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', opacity: .6 }}>
              {filteredPosts.length === 0
                ? 'Geen items te beoordelen'
                : 'Selecteer een item om te beoordelen'}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 28px' }}>

            {/* Color accent strip */}
            <div style={{
              height: '5px', borderRadius: '3px', marginBottom: '28px',
              background: `linear-gradient(90deg, ${platformColor}, ${platformColor}44)`,
            }} />

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {/* Platform badge */}
                <span style={{
                  fontSize: '.78rem', fontWeight: 700, padding: '4px 12px',
                  borderRadius: '50px', background: `${platformColor}18`,
                  color: platformColor, border: `1px solid ${platformColor}30`,
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}>
                  {PLATFORM_ICONS[selectedPost.platform?.toLowerCase()] || '📄'}
                  {selectedPost.platform?.charAt(0).toUpperCase() + selectedPost.platform?.slice(1)}
                  {selectedPost.content_type ? ` · ${selectedPost.content_type}` : ''}
                </span>
                {/* Status chip */}
                <span style={{
                  fontSize: '.72rem', padding: '4px 12px', borderRadius: '50px',
                  background: 'rgba(255,122,48,.1)', color: '#ff7a30',
                  fontWeight: 700, border: '1px solid rgba(255,122,48,.2)',
                }}>
                  ⏳ Wacht op goedkeuring
                </span>
              </div>

              <h2 style={{
                fontFamily: 'var(--font-syne), sans-serif',
                fontWeight: 800, fontSize: '1.45rem', marginBottom: '10px',
                color: 'var(--text)',
              }}>
                {selectedPost.title || 'Zonder titel'}
              </h2>

              <div style={{ display: 'flex', gap: '16px', fontSize: '.82rem', color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedPost.clients?.company_name && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    👤 <strong style={{ color: 'var(--text)' }}>{selectedPost.clients.company_name}</strong>
                  </span>
                )}
                {selectedPost.scheduled_at && (
                  <span>
                    📅 {new Date(selectedPost.scheduled_at).toLocaleString('nl-NL', {
                      weekday: 'long', day: 'numeric', month: 'long',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Media placeholder */}
            <div style={{
              background: `linear-gradient(135deg, ${platformColor}18, ${platformColor}06)`,
              borderRadius: 'var(--radius)', height: '220px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '24px',
              border: `1px solid ${platformColor}22`,
            }}>
              <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '8px', opacity: .6 }}>
                  {PLATFORM_ICONS[selectedPost.platform?.toLowerCase()] || '🖼️'}
                </div>
                <div style={{ fontSize: '.8rem', fontWeight: 500 }}>Mediabestand wordt hier getoond</div>
              </div>
            </div>

            {/* Caption */}
            {selectedPost.caption && (
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${platformColor}`,
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                padding: '16px 18px',
                marginBottom: '16px',
              }}>
                <div style={{
                  fontSize: '.68rem', fontWeight: 700, color: 'var(--muted)',
                  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.08em',
                }}>
                  Caption
                </div>
                <p style={{
                  fontSize: '.9rem', lineHeight: 1.75,
                  whiteSpace: 'pre-wrap', color: 'var(--text)', margin: 0,
                }}>
                  {selectedPost.caption}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {selectedPost.hashtags && (
              <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPost.hashtags.split(/\s+/).map((tag, i) =>
                  tag.trim() ? (
                    <span key={i} style={{
                      fontSize: '.75rem', padding: '3px 10px', borderRadius: '50px',
                      background: 'rgba(26,63,228,.08)', color: 'var(--accent1)',
                      fontWeight: 600, border: '1px solid rgba(26,63,228,.15)',
                    }}>
                      {tag}
                    </span>
                  ) : null
                )}
              </div>
            )}

            {/* Agency notes */}
            {selectedPost.notes && (
              <div style={{
                background: 'rgba(255,122,48,.06)', border: '1px solid rgba(255,122,48,.22)',
                borderRadius: 'var(--radius-sm)', padding: '14px 18px',
                marginBottom: '28px',
              }}>
                <div style={{
                  fontSize: '.68rem', fontWeight: 700, color: '#ff7a30',
                  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.08em',
                }}>
                  📌 Notitie van agency
                </div>
                <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: 'var(--text)', margin: 0 }}>
                  {selectedPost.notes}
                </p>
              </div>
            )}

            {/* ── CLIENT ACTION BUTTONS ───────────────────────────────── */}
            {!isAdmin ? (
              <div style={{ display: 'flex', gap: '14px' }}>
                <button
                  onClick={() => handleApprove(selectedPost)}
                  disabled={loading}
                  className="approve-action-btn"
                  style={{
                    flex: 1, padding: '18px 12px',
                    background: loading ? 'var(--border)' : 'linear-gradient(135deg, #00b89c, #00a388)',
                    color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 800, fontSize: '1.05rem',
                    fontFamily: 'var(--font-syne), sans-serif',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(0,184,156,.35)',
                    transition: 'all .2s',
                  }}
                >
                  ✅ Goedkeuren
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading}
                  className="approve-action-btn"
                  style={{
                    flex: 1, padding: '18px 12px',
                    background: 'transparent',
                    color: '#e53e3e',
                    border: '2px solid rgba(229,62,62,.35)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 800, fontSize: '1.05rem',
                    fontFamily: 'var(--font-syne), sans-serif',
                    transition: 'all .2s',
                  }}
                >
                  ✏️ Aanpassen nodig
                </button>
              </div>
            ) : (
              /* ── ADMIN STATUS PANEL ────────────────────────────────── */
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '18px 20px',
              }}>
                <div style={{
                  fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)',
                  marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.08em',
                }}>
                  Status beheren
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,122,48,.07)', border: '1px solid rgba(255,122,48,.2)',
                  fontSize: '.84rem', color: '#ff7a30', fontWeight: 600,
                  marginBottom: '14px',
                }}>
                  ⏳ Wacht op goedkeuring
                  {selectedPost.clients?.company_name && (
                    <> van <strong>{selectedPost.clients.company_name}</strong></>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleAdminChange(selectedPost, 'scheduled')}
                    style={{
                      padding: '9px 18px',
                      background: 'rgba(0,184,156,.1)', color: '#00b89c',
                      border: '1px solid rgba(0,184,156,.3)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      fontWeight: 700, fontSize: '.82rem',
                    }}
                  >
                    ✅ Goedkeuren & inplannen
                  </button>
                  <button
                    onClick={() => handleAdminChange(selectedPost, 'concept')}
                    style={{
                      padding: '9px 18px',
                      background: 'rgba(229,62,62,.07)', color: '#e53e3e',
                      border: '1px solid rgba(229,62,62,.25)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      fontWeight: 700, fontSize: '.82rem',
                    }}
                  >
                    ↩️ Terug naar concept
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REJECT MODAL ───────────────────────────────────────────────── */}
      {showRejectModal && selectedPost && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(13,20,51,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999, padding: '20px',
          }}
          onClick={e => e.target === e.currentTarget && setShowRejectModal(false)}
        >
          <div style={{
            background: 'var(--card)', borderRadius: 'var(--radius)',
            padding: '30px 28px', width: '100%', maxWidth: '500px',
            boxShadow: '0 24px 60px rgba(0,0,0,.25)',
            animation: 'fadeSlideUp .22s ease',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px',
            }}>
              ✏️ Aanpassingen doorgeven
            </h3>
            <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginBottom: '18px', lineHeight: 1.5 }}>
              Beschrijf wat er moet worden aangepast. Het team ontvangt jouw feedback direct.
            </p>
            <textarea
              autoFocus
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Bijv. Kan de tekst korter? En de afbeelding wat meer zomers maken…"
              rows={5}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                fontSize: '.88rem', background: 'var(--bg)',
                outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.6,
                color: 'var(--text)', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => { setShowRejectModal(false); setRejectNote('') }}
                style={{
                  flex: 1, padding: '11px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'none', cursor: 'pointer', fontSize: '.86rem',
                  color: 'var(--text)',
                }}
              >
                Annuleren
              </button>
              <button
                onClick={() => handleRequestChanges(selectedPost)}
                disabled={loading || !rejectNote.trim()}
                style={{
                  flex: 2, padding: '11px',
                  background: loading || !rejectNote.trim() ? 'var(--border)' : '#e53e3e',
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: loading || !rejectNote.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '.86rem',
                }}
              >
                {loading ? 'Versturen…' : 'Feedback versturen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
