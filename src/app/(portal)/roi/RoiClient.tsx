'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoiEntry {
  id: string
  client_id: string
  agency_id: string
  month: number
  year: number
  platform: string
  ad_spend: number
  revenue: number
  leads: number
  impressions: number
  clicks: number
  notes?: string
  created_at?: string
  clients?: { company_name: string }
}

interface Client {
  id: string
  company_name: string
}

interface Props {
  entries: RoiEntry[]
  clients: Client[]
  agencyId: string
  isAdmin: boolean
  clientId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

const PLATFORM_COLORS: Record<string, string> = {
  'Meta Ads': '#1877f2',
  'Google Ads': '#ea4335',
  'TikTok Ads': '#010101',
  'LinkedIn Ads': '#0077b5',
  'Overig': '#6b78a8',
}

const PLATFORM_ICONS: Record<string, string> = {
  'Meta Ads': 'f',
  'Google Ads': 'G',
  'TikTok Ads': '♪',
  'LinkedIn Ads': 'in',
  'Overig': '…',
}

const PLATFORMS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Indeed', 'Snapchat', 'Overig']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatRoas(spend: number, revenue: number): string {
  if (!spend || spend === 0) return '—'
  return (revenue / spend).toFixed(1) + 'x'
}

function getRoasColor(spend: number, revenue: number): string {
  if (!spend || spend === 0) return 'var(--muted)'
  const roas = revenue / spend
  if (roas >= 3) return '#00b89c'
  if (roas >= 1.5) return '#f5a623'
  return '#e53e3e'
}

function getRoasBg(spend: number, revenue: number): string {
  if (!spend || spend === 0) return 'rgba(107,120,168,.10)'
  const roas = revenue / spend
  if (roas >= 3) return 'rgba(0,184,156,.10)'
  if (roas >= 1.5) return 'rgba(245,166,35,.10)'
  return 'rgba(229,62,62,.10)'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: type === 'success' ? '#00b89c' : '#e53e3e',
      color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)',
      fontWeight: 600, fontSize: '.88rem',
      boxShadow: '0 4px 24px rgba(0,0,0,.18)',
      animation: 'fadeSlideUp .25s ease',
    }}>
      {msg}
    </div>
  )
}

