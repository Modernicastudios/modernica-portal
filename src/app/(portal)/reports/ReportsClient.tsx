'use client'

import { useState } from 'react'

interface Props {
  projects: any[]
  posts: any[]
  clients: { count: number }
  agency: any
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#e1306c',
  tiktok: '#010101',
  linkedin: '#0077b5',
  youtube: '#ff0000',
  facebook: '#1877f2',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  concept: { label: 'Concept', color: '#6b78a8', bg: 'rgba(107,120,168,.12)' },
  scheduled: { label: 'Gepland', color: '#0077b5', bg: 'rgba(0,119,181,.12)' },
  published: { label: 'Gepubliceerd', color: '#00b89c', bg: 'rgba(0,184,156,.12)' },
  pending_approval: { label: 'In behandeling', color: '#ff7a30', bg: 'rgba(255,122,48,.12)' },
}

const PROJECT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  backlog: { label: 'Backlog', color: '#6b78a8', bg: 'rgba(107,120,168,.12)' },
  in_progress: { label: 'In uitvoering', color: '#1a3fe4', bg: 'rgba(26,63,228,.10)' },
  waiting_feedback: { label: 'Wacht op feedback', color: '#f5a623', bg: 'rgba(245,166,35,.12)' },
  review: { label: 'Review', color: '#ff7a30', bg: 'rgba(255,122,48,.10)' },
  approved: { label: 'Goedgekeurd', color: '#00b89c', bg: 'rgba(0,184,156,.10)' },
  archived: { label: 'Archief', color: '#6b78a8', bg: 'rgba(107,120,168,.10)' },
}

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function inMonth(dateStr: string | null | undefined, year: number, month: number): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getFullYear() === year && d.getMonth() === month
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getWeekRanges(year: number, month: number): { label: string; start: number; end: number }[] {
  const days = getDaysInMonth(year, month)
  const weeks: { label: string; start: number; end: number }[] = []
  let day = 1
  let week = 1
  while (day <= days) {
    const end = Math.min(day + 6, days)
    weeks.push({ label: `Week ${week} (${day}-${end} ${new Date(year, month, 1).toLocaleDateString('nl-NL', { month: 'short' })})`, start: day, end })
    day += 7
    week++
  }
  return weeks
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null

export default function ReportsClient({ projects, posts, clients, agency }: Props) {
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => setToast(null), 3000)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function goToday() {
    setViewMonth(now.getMonth())
    setViewYear(now.getFullYear())
  }

  // --- Stats calculations ---
  const postsThisMonth = posts.filter(p => inMonth(p.scheduled_at, viewYear, viewMonth))
  const postsPrevMonth = posts.filter(p => {
    const pm = viewMonth === 0 ? 11 : viewMonth - 1
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    return inMonth(p.scheduled_at, py, pm)
  })

  const publishedThisMonth = postsThisMonth.filter(p => p.status === 'published').length
  const publishedPrevMonth = postsPrevMonth.filter(p => p.status === 'published').length

  const scheduledThisMonth = postsThisMonth.filter(p => p.status === 'scheduled').length
  const scheduledPrevMonth = postsPrevMonth.filter(p => p.status === 'scheduled').length

  const projectsDoneThisMonth = projects.filter(p =>
    (p.status === 'approved' || p.status === 'archived') && inMonth(p.created_at, viewYear, viewMonth)
  ).length
  const projectsDonePrevMonth = projects.filter(p => {
    const pm = viewMonth === 0 ? 11 : viewMonth - 1
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    return (p.status === 'approved' || p.status === 'archived') && inMonth(p.created_at, py, pm)
  }).length

  function delta(cur: number, prev: number) {
    if (prev === 0 && cur === 0) return null
    if (prev === 0) return { pct: 100, up: true }
    const d = Math.round(((cur - prev) / prev) * 100)
    return { pct: Math.abs(d), up: d >= 0 }
  }

  // --- Platform breakdown ---
  const platformCounts: Record<string, number> = {}
  postsThisMonth.forEach(p => {
    const pl = (p.platform || 'other').toLowerCase()
    platformCounts[pl] = (platformCounts[pl] || 0) + 1
  })
  const maxPlatformCount = Math.max(1, ...Object.values(platformCounts))

  // --- Status distribution ---
  const statusCounts: Record<string, number> = {}
  posts.forEach(p => {
    const s = p.status || 'concept'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })
  const totalPostsAll = posts.length || 1

  // --- Platform donut ---
  const platformsForDonut = ['instagram', 'tiktok', 'linkedin', 'youtube', 'facebook']
  const donutData = platformsForDonut.map(pl => ({
    platform: pl,
    count: posts.filter(p => (p.platform || '').toLowerCase() === pl).length,
    color: PLATFORM_COLORS[pl],
  })).filter(d => d.count > 0)
  const donutTotal = donutData.reduce((s, d) => s + d.count, 0) || 1
  let donutAngle = 0
  const donutSegments = donutData.map(d => {
    const deg = (d.count / donutTotal) * 360
    const seg = { ...d, start: donutAngle, deg }
    donutAngle += deg
    return seg
  })
  const conicGradient = donutSegments.length
    ? `conic-gradient(${donutSegments.map(s => `${s.color} ${s.start}deg ${s.start + s.deg}deg`).join(', ')})`
    : 'conic-gradient(var(--border) 0deg 360deg)'

  // --- Week summary ---
  const weekRanges = getWeekRanges(viewYear, viewMonth)

  // --- Projects grouped by status ---
  const projectsByStatus: Record<string, any[]> = {}
  projects.forEach(p => {
    const s = p.status || 'backlog'
    if (!projectsByStatus[s]) projectsByStatus[s] = []
    projectsByStatus[s].push(p)
  })

  const statCards = [
    {
      label: 'Posts gepubliceerd',
      value: publishedThisMonth,
      color: '#e1306c',
      gradient: 'linear-gradient(90deg, #e1306c, #ff6b6b)',
      delta: delta(publishedThisMonth, publishedPrevMonth),
    },
    {
      label: 'Posts gepland',
      value: scheduledThisMonth,
      color: '#0077b5',
      gradient: 'linear-gradient(90deg, #0077b5, #00b4d8)',
      delta: delta(scheduledThisMonth, scheduledPrevMonth),
    },
    {
      label: 'Projecten afgerond',
      value: projectsDoneThisMonth,
      color: '#00b89c',
      gradient: 'linear-gradient(90deg, #00b89c, #00dfc0)',
      delta: delta(projectsDoneThisMonth, projectsDonePrevMonth),
    },
    {
      label: 'Actieve klanten',
      value: clients.count,
      color: '#7c5ff5',
      gradient: 'linear-gradient(90deg, #7c5ff5, #1a3fe4)',
      delta: null,
    },
  ]

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: '#1a1a2e', color: '#fff', borderRadius: '10px',
          padding: '12px 20px', fontSize: '.88rem', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,.3)',
          animation: 'fadeIn .2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
            fontSize: '1.75rem', marginBottom: '4px',
          }}>
            Rapportage
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
            {agency?.name ? `${agency.name} — ` : ''}Maandelijks overzicht van content &amp; projecten
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Month selector */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0',
            border: '1px solid var(--border)', borderRadius: '10px',
            overflow: 'hidden', background: 'var(--card)',
          }}>
            <button
              onClick={prevMonth}
              style={{
                padding: '8px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: 'var(--text)', fontSize: '1rem',
                borderRight: '1px solid var(--border)',
              }}
            >
              ←
            </button>
            <span style={{
              padding: '8px 16px', fontSize: '.88rem', fontWeight: 600,
              fontFamily: 'var(--font-syne), sans-serif', minWidth: '160px',
              textAlign: 'center', color: 'var(--text)',
            }}>
              {formatMonthLabel(viewYear, viewMonth)}
            </span>
            <button
              onClick={nextMonth}
              style={{
                padding: '8px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: 'var(--text)', fontSize: '1rem',
                borderLeft: '1px solid var(--border)',
              }}
            >
              →
            </button>
          </div>

          <button
            onClick={goToday}
            style={{
              padding: '8px 16px', border: '1px solid var(--border)',
              borderRadius: '10px', background: 'var(--card)', cursor: 'pointer',
              fontSize: '.82rem', fontWeight: 600, color: 'var(--text)',
            }}
          >
            Vandaag
          </button>

          <button
            onClick={() => showToast('📤 Export komt binnenkort!')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, var(--accent1), #2d5fff)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📤 Exporteer
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(26,63,228,.06)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: card.gradient,
            }} />
            <div style={{
              fontSize: '.72rem', color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '10px',
            }}>
              {card.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
              fontSize: '2rem', color: card.color, lineHeight: 1,
              marginBottom: '8px',
            }}>
              {card.value}
            </div>
            {card.delta !== null ? (
              <div style={{
                fontSize: '.75rem',
                color: card.delta.up ? '#00b89c' : '#e1306c',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span>{card.delta.up ? '↑' : '↓'}</span>
                <span>{card.delta.pct}% vs vorige maand</span>
              </div>
            ) : (
              <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Totaal</div>
            )}
          </div>
        ))}
      </div>

      {/* TWO COLUMN CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* PLATFORM BAR CHART */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
            fontSize: '.95rem', marginBottom: '20px', color: 'var(--text)',
          }}>
            Content per platform
          </h3>
          {['instagram', 'tiktok', 'linkedin', 'youtube', 'facebook'].map(pl => {
            const count = platformCounts[pl] || 0
            const pct = Math.round((count / maxPlatformCount) * 100)
            return (
              <div key={pl} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '80px', fontSize: '.78rem', fontWeight: 500, color: 'var(--text)', flexShrink: 0 }}>
                  {PLATFORM_LABELS[pl]}
                </div>
                <div style={{ flex: 1, height: '22px', background: 'var(--bg)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: PLATFORM_COLORS[pl],
                    borderRadius: '6px',
                    minWidth: count > 0 ? '6px' : '0',
                    transition: 'width .4s ease',
                  }} />
                </div>
                <div style={{ width: '24px', fontSize: '.8rem', fontWeight: 700, color: 'var(--text)', textAlign: 'right', flexShrink: 0 }}>
                  {count}
                </div>
              </div>
            )
          })}
          {postsThisMonth.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '.82rem', textAlign: 'center', padding: '20px 0' }}>
              Geen posts in deze maand
            </p>
          )}
        </div>

        {/* STATUS DISTRIBUTION */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
            fontSize: '.95rem', marginBottom: '20px', color: 'var(--text)',
          }}>
            Content status verdeling
          </h3>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = statusCounts[status] || 0
            const pct = Math.round((count / totalPostsAll) * 100)
            return (
              <div key={status} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-block', width: '10px', height: '10px',
                      borderRadius: '50%', background: cfg.color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '.7rem', fontWeight: 700,
                      padding: '1px 8px', borderRadius: '50px',
                      background: cfg.bg, color: cfg.color,
                    }}>{count}</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--muted)', minWidth: '32px', textAlign: 'right' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: cfg.color, borderRadius: '4px',
                    transition: 'width .4s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DONUT + WEEK SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* PLATFORM DONUT */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
            fontSize: '.95rem', marginBottom: '20px', color: 'var(--text)',
          }}>
            Platform verdeling (totaal)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* Donut circle */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: conicGradient,
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'var(--card)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '.9rem', lineHeight: 1 }}>
                  {posts.length}
                </span>
                <span style={{ fontSize: '.6rem', color: 'var(--muted)' }}>posts</span>
              </div>
            </div>
            {/* Legend */}
            <div style={{ flex: 1 }}>
              {donutData.length > 0 ? donutData.map(d => (
                <div key={d.platform} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: d.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '.78rem', color: 'var(--text)', flex: 1 }}>
                    {PLATFORM_LABELS[d.platform] || d.platform}
                  </span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)' }}>
                    {Math.round((d.count / donutTotal) * 100)}%
                  </span>
                </div>
              )) : (
                <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Geen data beschikbaar</p>
              )}
            </div>
          </div>
        </div>

        {/* WEEK SUMMARY */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
            fontSize: '.95rem', marginBottom: '20px', color: 'var(--text)',
          }}>
            Content kalender samenvatting
          </h3>
          <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '16px' }}>
            Aantal geplande posts per week — {formatMonthLabel(viewYear, viewMonth)}
          </p>
          {weekRanges.map((week, i) => {
            const count = postsThisMonth.filter(p => {
              if (!p.scheduled_at) return false
              const d = new Date(p.scheduled_at)
              const day = d.getDate()
              return d.getFullYear() === viewYear && d.getMonth() === viewMonth && day >= week.start && day <= week.end
            }).length
            const maxWeek = Math.max(1, ...weekRanges.map(w => {
              return postsThisMonth.filter(p => {
                if (!p.scheduled_at) return false
                const d = new Date(p.scheduled_at)
                return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() >= w.start && d.getDate() <= w.end
              }).length
            }))
            const pct = Math.round((count / maxWeek) * 100)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--muted)', width: '80px', flexShrink: 0 }}>{week.label}</div>
                <div style={{ flex: 1, height: '20px', background: 'var(--bg)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'linear-gradient(90deg, var(--accent1), var(--accent2))',
                    borderRadius: '6px',
                    minWidth: count > 0 ? '6px' : '0',
                  }} />
                </div>
                <div style={{ width: '20px', fontSize: '.8rem', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* PROJECTEN OVERZICHT */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '24px',
        boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        marginBottom: '24px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
          fontSize: '.95rem', marginBottom: '20px', color: 'var(--text)',
        }}>
          Projecten overzicht
        </h3>

        {projects.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Geen projecten gevonden</p>
        )}

        {Object.entries(PROJECT_STATUS_CONFIG).map(([status, cfg]) => {
          const group = projectsByStatus[status]
          if (!group || group.length === 0) return null
          return (
            <div key={status} style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '10px',
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: cfg.color, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.06em', color: cfg.color,
                }}>
                  {cfg.label} ({group.length})
                </span>
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 2fr 1fr 1fr',
                gap: '12px',
                padding: '6px 12px',
                fontSize: '.68rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                borderBottom: '1px solid var(--border)',
                marginBottom: '4px',
              }}>
                <span>Project</span>
                <span>Klant</span>
                <span>Categorie</span>
                <span>Aangemaakt</span>
              </div>

              {group.map((project: any) => (
                <div key={project.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr 1fr 1fr',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '.82rem',
                  transition: 'background .15s',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.title || 'Zonder titel'}
                  </div>
                  <div style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.clients?.company_name || '—'}
                  </div>
                  <div>
                    {project.category ? (
                      <span style={{
                        fontSize: '.7rem', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '50px', background: 'var(--bg)',
                        border: '1px solid var(--border)', color: 'var(--muted)',
                      }}>
                        {project.category}
                      </span>
                    ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '.75rem' }}>
                    {project.created_at
                      ? new Date(project.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                      : '—'}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
