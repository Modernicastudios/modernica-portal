'use client'

import { useState, CSSProperties } from 'react'
import { Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import { PlatformIcon, PLATFORM_COLORS, PLATFORM_LABELS } from '@/components/ui/PlatformIcon'

interface Props {
  projects: any[]
  posts: any[]
  clients: { count: number }
  agency: any
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

const PLATFORMS = ['instagram', 'tiktok', 'linkedin', 'youtube', 'facebook']
const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

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

// ISO day: Monday=0 ... Sunday=6
function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null

const cardStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 8px rgba(26,63,228,.06)',
}

const cardTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-syne), sans-serif',
  fontWeight: 700,
  fontSize: '.9rem',
  marginBottom: '18px',
  color: 'var(--text)',
}

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

  // AI-samenvatting voor de klant — schrijft op basis van de maandcijfers.
  const [aiSummary, setAiSummary] = useState('')
  const [aiSumBusy, setAiSumBusy] = useState(false)
  async function aiWriteSummary() {
    setAiSumBusy(true)
    try {
      const maand = new Date(viewYear, viewMonth, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
      const prompt = `Schrijf een korte, positieve maandsamenvatting (3-4 zinnen, in het Nederlands) voor een klantrapportage over ${maand}. Cijfers: ${publishedThis} posts gepubliceerd, ${scheduledThis} gepland, ${projectsDoneThis} projecten afgerond. Schrijf professioneel en klantvriendelijk, benoem de voortgang positief en sluit af met een korte vooruitblik. Geef ALLEEN de samenvatting, zonder kopjes.`
      const res = await fetch('/api/ai/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (res.ok && data.text) setAiSummary(data.text.trim())
      else showToast(data.error || 'AI is even niet beschikbaar')
    } catch { showToast('Er ging iets mis met de AI') } finally { setAiSumBusy(false) }
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

  // ── Stats ──
  const postsThisMonth = posts.filter(p => inMonth(p.scheduled_at, viewYear, viewMonth))
  const postsPrevMonth = posts.filter(p => {
    const pm = viewMonth === 0 ? 11 : viewMonth - 1
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    return inMonth(p.scheduled_at, py, pm)
  })

  const publishedThis = postsThisMonth.filter(p => p.status === 'published').length
  const publishedPrev = postsPrevMonth.filter(p => p.status === 'published').length
  const scheduledThis = postsThisMonth.filter(p => p.status === 'scheduled').length
  const scheduledPrev = postsPrevMonth.filter(p => p.status === 'scheduled').length

  const projectsDoneThis = projects.filter(p =>
    (p.status === 'approved' || p.status === 'archived') && inMonth(p.created_at, viewYear, viewMonth)
  ).length
  const projectsDonePrev = projects.filter(p => {
    const pm = viewMonth === 0 ? 11 : viewMonth - 1
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    return (p.status === 'approved' || p.status === 'archived') && inMonth(p.created_at, py, pm)
  }).length

  function delta(cur: number, prev: number): { pct: number; up: boolean } | null {
    if (prev === 0 && cur === 0) return null
    if (prev === 0) return { pct: 100, up: true }
    const d = Math.round(((cur - prev) / prev) * 100)
    return { pct: Math.abs(d), up: d >= 0 }
  }

  // ── Platform breakdown ──
  const platformCounts: Record<string, number> = {}
  postsThisMonth.forEach(p => {
    const pl = (p.platform || 'other').toLowerCase()
    platformCounts[pl] = (platformCounts[pl] || 0) + 1
  })
  const maxPlatformCount = Math.max(1, ...Object.values(platformCounts))

  // ── Status breakdown (all posts) ──
  const statusCounts: Record<string, number> = {}
  posts.forEach(p => {
    const s = p.status || 'concept'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })
  const totalPostsAll = posts.length || 1

  // ── Donut (platform, all time) ──
  const donutData = PLATFORMS.map(pl => ({
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

  // ── Heatmap ──
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const heatmapCounts: Record<number, number> = {}
  postsThisMonth.forEach(p => {
    if (!p.scheduled_at) return
    const d = new Date(p.scheduled_at)
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate()
      heatmapCounts[day] = (heatmapCounts[day] || 0) + 1
    }
  })
  const maxHeatmap = Math.max(1, ...Object.values(heatmapCounts))

  // Build calendar grid: start from Monday of first week
  const firstDay = new Date(viewYear, viewMonth, 1)
  const startOffset = isoWeekday(firstDay) // 0=Mon
  const calCells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (calCells.length % 7 !== 0) calCells.push(null)

  function heatColor(count: number): string {
    if (count === 0) return 'var(--bg)'
    const intensity = count / maxHeatmap
    if (intensity < 0.25) return 'rgba(26,63,228,.15)'
    if (intensity < 0.5) return 'rgba(26,63,228,.35)'
    if (intensity < 0.75) return 'rgba(26,63,228,.60)'
    return 'rgba(26,63,228,.85)'
  }

  // ── Weekly activity table (Mon-Sun) ──
  // Build rows: week index → day-of-week array
  interface WeekRow {
    label: string
    days: (number | null)[]
    counts: number[]
  }
  const weekRows: WeekRow[] = []
  for (let i = 0; i < calCells.length; i += 7) {
    const slice = calCells.slice(i, i + 7)
    const counts = slice.map(day => {
      if (!day) return 0
      return heatmapCounts[day] || 0
    })
    const validDays = slice.filter(d => d !== null) as number[]
    if (validDays.length === 0) continue
    const label = `${validDays[0]}–${validDays[validDays.length - 1]} ${new Date(viewYear, viewMonth, 1)
      .toLocaleDateString('nl-NL', { month: 'short' })}`
    weekRows.push({ label, days: slice, counts })
  }

  // ── Projects grouped ──
  const projectsByStatus: Record<string, any[]> = {}
  projects.forEach(p => {
    const s = p.status || 'backlog'
    if (!projectsByStatus[s]) projectsByStatus[s] = []
    projectsByStatus[s].push(p)
  })

  const kpiCards = [
    {
      label: 'Posts gepubliceerd',
      value: publishedThis,
      color: '#e1306c',
      delta: delta(publishedThis, publishedPrev),
    },
    {
      label: 'Posts gepland',
      value: scheduledThis,
      color: '#0077b5',
      delta: delta(scheduledThis, scheduledPrev),
    },
    {
      label: 'Projecten afgerond',
      value: projectsDoneThis,
      color: '#00b89c',
      delta: delta(projectsDoneThis, projectsDonePrev),
    },
    {
      label: 'Actieve klanten',
      value: clients.count,
      color: '#7c5ff5',
      delta: null as { pct: number; up: boolean } | null,
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
        }}>
          {toast}
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
            fontSize: '1.6rem', marginBottom: '4px',
          }}>
            Rapportage
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
            {agency?.name ? `${agency.name} — ` : ''}Maandelijks overzicht van content &amp; projecten
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Month navigator */}
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1px solid var(--border)', borderRadius: '10px',
            overflow: 'hidden', background: 'var(--card)',
          }}>
            <button
              onClick={prevMonth}
              style={{
                padding: '8px 10px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: 'var(--text)',
                borderRight: '1px solid var(--border)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{
              padding: '8px 16px', fontSize: '.85rem', fontWeight: 600,
              fontFamily: 'var(--font-syne), sans-serif', minWidth: '160px',
              textAlign: 'center', color: 'var(--text)',
            }}>
              {formatMonthLabel(viewYear, viewMonth)}
            </span>
            <button
              onClick={nextMonth}
              style={{
                padding: '8px 10px', border: 'none', background: 'transparent',
                cursor: 'pointer', color: 'var(--text)',
                borderLeft: '1px solid var(--border)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronLeft size={15} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>

          <button
            onClick={goToday}
            style={{
              padding: '8px 14px', border: '1px solid var(--border)',
              borderRadius: '10px', background: 'var(--card)', cursor: 'pointer',
              fontSize: '.82rem', fontWeight: 600, color: 'var(--text)',
            }}
          >
            Vandaag
          </button>

          <button
            onClick={() => showToast('Export komt binnenkort beschikbaar')}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: '10px',
              background: 'var(--accent1)', color: '#fff',
              cursor: 'pointer', fontSize: '.84rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Download size={14} /> Exporteren
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px', marginBottom: '24px',
      }}>
        {kpiCards.map(card => {
          const d = card.delta
          return (
            <div key={card.label} style={{
              ...cardStyle,
              padding: '20px',
              borderTop: `3px solid ${card.color}`,
            }}>
              <div style={{
                fontSize: '.72rem', color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '.08em',
                marginBottom: '10px',
              }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
                fontSize: '2.1rem', color: card.color, lineHeight: 1, marginBottom: '8px',
              }}>
                {card.value}
              </div>
              {d !== null ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '.75rem', color: d.up ? '#00b89c' : '#e1306c',
                }}>
                  {d.up
                    ? <TrendingUp size={12} />
                    : <TrendingDown size={12} />}
                  <span>{d.pct}% vs vorige maand</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.75rem', color: 'var(--muted)' }}>
                  <Minus size={12} />
                  <span>Totaal</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── AI-SAMENVATTING ── */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <h3 style={{ ...cardTitleStyle, marginBottom: 0 }}>AI-samenvatting voor de klant</h3>
          <button
            onClick={aiWriteSummary}
            disabled={aiSumBusy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', border: '1px solid var(--accent1)', background: 'transparent', color: 'var(--accent1)', borderRadius: 'var(--radius-pill, 999px)', fontSize: '.76rem', fontWeight: 600, cursor: aiSumBusy ? 'wait' : 'pointer', opacity: aiSumBusy ? 0.6 : 1 }}
          >
            <Sparkles size={13} /> {aiSumBusy ? 'Bezig…' : 'Schrijf met AI'}
          </button>
        </div>
        <textarea
          value={aiSummary}
          onChange={e => setAiSummary(e.target.value)}
          rows={4}
          placeholder="Klik op 'Schrijf met AI' voor een korte samenvatting van deze maand op basis van de cijfers — je kunt 'm daarna aanpassen."
          style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '.88rem', lineHeight: 1.6, background: 'var(--bg)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* ── PLATFORM + STATUS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Platform breakdown */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Content per platform</h3>
          {PLATFORMS.map(pl => {
            const count = platformCounts[pl] || 0
            const pct = Math.round((count / maxPlatformCount) * 100)
            const totalPct = postsThisMonth.length > 0
              ? Math.round((count / postsThisMonth.length) * 100)
              : 0
            return (
              <div key={pl} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '11px' }}>
                <div style={{
                  width: '90px', fontSize: '.78rem', fontWeight: 500,
                  color: 'var(--text)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <PlatformIcon platform={pl} size={13} />
                  {PLATFORM_LABELS[pl]}
                </div>
                <div style={{
                  flex: 1, height: '8px', background: 'var(--bg)',
                  borderRadius: '4px', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: PLATFORM_COLORS[pl],
                    borderRadius: '4px',
                    minWidth: count > 0 ? '4px' : '0',
                    transition: 'width .4s ease',
                  }} />
                </div>
                <div style={{
                  width: '52px', flexShrink: 0,
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '.76rem',
                }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{count}</span>
                  <span style={{ color: 'var(--muted)' }}>{totalPct}%</span>
                </div>
              </div>
            )
          })}
          {postsThisMonth.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '.82rem', textAlign: 'center', padding: '16px 0' }}>
              Geen posts in deze maand
            </p>
          )}
        </div>

        {/* Status distribution */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Content status verdeling</h3>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = statusCounts[status] || 0
            const pct = Math.round((count / totalPostsAll) * 100)
            return (
              <div key={status} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{
                      width: '9px', height: '9px', borderRadius: '50%',
                      background: cfg.color, flexShrink: 0, display: 'inline-block',
                    }} />
                    <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '.7rem', fontWeight: 700,
                      padding: '2px 8px', borderRadius: '50px',
                      background: cfg.bg, color: cfg.color,
                    }}>{count}</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--muted)', minWidth: '30px', textAlign: 'right' }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div style={{ height: '5px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: cfg.color, borderRadius: '3px',
                    transition: 'width .4s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── HEATMAP + DONUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '20px' }}>

        {/* Content calendar heatmap */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ ...cardTitleStyle, marginBottom: 0 }}>Content kalender</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.72rem', color: 'var(--muted)' }}>
              <span>Minder</span>
              {[0, 0.2, 0.5, 0.8, 1].map((v, i) => (
                <div key={i} style={{
                  width: '12px', height: '12px', borderRadius: '3px',
                  background: v === 0 ? 'var(--bg)' : `rgba(26,63,228,${v * 0.85})`,
                  border: '1px solid var(--border)',
                }} />
              ))}
              <span>Meer</span>
            </div>
          </div>

          {/* Weekday header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{
                fontSize: '.68rem', color: 'var(--muted)', textAlign: 'center',
                fontWeight: 600, padding: '2px 0',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {calCells.map((day, idx) => {
              const count = day ? (heatmapCounts[day] || 0) : 0
              const isToday = day !== null
                && viewYear === now.getFullYear()
                && viewMonth === now.getMonth()
                && day === now.getDate()
              return (
                <div
                  key={idx}
                  title={day ? `${day} — ${count} post${count !== 1 ? 's' : ''}` : ''}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '4px',
                    background: day ? heatColor(count) : 'transparent',
                    border: isToday ? '2px solid var(--accent1)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.7rem', fontWeight: isToday ? 700 : 500,
                    color: count > 0 && count / maxHeatmap > 0.5 ? '#fff' : 'var(--text)',
                    cursor: day ? 'default' : 'default',
                  }}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>

        {/* Platform donut */}
        <div style={{ ...cardStyle, minWidth: '240px' }}>
          <h3 style={cardTitleStyle}>Platform verdeling</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: conicGradient,
              }} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: '68px', height: '68px', borderRadius: '50%',
                background: 'var(--card)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontWeight: 800, fontSize: '.95rem', lineHeight: 1,
                }}>
                  {posts.length}
                </span>
                <span style={{ fontSize: '.58rem', color: 'var(--muted)' }}>posts</span>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              {donutData.length > 0 ? donutData.map(d => (
                <div key={d.platform} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
                }}>
                  <span style={{
                    width: '9px', height: '9px', borderRadius: '50%',
                    background: d.color, flexShrink: 0, display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '.78rem', color: 'var(--text)', flex: 1 }}>
                    {PLATFORM_LABELS[d.platform] || d.platform}
                  </span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)' }}>
                    {Math.round((d.count / donutTotal) * 100)}%
                  </span>
                </div>
              )) : (
                <p style={{ fontSize: '.8rem', color: 'var(--muted)', textAlign: 'center' }}>
                  Geen data
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── WEEKLY ACTIVITY TABLE ── */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <h3 style={cardTitleStyle}>Weekactiviteit — {formatMonthLabel(viewYear, viewMonth)}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left', padding: '8px 12px',
                  color: 'var(--muted)', fontWeight: 600, fontSize: '.7rem',
                  textTransform: 'uppercase', letterSpacing: '.07em',
                  borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  Week
                </th>
                {WEEKDAYS.map(d => (
                  <th key={d} style={{
                    textAlign: 'center', padding: '8px 6px',
                    color: 'var(--muted)', fontWeight: 600, fontSize: '.7rem',
                    textTransform: 'uppercase', letterSpacing: '.07em',
                    borderBottom: '1px solid var(--border)',
                    width: '60px',
                  }}>
                    {d}
                  </th>
                ))}
                <th style={{
                  textAlign: 'right', padding: '8px 12px',
                  color: 'var(--muted)', fontWeight: 600, fontSize: '.7rem',
                  textTransform: 'uppercase', letterSpacing: '.07em',
                  borderBottom: '1px solid var(--border)',
                }}>
                  Totaal
                </th>
              </tr>
            </thead>
            <tbody>
              {weekRows.map((row, wi) => {
                const weekTotal = row.counts.reduce((a, b) => a + b, 0)
                return (
                  <tr key={wi} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{
                      padding: '10px 12px', color: 'var(--muted)',
                      fontSize: '.75rem', whiteSpace: 'nowrap',
                    }}>
                      {row.label}
                    </td>
                    {row.days.map((day, di) => {
                      const count = row.counts[di]
                      const isToday = day !== null
                        && viewYear === now.getFullYear()
                        && viewMonth === now.getMonth()
                        && day === now.getDate()
                      return (
                        <td key={di} style={{ padding: '6px 4px', textAlign: 'center' }}>
                          {day !== null ? (
                            <div style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '36px', height: '36px', borderRadius: '8px',
                              background: count > 0 ? 'rgba(26,63,228,.1)' : 'transparent',
                              border: isToday ? '2px solid var(--accent1)' : '1px solid transparent',
                              flexDirection: 'column',
                              gap: '1px',
                            }}>
                              <span style={{
                                fontSize: '.65rem', color: 'var(--muted)', lineHeight: 1,
                              }}>
                                {day}
                              </span>
                              {count > 0 && (
                                <span style={{
                                  fontSize: '.7rem', fontWeight: 700,
                                  color: 'var(--accent1)', lineHeight: 1,
                                }}>
                                  {count}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </td>
                      )
                    })}
                    <td style={{
                      padding: '10px 12px', textAlign: 'right',
                      fontWeight: weekTotal > 0 ? 700 : 400,
                      color: weekTotal > 0 ? 'var(--text)' : 'var(--muted)',
                      fontSize: '.82rem',
                    }}>
                      {weekTotal > 0 ? weekTotal : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PROJECT STATUS DONUT ── */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <h3 style={cardTitleStyle}>Project status overzicht</h3>
        {(() => {
          const projectStatusData = Object.entries(PROJECT_STATUS_CONFIG)
            .map(([status, cfg]) => ({
              status,
              label: cfg.label,
              color: cfg.color,
              count: (projectsByStatus[status] || []).length,
            }))
            .filter(d => d.count > 0)

          const projTotal = projectStatusData.reduce((s, d) => s + d.count, 0) || 1
          let pAngle = 0
          const projDonutSegs = projectStatusData.map(d => {
            const deg = (d.count / projTotal) * 360
            const seg = { ...d, start: pAngle, deg }
            pAngle += deg
            return seg
          })
          const projConic = projDonutSegs.length
            ? `conic-gradient(${projDonutSegs.map(s => `${s.color} ${s.start}deg ${s.start + s.deg}deg`).join(', ')})`
            : 'conic-gradient(var(--border) 0deg 360deg)'

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }}>
              {/* Donut */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '140px', height: '140px', borderRadius: '50%',
                  background: projConic,
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: '76px', height: '76px', borderRadius: '50%',
                  background: 'var(--card)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-syne), sans-serif',
                    fontWeight: 800, fontSize: '1.1rem', lineHeight: 1,
                  }}>
                    {projects.length}
                  </span>
                  <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>projecten</span>
                </div>
              </div>

              {/* Legend grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '10px', flex: 1,
              }}>
                {projectStatusData.map(d => (
                  <div key={d.status} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px',
                    background: 'var(--bg)', borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: d.color, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text)' }}>
                        {d.label}
                      </div>
                      <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '1px' }}>
                        {d.count} project{d.count !== 1 ? 'en' : ''} · {Math.round((d.count / projTotal) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
                {projectStatusData.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Geen projecten gevonden</p>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── PROJECTS TABLE ── */}
      {Object.keys(projectsByStatus).length > 0 && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Projecten per status</h3>
          {Object.entries(PROJECT_STATUS_CONFIG).map(([status, cfg]) => {
            const group = projectsByStatus[status]
            if (!group || group.length === 0) return null
            return (
              <div key={status} style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: cfg.color, flexShrink: 0, display: 'inline-block',
                  }} />
                  <span style={{
                    fontSize: '.75rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.06em', color: cfg.color,
                  }}>
                    {cfg.label} ({group.length})
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr 1fr 1fr',
                  gap: '12px',
                  padding: '5px 12px',
                  fontSize: '.68rem', color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '.07em',
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
                    padding: '9px 12px',
                    borderRadius: '6px',
                    fontSize: '.82rem',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {project.title || 'Zonder titel'}
                    </div>
                    <div style={{
                      color: 'var(--muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
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
      )}
    </div>
  )
}
