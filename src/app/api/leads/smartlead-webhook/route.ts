import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Ontvangt reactie-events van Smartlead. Zet deze URL in Smartlead als webhook
// voor 'EMAIL_REPLY'. Optioneel: ?secret=... dat overeenkomt met SMARTLEAD_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const secret = process.env.SMARTLEAD_WEBHOOK_SECRET
  if (secret && req.nextUrl.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Ongeldig' }, { status: 401 })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* leeg */ }

  // E-mailadres van de prospect uit diverse mogelijke velden halen.
  const email: string | null = (
    body.to_email || body.lead_email || body.email ||
    body.lead?.email || body.to?.email || body.data?.lead_email || null
  )
  const eventType: string = String(body.event_type || body.event || body.type || '').toUpperCase()
  // Alleen op echte reacties reageren (val terug op 'wel verwerken' als type onbekend is).
  const isReply = !eventType || /REPLY|REPLIED/.test(eventType)
  if (!email || !isReply) return NextResponse.json({ ok: true, ignored: true })

  const admin = createAdminClient()
  const { data: contacts } = await admin
    .from('lead_contacts').select('id, agency_id').ilike('email', email.trim())
  if (!contacts || contacts.length === 0) return NextResponse.json({ ok: true, matched: 0 })

  const contactIds = contacts.map(c => c.id)
  const { data: rows } = await admin
    .from('lead_outreach')
    .select('id, agency_id, company_id, lead_companies(name)')
    .in('contact_id', contactIds)

  if (!rows || rows.length === 0) return NextResponse.json({ ok: true, matched: 0 })

  // Naar 'Reactie' zetten.
  await admin.from('lead_outreach')
    .update({ status: 'replied', updated_at: new Date().toISOString() })
    .in('id', rows.map(r => r.id))

  // Melding (belletje) voor de managers van de agency.
  const agencyId = rows[0].agency_id
  const companyName = (rows[0] as any).lead_companies?.name || 'een bedrijf'
  const { data: managers } = await admin
    .from('user_profiles').select('id').eq('agency_id', agencyId).in('role', ['admin', 'manager', 'super_admin'])
  if (managers && managers.length > 0) {
    await admin.from('notifications').insert(managers.map(m => ({
      user_id: m.id,
      agency_id: agencyId,
      title: 'Nieuwe reactie op een lead 🎉',
      body: `${companyName} heeft gereageerd — check je leads-pijplijn.`,
      type: 'lead_reply',
      link_page: '/leads',
      read: false,
    })))
  }

  return NextResponse.json({ ok: true, matched: rows.length })
}
