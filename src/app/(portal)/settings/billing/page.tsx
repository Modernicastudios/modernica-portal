import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'client') redirect('/dashboard')

  const { data: agency } = await supabase.from('agencies').select('*').eq('id', profile?.agency_id).single()

  return <BillingClient agency={agency} />
}
