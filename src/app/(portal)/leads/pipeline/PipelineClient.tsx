'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, Phone, ArrowLeft } from 'lucide-react'
import { PIPELINE_STAGES, type PipelineStage } from '@/types/leadmachine'

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
        ct?.full_name?.toLowerCase().includes(q)
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
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Link href="/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5F5A72', fontSize: 13, textDecoration: 'none', marginBottom: 6 }}>
            <ArrowLeft size={14} /> Terug
          </Link>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>Pipeline</h1>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>{leads.length} leads · sleep-vrij kanban overzicht</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/leads/bellen" style={{ ...primaryBtn, textDecoration: 'none' }}>
            <Phone size={14} /> Start bellen
          </Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8F8AA3' }} />
          <input placeholder="Zoek bedrijf, contact, stad..." value={query} onChange={e => setQuery(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: 36 }} />
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 20 }}>
        {PIPELINE_STAGES.map(s => (
          <div key={s.key} style={{
            minWidth: 280, background: '#F6F3FF', borderRadius: 12, padding: 12,
            borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 12, background: 'white', color: '#5F5A72', padding: '2px 8px', borderRadius: 100 }}>
                {grouped[s.key]?.length || 0}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '70vh', overflowY: 'auto' }}>
              {(grouped[s.key] || []).map(l => (
                <Link key={l.id} href={`/leads/${l.id}`} style={{
                  background: 'white', padding: 10, borderRadius: 8, textDecoration: 'none', color: 'inherit',
                  border: '1px solid #E7E2F4', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: '#1A1730' }}>
                    {l.lead_companies?.name || '?'}
                  </div>
                  {l.lead_contacts?.full_name && (
                    <div style={{ fontSize: 11, color: '#5F5A72', marginBottom: 3 }}>{l.lead_contacts.full_name}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#8F8AA3', marginTop: 6 }}>
                    <span>{l.lead_companies?.city || '-'}</span>
                    {l.lead_companies?.phone && <span style={{ color: '#3F06E3' }}>📞</span>}
                  </div>
                  {l.next_action_at && (
                    <div style={{ fontSize: 10, color: '#3F06E3', marginTop: 4, fontWeight: 600 }}>
                      → {new Date(l.next_action_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </Link>
              ))}
              {(!grouped[s.key] || grouped[s.key].length === 0) && (
                <div style={{ padding: 20, textAlign: 'center', color: '#8F8AA3', fontSize: 12 }}>Leeg</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1px solid #E7E2F4', borderRadius: 10, fontSize: 14, outline: 'none',
}
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px',
  background: '#3F06E3', color: 'white', border: 'none', borderRadius: 10,
  fontWeight: 700, fontSize: 14, cursor: 'pointer',
}
