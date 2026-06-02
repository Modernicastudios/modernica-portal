import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Ontvangt reactie-events van Smartlead. Zet deze URL in Smartlead als webhook
// voor 'EMAIL_REPLY', inclusief ?secret=... dat overeenkomt met SMARTLEAD_WEBHOOK_SECRET.
// Het geheim is VERPLICHT: zonder geheim weigeren we elk verzoek, anders zou
// iedereen leads op 'gereageerd' kunnen zetten en valse meldingen kunnen sturen.
export async function POST(req: NextRequest) {
  const secret = process.env.SMARTLEAD_WEBHOOK_SECRET
  if (!secret || req.nextUrl.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Ongeldig' }, { status: 401 })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* leeg */ }

  // E-mailadres van de prospect uit diverse mogelijke velden halen.
  const email: string | null = (
    body.to_email || body.lead_email || body.email ||
    body.lead?.email || body.to?.email || body.data?.lead_email || null
  )
  // Smartlead-campagne-ID uit de payload — hiermee weten we welke agency dit is.
  const smartleadCampaignId: string | null = String(
    body.campaign_id || body.campaign?.id || body.data?.campaign_id || ''
  ) || null
  const eventType: string = String(body.event_type || body.event || body.type || '').toUpperCase()
  // Alleen op echte reacties reageren (val terug op 'wel verwerken' als type onbekend is).
  const isReply = !eventType || /REPLY|REPLIED/.test(eventType)
  if (!email || !isReply) return NextResponse.json({ ok: true, ignored: true })

  const admin = createAdminClient()

  // Welke agency('s) horen bij deze Smartlead-campagne? Zo voorkomen we dat een
  // reactie per ongeluk leads van een ANDERE agency raakt (multi-tenant).
  let scopedAgencyIds: string[] | null = null
  if (smartleadCampaignId) {
    const { data: camps } = await admin
      .from('lead_campaigns').select('agency_id')
      .eq('settings->>smartlead_campaign_id', smartleadCampaignId)
    if (camps && camps.length > 0) scopedAgencyIds = [...new Set(camps.map(c => c.agency_id))]
  }

  // Bijpassende outreach-rijen ophalen — gescoped op de juiste agency('s).
  // Filteren op e-mail via de gekoppelde contactpersoon.
  let contactQ = admin.from('lead_contacts').select('id, agency_id').ilike('email', email.trim())
  if (scopedAgencyIds) contactQ = contactQ.in('agency_id', scopedAgencyIds)
  const { data: contacts } = await contactQ
  if (!contacts || contacts.length === 0) return NextResponse.json({ ok: true, matched: 0 })

  const contactIds = contacts.map(c => c.id)
  let rowQ = admin
    .from('lead_outreach')
    .select('id, agency_id, company_id, lead_companies(name)')
    .in('contact_id', contactIds)
  if (scopedAgencyIds) rowQ = rowQ.in('agency_id', scopedAgencyIds)
  // Indien we het Smartlead-campagne-ID kennen, óók daarop scopen (extra precies).
  if (smartleadCampaignId) rowQ = rowQ.eq('smartlead_campaign_id', smartleadCampaignId)
  const { data: rows } = await rowQ

  if (!rows || rows.length === 0) return NextResponse.json({ ok: true, matched: 0 })

  // Naar 'Reactie' zetten.
  await admin.from('lead_outreach')
    .update({ status: 'replied', updated_at: new Date().toISOString() })
    .in('id', rows.map(r => r.id))

  // Meldingen per agency groeperen — nooit een melding bij de verkeerde agency.
  const byAgency = new Map<string, string>() // agency_id -> bedrijfsnaam
  for (const r of rows) {
    if (!byAgency.has(r.agency_id)) {
      byAgency.set(r.agency_id, (r as any).lead_companies?.name || 'een bedrijf')
    }
  }
  for (const [agencyId, companyName] of byAgency) {
    const { data: managers } = await admin
      .from('user_profiles').select('id').eq('agency_id', agencyId).in('role', ['admin', 'manager', 'super_admin'])
    if (managers && managers.length > 0) {
      await admin.from('notifications').insert(managers.map(m => ({
        user_id: m.id,
        agency_id: agencyId,
        title: 'Nieuwe reactie op een lead',
        body: `${companyName} heeft gereageerd — check je leads-pijplijn.`,
        type: 'lead_reply',
        link_page: '/leads',
        read: false,
      })))
    }
  }

  return NextResponse.json({ ok: true, matched: rows.length })
}
