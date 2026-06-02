import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushLeadsToCampaign, smartleadConfigured, type SmartleadLead } from '@/lib/leadmachine/smartlead'

export const maxDuration = 60

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Duwt de goedgekeurde leads van een campagne naar de gekoppelde Smartlead-campagne.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('agency_id, role').eq('id', user.id).single()
  if (!profile?.agency_id) return NextResponse.json({ error: 'Geen agency' }, { status: 403 })
  if (!MANAGER_ROLES.has(profile.role) && user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Geen rechten' }, { status: 403 })
  }
  if (!smartleadConfigured()) return NextResponse.json({ error: 'Smartlead is nog niet ingesteld (SMARTLEAD_API_KEY).' }, { status: 400 })

  const { campaignId } = await req.json()
  const { data: campaign } = await admin
    .from('lead_campaigns').select('id, agency_id, client_id, settings').eq('id', campaignId).single()
  if (!campaign || campaign.agency_id !== profile.agency_id) {
    return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
  }
  const smartleadCampaignId = (campaign.settings as { smartlead_campaign_id?: string } | null)?.smartlead_campaign_id
  if (!smartleadCampaignId) {
    return NextResponse.json({ error: 'Vul eerst je Smartlead-campagne-ID in bij deze klant.' }, { status: 400 })
  }

  // Goedgekeurde outreach (status 'queued') met een e-mailadres, voor deze campagne.
  let q = admin.from('lead_outreach')
    .select('id, opening_line, lead_contacts(full_name, email), lead_companies(name)')
    .eq('agency_id', profile.agency_id)
    .eq('status', 'queued')
  q = campaign.client_id ? q.eq('client_id', campaign.client_id) : q.is('client_id', null)
  const { data: outreach } = await q.limit(200)

  const sendable = (outreach || []).filter((o: any) => o.lead_contacts?.email)
  if (sendable.length === 0) return NextResponse.json({ ok: true, sent: 0, message: 'Geen goedgekeurde leads met e-mail.' })

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
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })

  // Markeer als verzonden in onze pijplijn.
  const ids = sendable.map((o: any) => o.id)
  await admin.from('lead_outreach')
    .update({ status: 'pushed', updated_at: new Date().toISOString() }).in('id', ids)

  return NextResponse.json({ ok: true, sent: sendable.length })
}
