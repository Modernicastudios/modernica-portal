'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, MapPin, Globe, CheckCircle2, PauseCircle, Search, Pencil, RotateCw, Check } from 'lucide-react'
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
  agencyName: string
}

const STAGES: { key: string; label: string; statuses: string[] }[] = [
  { key: 'draft', label: 'Te beoordelen', statuses: ['draft'] },
  { key: 'queued', label: 'Goedgekeurd', statuses: ['queued'] },
  { key: 'pushed', label: 'Verzonden', statuses: ['pushed'] },
  { key: 'replied', label: 'Reactie', statuses: ['replied'] },
  { key: 'won', label: 'Gewonnen', statuses: ['won'] },
  { key: 'lost', label: 'Verloren', statuses: ['lost', 'skipped'] },
]

function stageKey(status: string): string {
  if (status === 'skipped') return 'lost'
  return status
}

export default function LeadsClient({ isManager, clients, campaigns, outreach, agencyName }: Props) {
  const [camps, setCamps] = useState<LeadCampaign[]>(campaigns)
  const [rows, setRows] = useState<OutreachRow[]>(outreach)

  async function changeStatus(id: string, status: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: status as OutreachRow['status'] } : r))
    await fetch('/api/leads/outreach', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outreachId: id, action: 'status', status }),
    })
  }

  async function convert(id: string) {
    const res = await fetch('/api/leads/outreach', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outreachId: id, action: 'convert' }),
    })
    const data = await res.json()
    if (!res.ok) { alert('Mislukt: ' + (data.error || '')); return }
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'won' } : r))
    alert('Klant aangemaakt! Je vindt dit bedrijf nu terug onder Klanten.')
  }

  function setLineText(id: string, text: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, opening_line: text } : r))
  }

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
            Leadmachine activeren
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {/* Voor de agency zelf — nieuwe klanten voor jullie (client_id = null) */}
            <ClientActivationCard
              key="__self__"
              client={{ id: '__self__', company_name: `${agencyName} — eigen lead-gen`, industry: 'Nieuwe klanten vinden voor jullie agency', city: null }}
              campaign={camps.find(c => c.client_id === null) || null}
              onSaved={(camp) => setCamps(prev => [...prev.filter(c => c.client_id !== null), camp])}
            />
            {clients.map(client => (
              <ClientActivationCard
                key={client.id}
                client={client}
                campaign={camps.find(c => c.client_id === client.id) || null}
                onSaved={(camp) => setCamps(prev => [...prev.filter(c => c.client_id !== client.id), camp])}
              />
            ))}
          </div>
          {clients.length === 0 && (
            <div style={{ marginTop: '10px', fontSize: '.82rem', color: 'var(--muted)' }}>
              Nog geen klanten toegevoegd. Via Klantbeheer kun je klanten toevoegen om óók voor hen leads te zoeken.
            </div>
          )}
        </section>
      )}

      <section>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '12px' }}>
          {isManager ? 'Gevonden leads' : 'Mijn leads'}
        </h2>
        {rows.length === 0 ? (
          <div style={{ padding: '40px 24px', background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
            Nog geen leads. Zet hierboven een klant op actief en klik op <strong>Zoek leads</strong> —
            de gevonden bedrijven verschijnen hier in de pijplijn.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {STAGES.map(stage => {
              const items = rows.filter(r => stage.statuses.includes(r.status))
              return (
                <div key={stage.key} style={{ minWidth: '250px', flex: '1 0 250px', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '.8rem' }}>{stage.label}</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--muted)', background: 'var(--card)', borderRadius: 'var(--radius-pill)', padding: '1px 8px' }}>{items.length}</span>
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {items.map(row => (
                      <LeadCard key={row.id} row={row} onStatus={changeStatus} onConvert={convert} onText={setLineText} />
                    ))}
                  </div>
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
  const realClientId: string | null = client.id === '__self__' ? null : client.id
  const [region, setRegion] = useState(campaign?.region || client.city || '')
  const [sbi, setSbi] = useState(campaign?.sbi_code || '')
  const [service, setService] = useState<string>(((campaign?.settings as Record<string, unknown>)?.service as string) || 'website')
  const [autoApprove, setAutoApprove] = useState<boolean>(((campaign?.settings as Record<string, unknown>)?.auto_approve) !== false)
  const [inspiration, setInspiration] = useState<string>(((campaign?.settings as Record<string, unknown>)?.inspiration as string) || '')
  const [rules, setRules] = useState<string>(((campaign?.settings as Record<string, unknown>)?.rules as string) || '')
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
        body: JSON.stringify({ clientId: realClientId, region, sbiCode: sbi, service, autoApprove, inspiration, rules, action }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Mislukt'); return }
      onSaved({
        ...(campaign || {} as LeadCampaign),
        id: data.campaignId,
        client_id: realClientId,
        status: data.status,
        region: region || null,
        sbi_code: sbi || null,
        settings: { ...(campaign?.settings || {}), service, auto_approve: autoApprove, inspiration: inspiration.trim() || null, rules: rules.trim() || null },
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

      <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.5 }}>
        Welke bedrijven wil je benaderen <strong>voor {client.company_name}</strong>? Beschrijf de
        doelgroep — de <em>potentiële klanten</em> van {client.company_name}, niet {client.company_name} zelf.
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.78rem', marginBottom: '10px', cursor: 'pointer' }}>
        <input type="checkbox" checked={autoApprove} onChange={e => setAutoApprove(e.target.checked)} />
        <span style={{ color: 'var(--text)' }}>
          {autoApprove
            ? 'Automatisch versturen — leads gaan meteen door (je kunt alles wel volgen & ingrijpen)'
            : 'Eerst zelf goedkeuren — elke mail komt in "Te beoordelen" vóór versturen'}
        </span>
      </label>
      <label style={{ display: 'block', marginBottom: '10px' }}>
        <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>
          Inspiratie / aanwijzingen voor de mail (optioneel)
        </span>
        <textarea
          value={inspiration}
          onChange={e => setInspiration(e.target.value)}
          rows={2}
          placeholder="Bv. 'noem dat we lokaal werken, kort & informeel' of een voorbeeld-openingszin. De AI gebruikt dit als basis."
          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)', outline: 'none', resize: 'vertical' }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: '10px' }}>
        <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>
          Regels — wat de AI nooit/altijd doet (optioneel)
        </span>
        <textarea
          value={rules}
          onChange={e => setRules(e.target.value)}
          rows={2}
          placeholder="Bv. 'nooit prijzen noemen, nooit resultaten beloven, nooit het woord gratis, altijd vrijblijvend, altijd in het Nederlands.' De AI houdt zich hier strikt aan."
          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: 'var(--bg)', outline: 'none', resize: 'vertical' }}
        />
      </label>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ flex: 2, minWidth: '170px' }}>
          <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>Wat voor bedrijven? (doelgroep)</span>
          <input
            value={sbi}
            onChange={e => setSbi(e.target.value)}
            placeholder="bv. kantoren, horeca, winkels"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }}
          />
        </label>
        <label style={{ flex: 1, minWidth: '120px' }}>
          <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>Waar?</span>
          <input
            value={region}
            onChange={e => setRegion(e.target.value)}
            placeholder="bv. Haarlem"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }}
          />
        </label>
        <label style={{ flex: 1, minWidth: '140px' }}>
          <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>Dienst om te pitchen</span>
          <select
            value={service}
            onChange={e => setService(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none' }}
          >
            <option value="website">Website</option>
            <option value="social">Social media</option>
            <option value="ads">Advertenties</option>
            <option value="video">Video</option>
            <option value="recruitment">Recruitment</option>
            <option value="local">Lokale marketing</option>
          </select>
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

function LeadCard({ row, onStatus, onConvert, onText }: {
  row: OutreachRow
  onStatus: (id: string, status: string) => void
  onConvert: (id: string) => void
  onText: (id: string, text: string) => void
}) {
  const co = row.lead_companies
  const ct = row.lead_contacts
  const verifyTone = ct?.email_verified === 'valid' ? 'success' : ct?.email_verified === 'invalid' ? 'danger' : 'muted'
  const isReview = row.status === 'draft'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(row.opening_line || '')
  const [busy, setBusy] = useState(false)

  async function call(action: string, body: Record<string, unknown> = {}) {
    setBusy(true)
    try {
      const res = await fetch('/api/leads/outreach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outreachId: row.id, action, ...body }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Mislukt'); return null }
      return data
    } catch { alert('Er ging iets mis'); return null } finally { setBusy(false) }
  }

  async function regenerate() {
    const data = await call('regenerate')
    if (data) { onText(row.id, data.opening_line); setDraft(data.opening_line) }
  }
  async function saveEdit() {
    const data = await call('edit', { openingLine: draft })
    if (data) { onText(row.id, data.opening_line); setEditing(false) }
  }

  const inputBtn = { fontSize: '.7rem', padding: '4px 8px', borderRadius: '6px', cursor: busy ? 'wait' : 'pointer', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 600 as const }

  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${isReview ? 'var(--accent4)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '10px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{co?.name || 'Bedrijf'}</div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
        {co?.city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--muted)', fontSize: '.7rem' }}><MapPin size={11} /> {co.city}</span>}
        {co?.domain && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--muted)', fontSize: '.7rem' }}><Globe size={11} /> {co.domain}</span>}
      </div>
      {ct && (ct.full_name || ct.email) && (
        <div style={{ marginTop: '6px', fontSize: '.74rem' }}>
          {ct.full_name && <div style={{ fontWeight: 600 }}>{ct.full_name}{ct.role && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {ct.role}</span>}</div>}
          {ct.email && (
            <div style={{ color: 'var(--muted)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              {ct.email} {ct.email_verified && <Badge tone={verifyTone}>{ct.email_verified}</Badge>}
            </div>
          )}
        </div>
      )}

      {/* De mailtekst — bewerkbaar als 'ie nog beoordeeld moet worden */}
      {editing ? (
        <div style={{ marginTop: '8px' }}>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
            style={{ width: '100%', fontSize: '.74rem', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button onClick={saveEdit} disabled={busy} style={{ ...inputBtn, background: 'var(--accent1)', color: '#fff', border: 'none' }}>Opslaan</button>
            <button onClick={() => { setEditing(false); setDraft(row.opening_line || '') }} style={inputBtn}>Annuleren</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '6px', fontSize: '.74rem', fontStyle: 'italic', color: row.opening_line ? 'var(--text)' : 'var(--muted)' }}>
          {row.opening_line ? `“${row.opening_line}”` : 'Nog geen tekst'}
        </div>
      )}

      {/* Review-acties: alleen zolang 'ie nog beoordeeld moet worden */}
      {isReview && !editing && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setEditing(true)} style={inputBtn}><Pencil size={11} /> Bewerken</button>
          <button onClick={regenerate} disabled={busy} style={inputBtn}><RotateCw size={11} /> Opnieuw</button>
          <button onClick={() => onStatus(row.id, 'queued')} disabled={busy} style={{ ...inputBtn, background: 'var(--accent3)', color: '#fff', border: 'none' }}><Check size={11} /> Goedkeuren</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
        <select
          value={stageKey(row.status)}
          onChange={e => onStatus(row.id, e.target.value)}
          style={{ flex: 1, fontSize: '.72rem', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)' }}
        >
          <option value="draft">Te beoordelen</option>
          <option value="queued">Goedgekeurd</option>
          <option value="pushed">Verzonden</option>
          <option value="replied">Reactie</option>
          <option value="won">Gewonnen</option>
          <option value="lost">Verloren</option>
        </select>
        {row.status !== 'won' && (
          <button onClick={() => onConvert(row.id)} title="Maak hier een klant van"
            style={{ fontSize: '.72rem', padding: '4px 8px', border: 'none', borderRadius: '6px', background: 'var(--accent3)', color: '#fff', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            → Klant
          </button>
        )}
      </div>
    </div>
  )
}
