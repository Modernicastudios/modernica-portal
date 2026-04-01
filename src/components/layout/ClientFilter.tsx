'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface FilterClient {
  id: string
  agency_id: string
  company_name: string
  industry: string | null
  city: string | null
  contact_email: string | null
  created_at: string
}

export interface ClientFilterContextType {
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void
  filterClients: FilterClient[]
}

const ClientFilterContext = createContext<ClientFilterContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
  filterClients: [],
})

export function ClientFilterProvider({ agencyId, children }: { agencyId: string; children: React.ReactNode }) {
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(null)
  const [filterClients, setFilterClients] = useState<FilterClient[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('selected_client_id')
    if (stored) setSelectedClientIdState(stored)
  }, [])

  // Fetch clients using browser client (always works with user session)
  useEffect(() => {
    if (!agencyId) return
    const supabase = createClient()
    supabase
      .from('clients')
      .select('id, agency_id, company_name, industry, city, contact_email, created_at')
      .eq('agency_id', agencyId)
      .order('company_name')
      .then(({ data }) => { if (data) setFilterClients(data) })
  }, [agencyId])

  function setSelectedClientId(id: string | null) {
    setSelectedClientIdState(id)
    if (id) localStorage.setItem('selected_client_id', id)
    else localStorage.removeItem('selected_client_id')
  }

  return (
    <ClientFilterContext.Provider value={{ selectedClientId, setSelectedClientId, filterClients }}>
      {children}
    </ClientFilterContext.Provider>
  )
}

export function useClientFilter() {
  return useContext(ClientFilterContext)
}
