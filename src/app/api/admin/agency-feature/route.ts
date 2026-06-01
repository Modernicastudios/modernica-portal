import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

// Toelaatbare à-la-carte features die de super admin per agency mag schakelen.
const TOGGLEABLE = new Set(['lead_machine'])

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Niet gemachtigd' }, { status: 403 })
  }

  const { agencyId, feature, enabled } = await req.json()
  if (typeof agencyId !== 'string' || !TOGGLEABLE.has(feature) || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: agency, error: readErr } = await admin
    .from('agencies').select('features').eq('id', agencyId).single()
  if (readErr || !agency) {
    return NextResponse.json({ error: 'Agency niet gevonden' }, { status: 404 })
  }

  const features = { ...(agency.features || {}), [feature]: enabled }
  const { error: updErr } = await admin
    .from('agencies').update({ features }).eq('id', agencyId)
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, features })
}
