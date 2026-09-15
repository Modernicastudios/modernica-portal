'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Phone, ArrowLeft, Mail, Globe, MapPin, Calendar } from 'lucide-react'
import { PIPELINE_STAGES, type PipelineStage } from '@/types/leadmachine'

function KanbanCard({ l }: { l: any }) {
  const co = l.lead_companies
  const ct = l.lead_contacts
  const phone = ct?.phone || co?.phone
  const email = ct?.email
  const website = co?.website_url

  return (
    <Link href={`/leads/${l.id}`} style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px',
      textDecoration: 'none',
      color: 'inherit',
      display: 'block',
      boxShadow: 'var(--shadow)',
      transition: 'box-shadow .12s, border-color .12s',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'var(--shadow-lg)'
        el.style.borderColor = 'var(--accent2)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'var(--shadow)'
        el.style.borderColor = 'var(--border)'
      }}
    >
      {/* Bedrijfsnaam */}
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
        {co?.name || '—'}
      </div>

      {/* Contactpersoon */}
      {ct?.full_name && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          {ct.full_name}{ct.role ? ` · ${ct.role}` : ''}
        </div>
      )}

      {/* Contactgegevens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            onClick={e => e.preventDefault()}>
            <Phone size={12} style={{ color: 'var(--accent1)', flexShrink: 0 }} />
            <a href={`tel:${phone}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}
              onClick={e => e.stopPropagation()}>
              {phone}
            </a>
          </div>
        )}
        {email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            onClick={e => e.preventDefault()}>
            <Mail size={12} style={{ color: 'var(--accent1)', flexShrink: 0 }} />
            <a href={`mailto:${email}`} style={{ color: 'var(--text)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onClick={e => e.stopPropagation()}>
              {email}
            </a>
          </div>
        )}
        {website && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            onClick={e => e.preventDefault()}>
            <Globe size={12} style={{ color: 'var(--accent1)', flexShrink: 0 }} />
            <a href={website} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent1)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onClick={e => e.stopPropagation()}>
              {website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {co?.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <MapPin size={12} style={{ flexShrink: 0 }} />
            {co.city}
          </div>
        )}
      </div>

      {/* Callback datum */}
      {l.next_action_at && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 11, color: 'var(--accent1)', fontWeight: 600, background: 'var(--sidebar-active-bg)', borderRadius: 6, padding: '4px 8px' }}>
          <Calendar size={11} />
          {new Date(l.next_action_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          {l.next_action_note && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {l.next_action_note}</span>}
        </div>
      )}
    </Link>
  )
}

export default function PipelineClient({ leads }: { leads: any[] }) {
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? leads.filter(l => {
      const co = l.lead_companies
      const ct = l.lead_contacts
      return (
        co?.name?.toLowerCase().includes(q) ||
        co?.city?.toLowerCase().includes(q) ||
        co?.industry?.toLowerCase().includes(q) ||
        ct?.email?.toLowerCase().includes(q) ||
        ct?.full_name?.toLowerCase().includes(q) ||
        co?.phone?.toLowerCase().includes(q)
      )
    }) : leads
    const g: Record<string, any[]> = {}
    for (const s of PIPELINE_STAGES) g[s.key] = []
    for (const l of filtered) {
      const stage = (l.pipeline_stage || 'nieuw') as PipelineStage
      if (g[stage]) g[stage].push(l)
      else g['nieuw'].push(l)
    }
    return g
  }, [leads, query])

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Link href="/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: 13, textDecoration: 'none', marginBottom: 8 }}>
            <ArrowLeft size={14} /> Terug naar leads
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Pipeline
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{leads.length} leads</div>
        </div>
        <Link href="/leads/bellen" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', background: 'var(--accent1)', color: 'white',
          border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600,
          fontSize: 14, cursor: 'pointer', textDecoration: 'none',
        }}>
          <Phone size={14} /> Start bellen
        </Link>
      </div>

      {/* Zoekbalk */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            placeholder="Zoek bedrijf, contact, stad, telefoon..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: 38, padding: '10px 14px 10px 38px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              fontSize: 14, outline: 'none', background: 'var(--card)', color: 'var(--text)',
            }}
          />
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 24, alignItems: 'flex-start' }}>
        {PIPELINE_STAGES.map(s => {
          const items = grouped[s.key] || []
          return (
            <div key={s.key} style={{
              minWidth: 300, flex: '0 0 300px',
              background: 'var(--bg)',
              borderRadius: 'var(--radius)',
              padding: 14,
              borderTop: `3px solid ${s.color}`,
            }}>
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{
                  fontSize: 12, background: 'var(--card)', color: 'var(--muted)',
                  padding: '2px 9px', borderRadius: 100, border: '1px solid var(--border)',
                  fontWeight: 600,
                }}>
                  {items.length}
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '72vh', overflowY: 'auto' }}>
                {items.map(l => <KanbanCard key={l.id} l={l} />)}
                {items.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                    Leeg
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
