import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[/api/clients] Auth error:', authError)
      return NextResponse.json([], { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (profileError) console.error('[/api/clients] Profile error:', profileError)
    if (!profile?.agency_id) {
      console.error('[/api/clients] No agency_id for user', user.id)
      return NextResponse.json([])
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .order('company_name')

    if (clientsError) console.error('[/api/clients] Clients error:', clientsError)

    return NextResponse.json(clients || [])
  } catch (e) {
    console.error('[/api/clients] Unexpected error:', e)
    return NextResponse.json([])
  }
}
