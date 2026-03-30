'use client'

import { useState, useMemo, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Pencil, Share2, Clock, Eye, FileText, Pin, Heart, MessageCircle, Send, Bookmark, ThumbsUp, Repeat2, Music2, Globe, PartyPopper } from 'lucide-react'
import { PlatformIcon, PlatformBadge, PLATFORM_COLORS, PLATFORM_LABELS } from '@/components/ui/PlatformIcon'

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
  share_token?: string
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

type PreviewTab = 'preview' | 'details'

// ─── Constants ────────────────────────────────────────────────────────────────

// ─── Platform Preview Components ─────────────────────────────────────────────

function InstagramPreview({ post }: { post: Post }) {
  const hashtagList = post.hashtags
    ? post.hashtags.split(/\s+/).filter(Boolean)
    : []

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #dbdbdb',
      maxWidth: '468px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,.10)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#262626' }}>
            @{post.clients?.company_name?.toLowerCase().replace(/\s+/g, '_') || 'jouwbedrijf'}
          </div>
          <div style={{ fontSize: '11px', color: '#737373' }}>Gesponsord</div>
        </div>
        <div style={{ fontSize: '18px', color: '#262626', cursor: 'pointer' }}>···</div>
      </div>

      {/* Image placeholder */}
      <div style={{
        width: '100%', aspectRatio: '1 / 1',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #e1306c22 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.45 }}>
          <FileText size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#555' }}>Mediabestand</div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: '10px 14px 6px' }}>
        <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
          <Heart size={22} style={{ cursor: 'pointer', color: '#262626' }} />
          <MessageCircle size={22} style={{ cursor: 'pointer', color: '#262626' }} />
          <Send size={22} style={{ cursor: 'pointer', color: '#262626' }} />
          <Bookmark size={22} style={{ marginLeft: 'auto', cursor: 'pointer', color: '#262626' }} />
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#262626', marginBottom: '5px' }}>
          1.234 vind-ik-leuks
        </div>
        {post.caption && (
          <div style={{ fontSize: '13px', color: '#262626', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>
              {post.clients?.company_name?.toLowerCase().replace(/\s+/g, '_') || 'jouwbedrijf'}
            </span>
            {' '}
            <span style={{ color: '#262626' }}>{post.caption}</span>
          </div>
        )}
        {hashtagList.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            {hashtagList.map((tag, i) => (
              <span key={i} style={{ color: '#00376b', fontSize: '13px' }}>{tag} </span>
            ))}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#737373', marginTop: '6px', textTransform: 'uppercase' }}>
          Zojuist
        </div>
      </div>
    </div>
  )
}

function LinkedInPreview({ post }: { post: Post }) {
  const hashtagList = post.hashtags
    ? post.hashtags.split(/\s+/).filter(Boolean)
    : []

  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      maxWidth: '552px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px 8px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0077b5, #00a0dc)',
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '18px',
        }}>
          {(post.clients?.company_name || 'B')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#000000e6' }}>
            {post.clients?.company_name || 'Jouw Bedrijf'}
          </div>
          <div style={{ fontSize: '12px', color: '#00000099' }}>Marketing · 2.341 volgers</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#00000099', marginTop: '2px' }}>
            <span>Zojuist</span>
            <span>·</span>
            <Globe size={11} />
          </div>
        </div>
        <div style={{ color: '#0a66c2', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Volgen</div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div style={{ padding: '4px 16px 10px', fontSize: '14px', color: '#000000e6', lineHeight: 1.6 }}>
          {post.caption}
          {hashtagList.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              {hashtagList.map((tag, i) => (
                <span key={i} style={{ color: '#0a66c2', fontWeight: 400 }}>{tag} </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image placeholder */}
      <div style={{
        width: '100%', aspectRatio: '1.91 / 1',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #c2d4f8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <FileText size={32} style={{ marginBottom: '8px', opacity: 0.4, color: '#0077b5' }} />
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#555' }}>Mediabestand</div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: '6px 16px 10px', borderTop: '1px solid #e0e0e0', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 0' }}>
          {['Vind ik leuk', 'Reageren', 'Delen', 'Sturen'].map((action) => (
            <button key={action} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: '#00000099', fontWeight: 500,
              padding: '6px 10px', borderRadius: '4px',
            }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FacebookPreview({ post }: { post: Post }) {
  const hashtagList = post.hashtags
    ? post.hashtags.split(/\s+/).filter(Boolean)
    : []

  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #dddfe2',
      maxWidth: '500px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      boxShadow: '0 1px 8px rgba(0,0,0,.10)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 8px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: '#1877f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0,
        }}>
          {(post.clients?.company_name || 'B')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#050505' }}>
            {post.clients?.company_name || 'Jouw Bedrijf'}
          </div>
          <div style={{ fontSize: '12px', color: '#65676b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Gesponsord</span>
            <span>·</span>
            <Globe size={11} />
          </div>
        </div>
        <div style={{ fontSize: '20px', color: '#65676b', cursor: 'pointer' }}>···</div>
      </div>

      {post.caption && (
        <div style={{ padding: '4px 16px 10px', fontSize: '14px', color: '#050505', lineHeight: 1.5 }}>
          {post.caption}
          {hashtagList.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              {hashtagList.map((tag, i) => (
                <span key={i} style={{ color: '#1877f2' }}>{tag} </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1.91 / 1',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #bfd5ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <FileText size={32} style={{ marginBottom: '8px', opacity: 0.4, color: '#1877f2' }} />
          <div style={{ fontSize: '12px', color: '#555' }}>Mediabestand</div>
        </div>
      </div>

      {/* Reactions bar */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #dddfe2', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', display: 'flex', gap: '2px' }}><ThumbsUp size={14} /><Heart size={14} /></span>
          <span style={{ fontSize: '13px', color: '#65676b', marginLeft: '4px' }}>234</span>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#65676b' }}>12 reacties</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          borderTop: '1px solid #dddfe2', paddingTop: '4px',
        }}>
          {['Vind ik leuk', 'Reageren', 'Delen'].map((action) => (
            <button key={action} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: '#65676b', fontWeight: 600,
              padding: '6px 10px',
            }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TikTokPreview({ post }: { post: Post }) {
  return (
    <div style={{
      background: '#000',
      borderRadius: '16px',
      maxWidth: '320px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 8px 40px rgba(0,0,0,.5)',
    }}>
      {/* Video area */}
      <div style={{
        width: '100%', aspectRatio: '9 / 16',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <Music2 size={32} style={{ marginBottom: '8px', opacity: 0.5, color: '#fff' }} />
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>Video</div>
        </div>

        {/* Right action bar */}
        <div style={{
          position: 'absolute', right: '10px', bottom: '100px',
          display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'linear-gradient(45deg, #fe2c55, #25f4ee)',
              marginBottom: '4px',
            }} />
            <span style={{ fontSize: '10px', color: '#fff' }}>+</span>
          </div>
          {[<Heart key="h" size={24} />, <MessageCircle key="m" size={24} />, <Repeat2 key="r" size={24} />, <Music2 key="mu" size={24} />].map((icon, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.5))', display: 'flex', justifyContent: 'center' }}>{icon}</div>
              <div style={{ fontSize: '10px', color: '#fff', marginTop: '2px' }}>
                {['1.2K', '89', '24', ''][i]}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom caption overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: '60px',
          padding: '40px 12px 16px',
          background: 'linear-gradient(transparent, rgba(0,0,0,.7))',
        }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', marginBottom: '4px' }}>
            @{post.clients?.company_name?.toLowerCase().replace(/\s+/g, '') || 'jouwbedrijf'}
          </div>
          {post.caption && (
            <div style={{ fontSize: '12px', color: '#fff', lineHeight: 1.4, marginBottom: '6px' }}>
              {post.caption.slice(0, 120)}{post.caption.length > 120 ? '...' : ''}
            </div>
          )}
          {post.hashtags && (
            <div style={{ fontSize: '11px', color: '#fff', opacity: 0.85 }}>
              {post.hashtags.split(/\s+/).slice(0, 4).join(' ')}
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#333', border: '1px solid #fff',
              animation: 'spin 3s linear infinite',
            }} />
            <span style={{ fontSize: '11px', color: '#fff' }}>
              {post.title || 'Originele audio'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function YouTubePreview({ post }: { post: Post }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      maxWidth: '560px',
      margin: '0 auto',
      fontFamily: 'Roboto, -apple-system, sans-serif',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,.10)',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: '100%', aspectRatio: '16 / 9',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: '68px', height: '48px',
          background: 'rgba(255,0,0,.9)', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 0, height: 0,
            borderTop: '12px solid transparent',
            borderBottom: '12px solid transparent',
            borderLeft: '20px solid #fff',
            marginLeft: '4px',
          }} />
        </div>
        <div style={{
          position: 'absolute', bottom: '8px', right: '8px',
          background: 'rgba(0,0,0,.8)', color: '#fff',
          fontSize: '12px', fontWeight: 700, padding: '2px 6px',
          borderRadius: '3px',
        }}>
          1:23
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', gap: '12px', padding: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: '#ff0000', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '14px',
        }}>
          {(post.clients?.company_name || 'B')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 600, fontSize: '14px', color: '#0f0f0f',
            lineHeight: 1.4, marginBottom: '4px',
          }}>
            {post.title || post.caption?.slice(0, 80) || 'Videotitel hier'}
          </div>
          <div style={{ fontSize: '12px', color: '#606060' }}>
            {post.clients?.company_name || 'Jouw Kanaal'}
          </div>
          <div style={{ fontSize: '12px', color: '#606060' }}>
            1,2K weergaven · Zojuist
          </div>
        </div>
        <div style={{ fontSize: '18px', color: '#606060', cursor: 'pointer' }}>⋮</div>
      </div>
    </div>
  )
}

function PlatformPreview({ post }: { post: Post }) {
  const platform = post.platform?.toLowerCase()

  const wrapperStyle: CSSProperties = {
    padding: '24px',
    borderRadius: '12px',
    background: platform === 'tiktok' ? '#111' : 'linear-gradient(160deg, var(--bg) 0%, var(--card) 100%)',
    minHeight: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (platform === 'instagram') return (
    <div style={wrapperStyle}><InstagramPreview post={post} /></div>
  )
  if (platform === 'linkedin') return (
    <div style={wrapperStyle}><LinkedInPreview post={post} /></div>
  )
  if (platform === 'facebook') return (
    <div style={wrapperStyle}><FacebookPreview post={post} /></div>
  )
  if (platform === 'tiktok') return (
    <div style={wrapperStyle}><TikTokPreview post={post} /></div>
  )
  if (platform === 'youtube') return (
    <div style={wrapperStyle}><YouTubePreview post={post} /></div>
  )

  // Fallback generic preview
  const color = PLATFORM_COLORS[platform] || 'var(--accent1)'
  return (
    <div style={wrapperStyle}>
      <div style={{
        background: 'var(--card)', border: `1px solid ${color}30`,
        borderRadius: '12px', maxWidth: '480px', width: '100%',
        overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.10)',
      }}>
        <div style={{ height: '5px', background: color }} />
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: `${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
            }}>
              <span style={{ fontSize: '.65rem', fontWeight: 800, color: PLATFORM_COLORS[platform] || '#6b7280', textTransform: 'uppercase' }}>{(PLATFORM_LABELS[platform] || platform || 'PL').slice(0, 2)}</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>
                {post.clients?.company_name || 'Jouw Bedrijf'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Zojuist</div>
            </div>
          </div>
          {post.caption && (
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', marginBottom: '12px' }}>
              {post.caption}
            </div>
          )}
          <div style={{
            height: '180px', background: `${color}14`,
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: `${color}80`, textTransform: 'uppercase' }}>{(PLATFORM_LABELS[platform] || platform || 'PL').slice(0, 2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApproveClient({ posts: initial, clients, isAdmin, clientId, userId, agencyId }: Props) {
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>(initial)
  const [selectedPost, setSelectedPost] = useState<Post | null>(initial[0] || null)
  const [filterClient, setFilterClient] = useState('all')
  const [activeTab, setActiveTab] = useState<PreviewTab>('preview')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function copyShareLink(post: Post) {
    if (!post.share_token) return
    const url = `${window.location.origin}/review/${post.share_token}`
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link gekopieerd')
    })
  }

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
      await supabase.from('notifications').insert({
        agency_id: agencyId,
        user_id: userId,
        type: 'approved',
        title: 'Content goedgekeurd',
        message: `"${post.title || post.content_type || 'Content'}" is goedgekeurd door ${post.clients?.company_name || 'klant'}`,
        link: '/content',
      })

      removePost(post.id)
      showToast('Goedgekeurd. Content is ingepland.')
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

  // ─── Derived values ───────────────────────────────────────────────────────

  const platformColor = selectedPost
    ? (PLATFORM_COLORS[selectedPost.platform?.toLowerCase()] || 'var(--accent1)')
    : 'var(--accent1)'

  const platformLabel = selectedPost
    ? (PLATFORM_LABELS[selectedPost.platform?.toLowerCase()] || selectedPost.platform)
    : ''

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 80px)',
      overflow: 'hidden',
      margin: '-24px',
      background: 'var(--bg)',
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .approve-list-item:hover {
          background: var(--bg) !important;
        }
        .approve-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,.18) !important;
        }
        .tab-btn:hover {
          color: var(--text) !important;
        }
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

      {/* ── LEFT PANEL (320px fixed) ─────────────────────────────────── */}
      <div style={{
        width: '320px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <h1 style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 800, fontSize: '1rem', flex: 1, margin: 0,
              color: 'var(--text)',
            }}>
              Goedkeuringen
            </h1>
            <span style={{
              background: filteredPosts.length > 0 ? '#ff7a30' : '#00b89c',
              color: '#fff', borderRadius: '50px', padding: '2px 10px',
              fontSize: '.72rem', fontWeight: 700, minWidth: '24px', textAlign: 'center',
            }}>
              {filteredPosts.length}
            </span>
          </div>

          {!isAdmin && filteredPosts.length > 0 && (
            <div style={{
              background: 'rgba(255,122,48,.08)',
              border: '1px solid rgba(255,122,48,.25)',
              borderRadius: 'var(--radius-sm)', padding: '9px 12px',
              fontSize: '.76rem', color: '#ff7a30', fontWeight: 600,
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
              <PartyPopper size={40} style={{ marginBottom: '12px', opacity: 0.5, color: 'var(--accent3)' }} />
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', marginBottom: '6px' }}>
                Alles bijgewerkt!
              </div>
              <div style={{ fontSize: '.8rem' }}>
                Geen content wacht op goedkeuring
              </div>
            </div>
          ) : filteredPosts.map(post => {
            const color = PLATFORM_COLORS[post.platform?.toLowerCase()] || 'var(--accent1)'
            const label = PLATFORM_LABELS[post.platform?.toLowerCase()] || post.platform
            const isSelected = selectedPost?.id === post.id

            return (
              <div
                key={post.id}
                className="approve-list-item"
                onClick={() => { setSelectedPost(post); setActiveTab('preview') }}
                style={{
                  borderBottom: '1px solid var(--border)',
                  padding: '12px 14px 12px 0',
                  cursor: 'pointer',
                  background: isSelected ? `${color}0d` : 'transparent',
                  borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                  paddingLeft: isSelected ? '12px' : '14px',
                  transition: 'all .12s',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                {/* Platform icon box */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                  background: `${color}18`,
                  border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <PlatformIcon platform={post.platform} size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title */}
                  <div style={{
                    fontWeight: 700, fontSize: '.84rem', color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '4px',
                  }}>
                    {post.title || post.content_type || 'Geen titel'}
                  </div>

                  {/* Platform chip + client */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <PlatformBadge platform={post.platform} size={11} />
                    {post.clients?.company_name && (
                      <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>
                        {post.clients.company_name}
                      </span>
                    )}
                  </div>

                  {/* Date + status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {post.scheduled_at && (
                      <span style={{ fontSize: '.67rem', color: 'var(--muted)' }}>
                        {new Date(post.scheduled_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <span style={{
                      fontSize: '.62rem', fontWeight: 700, padding: '1px 7px',
                      borderRadius: '50px',
                      background: 'rgba(255,122,48,.10)', color: '#ff7a30',
                      border: '1px solid rgba(255,122,48,.18)',
                      marginLeft: 'auto',
                    }}>
                      WACHT
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {!selectedPost ? (
          /* Empty state */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)', gap: '14px', padding: '40px',
          }}>
            <FileText size={48} style={{ opacity: .35 }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', opacity: .5 }}>
              Selecteer een post om te bekijken
            </div>
          </div>
        ) : (
          <>
            {/* Top bar: title + tabs */}
            <div style={{
              borderBottom: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '0 24px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'stretch',
              gap: '0',
            }}>
              {/* Post info */}
              <div style={{ flex: 1, padding: '14px 0', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <PlatformBadge platform={selectedPost.platform} />
                <h2 style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontWeight: 800, fontSize: '.95rem',
                  color: 'var(--text)', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {selectedPost.title || 'Zonder titel'}
                </h2>
                {selectedPost.clients?.company_name && (
                  <span style={{ fontSize: '.78rem', color: 'var(--muted)', flexShrink: 0 }}>
                    · {selectedPost.clients.company_name}
                  </span>
                )}
              </div>

              {/* Preview / Details tabs */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', marginLeft: '16px' }}>
                {(['preview', 'details'] as PreviewTab[]).map(tab => (
                  <button
                    key={tab}
                    className="tab-btn"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0 18px',
                      fontSize: '.84rem', fontWeight: activeTab === tab ? 700 : 500,
                      color: activeTab === tab ? platformColor : 'var(--muted)',
                      borderBottom: activeTab === tab ? `2px solid ${platformColor}` : '2px solid transparent',
                      transition: 'all .15s',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab === 'preview' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Eye size={14} /> Preview</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={14} /> Details</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 100px' }}>

              {activeTab === 'preview' ? (
                /* ── PREVIEW TAB ───────────────────────────────────── */
                <div>
                  {/* Platform preview label */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    marginBottom: '20px',
                  }}>
                    <div style={{
                      height: '1px', flex: 1, background: 'var(--border)',
                    }} />
                    <span style={{
                      fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)',
                      padding: '4px 12px', borderRadius: '50px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      textTransform: 'uppercase', letterSpacing: '.06em',
                    }}>
                      {platformLabel} preview
                    </span>
                    <div style={{
                      height: '1px', flex: 1, background: 'var(--border)',
                    }} />
                  </div>

                  <PlatformPreview post={selectedPost} />

                  {/* Scheduled date below preview */}
                  {selectedPost.scheduled_at && (
                    <div style={{
                      textAlign: 'center', marginTop: '20px',
                      fontSize: '.8rem', color: 'var(--muted)',
                    }}>
                      Ingepland op{' '}
                      <strong style={{ color: 'var(--text)' }}>
                        {new Date(selectedPost.scheduled_at).toLocaleString('nl-NL', {
                          weekday: 'long', day: 'numeric', month: 'long',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                /* ── DETAILS TAB ───────────────────────────────────── */
                <div style={{ maxWidth: '640px' }}>

                  {/* Meta row */}
                  <div style={{
                    display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px',
                  }}>
                    <span style={{
                      fontSize: '.78rem', fontWeight: 700, padding: '5px 13px',
                      borderRadius: '50px', background: `${platformColor}18`,
                      color: platformColor, border: `1px solid ${platformColor}28`,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: platformColor, display: 'inline-block', marginRight: 5 }} />{platformLabel}
                    </span>
                    {selectedPost.content_type && (
                      <span style={{
                        fontSize: '.78rem', fontWeight: 600, padding: '5px 13px',
                        borderRadius: '50px', background: 'var(--card)',
                        color: 'var(--muted)', border: '1px solid var(--border)',
                      }}>
                        {selectedPost.content_type}
                      </span>
                    )}
                    <span style={{
                      fontSize: '.78rem', fontWeight: 700, padding: '5px 13px',
                      borderRadius: '50px',
                      background: 'rgba(255,122,48,.10)', color: '#ff7a30',
                      border: '1px solid rgba(255,122,48,.20)',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Clock size={12} /> Wacht op goedkeuring</span>
                    </span>
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
                        fontSize: '.65rem', fontWeight: 700, color: 'var(--muted)',
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
                      marginBottom: '20px',
                    }}>
                      <div style={{
                        fontSize: '.65rem', fontWeight: 700, color: '#ff7a30',
                        marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.08em',
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Pin size={12} /> Notitie van agency</span>
                      </div>
                      <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: 'var(--text)', margin: 0 }}>
                        {selectedPost.notes}
                      </p>
                    </div>
                  )}

                  {/* Scheduled date */}
                  {selectedPost.scheduled_at && (
                    <div style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                      fontSize: '.84rem', color: 'var(--text)',
                    }}>
                      <strong>Ingepland:</strong>{' '}
                      {new Date(selectedPost.scheduled_at).toLocaleString('nl-NL', {
                        weekday: 'long', day: 'numeric', month: 'long',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── FIXED ACTION BAR ─────────────────────────────────── */}
            <div style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--card)',
              padding: '14px 24px',
              flexShrink: 0,
            }}>
              {!isAdmin ? (
                /* Client actions */
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleApprove(selectedPost)}
                    disabled={loading}
                    className="approve-action-btn"
                    style={{
                      flex: 1, padding: '14px 12px',
                      background: loading ? 'var(--border)' : 'linear-gradient(135deg, #00b89c, #00a388)',
                      color: '#fff', border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 800, fontSize: '1rem',
                      fontFamily: 'var(--font-syne), sans-serif',
                      boxShadow: loading ? 'none' : '0 4px 20px rgba(0,184,156,.35)',
                      transition: 'all .2s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Check size={18} /> Goedkeuren</span>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={loading}
                    className="approve-action-btn"
                    style={{
                      flex: 1, padding: '14px 12px',
                      background: 'transparent',
                      color: '#e53e3e',
                      border: '2px solid rgba(229,62,62,.35)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 800, fontSize: '1rem',
                      fontFamily: 'var(--font-syne), sans-serif',
                      transition: 'all .2s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Pencil size={18} /> Aanpassingen nodig</span>
                  </button>
                </div>
              ) : (
                /* Admin status panel */
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '.78rem', fontWeight: 600, color: '#ff7a30',
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,122,48,.07)', border: '1px solid rgba(255,122,48,.2)',
                  }}>
                    ⏳ Wacht op goedkeuring
                    {selectedPost.clients?.company_name && (
                      <> — {selectedPost.clients.company_name}</>
                    )}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                    {selectedPost.share_token && (
                      <button
                        onClick={() => copyShareLink(selectedPost)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '9px 18px',
                          background: 'rgba(26,63,228,.07)', color: 'var(--accent1)',
                          border: '1px solid rgba(26,63,228,.2)',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          fontWeight: 700, fontSize: '.82rem',
                        }}
                      >
                        <Share2 size={14} style={{ flexShrink: 0 }} /> Deel goedkeuringslink
                      </button>
                    )}
                    <button
                      onClick={() => handleAdminChange(selectedPost, 'scheduled')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 18px',
                        background: 'rgba(0,184,156,.10)', color: '#00b89c',
                        border: '1px solid rgba(0,184,156,.3)',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        fontWeight: 700, fontSize: '.82rem',
                      }}
                    >
                      <Check size={14} /> Goedkeuren & inplannen
                    </button>
                    <button
                      onClick={() => handleAdminChange(selectedPost, 'concept')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 18px',
                        background: 'rgba(229,62,62,.07)', color: '#e53e3e',
                        border: '1px solid rgba(229,62,62,.25)',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        fontWeight: 700, fontSize: '.82rem',
                      }}
                    >
                      Terug naar concept
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
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
              fontWeight: 800, fontSize: '1.05rem', marginBottom: '6px', margin: '0 0 6px',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Pencil size={16} /> Aanpassingen doorgeven</span>
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
                {loading ? 'Versturen…' : 'Verstuur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
