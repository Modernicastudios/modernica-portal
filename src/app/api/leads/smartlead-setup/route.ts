import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCampaignWithSequence, smartleadConfigured } from '@/lib/leadmachine/smartlead'

export const maxDuration = 30

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Maakt vanuit de app een Smartlead-campagne + sjabloon aan en slaat het
// campagne-ID automatisch op bij de juiste leadcampagne. Daarna hoeft de
// gebruiker in Smartlead alleen nog z'n inboxen te koppelen en op 'aan' te zetten.
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
  if (!smartleadConfigured()) {
    return NextResponse.json({ error: 'Smartlead is nog niet ingesteld (SMARTLEAD_API_KEY).' }, { status: 400 })
  }

  const { campaignId } = await req.json()
  const { data: campaign } = await admin
    .from('lead_campaigns').select('id, agency_id, client_id, settings').eq('id', campaignId).single()
  if (!campaign || campaign.agency_id !== profile.agency_id) {
    return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
  }

  const settings = (campaign.settings as Record<string, unknown> | null) || {}
  // Al gekoppeld? Dan niet nog een keer aanmaken.
  if (settings.smartlead_campaign_id) {
    return NextResponse.json({ ok: true, smartleadCampaignId: settings.smartlead_campaign_id, alreadyLinked: true })
  }

  // Naam + ondertekening op basis van agency / klant.
  const { data: agency } = await admin.from('agencies').select('name').eq('id', profile.agency_id).single()
  const agencyName = agency?.name || 'Onze agency'
  let label = 'Eigen marketing'
  if (campaign.client_id) {
    const { data: client } = await admin.from('clients').select('company_name').eq('id', campaign.client_id).single()
    label = client?.company_name || 'Klant'
  }
  const name = `${agencyName} – ${label} (leadmachine)`

  // Standaard Nederlands sjabloon. {{opening_line}} = de AI-openingszin per lead.
  const subject = 'Even kort, {{first_name}}'
  const htmlBody = [
    '<p>Hi {{first_name}},</p>',
    '<p>{{opening_line}}</p>',
    `<p>Wij van ${agencyName} helpen bedrijven aan meer klanten met slimme websites, social media en advertenties. Ik dacht dat dit ook voor {{company_name}} interessant kon zijn.</p>`,
    '<p>Heb je deze week 10 minuten om kort te sparren?</p>',
    `<p>Groet,<br>${agencyName}</p>`,
  ].join('')

  const result = await createCampaignWithSequence({ name, subject, htmlBody })
  if (!result.ok || !result.campaignId) {
    return NextResponse.json({ error: result.error || 'Aanmaken mislukt' }, { status: 502 })
  }

  // Campagne-ID opslaan bij onze leadcampagne (merge in settings).
  const newSettings = { ...settings, smartlead_campaign_id: result.campaignId }
  await admin.from('lead_campaigns').update({ settings: newSettings, updated_at: new Date().toISOString() }).eq('id', campaign.id)

  return NextResponse.json({ ok: true, smartleadCampaignId: result.campaignId, warning: result.error || null })
}
