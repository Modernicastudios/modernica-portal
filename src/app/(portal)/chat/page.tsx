import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  const agencyId = profile?.agency_id || ''
  const isClient = profile?.role === 'client'
  const clientId = profile?.client_id || null

  let convsQuery = supabase
    .from('conversations')
    .select('*, clients(company_name), messages(id, content, created_at, sender_name)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  // Clients only see conversations linked to their own client_id
  if (isClient && clientId) {
    convsQuery = convsQuery.eq('client_id', clientId) as typeof convsQuery
  }

  const { data: conversations } = await convsQuery

  return <ChatClient conversations={conversations || []} agencyId={agencyId} currentUserId={user.id} currentUserName={profile?.full_name || 'Gebruiker'} isAdmin={!isClient} />
}
