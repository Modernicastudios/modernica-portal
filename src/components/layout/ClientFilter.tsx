'use client'
import { createContext, useContext, useState, useEffect } from 'react'

export interface ClientFilterContextType {
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void
}

const ClientFilterContext = createContext<ClientFilterContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
})

export function ClientFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('selected_client_id')
    if (stored) setSelectedClientIdState(stored)
  }, [])

  function setSelectedClientId(id: string | null) {
    setSelectedClientIdState(id)
    if (id) localStorage.setItem('selected_client_id', id)
    else localStorage.removeItem('selected_client_id')
  }

  return (
    <ClientFilterContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </ClientFilterContext.Provider>
  )
}

export function useClientFilter() {
  return useContext(ClientFilterContext)
}
