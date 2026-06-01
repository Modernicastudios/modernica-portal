'use client'

import { CSSProperties } from 'react'
import { Calendar, CheckCircle2, Clock, Hourglass } from 'lucide-react'
import { PlatformIcon, PlatformBadge, PLATFORM_COLORS, PLATFORM_LABELS } from '@/components/ui/PlatformIcon'

interface Props {
  posts: any[]
  isAdmin: boolean
  clientId: string
}

const PLATFORMS: { key: string; label: string; color: string; accent: string }[] = [
  { key: 'instagram', label: 'Instagram', color: '#e1306c', accent: '#e1306c' },
  { key: 'facebook', label: 'Facebook', color: '#1877f2', accent: '#1877f2' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0077b5', accent: '#0077b5' },
  { key: 'tiktok', label: 'TikTok', color: '#010101', accent: '#69c9d0' },
  { key: 'youtube', label: 'YouTube', color: '#ff0000', accent: '#ff6b6b' },
]

const STATUS_LABELS: Record<string, string> = {
  published: 'Gepubliceerd',
  scheduled: 'Gepland',
  pending_approval: 'Ter goedkeuring',
  draft: 'Concept',
  approved: 'Goedgekeurd',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  published: { bg: 'rgba(0,166,125,.12)', color: '#00a67d' },
  scheduled: { bg: 'rgba(26,63,228,.1)', color: 'var(--accent1)' },
  pending_approval: { bg: 'rgba(255,170,0,.12)', color: '#cc8800' },
  draft: { bg: 'rgba(107,120,168,.1)', color: 'var(--muted)' },
  approved: { bg: 'rgba(0,166,125,.08)', color: '#00a67d' },
}

const CONTENT_TYPES = ['Reels', 'Post', 'Story', 'Carrousel']

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

function getLast6Months(): { year: number; month: number; label: string }[] {
  const now = new Date()
  const result = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES_SHORT[d.getMonth()] })
  }
  return result
}

