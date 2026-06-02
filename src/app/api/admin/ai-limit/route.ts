import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

// Super admin stelt de AI-maandlimiet (USD) per agency in. null = globale standaard.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: me } = await admin.from('user_profiles').select('role').eq('id', user.id).single()
  const isSuper = me?.role === 'super_admin' || user.email?.toLowerCase() === SUPER_ADMIN_EMAIL
  if (!isSuper) return NextResponse.json({ error: 'Niet gemachtigd' }, { status: 403 })

  const { agencyId, limitUsd } = await req.json()
  if (typeof agencyId !== 'string') {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 })
  }
  // Leeg/null = terug naar globale standaard. Anders een geldig bedrag (0–100000).
  let value: number | null = null
  if (limitUsd !== null && limitUsd !== '' && limitUsd !== undefined) {
    const n = Number(limitUsd)
    if (!Number.isFinite(n) || n < 0 || n > 100000) {
      return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 })
    }
    value = n
  }

  const { error } = await admin.from('agencies').update({ ai_monthly_limit_usd: value }).eq('id', agencyId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, limitUsd: value })
}
