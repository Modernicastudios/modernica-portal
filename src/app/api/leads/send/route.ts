import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { smartleadConfigured } from '@/lib/leadmachine/smartlead'
import { pushQueuedForCampaign } from '@/lib/leadmachine/dispatch'
import { rateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const maxDuration = 60

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Duwt de goedgekeurde leads van een campagne naar de gekoppelde Smartlead-campagne.
export async function POST(req: NextRequest) {
  const rl = rateLimit(rateLimitKey(req, 'leads:send'), 10, 60_000)
  if (!rl.ok) return rateLimitResponse(rl.retryAfter)

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

  const result = await pushQueuedForCampaign(
    { id: campaign.id, agency_id: campaign.agency_id, client_id: campaign.client_id, settings: campaign.settings as { smartlead_campaign_id?: string } | null },
    admin,
  )
  if (result.error) {
    logger.error('[leads/send] pushQueued failed', { err: result.error, campaignId, agencyId: profile.agency_id })
    return NextResponse.json({ error: result.error }, { status: 502 })
  }
  logger.info('[leads/send] leads pushed', { sent: result.sent, campaignId, agencyId: profile.agency_id })
  if (result.sent === 0) return NextResponse.json({ ok: true, sent: 0, message: 'Geen goedgekeurde leads met geldig e-mailadres.' })

  return NextResponse.json({ ok: true, sent: result.sent })
}
