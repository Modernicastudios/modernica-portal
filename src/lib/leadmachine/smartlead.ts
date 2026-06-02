// Koppeling met Smartlead (verzendmotor). Leest de API-sleutel uit de omgeving.
// Voor de SaaS kan dit later per agency met een eigen sleutel; nu één centrale.
const SMARTLEAD_API_KEY = process.env.SMARTLEAD_API_KEY || ''
const SMARTLEAD_BASE = 'https://server.smartlead.ai/api/v1'

export type SmartleadLead = {
  email: string
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  custom_fields?: Record<string, string>
}

export function smartleadConfigured(): boolean {
  return Boolean(SMARTLEAD_API_KEY)
}

// Maakt een Smartlead-campagne aan + zet er meteen een e-mailsjabloon in dat de
// AI-openingszin ({{opening_line}}) gebruikt. Geeft het nieuwe campagne-ID terug,
// zodat de app dat zelf kan opslaan. De gebruiker hoeft daarna in Smartlead alleen
// nog z'n (opgewarmde) inboxen te koppelen en de campagne op 'aan' te zetten.
export async function createCampaignWithSequence(opts: {
  name: string
  subject: string
  htmlBody: string
}): Promise<{ ok: boolean; campaignId?: string; error?: string }> {
  if (!SMARTLEAD_API_KEY) return { ok: false, error: 'SMARTLEAD_API_KEY ontbreekt' }
  try {
    // 1. Campagne aanmaken.
    const createRes = await fetch(`${SMARTLEAD_BASE}/campaigns/create?api_key=${SMARTLEAD_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: opts.name }),
    })
    if (!createRes.ok) {
      const txt = (await createRes.text()).slice(0, 300)
      return { ok: false, error: `Aanmaken mislukt (${createRes.status}): ${txt}` }
    }
    const created = await createRes.json()
    const campaignId = String(created.id ?? created.campaign_id ?? created.data?.id ?? '')
    if (!campaignId) return { ok: false, error: 'Smartlead gaf geen campagne-ID terug' }

    // 2. E-mailsjabloon (sequence) toevoegen met {{opening_line}}.
    const seqRes = await fetch(`${SMARTLEAD_BASE}/campaigns/${campaignId}/sequences?api_key=${SMARTLEAD_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sequences: [{
          seq_number: 1,
          subject: opts.subject,
          email_body: opts.htmlBody,
          seq_delay_details: { delay_in_days: 0 },
        }],
      }),
    })
    if (!seqRes.ok) {
      const txt = (await seqRes.text()).slice(0, 300)
      // Campagne is aangemaakt maar sjabloon niet — geef ID terug met waarschuwing.
      return { ok: true, campaignId, error: `Campagne aangemaakt, maar sjabloon zetten mislukte (${seqRes.status}): ${txt}` }
    }

    return { ok: true, campaignId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Onbekende fout' }
  }
}

// Voeg leads toe aan een Smartlead-campagne. Smartlead verstuurt ze dan zelf
// (met rotatie over de inboxen + daglimieten), zodra de campagne actief is.
export async function pushLeadsToCampaign(campaignId: string, leads: SmartleadLead[]): Promise<{ ok: boolean; error?: string }> {
  if (!SMARTLEAD_API_KEY) return { ok: false, error: 'SMARTLEAD_API_KEY ontbreekt' }
  if (!campaignId) return { ok: false, error: 'Geen Smartlead-campagne ingesteld' }
  if (leads.length === 0) return { ok: true }
  try {
    const res = await fetch(`${SMARTLEAD_BASE}/campaigns/${campaignId}/leads?api_key=${SMARTLEAD_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_list: leads.map(l => ({
          email: l.email,
          first_name: l.first_name || '',
          last_name: l.last_name || '',
          company_name: l.company_name || '',
          custom_fields: l.custom_fields || {},
        })),
      }),
    })
    if (!res.ok) {
      const txt = (await res.text()).slice(0, 300)
      return { ok: false, error: `Smartlead gaf ${res.status}: ${txt}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Onbekende fout' }
  }
}
