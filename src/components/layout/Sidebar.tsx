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
  BarChart3, Clock, ChevronDown, Target, Search,
} from 'lucide-react'

interface Props {
  profile: UserProfile & { agencies?: Agency }
  agency: Agency | null
  brandKit: BrandKit | null
  clients?: Client[]
  isOpen?: boolean
  onClose?: () => void
}

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
  const isSuperAdmin = profile.role === 'super_admin' || (profile.email || '').toLowerCase() === SUPER_ADMIN_EMAIL
  const isClient = !!profile.client_id
  const leadMachineOn = Boolean((agency as { features?: Record<string, boolean> } | null)?.features?.lead_machine)

  const { selectedClientId, setSelectedClientId, filterClients, filterLoaded } = useClientFilter()
  const [clientDropOpen, setClientDropOpen] = useState(false)
  const selectedClient = filterClients.find(c => c.id === selectedClientId) || null

  // Zoeken + inklapbare groepen in de navigatie.
  const [navQuery, setNavQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nav_collapsed')
      if (raw) setCollapsed(new Set(JSON.parse(raw)))
    } catch { /* localStorage niet beschikbaar */ }
  }, [])
  function toggleSection(label: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label); else next.add(label)
      try { localStorage.setItem('nav_collapsed', JSON.stringify([...next])) } catch { /* noop */ }
      return next
    })
  }

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

  type NavEntry = { href: string; label: string; icon: React.ReactNode; exact?: boolean }
  type NavGroup = { label: string; items: NavEntry[] }

  const adminGroups: NavGroup[] = [
    { label: 'Overzicht', items: [{ href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, exact: true }] },
    { label: 'Klanten & Projecten', items: [
      { href: '/clients', label: 'Klanten', icon: <Users size={16} /> },
      { href: '/projects', label: 'Projecten', icon: <Kanban size={16} /> },
      { href: '/taken', label: 'Taken', icon: <CheckSquare size={16} /> },
      { href: '/planning', label: 'Planning', icon: <Calendar size={16} /> },
      { href: '/meetings', label: 'Vergaderingen', icon: <Video size={16} /> },
    ] },
    { label: 'Content & Social', items: [
      { href: '/content', label: 'Contentkalender', icon: <CalendarDays size={16} /> },
      { href: '/ideas', label: 'Ideeënbord', icon: <Lightbulb size={16} /> },
      { href: '/approve', label: 'Goedkeuringen', icon: <ThumbsUp size={16} /> },
      { href: '/media', label: 'Mediabibliotheek', icon: <Image size={16} /> },
    ] },
    { label: 'Advertenties & Analyse', items: [
      { href: '/analytics/ads', label: 'Advertenties', icon: <BarChart2 size={16} /> },
      { href: '/analytics/social', label: 'Social', icon: <TrendingUp size={16} /> },
      { href: '/roi', label: 'ROI', icon: <BarChart3 size={16} /> },
      { href: '/reports', label: 'Rapportage', icon: <FileText size={16} /> },
    ] },
    ...(leadMachineOn ? [{ label: 'Leadmachine', items: [{ href: '/leads', label: 'Leads & E-mail', icon: <Target size={16} /> }] }] : []),
    { label: 'Communicatie', items: [
      { href: '/chat', label: 'Berichten', icon: <MessageSquare size={16} /> },
      { href: '/tijd', label: 'Tijdregistratie', icon: <Clock size={16} /> },
    ] },
    { label: 'Beheer', items: [
      { href: '/settings/integrations', label: 'Koppelingen', icon: <Link2 size={16} /> },
      { href: '/settings/agency', label: 'Agency-instellingen', icon: <Settings size={16} /> },
      { href: '/settings/billing', label: 'Abonnement', icon: <CreditCard size={16} /> },
      { href: '/settings/profile', label: 'Mijn profiel', icon: <User size={16} /> },
    ] },
    ...(isSuperAdmin ? [{ label: 'Super Admin', items: [
      { href: '/admin', label: 'Platformbeheer', icon: <Shield size={16} />, exact: true },
      { href: '/admin/tickets', label: 'Supporttickets', icon: <MessageSquare size={16} /> },
    ] }] : []),
  ]

  const clientGroups: NavGroup[] = [
    { label: 'Overzicht', items: [{ href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, exact: true }] },
    { label: 'Mijn projecten', items: [
      { href: '/projects', label: 'Projecten', icon: <Kanban size={16} /> },
      { href: '/taken', label: 'Taken', icon: <CheckSquare size={16} /> },
      { href: '/planning', label: 'Planning', icon: <Calendar size={16} /> },
    ] },
    { label: 'Content', items: [
      { href: '/content', label: 'Contentkalender', icon: <CalendarDays size={16} /> },
      { href: '/approve', label: 'Goedkeuringen', icon: <ThumbsUp size={16} /> },
    ] },
    { label: 'Resultaten', items: [
      { href: '/analytics/ads', label: 'Advertenties', icon: <BarChart2 size={16} /> },
      { href: '/analytics/social', label: 'Social', icon: <TrendingUp size={16} /> },
    ] },
    ...(leadMachineOn ? [{ label: 'Leadmachine', items: [{ href: '/leads', label: 'Mijn leads', icon: <Target size={16} /> }] }] : []),
    { label: 'Contact', items: [{ href: '/chat', label: 'Berichten', icon: <MessageSquare size={16} /> }] },
    { label: 'Account', items: [{ href: '/settings/profile', label: 'Mijn profiel', icon: <User size={16} /> }] },
  ]

  const groups: NavGroup[] = (isAdmin || isSuperAdmin) ? adminGroups : clientGroups

  function isActive(item: NavEntry): boolean {
    if (item.exact) return pathname === item.href
    if (item.href === '/content') return pathname.startsWith('/content') && !pathname.includes('compose')
    return pathname.startsWith(item.href)
  }

  const q = navQuery.trim().toLowerCase()
  const searchResults = q ? groups.flatMap(g => g.items).filter(it => it.label.toLowerCase().includes(q)) : null

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
            Filter op klant
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
      <nav style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
        {/* Zoeken — typ en klik, geen twijfel waar iets staat */}
        <div style={{ position: 'relative', marginBottom: '6px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.5)' }} />
          <input
            value={navQuery}
            onChange={e => setNavQuery(e.target.value)}
            placeholder="Zoeken..."
            style={{ width: '100%', padding: '8px 26px 8px 30px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '8px', color: '#fff', fontSize: '.82rem', outline: 'none' }}
          />
          {navQuery && (
            <button onClick={() => setNavQuery('')} aria-label="Wissen" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {searchResults ? (
          searchResults.length === 0 ? (
            <div style={{ padding: '14px 12px', fontSize: '.8rem', color: 'rgba(255,255,255,.5)', textAlign: 'center' }}>Niets gevonden</div>
          ) : (
            searchResults.map(item => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item)} />
            ))
          )
        ) : (
          groups.map(group => {
            const isCollapsed = collapsed.has(group.label)
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleSection(group.label)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 12px 6px', color: 'rgba(255,255,255,.45)' }}
                >
                  <span style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>{group.label}</span>
                  <ChevronDown size={13} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }} />
                </button>
                {!isCollapsed && group.items.map(item => (
                  <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item)} />
                ))}
              </div>
            )
          })
        )}
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
