'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Clock, Play, Square, Download, ChevronDown, Euro, X, Edit2, Trash2, Plus, Check, Filter,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientRow { id: string; company_name: string }
interface ProjectRow { id: string; title: string; client_id: string | null }

interface TimeEntry {
  id: string
  agency_id: string
  user_id: string
  client_id: string | null
  project_id: string | null
  description: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  billable: boolean
  hourly_rate: number
  tags: string[]
  created_at: string
  clients?: { id: string; company_name: string } | null
  projects?: { id: string; title: string } | null
}

interface Props {
  initialEntries: TimeEntry[]
  clients: ClientRow[]
  projects: ProjectRow[]
  userId: string
  agencyId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLIENT_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]
function getClientColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length]
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}u ${m}m` : `${m}m`
}

function fmtClock(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function fmtTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function groupByDay(entries: TimeEntry[]): { date: string; entries: TimeEntry[] }[] {
  const map: Record<string, TimeEntry[]> = {}
  for (const e of entries) {
    const day = e.start_time.slice(0, 10)
    if (!map[day]) map[day] = []
    map[day].push(e)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => ({ date, entries }))
}

function dayTotalMinutes(entries: TimeEntry[]): number {
  return entries.reduce((acc, e) => acc + (e.duration_minutes || 0), 0)
}

function dayBillableAmount(entries: TimeEntry[]): number {
  return entries.reduce((acc, e) => acc + (e.billable ? ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0) : 0), 0)
}

function exportCSV(entries: TimeEntry[]) {
  const rows = [
    ['Datum', 'Beschrijving', 'Klant', 'Project', 'Start', 'Einde', 'Minuten', 'Uren', 'Factureerbaar', 'Tarief', 'Bedrag'],
    ...entries.map(e => [
      new Date(e.start_time).toLocaleDateString('nl-NL'),
      e.description,
      e.clients?.company_name || '',
      e.projects?.title || '',
      new Date(e.start_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      e.end_time ? new Date(e.end_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '',
      e.duration_minutes || '',
      e.duration_minutes ? (e.duration_minutes / 60).toFixed(2) : '',
      e.billable ? 'Ja' : 'Nee',
      e.hourly_rate || 0,
      e.duration_minutes && e.hourly_rate ? ((e.duration_minutes / 60) * e.hourly_rate).toFixed(2) : '0',
    ])
  ]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'tijdregistratie.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ─── Small reusable select ────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecteer...',
  style,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const label = options.find(o => o.value === value)?.label || placeholder

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '8px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '.83rem',
          color: value ? 'var(--text)' : 'var(--muted)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>{label}</span>
        <ChevronDown size={13} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,.1)',
          minWidth: '100%',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 300,
          padding: '4px',
        }}>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              style={{
                width: '100%',
                display: 'block',
                padding: '7px 10px',
                background: value === o.value ? 'rgba(26,63,228,.06)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '.82rem',
                color: value === o.value ? 'var(--accent1)' : 'var(--text)',
                fontWeight: value === o.value ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TijdClient({ initialEntries, clients, projects, userId, agencyId }: Props) {
  const supabase = createClient()

  // ── Timer state ──
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── New entry form ──
  const [desc, setDesc] = useState('')
  const [timerClientId, setTimerClientId] = useState('')
  const [timerProjectId, setTimerProjectId] = useState('')
  const [billable, setBillable] = useState(true)
  const [hourlyRate, setHourlyRate] = useState('0')

  // ── Entries ──
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries)

  // ── Filters ──
  const [tab, setTab] = useState<'registraties' | 'rapportage'>('registraties')
  const [dateFilter, setDateFilter] = useState<'vandaag' | 'week' | 'maand' | 'alles'>('maand')
  const [filterClientId, setFilterClientId] = useState('')
  const [filterProjectId, setFilterProjectId] = useState('')
  const [filterBillable, setFilterBillable] = useState<'alle' | 'ja' | 'nee'>('alle')
  const [searchDesc, setSearchDesc] = useState('')

  // ── Edit state ──
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editClientId, setEditClientId] = useState('')
  const [editProjectId, setEditProjectId] = useState('')
  const [editBillable, setEditBillable] = useState(true)
  const [editRate, setEditRate] = useState('0')

  // ── Timer logic ──
  function startTimer() {
    const now = new Date()
    setStartedAt(now)
    setElapsed(0)
    setRunning(true)
    timerRef.current = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)
  }

  async function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)

    if (!startedAt) return
    const end = new Date()
    const durationMinutes = Math.round((end.getTime() - startedAt.getTime()) / 60000)

    const { data, error } = await supabase.from('time_entries').insert({
      agency_id: agencyId,
      user_id: userId,
      client_id: timerClientId || null,
      project_id: timerProjectId || null,
      description: desc || 'Geen beschrijving',
      start_time: startedAt.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: durationMinutes,
      billable,
      hourly_rate: parseFloat(hourlyRate) || 0,
      tags: [],
    }).select('*, clients(id, company_name), projects(id, title)').single()

    if (!error && data) {
      setEntries(prev => [data as TimeEntry, ...prev])
    }

    setElapsed(0)
    setDesc('')
    setTimerClientId('')
    setTimerProjectId('')
    setBillable(true)
    setHourlyRate('0')
    setStartedAt(null)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // ── Filtered entries ──
  const filteredEntries = entries.filter(e => {
    const now = new Date()
    const start = new Date(e.start_time)

    if (dateFilter === 'vandaag') {
      if (start.toDateString() !== now.toDateString()) return false
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
      if (start < weekAgo) return false
    } else if (dateFilter === 'maand') {
      const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30)
      if (start < monthAgo) return false
    }

    if (filterClientId && e.client_id !== filterClientId) return false
    if (filterProjectId && e.project_id !== filterProjectId) return false
    if (filterBillable === 'ja' && !e.billable) return false
    if (filterBillable === 'nee' && e.billable) return false
    if (searchDesc && !e.description.toLowerCase().includes(searchDesc.toLowerCase())) return false

    return true
  })

  const grouped = groupByDay(filteredEntries)

  // ── Delete entry ──
  async function deleteEntry(id: string) {
    await supabase.from('time_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // ── Edit entry ──
  function startEdit(entry: TimeEntry) {
    setEditingId(entry.id)
    setEditDesc(entry.description)
    setEditClientId(entry.client_id || '')
    setEditProjectId(entry.project_id || '')
    setEditBillable(entry.billable)
    setEditRate(String(entry.hourly_rate || 0))
  }

  async function saveEdit(id: string) {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        description: editDesc,
        client_id: editClientId || null,
        project_id: editProjectId || null,
        billable: editBillable,
        hourly_rate: parseFloat(editRate) || 0,
      })
      .eq('id', id)
      .select('*, clients(id, company_name), projects(id, title)')
      .single()

    if (!error && data) {
      setEntries(prev => prev.map(e => e.id === id ? data as TimeEntry : e))
    }
    setEditingId(null)
  }

  // ── Project options for timer / edit ──
  const timerProjectOptions = [
    { value: '', label: 'Geen project' },
    ...projects
      .filter(p => !timerClientId || p.client_id === timerClientId)
      .map(p => ({ value: p.id, label: p.title }))
  ]

  const editProjectOptions = [
    { value: '', label: 'Geen project' },
    ...projects
      .filter(p => !editClientId || p.client_id === editClientId)
      .map(p => ({ value: p.id, label: p.title }))
  ]

  const clientOptions = [
    { value: '', label: 'Alle klanten' },
    ...clients.map(c => ({ value: c.id, label: c.company_name }))
  ]

  const projectOptions = [
    { value: '', label: 'Alle projecten' },
    ...projects
      .filter(p => !filterClientId || p.client_id === filterClientId)
      .map(p => ({ value: p.id, label: p.title }))
  ]

  // ── KPI totals for rapportage ──
  const totalMinutes = filteredEntries.reduce((a, e) => a + (e.duration_minutes || 0), 0)
  const billableMinutes = filteredEntries.filter(e => e.billable).reduce((a, e) => a + (e.duration_minutes || 0), 0)
  const totalRevenue = filteredEntries.reduce((a, e) => a + (e.billable ? ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0) : 0), 0)
  const avgRate = billableMinutes > 0
    ? totalRevenue / (billableMinutes / 60)
    : 0

  // ── By client (rapportage) ──
  const byClient: Record<string, { name: string; minutes: number; billable: number; amount: number }> = {}
  filteredEntries.forEach(e => {
    const key = e.client_id || '_none'
    const name = e.clients?.company_name || 'Geen klant'
    if (!byClient[key]) byClient[key] = { name, minutes: 0, billable: 0, amount: 0 }
    byClient[key].minutes += e.duration_minutes || 0
    if (e.billable) {
      byClient[key].billable += e.duration_minutes || 0
      byClient[key].amount += ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0)
    }
  })

  // ── By project (rapportage) ──
  const byProject: Record<string, { name: string; client: string; minutes: number; amount: number }> = {}
  filteredEntries.forEach(e => {
    const key = e.project_id || '_none'
    const name = e.projects?.title || 'Geen project'
    const client = e.clients?.company_name || ''
    if (!byProject[key]) byProject[key] = { name, client, minutes: 0, amount: 0 }
    byProject[key].minutes += e.duration_minutes || 0
    if (e.billable) byProject[key].amount += ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0)
  })

  // ── Bar chart data (hours per day) ──
  const dayMap: Record<string, number> = {}
  filteredEntries.forEach(e => {
    const day = e.start_time.slice(0, 10)
    dayMap[day] = (dayMap[day] || 0) + (e.duration_minutes || 0)
  })
  const chartDays = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
  const maxMinutes = Math.max(...chartDays.map(([, m]) => m), 1)

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* ── TIMER SECTION ── */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Clock size={20} color="var(--accent1)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
            Tijd registreren
          </span>
        </div>

        {/* Timer display */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontSize: '3.5rem',
            fontWeight: 800,
            color: running ? 'var(--accent1)' : 'var(--text)',
            letterSpacing: '-2px',
            transition: 'color .3s',
          }}>
            {fmtClock(elapsed)}
          </div>
          {running && (
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '4px' }}>
              Gestart om {startedAt ? fmtTime(startedAt.toISOString()) : '—'}
            </div>
          )}
        </div>

        {/* Form row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px auto auto auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Beschrijving</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Wat ben je aan het doen?"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '.83rem',
                color: 'var(--text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Klant</label>
            <Select
              value={timerClientId}
              onChange={v => { setTimerClientId(v); setTimerProjectId('') }}
              options={[{ value: '', label: 'Geen klant' }, ...clients.map(c => ({ value: c.id, label: c.company_name }))]}
              placeholder="Geen klant"
            />
          </div>

          <div>
            <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Project</label>
            <Select
              value={timerProjectId}
              onChange={setTimerProjectId}
              options={timerProjectOptions}
              placeholder="Geen project"
            />
          </div>

          <div>
            <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>€/uur</label>
            <input
              type="number"
              min="0"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              style={{
                width: '80px',
                padding: '8px 10px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '.83rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>

          {/* Billable toggle */}
          <div style={{ paddingBottom: '2px' }}>
            <label style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Factureerbaar</label>
            <button
              type="button"
              onClick={() => setBillable(v => !v)}
              title={billable ? 'Factureerbaar' : 'Niet factureerbaar'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: `1.5px solid ${billable ? '#10b981' : 'var(--border)'}`,
                background: billable ? 'rgba(16,185,129,.1)' : 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: billable ? '#10b981' : 'var(--muted)',
                transition: 'all .15s',
              }}
            >
              <Euro size={16} />
            </button>
          </div>

          {/* Start/Stop */}
          <div style={{ paddingBottom: '2px' }}>
            <label style={{ fontSize: '.75rem', color: 'transparent', display: 'block', marginBottom: '4px' }}>_</label>
            <button
              type="button"
              onClick={running ? stopTimer : startTimer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                background: running ? '#ef4444' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background .2s',
                whiteSpace: 'nowrap',
              }}
            >
              {running ? <><Square size={15} /> Stop</> : <><Play size={15} /> Start</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {(['registraties', 'rapportage'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px',
              borderRadius: '50px',
              border: 'none',
              background: tab === t ? 'var(--accent1)' : 'var(--card)',
              color: tab === t ? '#fff' : 'var(--muted)',
              fontWeight: tab === t ? 700 : 400,
              fontSize: '.85rem',
              cursor: 'pointer',
              transition: 'all .15s',
              textTransform: 'capitalize',
            }}
          >
            {t === 'registraties' ? 'Registraties' : 'Rapportage'}
          </button>
        ))}
      </div>

      {/* ── FILTERS BAR ── */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <Filter size={15} color="var(--muted)" />

        {/* Date range */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['vandaag', 'week', 'maand', 'alles'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              style={{
                padding: '5px 12px',
                borderRadius: '50px',
                border: `1px solid ${dateFilter === d ? 'var(--accent1)' : 'var(--border)'}`,
                background: dateFilter === d ? 'rgba(26,63,228,.08)' : 'transparent',
                color: dateFilter === d ? 'var(--accent1)' : 'var(--muted)',
                fontSize: '.78rem',
                fontWeight: dateFilter === d ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {d === 'vandaag' ? 'Vandaag' : d === 'week' ? 'Deze week' : d === 'maand' ? 'Deze maand' : 'Alles'}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

        <Select
          value={filterClientId}
          onChange={v => { setFilterClientId(v); setFilterProjectId('') }}
          options={clientOptions}
          placeholder="Alle klanten"
          style={{ width: '150px' }}
        />

        <Select
          value={filterProjectId}
          onChange={setFilterProjectId}
          options={projectOptions}
          placeholder="Alle projecten"
          style={{ width: '150px' }}
        />

        <Select
          value={filterBillable}
          onChange={v => setFilterBillable(v as 'alle' | 'ja' | 'nee')}
          options={[
            { value: 'alle', label: 'Alle' },
            { value: 'ja', label: 'Factureerbaar' },
            { value: 'nee', label: 'Niet factureerbaar' },
          ]}
          placeholder="Alle"
          style={{ width: '160px' }}
        />

        <input
          value={searchDesc}
          onChange={e => setSearchDesc(e.target.value)}
          placeholder="Zoek beschrijving..."
          style={{
            padding: '7px 12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '.82rem',
            color: 'var(--text)',
            outline: 'none',
            width: '180px',
          }}
        />

        <div style={{ flex: 1 }} />

        <button
          onClick={() => exportCSV(filteredEntries)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '.80rem',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <Download size={14} /> Exporteer CSV
        </button>
      </div>

      {/* ── REGISTRATIES TAB ── */}
      {tab === 'registraties' && (
        <div>
          {grouped.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--muted)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}>
              <Clock size={36} style={{ opacity: .3, marginBottom: '12px' }} />
              <div style={{ fontSize: '.95rem' }}>Geen tijdregistraties gevonden</div>
              <div style={{ fontSize: '.8rem', marginTop: '6px' }}>Start de timer of pas de filters aan</div>
            </div>
          )}

          {grouped.map(({ date, entries: dayEntries }) => (
            <div key={date} style={{ marginBottom: '24px' }}>
              {/* Day header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                padding: '0 4px',
              }}>
                <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', textTransform: 'capitalize' }}>
                  {fmtDate(date + 'T12:00:00')}
                </span>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                    {fmtDuration(dayTotalMinutes(dayEntries))}
                  </span>
                  {dayBillableAmount(dayEntries) > 0 && (
                    <span style={{ fontSize: '.82rem', color: '#10b981', fontWeight: 600 }}>
                      €{dayBillableAmount(dayEntries).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                {dayEntries.map((entry, idx) => (
                  <div key={entry.id}>
                    {idx > 0 && <div style={{ height: '1px', background: 'var(--border)' }} />}

                    {editingId === entry.id ? (
                      /* ── Inline edit ── */
                      <div style={{ padding: '16px', background: 'rgba(26,63,228,.02)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto auto', gap: '10px', alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: '.73rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Beschrijving</label>
                            <input
                              value={editDesc}
                              onChange={e => setEditDesc(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '7px',
                                fontSize: '.82rem',
                                color: 'var(--text)',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '.73rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Klant</label>
                            <Select
                              value={editClientId}
                              onChange={v => { setEditClientId(v); setEditProjectId('') }}
                              options={[{ value: '', label: 'Geen klant' }, ...clients.map(c => ({ value: c.id, label: c.company_name }))]}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '.73rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Project</label>
                            <Select
                              value={editProjectId}
                              onChange={setEditProjectId}
                              options={editProjectOptions}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '.73rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>€/uur</label>
                            <input
                              type="number"
                              value={editRate}
                              onChange={e => setEditRate(e.target.value)}
                              style={{
                                width: '70px',
                                padding: '7px 8px',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '7px',
                                fontSize: '.82rem',
                                color: 'var(--text)',
                                outline: 'none',
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '6px', paddingBottom: '2px' }}>
                            <button
                              onClick={() => saveEdit(entry.id)}
                              style={{
                                padding: '7px 14px',
                                background: 'var(--accent1)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '7px',
                                fontSize: '.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Check size={14} /> Opslaan
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                padding: '7px 10px',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '7px',
                                fontSize: '.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── Entry row ── */
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        transition: 'background .1s',
                      }}>
                        {/* Colored dot */}
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: entry.client_id ? getClientColor(entry.client_id) : 'var(--muted)',
                          flexShrink: 0,
                        }} />

                        {/* Description + meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.description || 'Geen beschrijving'}
                          </div>
                          <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                            {entry.clients && <span>{entry.clients.company_name}</span>}
                            {entry.projects && <><span>·</span><span>{entry.projects.title}</span></>}
                            <span>·</span>
                            <span>{fmtTime(entry.start_time)}{entry.end_time ? ` – ${fmtTime(entry.end_time)}` : ''}</span>
                          </div>
                        </div>

                        {/* Billable badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '50px',
                          background: entry.billable ? 'rgba(16,185,129,.1)' : 'var(--bg)',
                          border: `1px solid ${entry.billable ? 'rgba(16,185,129,.3)' : 'var(--border)'}`,
                          fontSize: '.72rem',
                          color: entry.billable ? '#10b981' : 'var(--muted)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}>
                          <Euro size={11} />
                          {entry.billable ? 'Factureerbaar' : 'Niet factureerbaar'}
                        </div>

                        {/* Duration + rate + amount */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--text)' }}>
                            {entry.duration_minutes ? fmtDuration(entry.duration_minutes) : '—'}
                          </div>
                          {entry.hourly_rate > 0 && (
                            <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                              €{entry.hourly_rate}/u · €{entry.duration_minutes ? ((entry.duration_minutes / 60) * entry.hourly_rate).toFixed(2) : '0.00'}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <button
                            onClick={() => startEdit(entry)}
                            style={{
                              width: '30px', height: '30px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'var(--muted)',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            style={{
                              width: '30px', height: '30px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#ef4444',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RAPPORTAGE TAB ── */}
      {tab === 'rapportage' && (
        <div>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Totale uren', value: fmtDuration(totalMinutes), sub: `${(totalMinutes / 60).toFixed(1)} uur` },
              { label: 'Factureerbare uren', value: fmtDuration(billableMinutes), sub: `${Math.round(billableMinutes / Math.max(totalMinutes, 1) * 100)}%` },
              { label: 'Totale omzet', value: `€${totalRevenue.toFixed(2)}`, sub: 'Uren × tarief' },
              { label: 'Gem. uurtarief', value: `€${avgRate.toFixed(2)}/u`, sub: 'Factureerbare uren' },
            ].map(kpi => (
              <div key={kpi.label} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '6px' }}>{kpi.label}</div>
                <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{kpi.value}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          {chartDays.length > 0 && (
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '20px', color: 'var(--text)' }}>
                Uren per dag
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
                {chartDays.map(([day, mins]) => (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: `${Math.round((mins / maxMinutes) * 100)}%`,
                      background: 'var(--accent1)',
                      borderRadius: '4px 4px 0 0',
                      opacity: .75,
                      minHeight: '4px',
                      transition: 'height .3s',
                    }} title={`${fmtDuration(mins)}`} />
                    <div style={{ fontSize: '.65rem', color: 'var(--muted)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap', marginTop: '4px' }}>
                      {new Date(day + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By client table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>
                Per klant
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Klant', 'Uren', 'Factureerbaar', 'Bedrag'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', fontSize: '.73rem', color: 'var(--muted)', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(byClient).sort((a, b) => b.minutes - a.minutes).map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{row.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{fmtDuration(row.minutes)}</td>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{fmtDuration(row.billable)}</td>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: '#10b981', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>€{row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {Object.keys(byClient).length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '.82rem' }}>Geen data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* By project table */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>
                Per project
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Project', 'Klant', 'Uren', 'Bedrag'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', fontSize: '.73rem', color: 'var(--muted)', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(byProject).sort((a, b) => b.minutes - a.minutes).map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{row.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{row.client}</td>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>{fmtDuration(row.minutes)}</td>
                      <td style={{ padding: '10px 14px', fontSize: '.82rem', color: '#10b981', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>€{row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {Object.keys(byProject).length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '.82rem' }}>Geen data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => exportCSV(filteredEntries)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                background: 'var(--accent1)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={15} /> Exporteer CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
