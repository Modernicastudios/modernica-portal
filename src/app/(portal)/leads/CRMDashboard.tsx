'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Phone, Globe, Mail, Search, PhoneCall, Layout, Download, Loader2, CheckCircle, ExternalLink, ArrowRight, MapPin } from 'lucide-react'
import { PIPELINE_STAGES } from '@/types/leadmachine'

interface Props {
  leads: any[]
  stageStats: Record<string, number>
  totalLeads: number
  callbacksDue: number
  callsToday: number
  userName: string
}

export default function CRMDashboard({ leads, stageStats, totalLeads, callbacksDue, callsToday, userName }: Props) {
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter(l => {
      if (stageFilter && l.pipeline_stage !== stageFilter) return false
      if (!q) return true
      const co = l.lead_companies
      const ct = l.lead_contacts
      return (
        co?.name?.toLowerCase().includes(q) ||
        co?.city?.toLowerCase().includes(q) ||
        co?.industry?.toLowerCase().includes(q) ||
        co?.phone?.toLowerCase().includes(q) ||
        ct?.email?.toLowerCase().includes(q) ||
        ct?.full_name?.toLowerCase().includes(q)
      )
    })
  }, [leads, query, stageFilter])

  async function runImport() {
    setImporting(true); setImportResult(null)
    try {
      const r = await fetch('/api/leads/smartlead-import', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' })
      const d = await r.json()
      setImportResult(d)
      if (d.ok) setTimeout(() => location.reload(), 1500)
    } catch (e: any) { setImportResult({ error: e.message }) }
    setImporting(false)
  }

  // Empty state
  if (totalLeads === 0) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 32 }}>Leads &amp; CRM</h1>
        <div style={{ background: 'white', border: '2px dashed #E7E2F4', borderRadius: 20, padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📥</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Nog geen leads in het CRM</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.5, fontSize: 15 }}>
            Importeer al jullie <strong>Modernica leads uit Smartlead</strong> in één klik.
            Alle 958 leads met email-historie komen erin, klaar om te bellen.
          </p>
          <button onClick={runImport} disabled={importing} style={{ ...bigBtn }}>
            {importing ? <><Loader2 size={18} className="anim-spin" /> Importeren...</> : <><Download size={18} /> Import 958 leads uit Smartlead</>}
          </button>
          {importResult?.error && <div style={{ marginTop: 16, color: '#991B1B' }}>Fout: {importResult.error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* ═══════════ HEADER ═══════════ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Leads &amp; CRM</h1>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>Hi {userName} · {totalLeads} leads in je pool</div>
          </div>
          <button onClick={runImport} disabled={importing} style={ghostBtn}>
            {importing ? <><Loader2 size={14} className="anim-spin" /> Bezig...</> : <><Download size={14} /> Import Smartlead</>}
          </button>
        </div>
        {importResult && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: importResult.error ? '#FEF2F2' : '#F0FDF4', color: importResult.error ? '#991B1B' : '#065F46', fontSize: 13 }}>
            {importResult.error ? `Fout: ${importResult.error}`
              : <><CheckCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Klaar: {importResult.companies} bedrijven, {importResult.contacts} contacten geïmporteerd. Pagina laadt opnieuw...</>}
          </div>
        )}
      </div>

      {/* ═══════════ VANDAAG — 3 grote actiekaarten ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 40 }}>
        {/* Bel volgende lead — altijd prominent */}
        <Link href="/leads/bellen" style={{ ...bigActionCard, background: 'linear-gradient(135deg, #3F06E3, #6D3EEB)', color: 'white', textDecoration: 'none' }}>
          <PhoneCall size={26} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Start bellen</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {callbacksDue > 0 ? `${callbacksDue} callbacks vandaag` : 'Volgende lead in de queue'}
            </div>
          </div>
          <ArrowRight size={20} style={{ marginLeft: 'auto', opacity: 0.8 }} />
        </Link>

        {/* Gesprekken vandaag */}
        <div style={{ ...bigActionCard, background: 'white', border: '1px solid #E7E2F4' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1ECFF', color: '#3F06E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{callsToday}</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Gesprekken vandaag</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Alle belpogingen samen</div>
          </div>
        </div>

        {/* Pipeline */}
        <Link href="/leads/pipeline" style={{ ...bigActionCard, background: 'white', border: '1px solid #E7E2F4', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F0FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layout size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Pipeline</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Kanban board</div>
          </div>
          <ArrowRight size={16} style={{ marginLeft: 'auto', color: '#8F8AA3' }} />
        </Link>
      </div>

      {/* ═══════════ ALLE LEADS ═══════════ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Alle leads</h2>
          <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8F8AA3' }} />
            <input placeholder="Zoek..." value={query} onChange={e => setQuery(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: 36 }} />
          </div>
        </div>

        {/* Filter chips per stage */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          <StageChip label={`Alle · ${totalLeads}`} active={!stageFilter} color="#3F06E3" onClick={() => setStageFilter(null)} />
          {PIPELINE_STAGES.map(s => {
            const count = stageStats[s.key] || 0
            if (count === 0) return null
            return <StageChip key={s.key} label={`${s.label} · ${count}`} active={stageFilter === s.key} color={s.color} onClick={() => setStageFilter(stageFilter === s.key ? null : s.key)} />
          })}
        </div>

        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
          {filtered.length} van {leads.length} zichtbaar
        </div>
      </div>

      {/* ═══════════ LEAD CARDS (ipv tabel — overzichtelijker) ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {filtered.map(l => {
          const co = l.lead_companies
          const ct = l.lead_contacts
          const stage = PIPELINE_STAGES.find(s => s.key === l.pipeline_stage) || PIPELINE_STAGES[0]
          return (
            <div key={l.id} style={leadCard}>
              {/* Top: bedrijfsnaam + stage */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Link href={`/leads/${l.id}`} style={{ textDecoration: 'none', color: '#1A1730' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{co?.name || '?'}</div>
                  {co?.industry && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{co.industry}</div>}
                </Link>
                <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: stage.color + '20', color: stage.color, whiteSpace: 'nowrap' }}>
                  {stage.label}
                </span>
              </div>

              {/* Contact */}
              {ct?.full_name && (
                <div style={{ fontSize: 13, color: '#5F5A72', marginBottom: 8 }}>
                  👤 {ct.full_name}{ct.role ? ` · ${ct.role}` : ''}
                </div>
              )}

              {/* City */}
              {co?.city && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {co.city}
                </div>
              )}

              {/* Actie knoppen — ALLEMAAL klikbaar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {co?.phone && (
                  <a href={`tel:${co.phone}`} style={rowBtnPrimary}>
                    <Phone size={14} /> {co.phone}
                  </a>
                )}
                {co?.website_url && (
                  <a href={co.website_url} target="_blank" rel="noopener" style={rowBtnGhost}>
                    <Globe size={14} /> {co.domain || 'Check website'} <ExternalLink size={10} style={{ marginLeft: 'auto' }} />
                  </a>
                )}
                {ct?.email && (
                  <a href={`mailto:${ct.email}`} style={rowBtnGhost}>
                    <Mail size={14} /> {ct.email}
                  </a>
                )}
              </div>

              {/* Volgende actie */}
              {l.next_action_at && (
                <div style={{ marginTop: 10, padding: '6px 10px', background: '#F1ECFF', borderRadius: 8, fontSize: 12, color: '#3F06E3', fontWeight: 600 }}>
                  → {new Date(l.next_action_at).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              )}

              {/* Open lead */}
              <Link href={`/leads/${l.id}`} style={{
                display: 'block', textAlign: 'center', marginTop: 10, padding: '8px', background: 'transparent',
                border: '1px solid #E7E2F4', borderRadius: 8, color: '#5F5A72', textDecoration: 'none',
                fontSize: 12, fontWeight: 600,
              }}>
                Open lead detail →
              </Link>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', background: 'white', borderRadius: 12, border: '1px solid #E7E2F4' }}>
          Geen leads matchen deze filter
        </div>
      )}

      <style>{`
        .anim-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function StageChip({ label, active, color, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 100, fontSize: 12, cursor: 'pointer',
      background: active ? color : 'white',
      color: active ? 'white' : color,
      border: `1px solid ${active ? color : color + '40'}`, fontWeight: 600,
    }}>{label}</button>
  )
}

const bigActionCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '18px 20px', borderRadius: 16, minHeight: 84,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}

const leadCard: React.CSSProperties = {
  background: 'white', padding: 16, borderRadius: 14,
  border: '1px solid #E7E2F4', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
}

const rowBtnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
  background: '#3F06E3', color: 'white', borderRadius: 8,
  fontSize: 13, fontWeight: 700, textDecoration: 'none',
}
const rowBtnGhost: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
  background: '#F6F3FF', color: '#3F06E3', borderRadius: 8,
  fontSize: 12, fontWeight: 600, textDecoration: 'none',
}
const bigBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 26px',
  background: '#3F06E3', color: 'white', border: 'none', borderRadius: 12,
  fontWeight: 700, fontSize: 16, cursor: 'pointer',
}
const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px',
  background: 'white', color: '#3F06E3', border: '1px solid #E7E2F4', borderRadius: 10,
  fontWeight: 600, fontSize: 13, cursor: 'pointer',
}
const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1px solid #E7E2F4', borderRadius: 10, fontSize: 14, outline: 'none',
}
