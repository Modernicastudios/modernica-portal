import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aiOpeningLine } from '@/lib/leadmachine/pipeline'

export const maxDuration = 30

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Genereert één voorbeeldmail met de huidige instellingen — zonder bedrijven te
// scrapen. Zo kun je toon/regels afstellen vóór je een hele batch draait.
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

  const body = await req.json()
  const region: string = (body.region || '').trim()
  const sbi: string = (body.sbi || '').trim()
  const service: string = body.service || 'website'
  const inspiration: string | null = typeof body.inspiration === 'string' ? body.inspiration.trim() || null : null
  const rules: string | null = typeof body.rules === 'string' ? body.rules.trim() || null : null

  const { data: brand } = await admin
    .from('brand_kits').select('brand_voice').eq('agency_id', profile.agency_id).maybeSingle()

  const result = await aiOpeningLine({
    name: `een ${sbi || 'bedrijf'}${region ? ` uit ${region}` : ''}`,
    city: region || null,
    websiteUrl: null,
    contactName: null,
    service,
    brandVoice: (brand as { brand_voice?: string } | null)?.brand_voice || null,
    inspiration,
    rules,
  })

  if (!result.line) {
    return NextResponse.json({ error: 'Geen voorbeeld gelukt — staat ANTHROPIC_API_KEY en tegoed goed?' }, { status: 502 })
  }
  return NextResponse.json({ ok: true, line: result.line })
}
