import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Activeert / pauzeert de leadmachine voor één klant van de agency.
// Maakt of werkt één lead_campaign per (agency, client) bij.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('agency_id, role').eq('id', user.id).single()
  if (!profile?.agency_id) return NextResponse.json({ error: 'Geen agency' }, { status: 403 })

  const isManager = MANAGER_ROLES.has(profile.role) || user.email === SUPER_ADMIN_EMAIL
  if (!isManager) return NextResponse.json({ error: 'Geen rechten' }, { status: 403 })

  // Feature moet aanstaan voor deze agency.
  const { data: agency } = await admin
    .from('agencies').select('features').eq('id', profile.agency_id).single()
  if (!agency?.features?.lead_machine) {
    return NextResponse.json({ error: 'Leadmachine staat uit voor deze agency' }, { status: 403 })
  }

  const body = await req.json()
  const clientId: string | null = body.clientId ?? null
  const region: string = (body.region ?? '').trim()
  const sbiCode: string | null = body.sbiCode ? String(body.sbiCode).trim() : null
  const VALID_SERVICES = new Set(['website', 'social', 'ads', 'video', 'recruitment', 'local'])
  const service: string = VALID_SERVICES.has(body.service) ? body.service : 'website'
  const autoApprove: boolean = body.autoApprove !== false // standaard automatisch
  const inspiration: string | null = typeof body.inspiration === 'string' ? body.inspiration.trim().slice(0, 2000) || null : null
  const rules: string | null = typeof body.rules === 'string' ? body.rules.trim().slice(0, 2000) || null : null
  const smartleadCampaignId: string | null = typeof body.smartleadCampaignId === 'string' ? body.smartleadCampaignId.trim() || null : null
  const signature: string | null = typeof body.signature === 'string' ? body.signature.trim().slice(0, 1000) || null : null
  const action: 'activate' | 'pause' = body.action === 'pause' ? 'pause' : 'activate'

  // Eén plek voor de instellingen (zowel bij aanmaken als bijwerken).
  const settings = { service, auto_approve: autoApprove, inspiration, rules, smartlead_campaign_id: smartleadCampaignId, signature }

  if (action === 'activate' && !region) {
    return NextResponse.json({ error: 'Regio is verplicht' }, { status: 400 })
  }

  // Klant moet bij deze agency horen.
  let clientName = 'Eigen lead-gen'
  if (clientId) {
    const { data: client } = await admin
      .from('clients').select('id, company_name, agency_id').eq('id', clientId).single()
    if (!client || client.agency_id !== profile.agency_id) {
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 })
    }
    clientName = client.company_name
  }

  // Bestaande campagne voor deze (agency, client) zoeken.
  const existingQuery = admin
    .from('lead_campaigns').select('id').eq('agency_id', profile.agency_id)
  const { data: existing } = clientId
    ? await existingQuery.eq('client_id', clientId).limit(1).maybeSingle()
    : await existingQuery.is('client_id', null).limit(1).maybeSingle()

  const status = action === 'activate' ? 'active' : 'paused'
  const payload = {
    agency_id: profile.agency_id,
    client_id: clientId,
    created_by: user.id,
    name: `Leadmachine — ${clientName}`,
    status,
    region: region || null,
    sbi_code: sbiCode,
    settings,
  }

  if (existing) {
    const { error } = await admin.from('lead_campaigns')
      .update({ status, region: region || null, sbi_code: sbiCode, settings, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, campaignId: existing.id, status })
  }

  const { data: created, error } = await admin
    .from('lead_campaigns').insert(payload).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, campaignId: created.id, status })
}