export default function SocialAnalyticsClient({ posts }: Props) {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  // Platform breakdown (published posts per platform)
  const platformCounts: Record<string, number> = {}
  for (const p of PLATFORMS) platformCounts[p.key] = 0
  for (const post of posts) {
    const pl = (post.platform || '').toLowerCase()
    if (platformCounts[pl] !== undefined) platformCounts[pl]++
    else platformCounts[pl] = (platformCounts[pl] || 0) + 1
  }

  // Stats this month
  const thisMonthPosts = posts.filter(p => {
    const d = new Date(p.scheduled_at || p.created_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  })
  const totalThisMonth = thisMonthPosts.length
  const publishedThisMonth = thisMonthPosts.filter(p => p.status === 'published').length
  const scheduledThisMonth = thisMonthPosts.filter(p => p.status === 'scheduled').length
  const pendingThisMonth = thisMonthPosts.filter(p => p.status === 'pending_approval').length

  // 6-month bar chart data
  const last6 = getLast6Months()
  const monthlyByPlatform: Record<string, number[]> = {}
  for (const p of PLATFORMS) {
    monthlyByPlatform[p.key] = Array(6).fill(0)
  }
  for (const post of posts) {
    if (post.status !== 'published') continue
    const d = new Date(post.scheduled_at || post.created_at)
    const idx = last6.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth())
    if (idx !== -1) {
      const pl = (post.platform || '').toLowerCase()
      if (monthlyByPlatform[pl]) monthlyByPlatform[pl][idx]++
    }
  }
  const monthTotals = last6.map((_, i) =>
    PLATFORMS.reduce((s, p) => s + (monthlyByPlatform[p.key]?.[i] || 0), 0)
  )
  const maxMonthTotal = Math.max(...monthTotals, 1)

  // Content type breakdown
  const typeCounts: Record<string, number> = {}
  for (const t of CONTENT_TYPES) typeCounts[t.toLowerCase()] = 0
  for (const post of posts) {
    const t = (post.content_type || '').toLowerCase()
    if (typeCounts[t] !== undefined) typeCounts[t]++
    else typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  const totalTyped = Object.values(typeCounts).reduce((a, b) => a + b, 0) || 1

  // Last 10 published posts
  const recentPublished = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.scheduled_at || b.created_at).getTime() - new Date(a.scheduled_at || a.created_at).getTime())
    .slice(0, 10)

  const cardStyle: CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    boxShadow: 'var(--shadow)',
  }

  const labelStyle: CSSProperties = {
    fontSize: '.72rem',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: '6px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '4px' }}>
          Content Overzicht
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          Analyse van gepubliceerde en geplande content — laatste 6 maanden
        </p>
      </div>

      {/* Platform breakdown cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {PLATFORMS.map(pl => (
          <div key={pl.key} style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(26,63,228,.05)',
          }}>
            <div style={{ height: '4px', background: pl.color }} />
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <PlatformIcon platform={pl.key} size={24} />
              </div>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.6rem', color: pl.color }}>
                {platformCounts[pl.key] || 0}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>{pl.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Posts deze maand', value: totalThisMonth, color: 'var(--accent1)', icon: <Calendar size={26} /> },
          { label: 'Gepubliceerd', value: publishedThisMonth, color: '#00a67d', icon: <CheckCircle2 size={26} /> },
          { label: 'Gepland', value: scheduledThisMonth, color: '#1877f2', icon: <Clock size={26} /> },
          { label: 'Ter goedkeuring', value: pendingThisMonth, color: '#cc8800', icon: <Hourglass size={26} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: color,
            }} />
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: .25, color }}>{icon}</div>
            <div style={labelStyle}>{label}</div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 6-month bar chart */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
            Gepubliceerde posts per maand
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '4px' }}>Laatste 6 maanden</div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {PLATFORMS.map(pl => (
            <div key={pl.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.74rem', color: 'var(--muted)' }}>
              <PlatformIcon platform={pl.key} size={13} />
              {pl.label}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '140px' }}>
          {last6.map((m, i) => {
            const total = monthTotals[i]
            const barH = (total / maxMonthTotal) * 120
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '120px', width: '100%', gap: '1px' }}>
                  {PLATFORMS.map(pl => {
                    const count = monthlyByPlatform[pl.key]?.[i] || 0
                    if (count === 0) return null
                    const h = (count / maxMonthTotal) * 120
                    return (
                      <div
                        key={pl.key}
                        title={`${pl.label}: ${count}`}
                        style={{
                          height: `${h}px`,
                          background: pl.color,
                          borderRadius: '2px',
                          minHeight: count > 0 ? '3px' : '0',
                          transition: 'height .3s',
                        }}
                      />
                    )
                  })}
                  {total === 0 && (
                    <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px' }} />
                  )}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)', textAlign: 'center' }}>{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content type breakdown */}
      <div style={cardStyle}>
        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '16px' }}>
          Content type verdeling
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CONTENT_TYPES.map((type, idx) => {
            const count = typeCounts[type.toLowerCase()] || 0
            const pct = Math.round((count / totalTyped) * 100)
            const colors = ['var(--accent1)', 'var(--accent2)', 'var(--accent3)', 'var(--accent4)']
            return (
              <div key={type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{type}</span>
                  <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: '6px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: colors[idx % colors.length],
                    borderRadius: '4px',
                    transition: 'width .5s',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status timeline — last 10 published */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
            Recente publicaties
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '2px' }}>Laatste 10 gepubliceerde posts</div>
        </div>
        {recentPublished.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
            <div style={{ fontWeight: 600 }}>Nog geen gepubliceerde posts</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Platform', 'Datum', 'Content type', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '.73rem', fontWeight: 700,
                      color: 'var(--muted)', textTransform: 'uppercase',
                      letterSpacing: '.05em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPublished.map(post => {
                  const pl = PLATFORMS.find(p => p.key === (post.platform || '').toLowerCase())
                  const statusStyle = STATUS_COLORS[post.status] || { bg: 'rgba(107,120,168,.1)', color: 'var(--muted)' }
                  const date = new Date(post.scheduled_at || post.created_at)
                  return (
                    <tr key={post.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <PlatformBadge platform={post.platform || ''} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '.82rem', color: 'var(--muted)' }}>
                        {date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '.82rem', textTransform: 'capitalize' }}>
                        {post.content_type || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '.72rem', padding: '3px 8px', borderRadius: '50px',
                          background: statusStyle.bg, color: statusStyle.color, fontWeight: 600,
                        }}>
                          {STATUS_LABELS[post.status] || post.status || '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
