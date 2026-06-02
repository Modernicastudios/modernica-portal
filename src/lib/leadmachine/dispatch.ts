// Gedeelde verzend-logica: duwt de goedgekeurde ('queued') leads van één
// campagne naar de gekoppelde Smartlead-campagne. Gebruikt door zowel de
// handmatige "→ Smartlead"-knop (/api/leads/send) als de dagelijkse cron
// (/api/cron/leads), zodat het gedrag overal identiek is.
import type { createAdminClient } from '@/lib/supabase/admin'
import { pushLeadsToCampaign, smartleadConfigured, type SmartleadLead } from './smartlead'

type Admin = ReturnType<typeof createAdminClient>

export type DispatchCampaign = {
  id: string
  agency_id: string
  client_id: string | null
  settings: { smartlead_campaign_id?: string } | null
}

export type DispatchResult = { sent: number; error?: string }

// Stuurt de wachtende leads van deze campagne naar Smartlead.
// Veilig: zonder Smartlead-koppeling (campagne-ID) wordt er NIETS verstuurd.
export async function pushQueuedForCampaign(campaign: DispatchCampaign, admin: Admin): Promise<DispatchResult> {
  if (!smartleadConfigured()) return { sent: 0, error: 'SMARTLEAD_API_KEY ontbreekt' }

  const smartleadCampaignId = campaign.settings?.smartlead_campaign_id
  // Nog niet gekoppeld → niet versturen. Dit is de natuurlijke "rem" tijdens warmup:
  // leads stapelen op als 'queued' tot de gebruiker het Smartlead-ID invult.
  if (!smartleadCampaignId) return { sent: 0 }

  let q = admin.from('lead_outreach')
    .select('id, opening_line, lead_contacts(full_name, email, email_verified), lead_companies(name)')
    .eq('agency_id', campaign.agency_id)
    .eq('status', 'queued')
  q = campaign.client_id ? q.eq('client_id', campaign.client_id) : q.is('client_id', null)
  const { data: outreach } = await q.limit(200)

  // Alleen versturen met een e-mailadres dat niet als 'invalid' is gemarkeerd
  // (beschermt de reputatie van de inboxen). Supabase typeert joins als arrays,
  // vandaar de losse 'any'-cast zoals elders in de leadmachine.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendable = (outreach || []).filter((o: any) =>
    o.lead_contacts?.email && o.lead_contacts?.email_verified !== 'invalid')
  if (sendable.length === 0) return { sent: 0 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leads: SmartleadLead[] = sendable.map((o: any) => {
    const name: string = o.lead_contacts?.full_name || ''
    const [first, ...rest] = name.split(' ')
    return {
      email: o.lead_contacts.email,
      first_name: first || null,
      last_name: rest.join(' ') || null,
      company_name: o.lead_companies?.name || null,
      custom_fields: { opening_line: o.opening_line || '' }, // gebruik {{opening_line}} in je Smartlead-sjabloon
    }
  })

  const result = await pushLeadsToCampaign(smartleadCampaignId, leads)
  if (!result.ok) return { sent: 0, error: result.error }

  // Markeer als verzonden + leg vast naar welke Smartlead-campagne.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = sendable.map((o: any) => o.id)
  await admin.from('lead_outreach')
    .update({ status: 'pushed', smartlead_campaign_id: smartleadCampaignId, updated_at: new Date().toISOString() })
    .in('id', ids)

  return { sent: sendable.length }
}
