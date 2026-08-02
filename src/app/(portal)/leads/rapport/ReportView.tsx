'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Calendar } from 'lucide-react'
import { CALL_OUTCOMES, PIPELINE_STAGES } from '@/types/leadmachine'

interface Props {
  from: string
  to: string
  preset: string
  agencyName: string
  calls: any[]
  notes: any[]
  meetings: any[]
  activities: any[]
  newLeadsCount: number
  wonLeads: any[]
  users: { id: string; full_name: string | null }[]
}

export default function ReportView({ from, to, preset, agencyName, calls, notes, meetings, activities, newLeadsCount, wonLeads, users }: Props) {
  const router = useRouter()
  const [fromInput, setFromInput] = useState(from.slice(0, 10))
  const [toInput, setToInput] = useState(to.slice(0, 10))

  // Stats
  const callsByOutcome: Record<string, number> = {}
  for (const c of calls) callsByOutcome[c.outcome] = (callsByOutcome[c.outcome] || 0) + 1

  const callsByUser: Record<string, { name: string; count: number }> = {}
  for (const c of calls) {
    const key = c.called_by || 'onbekend'
    const name = c.user_profiles?.full_name || users.find(u => u.id === key)?.full_name || 'Onbekend'
    if (!callsByUser[key]) callsByUser[key] = { name, count: 0 }
    callsByUser[key].count++
  }

  const activityByType: Record<string, number> = {}
  for (const a of activities) activityByType[a.type] = (activityByType[a.type] || 0) + 1

  function applyRange(preset: string) {
    router.push(`/leads/rapport?preset=${preset}`)
  }

  function applyCustom() {
    router.push(`/leads/rapport?from=${fromInput}&to=${toInput}`)
  }

  const dateLabel = `${new Date(from).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} — ${new Date(to).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px', background: '#FCFBFF', minHeight: '100vh' }}>
      {/* Controls (no-print) */}
      <div className="no-print" style={{ marginBottom: 24 }}>
        <Link href="/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5F5A72', fontSize: 13, textDecoration: 'none', marginBottom: 12 }}>
          <ArrowLeft size={14} /> Terug naar leads
        </Link>

        <div style={{ background: 'white', border: '1px solid #E7E2F4', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Periode kiezen</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <PresetBtn active={preset === 'today'} label="Vandaag" onClick={() => applyRange('today')} />
            <PresetBtn active={preset === 'week'} label="Deze week" onClick={() => applyRange('week')} />
            <PresetBtn active={preset === 'month'} label="Deze maand" onClick={() => applyRange('month')} />
            <PresetBtn active={preset === 'quarter'} label="Dit kwartaal" onClick={() => applyRange('quarter')} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#5F5A72' }}>Of custom:</span>
            <input type="date" value={fromInput} onChange={e => setFromInput(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid #E7E2F4', borderRadius: 8, fontSize: 13 }} />
            <span style={{ color: '#5F5A72' }}>tot</span>
            <input type="date" value={toInput} onChange={e => setToInput(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid #E7E2F4', borderRadius: 8, fontSize: 13 }} />
            <button onClick={applyCustom} style={{
              padding: '8px 14px', background: '#3F06E3', color: 'white', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Toepassen</button>
          </div>
        </div>

        <button onClick={() => window.print()} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: '#3F06E3', color: 'white', border: 'none', borderRadius: 12,
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          <Download size={16} /> Download als PDF
        </button>
        <span style={{ marginLeft: 12, fontSize: 12, color: '#5F5A72' }}>
          Cmd+P → &quot;Save as PDF&quot; als de dialog opent
        </span>
      </div>

      {/* Report content */}
      <div id="report">
        {/* Header */}
        <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #3F06E3' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Modernica CRM Rapport</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>{agencyName}</h1>
          <div style={{ fontSize: 14, color: '#5F5A72' }}>
            <Calendar size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {dateLabel}
          </div>
        </div>

        {/* Kerncijfers */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={h2}>📊 Kerncijfers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <Kpi label="Gesprekken gelogd" value={calls.length} color="#3F06E3" />
            <Kpi label="Notities toegevoegd" value={notes.length} color="#8B5CF6" />
            <Kpi label="Meetings" value={meetings.length} color="#0EA5E9" />
            <Kpi label="Nieuwe leads" value={newLeadsCount} color="#22C55E" />
            <Kpi label="Klant geworden" value={wonLeads.length} color="#059669" />
          </div>
        </section>

        {/* Outcome verdeling */}
        {Object.keys(callsByOutcome).length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={h2}>📞 Outcome verdeling</h2>
            <div style={{ background: 'white', border: '1px solid #E7E2F4', borderRadius: 12, padding: 16 }}>
              {Object.entries(callsByOutcome).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
                const o = CALL_OUTCOMES.find(x => x.key === k)
                return (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F6F3FF' }}>
                    <span>{o?.emoji} {o?.label || k}</span>
                    <strong>{v}</strong>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Per caller */}
        {Object.keys(callsByUser).length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={h2}>👥 Gesprekken per cold caller</h2>
            <div style={{ background: 'white', border: '1px solid #E7E2F4', borderRadius: 12, padding: 16 }}>
              {Object.entries(callsByUser).sort((a, b) => b[1].count - a[1].count).map(([id, { name, count }]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F6F3FF' }}>
                  <span>{name}</span>
                  <strong>{count} gesprek{count === 1 ? '' : 'ken'}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Meetings */}
        {meetings.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={h2}>📅 Ingeplande meetings</h2>
            <div style={{ background: 'white', border: '1px solid #E7E2F4', borderRadius: 12 }}>
              {meetings.map((m, i) => (
                <div key={m.id} style={{ padding: 14, borderBottom: i === meetings.length - 1 ? 'none' : '1px solid #F6F3FF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{m.lead_companies?.name || '?'}</strong>
                    <span style={{ fontSize: 12, color: '#5F5A72' }}>
                      {new Date(m.scheduled_at).toLocaleString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {m.notes && <div style={{ fontSize: 13, color: '#5F5A72' }}>{m.notes}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Won leads */}
        {wonLeads.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={h2}>🎉 Nieuwe klanten</h2>
            <div style={{ background: '#F0FDF4', border: '1px solid #22C55E', borderRadius: 12, padding: 16 }}>
              {wonLeads.map(l => (
                <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
                  <strong>{l.lead_companies?.name}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Alle calls detail */}
        {calls.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={h2}>📋 Alle belactiviteiten ({calls.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: 'white', border: '1px solid #E7E2F4', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#F6F3FF' }}>
                  <th style={th}>Datum</th>
                  <th style={th}>Bedrijf</th>
                  <th style={th}>Outcome</th>
                  <th style={th}>Door</th>
                  <th style={th}>Notitie</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c: any) => {
                  const o = CALL_OUTCOMES.find(x => x.key === c.outcome)
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid #F6F3FF' }}>
                      <td style={td}>{new Date(c.called_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={td}><strong>{c.lead_companies?.name || '?'}</strong><br /><span style={{ fontSize: 10, color: '#8F8AA3' }}>{c.lead_companies?.city}</span></td>
                      <td style={td}>{o?.emoji} {o?.label}</td>
                      <td style={td}>{c.user_profiles?.full_name || '—'}</td>
                      <td style={td}>{c.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #E7E2F4', fontSize: 11, color: '#8F8AA3', textAlign: 'center' }}>
          Gegenereerd: {new Date().toLocaleString('nl-NL')} · Modernica Portal CRM
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #report { margin: 0; padding: 0; }
          section { page-break-inside: avoid; }
        }
        @page { size: A4; margin: 15mm; }
      `}</style>
    </div>
  )
}

function PresetBtn({ active, label, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      background: active ? '#3F06E3' : 'white',
      color: active ? 'white' : '#5F5A72',
      border: `1px solid ${active ? '#3F06E3' : '#E7E2F4'}`,
    }}>{label}</button>
  )
}

function Kpi({ label, value, color }: any) {
  return (
    <div style={{ padding: 16, background: 'white', border: '1px solid #E7E2F4', borderRadius: 12 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#5F5A72' }}>{label}</div>
    </div>
  )
}

const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.01em' }
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5F5A72', textTransform: 'uppercase', letterSpacing: '0.06em' }
const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top' }
