import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientsClient from './ClientsClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'client') redirect('/dashboard')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('agency_id', profile?.agency_id || '')
    .order('company_name')

  const { data: pendingUsers } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('agency_id', profile?.agency_id || '')
    .is('client_id', null)
    .neq('role', 'admin')
    .neq('role', 'manager')
    .neq('id', user.id)

  return <ClientsClient clients={clients || []} pendingUsers={pendingUsers || []} agencyId={profile?.agency_id || ''} />
}
