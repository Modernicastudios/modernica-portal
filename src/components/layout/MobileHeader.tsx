'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import NotificationBell from './NotificationBell'

interface Props {
  agencyName: string
  userId: string
  onMenuOpen: () => void
}

export default function MobileHeader({ agencyName, userId, onMenuOpen }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: 'var(--sidebar-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 98,
      boxShadow: '0 2px 12px rgba(26,63,228,.25)',
    }}>
      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        aria-label="Menu openen"
        style={{
          background: 'rgba(255,255,255,.15)',
          border: 'none',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Menu size={20} />
      </button>

      {/* Agency name */}
      <span style={{
        fontFamily: 'var(--font-syne), sans-serif',
        fontWeight: 800,
        fontSize: '1rem',
        color: '#fff',
        letterSpacing: '-0.3px',
        flex: 1,
        textAlign: 'center',
      }}>
        {agencyName}
      </span>

      {/* Notification bell */}
      <div style={{ flexShrink: 0, color: '#fff' }}>
        <NotificationBell userId={userId} />
      </div>
    </div>
  )
}
