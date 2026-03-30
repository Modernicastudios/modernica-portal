'use client'

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostData {
  id: string
  title?: string
  platform: string
  content_type?: string
  caption?: string
  hashtags?: string
  notes?: string
  scheduled_at?: string
  status: string
  share_token: string
  rejection_note?: string
  clients?: { company_name: string }
  agencies?: { name: string; logo_url?: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#e1306c',
  tiktok: '#010101',
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

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  facebook: 'Facebook',
  twitter: 'Twitter',
}

// ─── Platform Previews ────────────────────────────────────────────────────────

function InstagramPreview({ post }: { post: PostData }) {
  const hashtagList = post.hashtags ? post.hashtags.split(/\s+/).filter(Boolean) : []
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', border: '1px solid #dbdbdb',
      maxWidth: '468px', margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,.10)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
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
      <div style={{
        width: '100%', aspectRatio: '1 / 1',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #e1306c22 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.45 }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📸</div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#555' }}>Mediabestand</div>
        </div>
      </div>
      <div style={{ padding: '10px 14px 6px' }}>
        <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🤍</span>
          <span style={{ fontSize: '24px' }}>💬</span>
          <span style={{ fontSize: '24px' }}>📤</span>
          <span style={{ fontSize: '24px', marginLeft: 'auto' }}>🔖</span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#262626', marginBottom: '5px' }}>1.234 vind-ik-leuks</div>
        {post.caption && (
          <div style={{ fontSize: '13px', color: '#262626', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>{post.clients?.company_name?.toLowerCase().replace(/\s+/g, '_') || 'jouwbedrijf'}</span>{' '}
            {post.caption}
          </div>
        )}
        {hashtagList.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            {hashtagList.map((tag, i) => <span key={i} style={{ color: '#00376b', fontSize: '13px' }}>{tag} </span>)}
          </div>
        )}
        <div style={{ fontSize: '11px', color: '#737373', marginTop: '6px', textTransform: 'uppercase' }}>Zojuist</div>
      </div>
    </div>
  )
}

function LinkedInPreview({ post }: { post: PostData }) {
  const hashtagList = post.hashtags ? post.hashtags.split(/\s+/).filter(Boolean) : []
  return (
    <div style={{
      background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0',
      maxWidth: '552px', margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)',
    }}>
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
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#000000e6' }}>{post.clients?.company_name || 'Jouw Bedrijf'}</div>
          <div style={{ fontSize: '12px', color: '#00000099' }}>Marketing · 2.341 volgers</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#00000099', marginTop: '2px' }}>
            <span>Zojuist</span><span>·</span><span>🌐</span>
          </div>
        </div>
        <div style={{ color: '#0a66c2', fontSize: '13px', fontWeight: 600 }}>+ Volgen</div>
      </div>
      {post.caption && (
        <div style={{ padding: '4px 16px 10px', fontSize: '14px', color: '#000000e6', lineHeight: 1.6 }}>
          {post.caption}
          {hashtagList.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              {hashtagList.map((tag, i) => <span key={i} style={{ color: '#0a66c2' }}>{tag} </span>)}
            </div>
          )}
        </div>
      )}
      <div style={{
        width: '100%', aspectRatio: '1.91 / 1',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #c2d4f8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💼</div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#555' }}>Mediabestand</div>
        </div>
      </div>
      <div style={{ padding: '6px 16px 10px', borderTop: '1px solid #e0e0e0', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 0' }}>
          {['👍 Vind ik leuk', '💬 Reageren', '🔄 Delen', '📤 Sturen'].map(action => (
            <button key={action} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#00000099', fontWeight: 500, padding: '6px 10px' }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FacebookPreview({ post }: { post: PostData }) {
  const hashtagList = post.hashtags ? post.hashtags.split(/\s+/).filter(Boolean) : []
  return (
    <div style={{
      background: '#fff', borderRadius: '8px', border: '1px solid #dddfe2',
      maxWidth: '500px', margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,.10)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 8px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', background: '#1877f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0,
        }}>
          {(post.clients?.company_name || 'B')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#050505' }}>{post.clients?.company_name || 'Jouw Bedrijf'}</div>
          <div style={{ fontSize: '12px', color: '#65676b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Gesponsord</span><span>·</span><span>🌐</span>
          </div>
        </div>
        <div style={{ fontSize: '20px', color: '#65676b' }}>···</div>
      </div>
      {post.caption && (
        <div style={{ padding: '4px 16px 10px', fontSize: '14px', color: '#050505', lineHeight: 1.5 }}>
          {post.caption}
          {hashtagList.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              {hashtagList.map((tag, i) => <span key={i} style={{ color: '#1877f2' }}>{tag} </span>)}
            </div>
          )}
        </div>
      )}
      <div style={{
        width: '100%', aspectRatio: '1.91 / 1',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #bfd5ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📘</div>
          <div style={{ fontSize: '12px', color: '#555' }}>Mediabestand</div>
        </div>
      </div>
      <div style={{ padding: '8px 16px', borderTop: '1px solid #dddfe2', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px' }}>👍❤️😂</span>
          <span style={{ fontSize: '13px', color: '#65676b', marginLeft: '4px' }}>234</span>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#65676b' }}>12 reacties</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #dddfe2', paddingTop: '4px' }}>
          {['👍 Vind ik leuk', '💬 Reageren', '↗️ Delen'].map(action => (
            <button key={action} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#65676b', fontWeight: 600, padding: '6px 10px' }}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TikTokPreview({ post }: { post: PostData }) {
  return (
    <div style={{
      background: '#000', borderRadius: '16px', maxWidth: '320px', margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,.5)',
    }}>
      <div style={{
        width: '100%', aspectRatio: '9 / 16',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎵</div>
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>Video</div>
        </div>
        <div style={{
          position: 'absolute', right: '10px', bottom: '100px',
          display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center',
        }}>
          {['🤍', '💬', '↗️', '🎵'].map((icon, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.5))' }}>{icon}</div>
              <div style={{ fontSize: '10px', color: '#fff', marginTop: '2px' }}>{['1.2K', '89', '24', ''][i]}</div>
            </div>
          ))}
        </div>
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
        </div>
      </div>
    </div>
  )
}

function YouTubePreview({ post }: { post: PostData }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '8px', maxWidth: '560px', margin: '0 auto',
      fontFamily: 'Roboto, -apple-system, sans-serif',
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.10)',
    }}>
      <div style={{
        width: '100%', aspectRatio: '16 / 9',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <div style={{
          width: '68px', height: '48px', background: 'rgba(255,0,0,.9)',
          borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 0, height: 0,
            borderTop: '12px solid transparent', borderBottom: '12px solid transparent',
            borderLeft: '20px solid #fff', marginLeft: '4px',
          }} />
        </div>
        <div style={{
          position: 'absolute', bottom: '8px', right: '8px',
          background: 'rgba(0,0,0,.8)', color: '#fff',
          fontSize: '12px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px',
        }}>1:23</div>
      </div>
      <div style={{ padding: '12px 16px 14px', display: 'flex', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: '#ff0000', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '14px',
        }}>
          {(post.clients?.company_name || 'Y')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f0f0f', lineHeight: 1.4 }}>
            {post.title || post.caption?.slice(0, 60) || 'Video titel'}
          </div>
          <div style={{ fontSize: '12px', color: '#606060', marginTop: '4px' }}>
            {post.clients?.company_name || 'Jouw Kanaal'} · 12K weergaven · Zojuist
          </div>
        </div>
      </div>
    </div>
  )
}

function PlatformPreview({ post }: { post: PostData }) {
  const platform = post.platform?.toLowerCase()
  if (platform === 'instagram') return <InstagramPreview post={post} />
  if (platform === 'linkedin') return <LinkedInPreview post={post} />
  if (platform === 'facebook') return <FacebookPreview post={post} />
  if (platform === 'tiktok') return <TikTokPreview post={post} />
  if (platform === 'youtube') return <YouTubePreview post={post} />

  const color = PLATFORM_COLORS[platform] || '#1a3fe4'
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', border: `1px solid ${color}30`,
      maxWidth: '480px', margin: '0 auto', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,.10)',
    }}>
      <div style={{ height: '5px', background: color }} />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: `${color}30`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px',
          }}>
            {PLATFORM_ICONS[platform] || '📄'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{post.clients?.company_name || 'Jouw Bedrijf'}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>Zojuist</div>
          </div>
        </div>
        {post.caption && (
          <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#111', marginBottom: '12px' }}>{post.caption}</div>
        )}
        <div style={{
          height: '180px', background: `${color}14`,
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '3rem', opacity: 0.4 }}>{PLATFORM_ICONS[platform] || '🖼️'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReviewClient({ token }: { token: string }) {
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reviewerName, setReviewerName] = useState('')
  const [showFeedbackBox, setShowFeedbackBox] = useState(false)
  const [feedbackNote, setFeedbackNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<'approved' | 'changes_requested' | null>(null)

  useEffect(() => {
    fetch(`/api/review/${token}`)
      .then(res => {
        if (!res.ok) { setNotFound(true); setLoading(false); return null }
        return res.json()
      })
      .then(data => {
        if (data) { setPost(data); setLoading(false) }
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  async function submitDecision(decision: 'approved' | 'changes_requested') {
    if (decision === 'changes_requested' && !feedbackNote.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/review/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, feedback_note: feedbackNote || null, reviewer_name: reviewerName || null }),
    })
    if (res.ok) {
      setSubmitted(decision)
    }
    setSubmitting(false)
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8f9fb',
      }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #e5e7eb',
            borderTopColor: '#1a3fe4', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '.9rem' }}>Laden...</div>
        </div>
      </div>
    )
  }

  // ── Not Found ──────────────────────────────────────────────────────────────

  if (notFound || !post) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8f9fb', padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔗</div>
          <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111', margin: '0 0 8px', fontFamily: 'sans-serif' }}>
            Link niet gevonden
          </h1>
          <p style={{ color: '#888', fontSize: '.9rem', lineHeight: 1.6, margin: 0 }}>
            Deze link is niet meer geldig of de content is verwijderd.
          </p>
        </div>
      </div>
    )
  }

  const platformColor = PLATFORM_COLORS[post.platform?.toLowerCase()] || '#1a3fe4'
  const platformLabel = PLATFORM_LABELS[post.platform?.toLowerCase()] || post.platform
  const isAlreadyApproved = post.status === 'scheduled'

  // ── Thank you state ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', flexDirection: 'column' }}>
        <TopBar post={post} />
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
              {submitted === 'approved' ? '🎉' : '✏️'}
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#111', margin: '0 0 10px', fontFamily: 'sans-serif' }}>
              {submitted === 'approved' ? 'Bedankt voor je feedback!' : 'Je aanpassingen zijn verstuurd.'}
            </h2>
            <p style={{ color: '#888', fontSize: '.9rem', lineHeight: 1.6, margin: 0 }}>
              Je kunt dit venster sluiten.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Review Page ───────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', flexDirection: 'column' }}>
      <TopBar post={post} />

      <div style={{ flex: 1, padding: '32px 24px 60px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '680px' }}>

          {/* Post header chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: '50px',
              background: `${platformColor}18`, color: platformColor,
              border: `1px solid ${platformColor}28`,
            }}>
              {PLATFORM_ICONS[post.platform?.toLowerCase()] || '📄'} {platformLabel}
            </span>
            {post.content_type && (
              <span style={{
                fontSize: '.78rem', fontWeight: 600, padding: '4px 12px', borderRadius: '50px',
                background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
              }}>
                {post.content_type}
              </span>
            )}
            {post.title && (
              <h1 style={{
                fontFamily: 'sans-serif', fontWeight: 800, fontSize: '1.1rem',
                color: '#111', margin: 0, flex: 1,
              }}>
                {post.title}
              </h1>
            )}
          </div>

          {/* Platform preview */}
          <div style={{ marginBottom: '28px' }}>
            <PlatformPreview post={post} />
          </div>

          {/* Scheduled date chip */}
          {post.scheduled_at && (
            <div style={{
              textAlign: 'center', marginBottom: '28px',
              fontSize: '.82rem', color: '#888',
            }}>
              📅 Ingepland op{' '}
              <strong style={{ color: '#111' }}>
                {new Date(post.scheduled_at).toLocaleString('nl-NL', {
                  weekday: 'long', day: 'numeric', month: 'long',
                  hour: '2-digit', minute: '2-digit',
                })}
              </strong>
            </div>
          )}

          {/* Caption + hashtags */}
          {post.caption && (
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderLeft: `4px solid ${platformColor}`,
              borderRadius: '0 8px 8px 0', padding: '16px 18px', marginBottom: '20px',
            }}>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px',
              }}>
                Caption
              </div>
              <p style={{ fontSize: '.9rem', lineHeight: 1.75, color: '#111', margin: 0, whiteSpace: 'pre-wrap' }}>
                {post.caption}
              </p>
              {post.hashtags && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {post.hashtags.split(/\s+/).filter(Boolean).map((tag, i) => (
                    <span key={i} style={{
                      fontSize: '.75rem', padding: '2px 10px', borderRadius: '50px',
                      background: `${platformColor}10`, color: platformColor,
                      fontWeight: 600, border: `1px solid ${platformColor}20`,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agency notes */}
          {post.notes && (
            <div style={{
              background: 'rgba(255,122,48,.06)', border: '1px solid rgba(255,122,48,.22)',
              borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
            }}>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, color: '#ff7a30',
                textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px',
              }}>
                📌 Notitie van agency
              </div>
              <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: '#111', margin: 0 }}>
                {post.notes}
              </p>
            </div>
          )}

          {/* Previous rejection note */}
          {post.rejection_note && !isAlreadyApproved && (
            <div style={{
              background: 'rgba(229,57,53,.05)', border: '1px solid rgba(229,57,53,.2)',
              borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
            }}>
              <div style={{
                fontSize: '.65rem', fontWeight: 700, color: '#e53935',
                textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px',
              }}>
                Eerder gevraagde aanpassingen
              </div>
              <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: '#111', margin: 0 }}>
                {post.rejection_note}
              </p>
            </div>
          )}

          {/* ── Review form ─────────────────────────────────────────────── */}
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '24px', marginTop: '8px',
          }}>
            {isAlreadyApproved ? (
              /* Already approved */
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', padding: '12px',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(0,184,156,.1)', color: '#00b89c',
                  border: '1px solid rgba(0,184,156,.3)',
                  borderRadius: '50px', padding: '8px 20px',
                  fontWeight: 700, fontSize: '.95rem',
                }}>
                  ✅ Goedgekeurd
                </span>
                <span style={{ color: '#888', fontSize: '.84rem' }}>
                  Deze content is al goedgekeurd.
                </span>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                    Jouw naam (optioneel)
                  </label>
                  <input
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    placeholder="Jouw naam (optioneel)"
                    style={{
                      width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
                      borderRadius: '8px', fontSize: '.9rem', outline: 'none',
                      boxSizing: 'border-box', color: '#111', background: '#f9fafb',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Approve button */}
                <button
                  onClick={() => submitDecision('approved')}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '14px', marginBottom: '10px',
                    background: submitting ? '#d1d5db' : 'linear-gradient(135deg, #00b89c, #00a388)',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 800, fontSize: '1rem',
                    boxShadow: submitting ? 'none' : '0 4px 16px rgba(0,184,156,.35)',
                    transition: 'all .2s',
                  }}
                >
                  ✅ Goedkeuren
                </button>

                {/* Changes needed button */}
                {!showFeedbackBox ? (
                  <button
                    onClick={() => setShowFeedbackBox(true)}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'transparent', color: '#e53e3e',
                      border: '2px solid rgba(229,62,62,.35)', borderRadius: '8px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontSize: '.95rem', transition: 'all .2s',
                    }}
                  >
                    ✏️ Aanpassingen nodig
                  </button>
                ) : (
                  <div style={{
                    border: '1.5px solid rgba(229,62,62,.3)', borderRadius: '8px',
                    padding: '16px', background: 'rgba(229,62,62,.02)',
                  }}>
                    <div style={{
                      fontSize: '.78rem', fontWeight: 700, color: '#e53e3e',
                      textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px',
                    }}>
                      ✏️ Beschrijf de aanpassingen
                    </div>
                    <textarea
                      autoFocus
                      value={feedbackNote}
                      onChange={e => setFeedbackNote(e.target.value)}
                      placeholder="Bijv. Kan de tekst korter? En de afbeelding wat meer zomers maken…"
                      rows={4}
                      style={{
                        width: '100%', padding: '10px 14px',
                        border: '1px solid #e5e7eb', borderRadius: '8px',
                        fontSize: '.88rem', outline: 'none', resize: 'vertical',
                        fontFamily: 'inherit', lineHeight: 1.6,
                        color: '#111', boxSizing: 'border-box', background: '#fff',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => { setShowFeedbackBox(false); setFeedbackNote('') }}
                        style={{
                          flex: 1, padding: '10px', border: '1px solid #e5e7eb',
                          borderRadius: '8px', background: 'none', cursor: 'pointer',
                          fontSize: '.86rem', color: '#6b7280',
                        }}
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={() => submitDecision('changes_requested')}
                        disabled={submitting || !feedbackNote.trim()}
                        style={{
                          flex: 2, padding: '10px',
                          background: submitting || !feedbackNote.trim() ? '#d1d5db' : '#e53e3e',
                          color: '#fff', border: 'none', borderRadius: '8px',
                          cursor: submitting || !feedbackNote.trim() ? 'not-allowed' : 'pointer',
                          fontWeight: 700, fontSize: '.86rem',
                        }}
                      >
                        {submitting ? 'Versturen...' : 'Verstuur aanpassingen'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

function TopBar({ post }: { post: PostData }) {
  return (
    <div style={{
      height: '60px', background: '#fff', borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {post.agencies?.logo_url ? (
          <img
            src={post.agencies.logo_url}
            alt={post.agencies.name || ''}
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        ) : (
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #1a3fe4, #3b5fe8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '14px',
          }}>
            {(post.agencies?.name || 'M')[0].toUpperCase()}
          </div>
        )}
        <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#111' }}>
          {post.agencies?.name || 'Modernica'}
        </span>
      </div>
      <span style={{ fontSize: '.75rem', color: '#9ca3af', fontWeight: 500 }}>
        Powered by Modernica
      </span>
    </div>
  )
}
