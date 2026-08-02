'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Phone, Layout, Download, BarChart3, Loader2, CheckCircle, PhoneCall } from 'lucide-react'

export default function CRMNav() {
  const [stats, setStats] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  useEffect(() => {
    fetch('/api/leads/crm?action=queue_stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  async function runImport() {
    setImporting(true); setImportResult(null)
    try {
      const r = await fetch('/api/leads/smartlead-import', { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' })
      const d = await r.json()
      setImportResult(d)
      fetch('/api/leads/crm?action=queue_stats').then(r => r.json()).then(setStats).catch(() => {})
    } catch (e: any) {
      setImportResult({ error: e.message })
    }
    setImporting(false)
  }

  const totalLeads = stats?.by_stage ? Object.values<number>(stats.by_stage).reduce((a, b) => a + b, 0) : 0
  const callbacks = stats?.callbacks_due || 0

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Leads &amp; CRM</h1>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            {totalLeads > 0
              ? <>{totalLeads} leads in pipeline · <strong style={{ color: '#3F06E3' }}>{callbacks} callbacks vandaag</strong></>
              : 'Nog geen leads in het CRM'}
          </div>
        </div>
        <button onClick={runImport} disabled={importing} style={importBtn}>
          {importing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importeren...</>
                     : <><Download size={14} /> Import uit Smartlead</>}
        </button>
      </div>

      {importResult && (
        <div style={{
          padding: 12, borderRadius: 10, marginBottom: 16,
          background: importResult.error ? '#FEF2F2' : '#F0FDF4',
          color: importResult.error ? '#991B1B' : '#065F46',
          fontSize: 13,
        }}>
          {importResult.error
            ? `Fout: ${importResult.error}`
            : <>
                <CheckCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Klaar: {importResult.companies} bedrijven, {importResult.contacts} contacten, {importResult.outreach} outreach records, {importResult.activities} activiteiten geïmporteerd. Skipped: {importResult.skipped}.
              </>}
        </div>
      )}

      {/* CRM quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <NavCard href="/leads/bellen" icon={<PhoneCall size={22} />}
          title="Cold caller"
          desc={callbacks > 0 ? `${callbacks} callbacks vandaag` : 'Bellen vanaf mobiel'}
          color="#3F06E3" highlight={callbacks > 0} />
        <NavCard href="/leads/pipeline" icon={<Layout size={22} />}
          title="Pipeline" desc="Kanban board per stage" color="#8B5CF6" />
        <NavCard href="/leads" icon={<BarChart3 size={22} />}
          title="Email outreach" desc="Bekijk en beheer email campagnes" color="#0EA5E9" />
      </div>

      {/* Stage stats mini bar */}
      {stats?.by_stage && Object.keys(stats.by_stage).length > 0 && (
        <div style={{ marginTop: 16, padding: 14, background: '#F6F3FF', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#5F5A72', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pipeline verdeling</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries<number>(stats.by_stage).map(([k, v]) => (
              <div key={k} style={{ padding: '4px 10px', background: 'white', borderRadius: 100, fontSize: 12 }}>
                <span style={{ color: '#5F5A72' }}>{k}:</span> <strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function NavCard({ href, icon, title, desc, color, highlight }: any) {
  return (
    <Link href={href} style={{
      display: 'block', padding: 16, borderRadius: 12, textDecoration: 'none',
      background: highlight ? color : 'white',
      color: highlight ? 'white' : '#1A1730',
      border: `1px solid ${highlight ? color : '#E7E2F4'}`,
      boxShadow: highlight ? `0 6px 20px ${color}40` : '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <div style={{ color: highlight ? 'white' : color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: highlight ? 0.9 : 0.7 }}>{desc}</div>
    </Link>
  )
}

const importBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px',
  background: '#3F06E3', color: 'white', border: 'none', borderRadius: 10,
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
}
