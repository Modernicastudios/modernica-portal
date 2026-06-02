import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Agency-velden die via dit endpoint mogen worden geschreven (slug = niet wijzigbaar).
const AGENCY_FIELDS = ['name', 'website', 'email', 'phone', 'address', 'vat_number'] as const
// Brand-kit velden.
const BRAND_FIELDS = [
  'primary_color', 'secondary_color', 'logo_url', 'contact_email', 'email_signature',
  'welcome_message', 'welcome_subtitle',
  'instagram_handle', 'tiktok_handle', 'linkedin_handle', 'youtube_handle', 'facebook_handle',
] as const

// Bouwt een schrijf-object met alléén velden die echt als kolom bestaan
// (voorkomt "could not find column"-fouten).
function pickExisting(
  source: Record<string, unknown>,
  allowed: readonly string[],
  existingCols: Set<string> | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of allowed) {
    if (!(f in source)) continue
    if (existingCols && !existingCols.has(f)) continue
    out[f] = typeof source[f] === 'string' ? (source[f] as string).slice(0, 4000) : source[f]
  }
  return out
}

// Slaat agency-gegevens + brand kit op via de service-role (na rolcheck).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('agency_id, role').eq('id', user.id).single()
  if (!profile?.agency_id || !ADMIN_ROLES.has(profile.role)) {
    return NextResponse.json({ error: 'Geen rechten' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  // Backwards-compat: oude payload stuurde alleen { name }.
  const agencyIn: Record<string, unknown> = (body.agency && typeof body.agency === 'object')
    ? body.agency
    : (typeof body.name === 'string' ? { name: body.name } : {})
  const brandIn = (body.brand && typeof body.brand === 'object') ? body.brand as Record<string, unknown> : {}

  // ── Agency: alleen bestaande kolommen wegschrijven ──
  const { data: agencyRow } = await admin
    .from('agencies').select('*').eq('id', profile.agency_id).maybeSingle()
  const agencyCols = agencyRow ? new Set(Object.keys(agencyRow)) : null
  const agencyUpdate = pickExisting(agencyIn, AGENCY_FIELDS, agencyCols)
  if (Object.keys(agencyUpdate).length > 0) {
    const { error } = await admin.from('agencies').update(agencyUpdate).eq('id', profile.agency_id)
    if (error) return NextResponse.json({ error: `agencies: ${error.message}` }, { status: 500 })
  }

  // ── Brand kit (agency-niveau = client_id NULL): bijwerken of aanmaken ──
  // Belangrijk: scope op client_id IS NULL, anders raken we per ongeluk een
  // klant-brandkit (die heeft wél een client_id).
  const { data: brandRow } = await admin
    .from('brand_kits').select('*').eq('agency_id', profile.agency_id).is('client_id', null).maybeSingle()
  const brandCols = brandRow ? new Set(Object.keys(brandRow)) : null
  const brandUpdate = pickExisting(brandIn, BRAND_FIELDS, brandCols)
  if (brandRow) {
    if (Object.keys(brandUpdate).length > 0) {
      const { error } = await admin.from('brand_kits').update(brandUpdate)
        .eq('agency_id', profile.agency_id).is('client_id', null)
      if (error) return NextResponse.json({ error: `brand_kits: ${error.message}` }, { status: 500 })
    }
  } else {
    const { error } = await admin.from('brand_kits').insert({ agency_id: profile.agency_id, client_id: null, ...brandUpdate })
    if (error) return NextResponse.json({ error: `brand_kits: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
