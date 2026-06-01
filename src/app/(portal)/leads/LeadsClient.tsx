'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, MapPin, Globe, CheckCircle2, PauseCircle, Search } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { LeadCampaign, LeadCompany, LeadContact, LeadOutreach } from '@/types/leadmachine'

interface ClientLite {
  id: string
  company_name: string
  industry: string | null
  city: string | null
}

type OutreachRow = LeadOutreach & {
  lead_companies: LeadCompany | null
  lead_contacts: LeadContact | null
}

interface Props {
  isManager: boolean
  isClient: boolean
  clients: ClientLite[]
  campaigns: LeadCampaign[]
  outreach: OutreachRow[]
}

export default function LeadsClient({ isManager, clients, campaigns, outreach }: Props) {
  const [camps, setCamps] = useState<LeadCampaign[]>(campaigns)

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={22} style={{ color: 'var(--accent1)' }} /> Leads
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: '4px' }}>
          {isManager
            ? 'Zet de leadmachine aan per klant. Wij vinden de bedrijven, de juiste contactpersoon en schrijven het bericht.'
            : 'Nieuwe bedrijven die bij jou passen, met een kant-en-klaar bericht om op te volgen.'}
        </p>
      </div>

      {isManager && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '12px' }}>
            Per klant activeren
          </h2>
          {clients.length === 0 ? (
            <div style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--muted)', fontSize: '.9rem' }}>
              Je hebt nog geen klanten. Voeg eerst een klant toe via Klantbeheer.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {clients.map(client => (
                <ClientActivationCard
                  key={client.id}
                  client={client}
                  campaign={camps.find(c => c.client_id === client.id) || null}
                  onSaved={(camp) => setCamps(prev => {
                    const rest = prev.filter(c => c.client_id !== client.id)
                    return [...rest, camp]
                  })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '12px' }}>
          {isManager ? 'Gevonden leads' : 'Mijn leads'}
        </h2>
        {outreach.length === 0 ? (
          <div style={{ padding: '40px 24px', background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
            Nog geen leads. Zet hierboven een klant op actief en klik op <strong>Zoek leads</strong> —
            de gevonden bedrijven verschijnen hier met contactpersoon en een kant-en-klaar bericht.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {outreach.map(row => {
              const co = row.lead_companies
              const ct = row.lead_contacts
              const verifyTone = ct?.email_verified === 'valid' ? 'success' : ct?.email_verified === 'invalid' ? 'danger' : 'muted'
              return (
                <div key={row.id} style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{co?.name || 'Bedrijf'}</div>
                    {co?.city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '.78rem' }}><MapPin size={12} /> {co.city}</span>}
                    {co?.domain && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '.78rem' }}><Globe size={12} /> {co.domain}</span>}
                  </div>
                  {ct && (
                    <div style={{ marginTop: '6px', fontSize: '.82rem' }}>
                      <span style={{ fontWeight: 600 }}>{ct.full_name || 'Contact'}</span>
                      {ct.role && <span style={{ color: 'var(--muted)' }}> — {ct.role}</span>}
                      {ct.email && (
                        <span style={{ marginLeft: '8px', color: 'var(--muted)' }}>
                          {ct.email}
                          {ct.email_verified && <Badge tone={verifyTone}>{ct.email_verified}</Badge>}
                        </span>
                      )}
                    </div>
                  )}
                  {row.opening_line && (
                    <div style={{ marginTop: '8px', fontSize: '.85rem', fontStyle: 'italic', color: 'var(--text)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                      “{row.opening_line}”
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function ClientActivationCard({ client, campaign, onSaved }: {
  client: ClientLite
  campaign: LeadCampaign | null
  onSaved: (camp: LeadCampaign) => void
}) {
  const router = useRouter()
  const [region, setRegion] = useState(campaign?.region || client.city || '')
  const [sbi, setSbi] = useState(campaign?.sbi_code || '')
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg] = useState<string | null>(null)
  const active = campaign?.status === 'active'

  async function runNow() {
    if (!campaign) return
    setRunning(true); setRunMsg(null)
    try {
      const res = await fetch('/api/leads/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, limit: 5 }),
      })
      const data = await res.json()
      if (!res.ok) { setRunMsg('Fout: ' + (data.error || 'mislukt')); return }
      const s = data.summary
      setRunMsg(`${s.found} bedrijven gevonden · ${s.withEmail} met e-mail · ${s.withOpeningLine} met openingszin.`)
      router.refresh()
    } catch {
      setRunMsg('Er ging iets mis. Probeer opnieuw.')
    } finally { setRunning(false) }
  }

  async function submit(action: 'activate' | 'pause') {
    setSaving(true)
    try {
      const res = await fetch('/api/leads/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, region, sbiCode: sbi, action }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Mislukt'); return }
      onSaved({
        ...(campaign || {} as LeadCampaign),
        id: data.campaignId,
        client_id: client.id,
        status: data.status,
        region: region || null,
        sbi_code: sbi || null,
      } as LeadCampaign)
    } catch {
      alert('Er ging iets mis. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent1)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 800, flexShrink: 0 }}>
          {client.company_name.slice(0, 2).toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{client.company_name}</div>
          {client.industry && <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{client.industry}</div>}
        </div>
        {active ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '.75rem', fontWeight: 600, color: 'var(--accent3)' }}>
            <CheckCircle2 size={14} /> Actief
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)' }}>
            <PauseCircle size={14} /> {campaign ? 'Gepauzeerd' : 'Uit'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ flex: 1, minWidth: '140px' }}>
          <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>Regio</span>
          <input
            value={region}
            onChange={e => setRegion(e.target.value)}
            placeholder="bv. Haarlem"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }}
          />
        </label>
        <label style={{ flex: 1, minWidth: '140px' }}>
          <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>Branche (optioneel)</span>
          <input
            value={sbi}
            onChange={e => setSbi(e.target.value)}
            placeholder="bv. horeca"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }}
          />
        </label>
        {active ? (
          <>
            <button onClick={runNow} disabled={running}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent1)', color: '#fff', fontWeight: 600, fontSize: '.82rem', cursor: running ? 'wait' : 'pointer', boxShadow: 'var(--shadow)' }}>
              <Search size={14} /> {running ? 'Zoeken…' : 'Zoek leads'}
            </button>
            <button onClick={() => submit('pause')} disabled={saving}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 600, fontSize: '.82rem', cursor: saving ? 'wait' : 'pointer' }}>
              Pauzeren
            </button>
          </>
        ) : (
          <button onClick={() => submit('activate')} disabled={saving}
            style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent1)', color: '#fff', fontWeight: 600, fontSize: '.82rem', cursor: saving ? 'wait' : 'pointer', boxShadow: 'var(--shadow)' }}>
            {saving ? 'Bezig…' : 'Activeren'}
          </button>
        )}
      </div>
      {runMsg && (
        <div style={{ marginTop: '10px', fontSize: '.8rem', color: 'var(--muted)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          {runMsg}
        </div>
      )}
    </div>
  )
}
