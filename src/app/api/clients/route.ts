import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return NextResponse.json([])

  const { data: clients } = await supabase
    .from('clients')
    .select('id, agency_id, company_name, industry, city, contact_email, created_at')
    .eq('agency_id', profile.agency_id)
    .order('company_name')

  return NextResponse.json(clients || [])
}
