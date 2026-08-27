import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { queue } from '@/lib/queue'

export async function POST(req: NextRequest) {
  // 20 invitations per minute per IP
  const rl = rateLimit(rateLimitKey(req, 'invite'), 20, 60_000)
  if (!rl.ok) return rateLimitResponse(rl.retryAfter)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, email } = await req.json()
  if (!clientId || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  // Basale e-mailvalidatie.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
  }

  const { data: profile } = await supabase.from('user_profiles').select('agency_id, full_name').eq('id', user.id).single()
  if (!profile?.agency_id) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

  // Klant moet bij de agency van de gebruiker horen (geen cross-tenant uitnodigingen).
  const { data: client } = await supabase.from('clients')
    .select('company_name').eq('id', clientId).eq('agency_id', profile.agency_id).single()
  if (!client) return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 })
  const { data: agency } = await supabase.from('agencies').select('name').eq('id', profile.agency_id).single()

  // Create invitation record
  const { data: invitation, error } = await supabase
    .from('client_invitations')
    .insert({
      agency_id: profile.agency_id,
      client_id: clientId,
      email: email.toLowerCase().trim(),
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Uitnodiging al verzonden naar dit e-mailadres' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send email asynchronously via background queue
  const supabaseCopy = supabase
  queue.enqueue('send-invitation-email', async () => {
    const result = await supabaseCopy.functions.invoke('send-email', {
      body: {
        to: email,
        type: 'invitation',
        data: {
          token: invitation.token,
          agencyName: agency?.name || 'Modernica',
          clientName: client?.company_name || 'uw bedrijf',
          inviterName: profile.full_name || 'Het team',
        },
      },
    })
    if (result.error) logger.error('[invitations/send] email failed', { err: String(result.error), invitationId: invitation.id })
    else logger.info('[invitations/send] email sent', { to: email, invitationId: invitation.id })
  })

  return NextResponse.json({ success: true, invitationId: invitation.id })
}
