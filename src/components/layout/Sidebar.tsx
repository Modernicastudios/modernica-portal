'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { UserProfile, Agency, BrandKit, Client } from '@/types'
import { useClientFilter } from './ClientFilter'
import {
  LayoutDashboard, BarChart2, TrendingUp, Kanban, CalendarDays, CheckSquare,
  ThumbsUp, Calendar, Video, MessageSquare, Lightbulb, Image, PieChart,
  FileText, Users, Link2, Settings, CreditCard, Shield, User, LogOut, X,
  BarChart3, Clock, ChevronDown,
} from 'lucide-react'

interface Props {
  profile: UserProfile & { agencies?: Agency }
  agency: Agency | null
  brandKit: BrandKit | null
  clients?: Client[]
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  superAdminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { href: '/analytics/ads', label: 'Paid Ads', icon: <BarChart2 size={16} /> },
  { href: '/analytics/social', label: 'Social Organic', icon: <TrendingUp size={16} /> },
  { href: '/projects', label: 'Project Board', icon: <Kanban size={16} /> },
  { href: '/content', label: 'Content Kalender', icon: <CalendarDays size={16} /> },
  { href: '/chat', label: 'Berichten', icon: <MessageSquare size={16} /> },
  { href: '/clients', label: 'Klantbeheer', icon: <Users size={16} />, adminOnly: true },
  { href: '/settings/profile', label: 'Mijn Profiel', icon: <User size={16} /> },
  { href: '/settings/agency', label: 'Agency Instellingen', icon: <Settings size={16} />, adminOnly: true },
  { href: '/settings/integrations', label: 'Koppelingen', icon: <Link2 size={16} />, adminOnly: true },
  { href: '/settings/billing', label: 'Abonnement', icon: <CreditCard size={16} />, adminOnly: true },
  { href: '/admin', label: 'Platform Beheer', icon: <Shield size={16} />, superAdminOnly: true },
]

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export default function Sidebar({ profile, agency, brandKit, clients: _clientsProp = [], isOpen, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isAdmin = profile.role === 'admin' || profile.role === 'manager' || profile.role === 'super_admin'
  const isSuperAdmin = profile.email === SUPER_ADMIN_EMAIL || profile.role === 'super_admin'
  const isClient = !!profile.client_id

  const { selectedClientId, setSelectedClientId, filterClients, filterLoaded } = useClientFilter()
  const [clientDropOpen, setClientDropOpen] = useState(false)
  const selectedClient = filterClients.find(c => c.id === selectedClientId) || null

  const logoUrl = brandKit?.logo_url || null
  const agencyName = agency?.name || 'Modernica'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const sidebarOpen = isOpen ?? true

  return (
    <>
      {/* Backdrop on mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 99,
          }}
        />
      )}
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--accent1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
      boxShadow: '4px 0 32px rgba(26,63,228,.22)',
      transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 24px 20px',
        borderBottom: '1px solid rgba(255,255,255,.15)',
        position: 'relative',
      }}>
        {/* Close button — mobile only */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,.15)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Sluiten"
          >
            <X size={16} />
          </button>
        )}
        {logoUrl ? (
          <img src={logoUrl} alt={agencyName} style={{ height: '32px', objectFit: 'contain' }} />
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.5px' }}>
              {agencyName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.55)', marginTop: '2px', letterSpacing: '.05em', textTransform: 'uppercase' }}>
              {isSuperAdmin ? 'Super Admin' : 'Portal'}
            </div>
          </>
        )}
      </div>

      {/* Client switcher — admin only */}
      {(isAdmin || isSuperAdmin) && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.12)', position: 'relative' }}>
          <div style={{ fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '6px' }}>
            Klant context
          </div>
          <button
            onClick={() => setClientDropOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              background: selectedClient ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.1)',
              border: `1px solid ${selectedClient ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.15)'}`,
              borderRadius: '8px', padding: '7px 10px', cursor: 'pointer',
              color: '#fff', fontSize: '.8rem', fontWeight: selectedClient ? 700 : 400,
            }}
          >
            {selectedClient ? (
              <>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 800, flexShrink: 0 }}>
                  {selectedClient.company_name.slice(0,2).toUpperCase()}
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                  {selectedClient.company_name}
                </span>
                <span onClick={e => { e.stopPropagation(); setSelectedClientId(null) }} style={{ opacity: .7, display: 'flex', alignItems: 'center' }}>
                  <X size={13} />
                </span>
              </>
            ) : (
              <>
                <Users size={14} style={{ opacity: .7, flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', opacity: .75 }}>Alle klanten</span>
                <ChevronDown size={13} style={{ opacity: .6 }} />
              </>
            )}
          </button>

          {clientDropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% - 2px)', left: '14px', right: '14px',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
              zIndex: 200, maxHeight: '260px', overflowY: 'auto', padding: '4px',
            }}>
              <button
                onClick={() => { setSelectedClientId(null); setClientDropOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', background: !selectedClientId ? 'rgba(26,63,228,.07)' : 'transparent', color: !selectedClientId ? 'var(--accent1)' : 'var(--text)', fontSize: '.82rem', fontWeight: !selectedClientId ? 700 : 400, cursor: 'pointer', textAlign: 'left' }}
              >
                <Users size={14} style={{ opacity: .5 }} /> Alle klanten
              </button>
              {filterClients.length > 0 && <div style={{ height: '1px', background: 'var(--border)', margin: '3px 0' }} />}
              {filterClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClientId(c.id); setClientDropOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', background: selectedClientId === c.id ? 'rgba(26,63,228,.07)' : 'transparent', color: selectedClientId === c.id ? 'var(--accent1)' : 'var(--text)', fontSize: '.82rem', fontWeight: selectedClientId === c.id ? 700 : 400, cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {c.company_name.slice(0,2).toUpperCase()}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company_name}</span>
                </button>
              ))}
              {filterLoaded && filterClients.length === 0 && (
                <div style={{ padding: '10px', fontSize: '.78rem', color: 'var(--muted)', textAlign: 'center' }}>Geen klanten</div>
              )}
              {!filterLoaded && filterClients.length === 0 && (
                <div style={{ padding: '10px', fontSize: '.78rem', color: 'var(--muted)', textAlign: 'center' }}>Laden...</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        {/* Top section */}
        {(isAdmin || isSuperAdmin) && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '4px 12px 8px' }}>
              Overzicht
            </div>
            <NavLink href="/dashboard" label="Dashboard" icon={<LayoutDashboard size={16} />} active={pathname === '/dashboard'} />
            <NavLink href="/analytics/ads" label="Paid Ads" icon={<BarChart2 size={16} />} active={pathname.startsWith('/analytics/ads')} />
            <NavLink href="/analytics/social" label="Social Organic" icon={<TrendingUp size={16} />} active={pathname.startsWith('/analytics/social')} />
          </div>
        )}

        {!isAdmin && !isSuperAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '4px 12px 8px' }}>
              Mijn portaal
            </div>
            <NavLink href="/dashboard" label="Dashboard" icon={<LayoutDashboard size={16} />} active={pathname === '/dashboard'} />
          </div>
        )}

        {/* SHARED: visible for both admin and client */}
        <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '4px 12px 8px' }}>
          {isAdmin ? 'Werkruimte' : 'Mijn portaal'}
        </div>
        <NavLink href="/projects" label="Project Board" icon={<Kanban size={16} />} active={pathname.startsWith('/projects')} />
        <NavLink href="/taken" label="Taken" icon={<CheckSquare size={16} />} active={pathname.startsWith('/taken')} />
        <NavLink href="/content" label="Content Kalender" icon={<CalendarDays size={16} />} active={pathname.startsWith('/content') && !pathname.includes('compose')} />
        <NavLink href="/approve" label="Goedkeuringen" icon={<ThumbsUp size={16} />} active={pathname.startsWith('/approve')} />
        <NavLink href="/planning" label="Planning Kalender" icon={<Calendar size={16} />} active={pathname.startsWith('/planning')} />
        <NavLink href="/meetings" label="Vergaderingen" icon={<Video size={16} />} active={pathname.startsWith('/meetings')} />
        <NavLink href="/chat" label="Berichten" icon={<MessageSquare size={16} />} active={pathname.startsWith('/chat')} />
        <NavLink href="/tijd" label="Tijdregistratie" icon={<Clock size={16} />} active={pathname.startsWith('/tijd')} />

        {/* ADMIN ONLY */}
        {(isAdmin || isSuperAdmin) && (
          <>
            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '12px 12px 6px' }}>
              Creatie
            </div>
            <NavLink href="/ideas" label="Ideeënbord" icon={<Lightbulb size={16} />} active={pathname.startsWith('/ideas')} />
            <NavLink href="/media" label="Media Library" icon={<Image size={16} />} active={pathname.startsWith('/media')} />

            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '12px 12px 6px' }}>
              Analyse
            </div>
            <NavLink href="/analytics/ads" label="Paid Ads" icon={<BarChart2 size={16} />} active={pathname.startsWith('/analytics/ads')} />
            <NavLink href="/analytics/social" label="Social Organic" icon={<TrendingUp size={16} />} active={pathname.startsWith('/analytics/social')} />
            <NavLink href="/roi" label="ROI Dashboard" icon={<BarChart3 size={16} />} active={pathname.startsWith('/roi')} />
            <NavLink href="/reports" label="Rapportage" icon={<FileText size={16} />} active={pathname.startsWith('/reports')} />

            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '12px 12px 6px' }}>
              Beheer
            </div>
            <NavLink href="/clients" label="Klantbeheer" icon={<Users size={16} />} active={pathname.startsWith('/clients')} />
            <NavLink href="/settings/integrations" label="Koppelingen" icon={<Link2 size={16} />} active={pathname.startsWith('/settings/integrations')} />
            <NavLink href="/settings/agency" label="Agency Instellingen" icon={<Settings size={16} />} active={pathname.startsWith('/settings/agency')} />
            <NavLink href="/settings/billing" label="Abonnement" icon={<CreditCard size={16} />} active={pathname.startsWith('/settings/billing')} />
          </>
        )}

        {isSuperAdmin && (
          <>
            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '12px 12px 6px' }}>
              Super Admin
            </div>
            <NavLink href="/admin" label="Platform Beheer" icon={<Shield size={16} />} active={pathname === '/admin'} />
            <NavLink href="/admin/tickets" label="Support Tickets" icon={<MessageSquare size={16} />} active={pathname.startsWith('/admin/tickets')} />
          </>
        )}

        <div style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '12px 12px 6px' }}>
          Account
        </div>
        <NavLink href="/settings/profile" label="Mijn Profiel" icon={<User size={16} />} active={pathname.startsWith('/settings/profile')} />
      </nav>

      {/* User chip */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,.15)' }}>
        <div
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,.12)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: profile.avatar_url ? 'none' : 'rgba(255,255,255,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.75rem', fontWeight: 700, color: '#fff',
            border: '2px solid rgba(255,255,255,.4)',
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name}
            </div>
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LogOut size={14} />
              Uitloggen
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '.88rem',
        color: active ? '#fff' : 'rgba(255,255,255,.6)',
        background: active ? 'rgba(255,255,255,.18)' : 'transparent',
        textDecoration: 'none',
        transition: 'all .18s',
        marginBottom: '2px',
        fontWeight: active ? 600 : 400,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
  )
}
