'use client'

import React, { useState, useMemo, CSSProperties } from 'react'
import { Calendar, AlertTriangle, Video, X } from 'lucide-react'
import { PlatformIcon, PLATFORM_COLORS as IMPORTED_PLATFORM_COLORS } from '@/components/ui/PlatformIcon'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Post {
  id: string
  title: string
  platform: string
  scheduled_at: string
  status: string
  client_id: string | null
  clients?: { company_name: string } | null
}

interface Project {
  id: string
  title: string
  status: string
  due_date: string
  client_id: string | null
  clients?: { company_name: string } | null
}

interface Meeting {
  id: string
  title: string
  meeting_date: string
  status: string
  client_id: string | null
  clients?: { company_name: string } | null
}

interface Props {
  posts: Post[]
  projects: Project[]
  meetings: Meeting[]
  isAdmin: boolean
  clientId: string
}

type FilterType = 'all' | 'content' | 'deadlines' | 'meetings'
type ViewType = 'month' | 'week'

interface CalEvent {
  id: string
  type: 'content' | 'deadline' | 'meeting'
  title: string
  date: Date
  color: string
  client: string
  status: string
  platform?: string
  icon: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_COLORS = IMPORTED_PLATFORM_COLORS

function getDeadlineColor(dueDate: Date): string {
  const now = new Date()
  const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 3) return '#e53935'
  if (diff <= 7) return '#ff7a30'
  return '#9c27b0'
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

const NL_DAYS_SHORT = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
const NL_MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function formatDateChip(date: Date): { day: string; month: string } {
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: NL_MONTHS[date.getMonth()].slice(0, 3),
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PlanningClient({ posts, projects, meetings, isAdmin, clientId }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewMonth, setViewMonth] = useState<number>(today.getMonth())
  const [viewYear, setViewYear] = useState<number>(today.getFullYear())
  const [view, setView] = useState<ViewType>('month')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // ---------------------------------------------------------------------------
  // Build events
  // ---------------------------------------------------------------------------
  const allEvents = useMemo<CalEvent[]>(() => {
    const evs: CalEvent[] = []

    for (const p of posts) {
      if (!p.scheduled_at) continue
      const d = new Date(p.scheduled_at)
      const platform = (p.platform || '').toLowerCase()
      evs.push({
        id: `post-${p.id}`,
        type: 'content',
        title: p.title,
        date: d,
        color: PLATFORM_COLORS[platform] || '#888',
        client: p.clients?.company_name || '',
        status: p.status || '',
        platform,
        icon: '',
      })
    }

    for (const pr of projects) {
      if (!pr.due_date) continue
      const d = new Date(pr.due_date)
      evs.push({
        id: `proj-${pr.id}`,
        type: 'deadline',
        title: pr.title,
        date: d,
        color: getDeadlineColor(d),
        client: pr.clients?.company_name || '',
        status: pr.status || '',
        icon: '',
      })
    }

    for (const m of meetings) {
      if (!m.meeting_date) continue
      const d = new Date(m.meeting_date)
      evs.push({
        id: `meet-${m.id}`,
        type: 'meeting',
        title: m.title,
        date: d,
        color: '#00b89c',
        client: m.clients?.company_name || '',
        status: m.status || '',
        icon: '',
      })
    }

    return evs
  }, [posts, projects, meetings])

  const filteredEvents = useMemo<CalEvent[]>(() => {
    if (filter === 'all') return allEvents
    if (filter === 'content') return allEvents.filter((e) => e.type === 'content')
    if (filter === 'deadlines') return allEvents.filter((e) => e.type === 'deadline')
    if (filter === 'meetings') return allEvents.filter((e) => e.type === 'meeting')
    return allEvents
  }, [allEvents, filter])

  // ---------------------------------------------------------------------------
  // Calendar grid helpers
  // ---------------------------------------------------------------------------
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startDayOfWeek = firstDayOfMonth.getDay() // 0=Sun

  const calendarCells: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  function getEventsOnDay(day: number): CalEvent[] {
    const target = new Date(viewYear, viewMonth, day)
    return filteredEvents.filter((e) => isSameDay(e.date, target))
  }

  const monthEvents = useMemo(() => {
    return filteredEvents.filter(
      (e) => e.date.getFullYear() === viewYear && e.date.getMonth() === viewMonth
    )
  }, [filteredEvents, viewYear, viewMonth])

  // ---------------------------------------------------------------------------
  // Week view helpers
  // ---------------------------------------------------------------------------
  const weekStart = useMemo(() => {
    const ref = selectedDay
      ? new Date(viewYear, viewMonth, selectedDay)
      : new Date(viewYear, viewMonth, 1)
    return startOfWeek(ref)
  }, [viewYear, viewMonth, selectedDay])

  const weekDays: Date[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }, [weekStart])

