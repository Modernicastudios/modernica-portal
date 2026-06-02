import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_ROLES = new Set(['admin', 'manager', 'super_admin'])
// Alleen deze velden van de brand kit mogen via dit endpoint worden geschreven.
const BRAND_FIELDS = [
  'primary_color', 'secondary_color', 'logo_url', 'contact_email', 'email_signature',
  'welcome_message', 'welcome_subtitle',
  'instagram_handle', 'tiktok_handle', 'linkedin_handle', 'youtube_handle', 'facebook_handle',
] as const

// Slaat agency-naam + brand kit op via de service-role (na rolcheck), zodat
// RLS de browser niet blokkeert maar de toegang wél server-side is afgeschermd.
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
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : null
  const brand = (body.brand && typeof body.brand === 'object') ? body.brand as Record<string, unknown> : {}

  // Ontdek welke kolommen brand_kits écht heeft (voorkomt "column not found").
  const { data: existing } = await admin
    .from('brand_kits').select('*').eq('agency_id', profile.agency_id).maybeSingle()
  const existingCols = existing ? new Set(Object.keys(existing)) : null

  const fields: Record<string, unknown> = {}
  for (const f of BRAND_FIELDS) {
    if (!(f in brand)) continue
    if (existingCols && !existingCols.has(f)) continue // kolom bestaat niet -> overslaan
    fields[f] = typeof brand[f] === 'string' ? (brand[f] as string).slice(0, 4000) : brand[f]
  }

  if (name) {
    const { error } = await admin.from('agencies').update({ name }).eq('id', profile.agency_id)
    if (error) return NextResponse.json({ error: `agencies: ${error.message}` }, { status: 500 })
  }

  // Bijwerken als er al een brand kit is, anders aanmaken (geen ON CONFLICT nodig).
  if (existing) {
    const { error } = await admin.from('brand_kits').update(fields).eq('agency_id', profile.agency_id)
    if (error) return NextResponse.json({ error: `brand_kits: ${error.message}` }, { status: 500 })
  } else {
    const { error } = await admin.from('brand_kits').insert({ agency_id: profile.agency_id, ...fields })
    if (error) return NextResponse.json({ error: `brand_kits: ${error.message}` }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
