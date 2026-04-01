'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { UserProfile, Agency, Client } from '@/types'
import NotificationBell from './NotificationBell'
import { useClientFilter } from './ClientFilter'
import { ChevronDown, X } from 'lucide-react'

interface Props {
  profile: UserProfile
  agency: Agency | null
  userId: string
  clients?: Client[]
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics/ads': 'Paid Ads Analytics',
  '/analytics/social': 'Social Organic Analytics',
  '/projects': 'Project Board',
  '/content': 'Content Kalender',
  '/ideas': 'Ideeënbord',
  '/meetings': 'Vergaderingen',
  '/chat': 'Berichten',
  '/clients': 'Klantbeheer',
  '/planning': 'Planning Kalender',
  '/approve': 'Goedkeuringen',
  '/roi': 'ROI Dashboard',
  '/reports': 'Rapportage',
  '/media': 'Media Library',
  '/settings/profile': 'Mijn Profiel',
  '/settings/agency': 'Agency Instellingen',
  '/settings/integrations': 'Koppelingen',
  '/settings/billing': 'Abonnement',
  '/admin': 'Platform Beheer',
  '/tijd': 'Tijdregistratie',
}

function getTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title
  }
  return 'Portal'
}

function formatDate(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const CLIENT_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

function getClientColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length]
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export default function Header({ profile, agency, userId, clients: _clientsProp = [] }: Props) {
  const pathname = usePathname()
  const title = getTitle(pathname)
  const { selectedClientId, setSelectedClientId, filterClients } = useClientFilter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = profile.role === 'admin' || profile.role === 'manager' || profile.role === 'super_admin'
  const isSuperAdmin = profile.email === SUPER_ADMIN_EMAIL || profile.role === 'super_admin'

  const selectedClient = filterClients.find(c => c.id === selectedClientId) || null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header style={{
      height: '64px',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(255,255,255,.92)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 12px rgba(26,63,228,.06)',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-syne), sans-serif',
        fontWeight: 700,
        fontSize: '1.15rem',
        color: 'var(--text)',
      }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Client selector — admin only */}
        {(isAdmin || isSuperAdmin) && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: selectedClient ? 'rgba(26,63,228,.06)' : 'var(--card)',
                border: `1px solid ${selectedClient ? 'rgba(26,63,228,.25)' : 'var(--border)'}`,
                borderRadius: '50px',
                padding: '5px 12px',
                fontSize: '.78rem',
                color: selectedClient ? 'var(--accent1)' : 'var(--muted)',
                fontWeight: selectedClient ? 600 : 400,
                cursor: 'pointer',
                transition: 'all .15s',
                whiteSpace: 'nowrap',
                maxWidth: '220px',
              }}
            >
              {selectedClient ? (
                <>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: getClientColor(selectedClient.id),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '.6rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {getInitials(selectedClient.company_name)}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                    {selectedClient.company_name}
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); setSelectedClientId(null); setDropdownOpen(false) }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'rgba(26,63,228,.15)',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={10} />
                  </span>
                </>
              ) : (
                <>
                  Alle klanten
                  <ChevronDown size={13} />
                </>
              )}
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,.12)',
                minWidth: '220px',
                maxHeight: '280px',
                overflowY: 'auto',
                zIndex: 200,
                padding: '6px',
              }}>
                <button
                  onClick={() => { setSelectedClientId(null); setDropdownOpen(false) }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: !selectedClientId ? 'rgba(26,63,228,.06)' : 'transparent',
                    color: !selectedClientId ? 'var(--accent1)' : 'var(--text)',
                    fontSize: '.83rem',
                    fontWeight: !selectedClientId ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Alle klanten
                </button>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                {filterClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => { setSelectedClientId(client.id); setDropdownOpen(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedClientId === client.id ? 'rgba(26,63,228,.06)' : 'transparent',
                      color: selectedClientId === client.id ? 'var(--accent1)' : 'var(--text)',
                      fontSize: '.83rem',
                      fontWeight: selectedClientId === client.id ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: getClientColor(client.id),
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '.62rem',
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}>
                      {getInitials(client.company_name)}
                    </span>
                    {client.company_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Date chip */}
        <span style={{
          fontSize: '.78rem',
          color: 'var(--muted)',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          padding: '6px 14px',
          borderRadius: '50px',
          textTransform: 'capitalize',
        }}>
          {formatDate()}
        </span>

        {/* Agency badge */}
        {agency && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(26,63,228,.08)',
            border: '1px solid rgba(26,63,228,.15)',
            borderRadius: '50px',
            padding: '4px 12px',
            fontSize: '.75rem',
            color: 'var(--accent1)',
            fontWeight: 600,
          }}>
            {agency.name}
          </span>
        )}

        {/* Notification bell */}
        <NotificationBell userId={userId} />
      </div>
    </header>
  )
}
