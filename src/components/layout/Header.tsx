'use client'

import { usePathname } from 'next/navigation'
import type { UserProfile, Agency } from '@/types'

interface Props {
  profile: UserProfile
  agency: Agency | null
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics/ads': 'Paid Ads',
  '/analytics/social': 'Social Organic',
  '/projects': 'Project Board',
  '/content': 'Content Kalender',
  '/chat': 'Berichten',
  '/clients': 'Klantbeheer',
  '/settings/profile': 'Mijn Profiel',
  '/settings/agency': 'Agency Instellingen',
  '/settings/integrations': 'Koppelingen',
  '/settings/billing': 'Abonnement',
  '/admin': 'Platform Beheer',
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

export default function Header({ profile, agency }: Props) {
  const pathname = usePathname()
  const title = getTitle(pathname)

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

        {/* Agency badge for admin */}
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
      </div>
    </header>
  )
}