  function getEventsOnDate(date: Date): CalEvent[] {
    return filteredEvents.filter((e) => isSameDay(e.date, date))
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }
  function goToday() {
    setViewMonth(today.getMonth())
    setViewYear(today.getFullYear())
    setSelectedDay(today.getDate())
  }

  // ---------------------------------------------------------------------------
  // Upcoming panel data
  // ---------------------------------------------------------------------------
  const upcomingEvents = useMemo<CalEvent[]>(() => {
    const todayTime = today.getTime()
    return allEvents
      .filter((e) => e.date.getTime() >= todayTime)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10)
  }, [allEvents, today])

  function getUpcomingGroup(date: Date): 'today' | 'week' | 'later' {
    const t = today.getTime()
    const d = new Date(date); d.setHours(0, 0, 0, 0)
    const diff = (d.getTime() - t) / (1000 * 60 * 60 * 24)
    if (diff === 0) return 'today'
    if (diff <= 7) return 'week'
    return 'later'
  }

  // ---------------------------------------------------------------------------
  // Selected day events
  // ---------------------------------------------------------------------------
  const selectedDayEvents = useMemo<CalEvent[]>(() => {
    if (selectedDay === null) return []
    return getEventsOnDay(selectedDay)
  }, [selectedDay, filteredEvents, viewYear, viewMonth])

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------
  const viewBtnStyle = (active: boolean): CSSProperties => ({
    background: active ? 'var(--accent1)' : 'none',
    color: active ? '#fff' : 'var(--muted)',
    border: 'none',
    cursor: 'pointer',
    padding: '0.4rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: 'var(--font-syne), sans-serif',
    transition: 'all 0.15s',
  })
  const filterPillStyle = (active: boolean): CSSProperties => ({
    background: active ? 'var(--accent1)' : 'var(--card)',
    color: active ? '#fff' : 'var(--muted)',
    border: `1px solid ${active ? 'var(--accent1)' : 'var(--border)'}`,
    borderRadius: '999px',
    padding: '0.35rem 0.85rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-syne), sans-serif',
    transition: 'all 0.15s',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s: Record<string, any> = {
    wrapper: {
      fontFamily: 'var(--font-syne), sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1.5rem',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '1rem',
    },
    titleBlock: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: 'var(--text)',
      margin: 0,
    },
    subtitle: {
      fontSize: '0.875rem',
      color: 'var(--muted)',
      margin: 0,
    },
    controls: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '0.75rem',
    },
    navGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '0.25rem',
    },
    navBtn: {
      background: 'none',
      border: 'none',
      color: 'var(--text)',
      cursor: 'pointer',
      padding: '0.35rem 0.6rem',
      borderRadius: 'var(--radius-sm)',
      fontSize: '0.85rem',
      fontFamily: 'var(--font-syne), sans-serif',
      transition: 'background 0.15s',
    },
    monthLabel: {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: 'var(--text)',
      minWidth: '140px',
      textAlign: 'center',
    },
    viewToggle: {
      display: 'flex',
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    },
    filterRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 280px',
      gap: '1.5rem',
      alignItems: 'start',
    },
    calendarCard: {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    },
    weekHeaderRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
    },
    weekHeaderCell: {
      padding: '0.6rem 0',
      textAlign: 'center',
      fontSize: '0.72rem',
      fontWeight: 700,
      color: 'var(--muted)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    monthGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
    },
    dayCell: (isToday: boolean, isWeekend: boolean, isSelected: boolean, isOtherMonth: boolean): CSSProperties => ({
      minHeight: '120px',
      padding: '0.5rem',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: isSelected
        ? 'color-mix(in srgb, var(--accent1) 8%, var(--card))'
        : isWeekend
          ? 'color-mix(in srgb, var(--bg) 60%, var(--card))'
          : 'var(--card)',
      cursor: isOtherMonth ? 'default' : 'pointer',
      transition: 'background 0.15s',
      position: 'relative',
    }),
    dayNumber: (isToday: boolean): CSSProperties => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      borderRadius: '50%',
      fontSize: '0.8rem',
      fontWeight: isToday ? 700 : 500,
      background: isToday ? 'var(--accent1)' : 'transparent',
      color: isToday ? '#fff' : 'var(--text)',
      marginBottom: '0.35rem',
    }),
    eventPill: (color: string): CSSProperties => ({
      display: 'block',
      background: `${color}22`,
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: '4px',
      padding: '1px 5px',
      fontSize: '0.65rem',
      fontWeight: 600,
      marginBottom: '2px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      cursor: 'pointer',
      lineHeight: 1.5,
    }),
    morePill: {
      fontSize: '0.62rem',
      color: 'var(--muted)',
      fontWeight: 500,
      marginTop: '2px',
    },
    emptyCell: {
      background: 'color-mix(in srgb, var(--bg) 40%, var(--card))',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      minHeight: '120px',
    },
    // Week view
    weekViewGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
    },
    weekDayCard: (isToday: boolean): CSSProperties => ({
      minHeight: '200px',
      padding: '0.75rem 0.5rem',
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: isToday ? 'color-mix(in srgb, var(--accent1) 6%, var(--card))' : 'var(--card)',
    }),
    weekDayHeader: {
      marginBottom: '0.5rem',
    },
    weekDayName: {
      fontSize: '0.7rem',
      fontWeight: 700,
      color: 'var(--muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    weekDayNum: (isToday: boolean): CSSProperties => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      fontSize: '0.9rem',
      fontWeight: 700,
      background: isToday ? 'var(--accent1)' : 'transparent',
      color: isToday ? '#fff' : 'var(--text)',
    }),
    // Day detail panel
    dayPanel: {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      marginTop: '1rem',
    },
    dayPanelTitle: {
      fontSize: '1rem',
      fontWeight: 700,
      color: 'var(--text)',
      marginBottom: '1rem',
    },
    dayEventRow: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.6rem 0',
      borderBottom: '1px solid var(--border)',
    },
    dayEventIcon: (color: string): CSSProperties => ({
      width: '32px',
      height: '32px',
      borderRadius: 'var(--radius-sm)',
      background: `${color}22`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9rem',
      flexShrink: 0,
    }),
    dayEventInfo: {
      flex: 1,
      minWidth: 0,
    },
    dayEventTitle: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: '0.15rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    dayEventMeta: {
      fontSize: '0.75rem',
      color: 'var(--muted)',
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap',
    },
    statusBadge: (color: string): CSSProperties => ({
      fontSize: '0.65rem',
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: '999px',
      background: `${color}22`,
      color: color,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }),
    // Upcoming panel
    upcomingCard: {
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      position: 'sticky',
      top: '1.5rem',
    },
    upcomingTitle: {
      fontSize: '0.95rem',
      fontWeight: 700,
      color: 'var(--text)',
      marginBottom: '1rem',
    },
    groupLabel: {
      fontSize: '0.7rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--muted)',
      margin: '0.75rem 0 0.4rem',
    },
    upcomingRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      padding: '0.5rem 0',
      borderBottom: '1px solid var(--border)',
    },
    dateChip: (color: string): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '40px',
      borderRadius: 'var(--radius-sm)',
      background: `${color}18`,
      flexShrink: 0,
    }),
    dateChipDay: (color: string): CSSProperties => ({
      fontSize: '0.9rem',
      fontWeight: 700,
      color: color,
      lineHeight: 1,
    }),
    dateChipMonth: (color: string): CSSProperties => ({
      fontSize: '0.58rem',
      fontWeight: 600,
      color: color,
      textTransform: 'uppercase',
      lineHeight: 1.2,
    }),
    upcomingInfo: {
      flex: 1,
      minWidth: 0,
    },
    upcomingEventTitle: {
      fontSize: '0.8rem',
      fontWeight: 600,
      color: 'var(--text)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    upcomingEventClient: {
      fontSize: '0.7rem',
      color: 'var(--muted)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    colorDot: (color: string): CSSProperties => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }),
    emptyState: {
      textAlign: 'center',
      padding: '3rem 1rem',
      color: 'var(--muted)',
    },
    emptyStateEmoji: {
      fontSize: '2.5rem',
      marginBottom: '0.75rem',
    },
    emptyStateText: {
      fontSize: '0.9rem',
    },
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderEventPill(ev: CalEvent, idx: number) {
    return (
      <span key={ev.id} style={s.eventPill(ev.color) as CSSProperties}>
        {ev.title}
      </span>
    )
  }

  function renderDayPanel() {
    if (selectedDay === null) return null
    const selectedDate = new Date(viewYear, viewMonth, selectedDay)
    const label = `${selectedDay} ${NL_MONTHS[viewMonth]} ${viewYear}`
    return (
      <div style={s.dayPanel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={s.dayPanelTitle as CSSProperties}>
            {label}
            {selectedDayEvents.length === 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)', marginLeft: '0.5rem' }}>
                Geen evenementen
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedDay(null)}
            style={{ ...s.navBtn, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as CSSProperties}
          >
            <X size={16} />
          </button>
        </div>
        {selectedDayEvents.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Geen geplande evenementen op deze dag.</div>
        ) : (
          selectedDayEvents.map((ev) => (
            <div key={ev.id} style={s.dayEventRow as CSSProperties}>
              <div style={s.dayEventIcon(ev.color) as CSSProperties}>
                {ev.type === 'deadline' ? <AlertTriangle size={15} style={{ color: ev.color }} /> : ev.type === 'meeting' ? <Calendar size={15} style={{ color: ev.color }} /> : <Video size={15} style={{ color: ev.color }} />}
              </div>
              <div style={s.dayEventInfo as CSSProperties}>
                <div style={s.dayEventTitle as CSSProperties}>{ev.title}</div>
                <div style={s.dayEventMeta as CSSProperties}>
                  {ev.client && <span>{ev.client}</span>}
                  <span>{formatTime(ev.date)}</span>
                  {ev.platform && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', textTransform: 'capitalize' }}>
                      <PlatformIcon platform={ev.platform} size={11} /> {ev.platform}
                    </span>
                  )}
                </div>
              </div>
              {ev.status && (
                <span style={s.statusBadge(ev.color) as CSSProperties}>{ev.status.replace(/_/g, ' ')}</span>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  function renderMonthView() {
    return (
      <>
        <div style={s.weekHeaderRow as CSSProperties}>
          {NL_DAYS_SHORT.map((d) => (
            <div key={d} style={s.weekHeaderCell as CSSProperties}>{d}</div>
          ))}
        </div>
        <div style={s.monthGrid as CSSProperties}>
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} style={s.emptyCell as CSSProperties} />
            }
            const date = new Date(viewYear, viewMonth, day)
            const isToday = isSameDay(date, today)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            const isSelected = selectedDay === day
            const dayEvs = getEventsOnDay(day)
            const visibleEvs = dayEvs.slice(0, 3)
            const extraCount = dayEvs.length - visibleEvs.length

            return (
              <div
                key={day}
                style={s.dayCell(isToday, isWeekend, isSelected, false) as CSSProperties}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              >
                <div style={s.dayNumber(isToday) as CSSProperties}>{day}</div>
                {visibleEvs.map((ev, i) => renderEventPill(ev, i))}
                {extraCount > 0 && (
                  <div style={s.morePill as CSSProperties}>+{extraCount} meer</div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function renderWeekView() {
    return (
      <>
        <div style={s.weekHeaderRow as CSSProperties}>
          {weekDays.map((d) => (
            <div key={d.toISOString()} style={s.weekHeaderCell as CSSProperties}>
              {NL_DAYS_SHORT[d.getDay()]}
            </div>
          ))}
        </div>
        <div style={s.weekViewGrid as CSSProperties}>
          {weekDays.map((d) => {
            const isToday = isSameDay(d, today)
            const dayEvs = getEventsOnDate(d)
            return (
              <div key={d.toISOString()} style={s.weekDayCard(isToday) as CSSProperties}>
                <div style={s.weekDayHeader as CSSProperties}>
                  <div style={s.weekDayName as CSSProperties}>{NL_DAYS_SHORT[d.getDay()]}</div>
                  <div style={s.weekDayNum(isToday) as CSSProperties}>{d.getDate()}</div>
                </div>
                {dayEvs.length === 0 ? (
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>—</div>
                ) : (
                  dayEvs.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        background: `${ev.color}20`,
                        color: ev.color,
                        border: `1px solid ${ev.color}40`,
                        borderRadius: '5px',
                        padding: '4px 6px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        marginBottom: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      } as CSSProperties}
                    >
                      {ev.icon} {ev.title}
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function renderUpcomingPanel() {
    const grouped: Record<string, CalEvent[]> = { today: [], week: [], later: [] }
    for (const ev of upcomingEvents) {
      grouped[getUpcomingGroup(ev.date)].push(ev)
    }

    const sections: { key: string; label: string }[] = [
      { key: 'today', label: 'Vandaag' },
      { key: 'week', label: 'Deze week' },
      { key: 'later', label: 'Later' },
    ]

    return (
      <div style={s.upcomingCard as CSSProperties}>
        <div style={s.upcomingTitle as CSSProperties}>Aankomend</div>
        {upcomingEvents.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Geen aankomende evenementen.</div>
        ) : (
          sections.map(({ key, label }) => {
            const evs = grouped[key]
            if (evs.length === 0) return null
            return (
              <div key={key}>
                <div style={s.groupLabel as CSSProperties}>{label}</div>
                {evs.map((ev) => {
                  const chip = formatDateChip(ev.date)
                  return (
                    <div key={ev.id} style={s.upcomingRow as CSSProperties}>
                      <div style={s.dateChip(ev.color) as CSSProperties}>
                        <span style={s.dateChipDay(ev.color) as CSSProperties}>{chip.day}</span>
                        <span style={s.dateChipMonth(ev.color) as CSSProperties}>{chip.month}</span>
                      </div>
                      <div style={s.upcomingInfo as CSSProperties}>
                        <div style={s.upcomingEventTitle as CSSProperties}>
                          {ev.type === 'content' && ev.platform
                            ? <PlatformIcon platform={ev.platform} size={12} />
                            : null}{' '}
                          {ev.title}
                        </div>
                        {ev.client && (
                          <div style={s.upcomingEventClient as CSSProperties}>{ev.client}</div>
                        )}
                      </div>
                      <div style={s.colorDot(ev.color) as CSSProperties} />
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="animate-fade-up" style={s.wrapper as CSSProperties}>
      {/* Header */}
      <div style={s.header as CSSProperties}>
        <div style={s.titleBlock as CSSProperties}>
          <h1 style={s.title as CSSProperties}>Planning Kalender</h1>
          <p style={s.subtitle as CSSProperties}>
            {allEvents.length} evenement{allEvents.length !== 1 ? 'en' : ''} in totaal
          </p>
        </div>

        <div style={s.controls as CSSProperties}>
          {/* Month navigation */}
          <div style={s.navGroup as CSSProperties}>
            <button style={s.navBtn as CSSProperties} onClick={prevMonth} title="Vorige maand">‹</button>
            <span style={s.monthLabel as CSSProperties}>
              {NL_MONTHS[viewMonth]} {viewYear}
            </span>
            <button style={s.navBtn as CSSProperties} onClick={nextMonth} title="Volgende maand">›</button>
          </div>

          <button
            style={{
              ...s.navBtn,
              background: 'var(--card)',
              border: '1px solid var(--border)',
            } as CSSProperties}
            onClick={goToday}
          >
            Vandaag
          </button>

          {/* View toggle */}
          <div style={s.viewToggle as CSSProperties}>
            <button
              style={viewBtnStyle(view === 'month')}
              onClick={() => setView('month')}
            >
              Maand
            </button>
            <button
              style={viewBtnStyle(view === 'week')}
              onClick={() => setView('week')}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={s.filterRow as CSSProperties}>
        {(
          [
            { key: 'all', label: 'Alle' },
            { key: 'content', label: 'Content' },
            { key: 'deadlines', label: 'Deadlines' },
            { key: 'meetings', label: 'Vergaderingen' },
          ] as { key: FilterType; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            style={filterPillStyle(filter === key)}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main layout: calendar + upcoming sidebar */}
      <div style={s.mainGrid as CSSProperties}>
        <div>
          {/* Calendar card */}
          <div style={s.calendarCard as CSSProperties}>
            {view === 'month' ? renderMonthView() : renderWeekView()}
          </div>

          {/* Empty state for current month */}
          {view === 'month' && monthEvents.length === 0 && (
            <div style={s.emptyState as CSSProperties}>
              <div style={s.emptyStateEmoji as CSSProperties}><Calendar size={36} style={{ opacity: 0.3 }} /></div>
              <div style={s.emptyStateText as CSSProperties}>
                Geen evenementen in {NL_MONTHS[viewMonth]} {viewYear}
              </div>
            </div>
          )}

          {/* Day detail panel */}
          {selectedDay !== null && renderDayPanel()}
        </div>

        {/* Upcoming panel */}
        {renderUpcomingPanel()}
      </div>
    </div>
  )
}
