'use client'

import { useState, CSSProperties } from 'react'
import Link from 'next/link'
import { Wallet, Euro, TrendingUp, Target, BarChart3, Inbox } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

// Normaliseert een advertentie-platformsleutel naar het juiste merk-icoon.
const adIconKey = (k: string) => String(k || '').replace('_ads', '').replace('meta', 'facebook')

interface Props {
  entries: any[]
  clients: any[]
  isAdmin: boolean
  clientId: string
}

type SortKey = 'month' | 'year' | 'platform' | 'client' | 'spend' | 'revenue' | 'roas'
type SortDir = 'asc' | 'desc'

const AD_PLATFORMS = [
  { key: 'meta_ads', label: 'Meta Ads', icon: '📘', color: '#1877f2' },
  { key: 'google_ads', label: 'Google Ads', icon: '🔍', color: '#ea4335' },
  { key: 'tiktok_ads', label: 'TikTok Ads', icon: '🎵', color: '#010101' },
  { key: 'linkedin_ads', label: 'LinkedIn Ads', icon: '💼', color: '#0077b5' },
  { key: 'indeed', label: 'Indeed', icon: '💼', color: '#003A9B' },
  { key: 'snapchat', label: 'Snapchat', icon: '👻', color: '#FFFC00' },
  { key: 'overig', label: 'Overig', icon: '📊', color: '#7c5ff5' },
]

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

function roasColor(roas: number): string {
  if (roas > 3) return '#00a67d'
  if (roas > 1.5) return '#cc8800'
  return '#d94040'
}

