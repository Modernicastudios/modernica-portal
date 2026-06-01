import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])
const VALID_STATUS = new Set(['draft', 'queued', 'pushed', 'skipped', 'replied', 'won', 'lost'])

// CRM-acties op een outreach-rij: status verzetten in de pijplijn, of een
// gewonnen lead doorkoppelen naar een echte klant in `clients`.
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

  const { outreachId, action, status } = await req.json()
  if (typeof outreachId !== 'string') return NextResponse.json({ error: 'outreachId ontbreekt' }, { status: 400 })

  // Outreach moet bij deze agency horen.
  const { data: row } = await admin
    .from('lead_outreach')
    .select('id, agency_id, company_id, contact_id, lead_companies(*), lead_contacts(*)')
    .eq('id', outreachId).single()
  if (!row || row.agency_id !== profile.agency_id) {
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 })
  }

  if (action === 'status') {
    if (!VALID_STATUS.has(status)) return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
    const { error } = await admin.from('lead_outreach')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', outreachId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status })
  }

  if (action === 'convert') {
    const co = (row as any).lead_companies
    const ct = (row as any).lead_contacts
    const { data: client, error } = await admin.from('clients').insert({
      agency_id: profile.agency_id,
      company_name: co?.name || 'Nieuwe klant',
      city: co?.city || null,
      website: co?.website_url || null,
      phone: co?.phone || null,
      contact_name: ct?.full_name || null,
      contact_email: ct?.email || null,
      email: ct?.email || null,
      status: 'active',
      notes: 'Aangemaakt vanuit de Leadmachine.',
    }).select('id').single()
    if (error) return NextResponse.json({ error: 'Klant aanmaken mislukt: ' + error.message }, { status: 500 })

    await admin.from('lead_outreach')
      .update({ status: 'won', updated_at: new Date().toISOString() }).eq('id', outreachId)
    return NextResponse.json({ ok: true, status: 'won', clientId: client.id })
  }

  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 })
}
