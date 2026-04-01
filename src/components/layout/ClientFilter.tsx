'use client'
import { createContext, useContext, useState, useEffect } from 'react'

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
  filterLoaded: boolean
}

const ClientFilterContext = createContext<ClientFilterContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
  filterClients: [],
  filterLoaded: false,
})

export function ClientFilterProvider({ agencyId, children }: { agencyId: string; children: React.ReactNode }) {
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(null)
  const [filterClients, setFilterClients] = useState<FilterClient[]>([])
  const [filterLoaded, setFilterLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('selected_client_id')
    if (stored) setSelectedClientIdState(stored)
  }, [])

  // Fetch clients via API route (uses server-side Supabase client, bypasses RLS issues)
  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then((data: FilterClient[]) => {
        if (Array.isArray(data)) setFilterClients(data)
        setFilterLoaded(true)
      })
      .catch(() => { setFilterLoaded(true) })
  }, [agencyId])

  function setSelectedClientId(id: string | null) {
    setSelectedClientIdState(id)
    if (id) localStorage.setItem('selected_client_id', id)
    else localStorage.removeItem('selected_client_id')
  }

  return (
    <ClientFilterContext.Provider value={{ selectedClientId, setSelectedClientId, filterClients, filterLoaded }}>
      {children}
    </ClientFilterContext.Provider>
  )
}

export function useClientFilter() {
  return useContext(ClientFilterContext)
}
