'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileHeader from './MobileHeader'
import SupportButton from './SupportButton'
import { ClientFilterProvider, useClientFilter } from './ClientFilter'
import type { UserProfile, Agency, BrandKit, Client } from '@/types'
import { X } from 'lucide-react'

interface Props {
  profile: UserProfile & { agencies?: Agency }
  agency: Agency | null
  brandKit: BrandKit | null
  userId: string
  clients: Client[]
  children: React.ReactNode
}

function ClientFilterBanner() {
  const { selectedClientId, setSelectedClientId, filterClients } = useClientFilter()
  const selectedClient = filterClients.find(c => c.id === selectedClientId) || null

  if (!selectedClient) return null

  return (
    <div style={{
      background: 'rgba(26,63,228,.06)',
      borderBottom: '1px solid rgba(26,63,228,.15)',
      padding: '8px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '.82rem',
      color: 'var(--accent1)',
    }}>
      <span style={{ fontWeight: 600 }}>Gefilterd op klant:</span>
      <span style={{ fontWeight: 700 }}>{selectedClient.company_name}</span>
      <span style={{ color: 'var(--muted)', flex: 1 }}>— Alle overzichten tonen alleen data voor deze klant</span>
      <button
        onClick={() => setSelectedClientId(null)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(26,63,228,.12)',
          border: 'none',
          borderRadius: '50px',
          padding: '3px 10px',
          fontSize: '.75rem',
          color: 'var(--accent1)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <X size={12} /> Filter wissen
      </button>
    </div>
  )
}

function ShellInner({ profile, agency, brandKit, userId, clients, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const agencyName = agency?.name || 'Modernica'

  return (
    <div
      className="shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      {/* Mobile top bar */}
      <MobileHeader
        agencyName={agencyName}
        userId={userId}
        onMenuOpen={() => setSidebarOpen(true)}
      />

      {/* Sidebar */}
      <Sidebar
        profile={profile}
        agency={agency}
        brandKit={brandKit}
        clients={clients}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div style={{
        marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
        flex: 1,
        minHeight: '100vh',
        overflow: 'hidden',
        paddingTop: isMobile ? '56px' : 0,
      }}>
        <Header profile={profile} agency={agency} userId={userId} clients={clients} />
        <ClientFilterBanner />
        <main style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
          {children}
        </main>
      </div>

      <SupportButton agencyId={profile.agency_id || ''} userId={userId} />
    </div>
  )
}

export default function PortalShell(props: Props) {
  return (
    <ClientFilterProvider agencyId={props.profile.agency_id || ''}>
      <ShellInner {...props} />
    </ClientFilterProvider>
  )
}
