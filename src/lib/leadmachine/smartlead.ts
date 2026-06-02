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