function fmtEur(n: number): string {
  return `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtNum(n: number): string {
  return n.toLocaleString('nl-NL')
}

export default function AdsClient({ entries, clients, isAdmin, clientId }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [sortKey, setSortKey] = useState<SortKey>('year')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Filter entries
  const filtered = entries.filter(e => {
    if (selectedYear && e.year !== selectedYear) return false
    if (selectedClient !== 'all' && e.client_id !== selectedClient) return false
    return true
  })

  // KPI totals for current period
  const totalSpend = filtered.reduce((s, e) => s + (e.ad_spend || 0), 0)
  const totalRevenue = filtered.reduce((s, e) => s + (e.revenue || 0), 0)
  const totalLeads = filtered.reduce((s, e) => s + (e.leads || 0), 0)
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // Previous period (previous year)
  const prevYearEntries = entries.filter(e => {
    if (e.year !== selectedYear - 1) return false
    if (selectedClient !== 'all' && e.client_id !== selectedClient) return false
    return true
  })
  const prevSpend = prevYearEntries.reduce((s, e) => s + (e.ad_spend || 0), 0)
  const prevRevenue = prevYearEntries.reduce((s, e) => s + (e.revenue || 0), 0)
  const prevRoas = prevSpend > 0 ? prevRevenue / prevSpend : 0
  const prevLeads = prevYearEntries.reduce((s, e) => s + (e.leads || 0), 0)

  function trend(current: number, prev: number) {
    if (prev === 0) return null
    const pct = ((current - prev) / prev) * 100
    return pct
  }

  function TrendArrow({ current, prev }: { current: number; prev: number }) {
    const pct = trend(current, prev)
    if (pct === null) return null
    const up = pct >= 0
    return (
      <span style={{ fontSize: '.78rem', color: up ? '#00a67d' : '#d94040', marginLeft: '6px', fontWeight: 600 }}>
        {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
      </span>
    )
  }

  // Platform breakdown
  const platformRows = AD_PLATFORMS.map(pl => {
    const rows = filtered.filter(e => (e.platform || '').toLowerCase() === pl.key)
    const spend = rows.reduce((s, e) => s + (e.ad_spend || 0), 0)
    const revenue = rows.reduce((s, e) => s + (e.revenue || 0), 0)
    const leads = rows.reduce((s, e) => s + (e.leads || 0), 0)
    const impressions = rows.reduce((s, e) => s + (e.impressions || 0), 0)
    const roas = spend > 0 ? revenue / spend : 0
    return { ...pl, spend, revenue, leads, impressions, roas }
  })
  const totalRow = {
    label: 'Totaal', spend: totalSpend, revenue: totalRevenue,
    leads: totalLeads,
    impressions: platformRows.reduce((s, r) => s + r.impressions, 0),
    roas: avgRoas,
  }

  // 6-month trend chart
  const last6Months: { year: number; month: number; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    last6Months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES_SHORT[d.getMonth()] })
  }
  const monthlySpend = last6Months.map(m =>
    entries.filter(e => e.month === m.month && e.year === m.year &&
      (selectedClient === 'all' || e.client_id === selectedClient))
      .reduce((s, e) => s + (e.ad_spend || 0), 0)
  )
  const monthlyRevenue = last6Months.map(m =>
    entries.filter(e => e.month === m.month && e.year === m.year &&
      (selectedClient === 'all' || e.client_id === selectedClient))
      .reduce((s, e) => s + (e.revenue || 0), 0)
  )
  const maxBarVal = Math.max(...monthlySpend, ...monthlyRevenue, 1)

  // Sortable entries table
  const sortedEntries = [...filtered].sort((a, b) => {
    let aVal: string | number = 0
    let bVal: string | number = 0
    if (sortKey === 'month') { aVal = a.month; bVal = b.month }
    else if (sortKey === 'year') { aVal = a.year; bVal = b.year }
    else if (sortKey === 'platform') { aVal = a.platform || ''; bVal = b.platform || '' }
    else if (sortKey === 'client') { aVal = a.clients?.company_name || ''; bVal = b.clients?.company_name || '' }
    else if (sortKey === 'spend') { aVal = a.ad_spend || 0; bVal = b.ad_spend || 0 }
    else if (sortKey === 'revenue') { aVal = a.revenue || 0; bVal = b.revenue || 0 }
    else if (sortKey === 'roas') {
      aVal = (a.ad_spend || 0) > 0 ? (a.revenue || 0) / (a.ad_spend || 0) : 0
      bVal = (b.ad_spend || 0) > 0 ? (b.revenue || 0) / (b.ad_spend || 0) : 0
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIndicator({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span style={{ opacity: .3 }}> ↕</span>
    return <span style={{ color: 'var(--accent1)' }}> {sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const cardStyle: CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    boxShadow: 'var(--shadow)',
  }

  const thStyle: CSSProperties = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: '.73rem',
    fontWeight: 700,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    whiteSpace: 'nowrap',
    background: 'var(--bg)',
  }

  const tdStyle: CSSProperties = {
    padding: '12px 16px',
    fontSize: '.85rem',
    borderTop: '1px solid var(--border)',
  }

  if (entries.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '4px' }}>
            Advertentie Resultaten
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Overzicht van advertentieuitgaven en ROI</p>
        </div>
        <div style={{
          ...cardStyle,
          textAlign: 'center',
          padding: '56px 40px',
        }}>
          <div style={{ marginBottom: '16px', color: 'var(--muted)', display: 'flex', justifyContent: 'center' }}><BarChart3 size={40} /></div>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
            Nog geen advertentiedata
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '20px' }}>
            Voeg ROI entries toe via het ROI Dashboard
          </div>
          <Link href="/roi" style={{
            display: 'inline-block',
            background: 'var(--accent1)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '.9rem',
            textDecoration: 'none',
          }}>
            Naar ROI Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.6rem', marginBottom: '4px' }}>
          Advertentie Resultaten
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Overzicht van advertentieuitgaven en ROI per platform</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {isAdmin && clients.length > 0 && (
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--text)', fontSize: '.85rem', cursor: 'pointer',
            }}
          >
            <option value="all">Alle klanten</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        )}
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--card)',
            color: 'var(--text)', fontSize: '.85rem', cursor: 'pointer',
          }}
        >
          <option value={currentYear}>{currentYear}</option>
          <option value={currentYear - 1}>{currentYear - 1}</option>
        </select>
      </div>

      {/* 4 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Totaal uitgegeven', value: fmtEur(totalSpend), prev: prevSpend, current: totalSpend, color: '#1877f2', icon: <Wallet size={26} /> },
          { label: 'Totaal omzet', value: fmtEur(totalRevenue), prev: prevRevenue, current: totalRevenue, color: '#00a67d', icon: <Euro size={26} /> },
          { label: 'Gemiddelde ROAS', value: `${avgRoas.toFixed(2)}×`, prev: prevRoas, current: avgRoas, color: roasColor(avgRoas), icon: <TrendingUp size={26} /> },
          { label: 'Totaal leads', value: fmtNum(totalLeads), prev: prevLeads, current: totalLeads, color: 'var(--accent4)', icon: <Target size={26} /> },
        ].map(({ label, value, prev, current, color, icon }) => (
          <div key={label} style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color,
            }} />
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: .25, color }}>{icon}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px' }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.6rem' }}>
              {value}
            </div>
            <TrendArrow current={current} prev={prev} />
          </div>
        ))}
      </div>

      {/* Platform breakdown table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
            Platform overzicht
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Platform', 'Uitgegeven', 'Omzet', 'ROAS', 'Leads', 'Vertoningen'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {platformRows.map(pl => (
                <tr key={pl.key}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    <span style={{ marginRight: '6px', display: 'inline-flex', verticalAlign: 'middle' }}><PlatformIcon platform={adIconKey(pl.key)} size={15} /></span>
                    {pl.label}
                  </td>
                  <td style={tdStyle}>{fmtEur(pl.spend)}</td>
                  <td style={tdStyle}>{fmtEur(pl.revenue)}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: roasColor(pl.roas) }}>
                    {pl.spend > 0 ? `${pl.roas.toFixed(2)}×` : '—'}
                  </td>
                  <td style={tdStyle}>{fmtNum(pl.leads)}</td>
                  <td style={tdStyle}>{fmtNum(pl.impressions)}</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ background: 'var(--bg)' }}>
                <td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'var(--font-syne), sans-serif' }}>Totaal</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtEur(totalRow.spend)}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtEur(totalRow.revenue)}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: roasColor(totalRow.roas) }}>
                  {totalRow.spend > 0 ? `${totalRow.roas.toFixed(2)}×` : '—'}
                </td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtNum(totalRow.leads)}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtNum(totalRow.impressions)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly trend chart */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
            Maandelijkse trend
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '2px' }}>Laatste 6 maanden — uitgaven vs omzet</div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.74rem', color: 'var(--muted)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#1877f2', flexShrink: 0 }} />
            Uitgaven
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.74rem', color: 'var(--muted)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#00a67d', flexShrink: 0 }} />
            Omzet
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '140px' }}>
          {last6Months.map((m, i) => {
            const spendH = (monthlySpend[i] / maxBarVal) * 110
            const revH = (monthlyRevenue[i] / maxBarVal) * 110
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '110px' }}>
                  <div
                    title={`Uitgaven: ${fmtEur(monthlySpend[i])}`}
                    style={{
                      width: '14px',
                      height: `${Math.max(spendH, monthlySpend[i] > 0 ? 3 : 0)}px`,
                      background: '#1877f2',
                      borderRadius: '3px 3px 0 0',
                      alignSelf: 'flex-end',
                    }}
                  />
                  <div
                    title={`Omzet: ${fmtEur(monthlyRevenue[i])}`}
                    style={{
                      width: '14px',
                      height: `${Math.max(revH, monthlyRevenue[i] > 0 ? 3 : 0)}px`,
                      background: '#00a67d',
                      borderRadius: '3px 3px 0 0',
                      alignSelf: 'flex-end',
                    }}
                  />
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ROI entries table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
              ROI Entries
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '2px' }}>
              {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
          <Link href="/roi" style={{
            fontSize: '.78rem', color: 'var(--accent1)', fontWeight: 600,
            textDecoration: 'none',
          }}>
            Beheren →
          </Link>
        </div>
        {sortedEntries.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            <Inbox size={30} style={{ color: 'var(--muted)', marginBottom: '10px' }} />
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Geen data voor deze filters</div>
            <div style={{ fontSize: '.85rem' }}>Pas de filters aan of voeg ROI entries toe</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {([
                    { key: 'month' as SortKey, label: 'Maand' },
                    { key: 'year' as SortKey, label: 'Jaar' },
                    { key: 'platform' as SortKey, label: 'Platform' },
                    ...(isAdmin ? [{ key: 'client' as SortKey, label: 'Klant' }] : []),
                    { key: 'spend' as SortKey, label: 'Uitgaven' },
                    { key: 'revenue' as SortKey, label: 'Omzet' },
                    { key: 'roas' as SortKey, label: 'ROAS' },
                  ]).map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                    >
                      {col.label}<SortIndicator k={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map(e => {
                  const roas = (e.ad_spend || 0) > 0 ? (e.revenue || 0) / (e.ad_spend || 0) : 0
                  const plConfig = AD_PLATFORMS.find(p => p.key === (e.platform || '').toLowerCase())
                  return (
                    <tr key={e.id}>
                      <td style={tdStyle}>{MONTH_NAMES_SHORT[(e.month || 1) - 1] || e.month}</td>
                      <td style={tdStyle}>{e.year}</td>
                      <td style={{ ...tdStyle }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          fontSize: '.78rem', fontWeight: 600,
                          color: plConfig?.color || 'var(--muted)',
                        }}>
                          <PlatformIcon platform={adIconKey(plConfig?.key || e.platform)} size={13} /> {plConfig?.label || e.platform || '—'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ ...tdStyle, color: 'var(--muted)' }}>
                          {e.clients?.company_name || '—'}
                        </td>
                      )}
                      <td style={tdStyle}>{fmtEur(e.ad_spend || 0)}</td>
                      <td style={tdStyle}>{fmtEur(e.revenue || 0)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: roasColor(roas) }}>
                        {(e.ad_spend || 0) > 0 ? `${roas.toFixed(2)}×` : '—'}
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