function PlatformBadge({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform] || '#6b78a8'
  const icon = PLATFORM_ICONS[platform] || '?'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: color + '18', color, border: `1px solid ${color}33`,
      borderRadius: '50px', padding: '2px 10px 2px 6px',
      fontSize: '.72rem', fontWeight: 700,
    }}>
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%',
        background: color, color: '#fff', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '.65rem', fontWeight: 900, flexShrink: 0,
      }}>{icon}</span>
      {platform}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoiClient({ entries, clients, agencyId, isAdmin, clientId }: Props) {
  const supabase = createClient()

  const now = new Date()
  const [selectedClientId, setSelectedClientId] = useState(
    isAdmin ? (clients[0]?.id || '') : clientId
  )
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [localEntries, setLocalEntries] = useState<RoiEntry[]>(entries)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [formData, setFormData] = useState({
    client_id: clients[0]?.id || '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    platform: 'Meta Ads',
    ad_spend: '',
    revenue: '',
    leads: '',
    impressions: '',
    clicks: '',
    notes: '',
  })

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  // ── Filtered data ────────────────────────────────────────────────────────

  const filteredByClient = useMemo(
    () => localEntries.filter(e => !selectedClientId || e.client_id === selectedClientId),
    [localEntries, selectedClientId]
  )

  const filteredByPeriod = useMemo(
    () => filteredByClient.filter(e => e.month === selectedMonth && e.year === selectedYear),
    [filteredByClient, selectedMonth, selectedYear]
  )

  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
  const prevPeriod = useMemo(
    () => filteredByClient.filter(e => e.month === prevMonth && e.year === prevYear),
    [filteredByClient, prevMonth, prevYear]
  )

  // ── Stats ────────────────────────────────────────────────────────────────

  const totalSpend = filteredByPeriod.reduce((s, e) => s + (e.ad_spend || 0), 0)
  const totalRevenue = filteredByPeriod.reduce((s, e) => s + (e.revenue || 0), 0)
  const totalLeads = filteredByPeriod.reduce((s, e) => s + (e.leads || 0), 0)

  const prevSpend = prevPeriod.reduce((s, e) => s + (e.ad_spend || 0), 0)
  const prevRevenue = prevPeriod.reduce((s, e) => s + (e.revenue || 0), 0)
  const prevLeads = prevPeriod.reduce((s, e) => s + (e.leads || 0), 0)

  function delta(cur: number, prev: number) {
    if (!prev) return null
    const pct = ((cur - prev) / prev) * 100
    return { pct: pct.toFixed(1), up: pct >= 0 }
  }

  // ── Platform breakdown ───────────────────────────────────────────────────

  const platformGroups = useMemo(() => {
    const map: Record<string, { spend: number; revenue: number; leads: number; clicks: number; impressions: number }> = {}
    filteredByPeriod.forEach(e => {
      if (!map[e.platform]) map[e.platform] = { spend: 0, revenue: 0, leads: 0, clicks: 0, impressions: 0 }
      map[e.platform].spend += e.ad_spend || 0
      map[e.platform].revenue += e.revenue || 0
      map[e.platform].leads += e.leads || 0
      map[e.platform].clicks += e.clicks || 0
      map[e.platform].impressions += e.impressions || 0
    })
    return Object.entries(map)
  }, [filteredByPeriod])

  // ── Trend data (last 6 months) ───────────────────────────────────────────

  const trendData = useMemo(() => {
    const months: { label: string; spend: number; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - 1 - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const rows = filteredByClient.filter(e => e.month === m && e.year === y)
      months.push({
        label: MONTHS[m - 1].slice(0, 3),
        spend: rows.reduce((s, e) => s + (e.ad_spend || 0), 0),
        revenue: rows.reduce((s, e) => s + (e.revenue || 0), 0),
      })
    }
    return months
  }, [filteredByClient, selectedMonth, selectedYear])

  const trendMax = Math.max(...trendData.map(t => Math.max(t.spend, t.revenue)), 1)

  // ── Save entry ───────────────────────────────────────────────────────────

  async function handleSave() {
    if (!formData.client_id) { showToast('Selecteer een klant', 'error'); return }
    setSaving(true)
    const { data, error } = await supabase
      .from('roi_entries')
      .insert({
        agency_id: agencyId,
        client_id: formData.client_id,
        month: Number(formData.month),
        year: Number(formData.year),
        platform: formData.platform,
        ad_spend: Number(formData.ad_spend) || 0,
        revenue: Number(formData.revenue) || 0,
        leads: Number(formData.leads) || 0,
        impressions: Number(formData.impressions) || 0,
        clicks: Number(formData.clicks) || 0,
        notes: formData.notes || null,
      })
      .select('*, clients(company_name)')
      .single()
    setSaving(false)
    if (error) { showToast('Fout bij opslaan: ' + error.message, 'error'); return }
    setLocalEntries(prev => [data as RoiEntry, ...prev])
    setFormData(f => ({ ...f, ad_spend: '', revenue: '', leads: '', impressions: '', clicks: '', notes: '' }))
    showToast('Entry toegevoegd!')
  }

  // ── Delete entry ─────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    const { error } = await supabase.from('roi_entries').delete().eq('id', id)
    if (error) { showToast('Fout bij verwijderen', 'error'); return }
    setLocalEntries(prev => prev.filter(e => e.id !== id))
    showToast('Entry verwijderd')
  }

  // ── Selected client name ─────────────────────────────────────────────────

  const selectedClientName = isAdmin
    ? (clients.find(c => c.id === selectedClientId)?.company_name || 'Alle klanten')
    : ''

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-up" style={{ maxWidth: '1400px' }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .roi-delete-btn:hover { opacity: 1 !important; }
        .roi-row:hover { background: var(--bg) !important; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #00b89c 0%, #00a388 60%, #007a68 100%)',
          borderRadius: 'var(--radius)',
          padding: '32px 36px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,184,156,.28)',
          marginBottom: '20px',
        }}>
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '260px', height: '260px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <h2 style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
            fontSize: '1.8rem', color: '#fff', marginBottom: '6px',
          }}>
            ROI Dashboard
          </h2>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.9rem' }}>
            {isAdmin
              ? 'Advertentieresultaten per klant en platform overzicht'
              : 'Jouw advertentieresultaten en campagneprestaties'}
          </p>
        </div>

        {/* Filters row */}
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 20px',
        }}>
          {isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Klant
              </label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: '7px 12px', background: 'var(--bg)', color: 'var(--text)',
                  fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
                  minWidth: '180px',
                }}
              >
                <option value="">Alle klanten</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Maand
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '7px 12px', background: 'var(--bg)', color: 'var(--text)',
                fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Jaar
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '7px 12px', background: 'var(--bg)', color: 'var(--text)',
                fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {isAdmin && selectedClientId && (
            <div style={{
              marginLeft: 'auto', padding: '6px 14px',
              background: 'rgba(0,184,156,.10)', borderRadius: 'var(--radius-sm)',
              color: '#00b89c', fontWeight: 700, fontSize: '.82rem',
              border: '1px solid rgba(0,184,156,.2)',
            }}>
              {selectedClientName}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isAdmin ? '1fr 380px' : '1fr',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* LEFT / MAIN CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── STATS ROW ──────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              {
                label: 'Ad Spend',
                value: formatCurrency(totalSpend),
                delta: delta(totalSpend, prevSpend),
                gradient: 'linear-gradient(90deg, #e53e3e, #f56565)',
                color: '#e53e3e',
                icon: '💸',
              },
              {
                label: 'Revenue',
                value: formatCurrency(totalRevenue),
                delta: delta(totalRevenue, prevRevenue),
                gradient: 'linear-gradient(90deg, #00b89c, #38d9a9)',
                color: '#00b89c',
                icon: '💰',
              },
              {
                label: 'ROAS',
                value: formatRoas(totalSpend, totalRevenue),
                delta: null,
                roasBg: getRoasBg(totalSpend, totalRevenue),
                roasColor: getRoasColor(totalSpend, totalRevenue),
                gradient: `linear-gradient(90deg, ${getRoasColor(totalSpend, totalRevenue)}, ${getRoasColor(totalSpend, totalRevenue)}aa)`,
                color: getRoasColor(totalSpend, totalRevenue),
                icon: '📈',
              },
              {
                label: 'Leads',
                value: totalLeads.toLocaleString('nl-NL'),
                delta: delta(totalLeads, prevLeads),
                gradient: 'linear-gradient(90deg, var(--accent1), #7c5ff5)',
                color: 'var(--accent1)',
                icon: '🎯',
              },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,.06)',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: stat.gradient, borderRadius: 'var(--radius) var(--radius) 0 0',
                }} />
                <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '1.3rem', opacity: .18 }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px', fontWeight: 600 }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
                  fontSize: stat.label === 'Ad Spend' || stat.label === 'Revenue' ? '1.15rem' : '1.6rem',
                  color: stat.color, marginBottom: '6px',
                  wordBreak: 'break-word',
                }}>
                  {stat.value}
                </div>
                {stat.delta && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    fontSize: '.7rem', fontWeight: 600,
                    color: stat.delta.up ? '#00b89c' : '#e53e3e',
                    background: stat.delta.up ? 'rgba(0,184,156,.1)' : 'rgba(229,62,62,.1)',
                    borderRadius: '50px', padding: '2px 8px',
                  }}>
                    {stat.delta.up ? '↑' : '↓'} {Math.abs(Number(stat.delta.pct))}% vs vorige maand
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── PLATFORM BREAKDOWN TABLE ────────────────────────────────── */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00b89c', display: 'inline-block' }} />
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
                Platform breakdown — {MONTHS[selectedMonth - 1]} {selectedYear}
              </h3>
            </div>

            {platformGroups.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>
                Geen data voor deze periode
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {['Platform', 'Spend', 'Revenue', 'ROAS', 'Leads', 'CPC', 'Impressies'].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: h === 'Platform' ? 'left' : 'right',
                          color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem',
                          textTransform: 'uppercase', letterSpacing: '.06em',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {platformGroups.map(([platform, d]) => (
                      <tr key={platform} className="roi-row" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <PlatformBadge platform={platform} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(d.spend)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#00b89c' }}>
                          {formatCurrency(d.revenue)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '.82rem',
                            color: getRoasColor(d.spend, d.revenue),
                            background: getRoasBg(d.spend, d.revenue),
                            borderRadius: '50px', padding: '2px 10px',
                          }}>
                            {formatRoas(d.spend, d.revenue)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>{d.leads.toLocaleString('nl-NL')}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--muted)' }}>
                          {d.clicks > 0 ? formatCurrency(d.spend / d.clicks) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--muted)' }}>
                          {d.impressions.toLocaleString('nl-NL')}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    {platformGroups.length > 1 && (
                      <tr style={{ background: 'var(--bg)', borderTop: '2px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text)' }}>Totaal</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(totalSpend)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#00b89c' }}>{formatCurrency(totalRevenue)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '.82rem',
                            color: getRoasColor(totalSpend, totalRevenue),
                            background: getRoasBg(totalSpend, totalRevenue),
                            borderRadius: '50px', padding: '2px 10px',
                          }}>
                            {formatRoas(totalSpend, totalRevenue)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{totalLeads.toLocaleString('nl-NL')}</td>
                        <td style={{ padding: '12px 16px' }} />
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>
                          {platformGroups.reduce((s, [, d]) => s + d.impressions, 0).toLocaleString('nl-NL')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── TREND CHART ─────────────────────────────────────────────── */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent1)', display: 'inline-block' }} />
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
                Trend — afgelopen 6 maanden
              </h3>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '.75rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#e53e3e', display: 'inline-block' }} />
                  Ad Spend
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#00b89c', display: 'inline-block' }} />
                  Revenue
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendData.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', fontSize: '.75rem', color: 'var(--muted)', fontWeight: 600, flexShrink: 0, textAlign: 'right' }}>
                    {t.label}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '10px', background: 'var(--bg)', borderRadius: '50px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '50px',
                          background: 'linear-gradient(90deg, #e53e3e, #f56565)',
                          width: `${trendMax > 0 ? (t.spend / trendMax) * 100 : 0}%`,
                          transition: 'width .6s ease',
                        }} />
                      </div>
                      <div style={{ width: '80px', fontSize: '.72rem', color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>
                        {t.spend > 0 ? formatCurrency(t.spend) : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '10px', background: 'var(--bg)', borderRadius: '50px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '50px',
                          background: 'linear-gradient(90deg, #00b89c, #38d9a9)',
                          width: `${trendMax > 0 ? (t.revenue / trendMax) * 100 : 0}%`,
                          transition: 'width .6s ease',
                        }} />
                      </div>
                      <div style={{ width: '80px', fontSize: '.72rem', color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>
                        {t.revenue > 0 ? formatCurrency(t.revenue) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── ENTRIES LIST ─────────────────────────────────────────────── */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c5ff5', display: 'inline-block' }} />
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
                Alle entries — {MONTHS[selectedMonth - 1]} {selectedYear}
              </h3>
              <span style={{
                marginLeft: '8px', background: 'rgba(124,95,245,.12)', color: '#7c5ff5',
                borderRadius: '50px', padding: '1px 10px', fontSize: '.72rem', fontWeight: 700,
              }}>
                {filteredByPeriod.length}
              </span>
            </div>

            {filteredByPeriod.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>
                Geen entries voor deze periode
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {['Platform', 'Spend', 'Revenue', 'ROAS', 'Leads', ...(isAdmin ? [''] : [])].map(h => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: h === 'Platform' || h === '' ? 'left' : 'right',
                          color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem',
                          textTransform: 'uppercase', letterSpacing: '.06em',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredByPeriod.map(entry => (
                      <tr key={entry.id} className="roi-row" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <PlatformBadge platform={entry.platform} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(entry.ad_spend)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#00b89c' }}>
                          {formatCurrency(entry.revenue)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '.8rem',
                            color: getRoasColor(entry.ad_spend, entry.revenue),
                            background: getRoasBg(entry.ad_spend, entry.revenue),
                            borderRadius: '50px', padding: '2px 8px',
                          }}>
                            {formatRoas(entry.ad_spend, entry.revenue)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>{entry.leads}</td>
                        {isAdmin && (
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="roi-delete-btn"
                              style={{
                                background: 'rgba(229,62,62,.1)', border: 'none',
                                color: '#e53e3e', borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px', cursor: 'pointer',
                                fontSize: '.72rem', fontWeight: 600, opacity: .7,
                              }}
                            >
                              Verwijder
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Admin add form */}
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '20px' }}>
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '24px',
              boxShadow: '0 2px 16px rgba(0,0,0,.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00b89c', display: 'inline-block' }} />
                <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
                  Entry toevoegen
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Client */}
                <div>
                  <label style={labelStyle}>Klant</label>
                  <select
                    value={formData.client_id}
                    onChange={e => setFormData(f => ({ ...f, client_id: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Selecteer klant…</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                {/* Month + Year */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Maand</label>
                    <select
                      value={formData.month}
                      onChange={e => setFormData(f => ({ ...f, month: Number(e.target.value) }))}
                      style={inputStyle}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Jaar</label>
                    <select
                      value={formData.year}
                      onChange={e => setFormData(f => ({ ...f, year: Number(e.target.value) }))}
                      style={inputStyle}
                    >
                      {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Platform */}
                <div>
                  <label style={labelStyle}>Platform</label>
                  <select
                    value={formData.platform}
                    onChange={e => setFormData(f => ({ ...f, platform: e.target.value }))}
                    style={inputStyle}
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Spend + Revenue */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Ad Spend (€)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={formData.ad_spend}
                      onChange={e => setFormData(f => ({ ...f, ad_spend: e.target.value }))}
                      placeholder="0.00"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Revenue (€)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={formData.revenue}
                      onChange={e => setFormData(f => ({ ...f, revenue: e.target.value }))}
                      placeholder="0.00"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Leads + Impressions + Clicks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Leads</label>
                    <input
                      type="number" min="0"
                      value={formData.leads}
                      onChange={e => setFormData(f => ({ ...f, leads: e.target.value }))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Impressies</label>
                    <input
                      type="number" min="0"
                      value={formData.impressions}
                      onChange={e => setFormData(f => ({ ...f, impressions: e.target.value }))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Klikken</label>
                    <input
                      type="number" min="0"
                      value={formData.clicks}
                      onChange={e => setFormData(f => ({ ...f, clicks: e.target.value }))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Notities</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Opmerkingen over deze periode…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Live ROAS preview */}
                {formData.ad_spend && formData.revenue && (
                  <div style={{
                    background: getRoasBg(Number(formData.ad_spend), Number(formData.revenue)),
                    border: `1px solid ${getRoasColor(Number(formData.ad_spend), Number(formData.revenue))}33`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '.78rem', color: 'var(--muted)', fontWeight: 600 }}>Geschatte ROAS</span>
                    <span style={{
                      fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem',
                      color: getRoasColor(Number(formData.ad_spend), Number(formData.revenue)),
                    }}>
                      {formatRoas(Number(formData.ad_spend), Number(formData.revenue))}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: saving ? 'var(--border)' : 'linear-gradient(135deg, #00b89c, #00a388)',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                    padding: '12px', fontWeight: 700, fontSize: '.88rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-syne), sans-serif',
                    transition: 'opacity .2s',
                    boxShadow: saving ? 'none' : '0 4px 16px rgba(0,184,156,.3)',
                  }}
                >
                  {saving ? 'Opslaan…' : '+ Entry toevoegen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.72rem', fontWeight: 600,
  color: 'var(--muted)', marginBottom: '5px',
  textTransform: 'uppercase', letterSpacing: '.06em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '8px 12px',
  background: 'var(--bg)', color: 'var(--text)',
  fontSize: '.85rem', boxSizing: 'border-box',
  outline: 'none',
}
