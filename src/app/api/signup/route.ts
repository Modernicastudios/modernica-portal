import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Agency-registratie volledig server-side: RLS blokkeert een directe insert in
// `agencies` vanuit de browser, dus we maken gebruiker + agency + profiel +
// brand kit aan met de service-role client en bevestigen de gebruiker meteen.
export async function POST(req: NextRequest) {
  try {
  // Max 3 signups per 10 minutes per IP
  const rl = rateLimit(rateLimitKey(req, 'signup'), 3, 10 * 60_000)
  if (!rl.ok) return rateLimitResponse(rl.retryAfter)

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 }) }
  const fullName = String(body.fullName || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const agencyName = String(body.agencyName || '').trim()
  const agencySlug = String(body.agencySlug || '').trim().toLowerCase()

  if (!fullName || !email || password.length < 8 || !agencyName || !agencySlug) {
    return NextResponse.json({ error: 'Vul alle velden correct in (wachtwoord min. 8 tekens).' }, { status: 400 })
  }
  if (!/^[a-z0-9-]+$/.test(agencySlug)) {
    return NextResponse.json({ error: 'Ongeldige agency-URL.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Slug moet uniek zijn.
  const { data: slugTaken } = await admin.from('agencies').select('id').eq('slug', agencySlug).maybeSingle()
  if (slugTaken) {
    return NextResponse.json({ error: 'Deze agency-URL is al in gebruik. Kies een andere.' }, { status: 409 })
  }

  // 1. Bevestigde auth-gebruiker aanmaken.
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (userErr || !created.user) {
    const msg = /already.*registered|exists/i.test(userErr?.message || '')
      ? 'Er bestaat al een account met dit e-mailadres.'
      : (userErr?.message || 'Account aanmaken mislukt.')
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  const userId = created.user.id

  // 2. Agency aanmaken.
  const { data: agency, error: agencyErr } = await admin.from('agencies').insert({
    name: agencyName,
    slug: agencySlug,
    subscription_plan: 'free',
    subscription_status: 'trialing',
    max_clients: 5,
    max_social_accounts: 10,
    features: {},
  }).select('id').single()
  if (agencyErr || !agency) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Agency aanmaken mislukt: ' + (agencyErr?.message || '') }, { status: 500 })
  }

  // 3. Profiel + brand kit.
  const { error: profileErr } = await admin.from('user_profiles').insert({
    id: userId,
    email,
    full_name: fullName,
    role: 'admin',
    agency_id: agency.id,
    timezone: 'Europe/Amsterdam',
  })
  if (profileErr) {
    await admin.from('agencies').delete().eq('id', agency.id)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Profiel aanmaken mislukt: ' + profileErr.message }, { status: 500 })
  }

  await admin.from('brand_kits').insert({
    agency_id: agency.id,
    primary_color: '#1a3fe4',
    secondary_color: '#4f7bff',
    powered_by_visible: true,
  })

  logger.info('[signup] new agency created', { email, agencySlug })
  return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('[signup] unexpected error', { err: String(err) })
    return NextResponse.json({ error: 'Registratie mislukt. Probeer het later opnieuw.' }, { status: 500 })
  }
}
