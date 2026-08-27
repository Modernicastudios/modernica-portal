import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runCampaign } from '@/lib/leadmachine/pipeline'
import { rateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export const maxDuration = 60

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

export async function POST(req: NextRequest) {
  // Max 5 campaign runs per minute per IP (heavy operation)
  const rl = rateLimit(rateLimitKey(req, 'leads:run'), 5, 60_000)
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

  const { data: agency } = await admin.from('agencies').select('features').eq('id', profile.agency_id).single()
  if (!agency?.features?.lead_machine) {
    return NextResponse.json({ error: 'Leadmachine staat uit voor deze agency' }, { status: 403 })
  }

  const body = await req.json()
  const campaignId: string = body.campaignId
  const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 20)
  if (typeof campaignId !== 'string') {
    return NextResponse.json({ error: 'campaignId ontbreekt' }, { status: 400 })
  }

  // Campagne moet bij deze agency horen.
  const { data: campaign } = await admin
    .from('lead_campaigns').select('id, agency_id').eq('id', campaignId).single()
  if (!campaign || campaign.agency_id !== profile.agency_id) {
    return NextResponse.json({ error: 'Campagne niet gevonden' }, { status: 404 })
  }

  // Harde maandlimiet per agency (kostenrem). Instelbaar via env LEAD_MONTHLY_CAP.
  const monthlyCap = Number(process.env.LEAD_MONTHLY_CAP) || 2000
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { count: usedThisMonth } = await admin
    .from('lead_companies')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .gte('created_at', firstOfMonth)
  const used = usedThisMonth || 0
  if (used >= monthlyCap) {
    return NextResponse.json({ error: `Maandlimiet bereikt (${monthlyCap} leads). Verhoog de limiet of wacht tot volgende maand.` }, { status: 429 })
  }
  const effectiveLimit = Math.min(limit, monthlyCap - used)

  try {
    const summary = await runCampaign(campaignId, effectiveLimit)
    logger.info('[leads/run] campaign completed', { campaignId, agencyId: profile.agency_id, summary })
    return NextResponse.json({ ok: true, summary })
  } catch (e) {
    logger.error('[leads/run] runCampaign failed', { err: String(e), campaignId, agencyId: profile.agency_id })
    return NextResponse.json({ error: 'Er ging iets mis bij het ophalen van leads. Probeer het later opnieuw.' }, { status: 500 })
  }
}
