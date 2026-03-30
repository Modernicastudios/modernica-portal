'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileHeader from './MobileHeader'
import SupportButton from './SupportButton'
import type { UserProfile, Agency, BrandKit } from '@/types'

interface Props {
  profile: UserProfile & { agencies?: Agency }
  agency: Agency | null
  brandKit: BrandKit | null
  userId: string
  children: React.ReactNode
}

export default function PortalShell({ profile, agency, brandKit, userId, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // On desktop, sidebar is always open (controlled by CSS transform in Sidebar)
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
        <Header profile={profile} agency={agency} userId={userId} />
        <main style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
          {children}
        </main>
      </div>

      <SupportButton agencyId={profile.agency_id || ''} userId={userId} />
    </div>
  )
}
