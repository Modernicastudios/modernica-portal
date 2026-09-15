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
  BarChart3, Clock, ChevronDown, Target, Search, Rocket, Activity,
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
    function checkMobile() { setIsMobile(window.innerWidth < 768) }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isAdmin = profile.role === 'admin' || profile.role === 'manager' || profile.role === 'super_admin'
  const isSuperAdmin = profile.role === 'super_admin' || (profile.email || '').toLowerCase() === SUPER_ADMIN_EMAIL
  const leadMachineOn = Boolean((agency as { features?: Record<string, boolean> } | null)?.features?.lead_machine)

  const { selectedClientId, setSelectedClientId, filterClients, filterLoaded } = useClientFilter()
  const [clientDropOpen, setClientDropOpen] = useState(false)
  const selectedClient = filterClients.find(c => c.id === selectedClientId) || null

  const DEFAULT_COLLAPSED = ['Werk', 'Analyse', 'Beheer', 'Super Admin']
  const [navQuery, setNavQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(DEFAULT_COLLAPSED))
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nav_collapsed')
      if (raw) setCollapsed(new Set(JSON.parse(raw)))
    } catch { /* noop */ }
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
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const sidebarOpen = isOpen ?? true

  type NavEntry = { href: string; label: string; icon: React.ReactNode; exact?: boolean }
  type NavGroup = { label: string; items: NavEntry[] }

  const adminGroups: NavGroup[] = [
    { label: '', items: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, exact: true },
      { href: '/clients', label: 'Klanten', icon: <Users size={16} /> },
      { href: '/content', label: 'Contentkalender', icon: <CalendarDays size={16} /> },
      { href: '/approve', label: 'Goedkeuringen', icon: <ThumbsUp size={16} /> },
      { href: '/chat', label: 'Berichten', icon: <MessageSquare size={16} /> },
      ...(leadMachineOn ? [{ href: '/leads', label: 'Leads', icon: <Target size={16} /> }] : []),
    ] },
    { label: 'Eigen marketing', items: [
      { href: '/eigen-marketing', label: 'Voor jezelf', icon: <Rocket size={16} /> },
    ] },
    { label: 'Werk', items: [
      { href: '/projects', label: 'Projecten', icon: <Kanban size={16} /> },
      { href: '/taken', label: 'Taken', icon: <CheckSquare size={16} /> },
      { href: '/planning', label: 'Planning', icon: <Calendar size={16} /> },
      { href: '/meetings', label: 'Vergaderingen', icon: <Video size={16} /> },
      { href: '/ideas', label: 'Ideeën', icon: <Lightbulb size={16} /> },
      { href: '/media', label: 'Media', icon: <Image size={16} /> },
      { href: '/tijd', label: 'Tijdregistratie', icon: <Clock size={16} /> },
    ] },
    { label: 'Analyse', items: [
      { href: '/analytics/ads', label: 'Advertenties', icon: <BarChart2 size={16} /> },
      { href: '/analytics/social', label: 'Social', icon: <TrendingUp size={16} /> },
      { href: '/roi', label: 'ROI', icon: <BarChart3 size={16} /> },
      { href: '/reports', label: 'Rapportage', icon: <FileText size={16} /> },
    ] },
    { label: 'Beheer', items: [
      { href: '/settings/integrations', label: 'Koppelingen', icon: <Link2 size={16} /> },
      { href: '/settings/agency', label: 'Instellingen', icon: <Settings size={16} /> },
      { href: '/settings/billing', label: 'Abonnement', icon: <CreditCard size={16} /> },
      { href: '/settings/status', label: 'Systeemstatus', icon: <Activity size={16} /> },
      { href: '/settings/profile', label: 'Mijn profiel', icon: <User size={16} /> },
    ] },
    ...(isSuperAdmin ? [{ label: 'Super Admin', items: [
      { href: '/admin', label: 'Platformbeheer', icon: <Shield size={16} />, exact: true },
      { href: '/admin/tickets', label: 'Supporttickets', icon: <MessageSquare size={16} /> },
    ] }] : []),
  ]

  const clientGroups: NavGroup[] = [
    { label: '', items: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, exact: true },
      { href: '/content', label: 'Contentkalender', icon: <CalendarDays size={16} /> },
      { href: '/approve', label: 'Goedkeuringen', icon: <ThumbsUp size={16} /> },
      { href: '/chat', label: 'Berichten', icon: <MessageSquare size={16} /> },
      ...(leadMachineOn ? [{ href: '/leads', label: 'Mijn leads', icon: <Target size={16} /> }] : []),
    ] },
    { label: 'Werk', items: [
      { href: '/projects', label: 'Projecten', icon: <Kanban size={16} /> },
      { href: '/taken', label: 'Taken', icon: <CheckSquare size={16} /> },
      { href: '/planning', label: 'Planning', icon: <Calendar size={16} /> },
    ] },
    { label: 'Analyse', items: [
      { href: '/analytics/ads', label: 'Advertenties', icon: <BarChart2 size={16} /> },
      { href: '/analytics/social', label: 'Social', icon: <TrendingUp size={16} /> },
    ] },
    { label: 'Beheer', items: [{ href: '/settings/profile', label: 'Mijn profiel', icon: <User size={16} /> }] },
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
      {isMobile && sidebarOpen && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99, backdropFilter: 'blur(2px)' }} />
      )}
      <aside style={{
        width: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 100,
        borderRight: '1px solid var(--sidebar-border)',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
          {isMobile && onClose && (
            <button onClick={onClose} style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'var(--sidebar-hover-bg)', border: 'none', borderRadius: '6px',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sidebar-text)', cursor: 'pointer',
            }}>
              <X size={15} />
            </button>
          )}
          {logoUrl ? (
            <img src={logoUrl} alt={agencyName} style={{ height: '28px', objectFit: 'contain' }} />
          ) : (
            <div>
              <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', letterSpacing: '-0.4px' }}>
                {agencyName}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--sidebar-muted)', marginTop: '1px', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                {isSuperAdmin ? 'Super Admin' : 'Portal'}
              </div>
            </div>
          )}
        </div>

        {/* Client switcher — admin only */}
        {(isAdmin || isSuperAdmin) && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--sidebar-border)', position: 'relative' }}>
            <button
              onClick={() => setClientDropOpen(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                background: selectedClient ? 'var(--sidebar-active-bg)' : 'transparent',
                border: `1px solid ${selectedClient ? 'rgba(26,63,228,.2)' : 'var(--sidebar-border)'}`,
                borderRadius: '8px', padding: '7px 10px', cursor: 'pointer',
                color: selectedClient ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                fontSize: '.8rem', fontWeight: selectedClient ? 600 : 400,
              }}
            >
              {selectedClient ? (
                <>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'var(--accent1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {selectedClient.company_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                    {selectedClient.company_name}
                  </span>
                  <span onClick={e => { e.stopPropagation(); setSelectedClientId(null) }} style={{ opacity: .6, display: 'flex', alignItems: 'center' }}>
                    <X size={12} />
                  </span>
                </>
              ) : (
                <>
                  <Users size={13} style={{ opacity: .45, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left', color: 'var(--muted)' }}>Alle klanten</span>
                  <ChevronDown size={12} style={{ opacity: .4 }} />
                </>
              )}
            </button>

            {clientDropOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% - 2px)', left: '12px', right: '12px',
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,.10)',
                zIndex: 200, maxHeight: '240px', overflowY: 'auto', padding: '4px',
              }}>
                <button
                  onClick={() => { setSelectedClientId(null); setClientDropOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', border: 'none', background: !selectedClientId ? 'var(--sidebar-active-bg)' : 'transparent', color: !selectedClientId ? 'var(--accent1)' : 'var(--text)', fontSize: '.8rem', fontWeight: !selectedClientId ? 600 : 400, cursor: 'pointer', textAlign: 'left' }}
                >
                  <Users size={13} style={{ opacity: .5 }} /> Alle klanten
                </button>
                {filterClients.length > 0 && <div style={{ height: '1px', background: 'var(--border)', margin: '3px 0' }} />}
                {filterClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClientId(c.id); setClientDropOpen(false) }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', border: 'none', background: selectedClientId === c.id ? 'var(--sidebar-active-bg)' : 'transparent', color: selectedClientId === c.id ? 'var(--accent1)' : 'var(--text)', fontSize: '.8rem', fontWeight: selectedClientId === c.id ? 600 : 400, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--accent1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {c.company_name.slice(0, 2).toUpperCase()}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company_name}</span>
                  </button>
                ))}
                {filterLoaded && filterClients.length === 0 && (
                  <div style={{ padding: '10px', fontSize: '.78rem', color: 'var(--muted)', textAlign: 'center' }}>Geen klanten</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
          {/* Zoekbalk */}
          <div style={{ position: 'relative', marginBottom: '4px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sidebar-muted)' }} />
            <input
              value={navQuery}
              onChange={e => setNavQuery(e.target.value)}
              placeholder="Zoeken..."
              style={{ width: '100%', padding: '8px 26px 8px 30px', background: 'var(--sidebar-hover-bg)', border: '1px solid transparent', borderRadius: '8px', color: 'var(--text)', fontSize: '.82rem', fontWeight: 400, outline: 'none' }}
            />
            {navQuery && (
              <button onClick={() => setNavQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--sidebar-muted)', cursor: 'pointer', display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>

          {searchResults ? (
            searchResults.length === 0 ? (
              <div style={{ padding: '14px 10px', fontSize: '.8rem', color: 'var(--sidebar-muted)', textAlign: 'center' }}>Niets gevonden</div>
            ) : (
              searchResults.map(item => (
                <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item)} />
              ))
            )
          ) : (
            groups.map(group => {
              if (!group.label) {
                return (
                  <div key="__primary" style={{ marginBottom: '2px' }}>
                    {group.items.map(item => (
                      <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item)} />
                    ))}
                  </div>
                )
              }
              const isCollapsed = collapsed.has(group.label)
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleSection(group.label)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 10px 4px', color: 'var(--sidebar-muted)' }}
                  >
                    <span style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700 }}>{group.label}</span>
                    <ChevronDown size={12} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s', opacity: .7 }} />
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
        <div style={{ padding: '12px', borderTop: '1px solid var(--sidebar-border)' }}>
          <div
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 11px', borderRadius: '9px',
              background: 'var(--sidebar-hover-bg)',
              cursor: 'pointer', transition: 'background .15s',
            }}
          >
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: profile.avatar_url ? 'none' : 'var(--accent1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.7rem', fontWeight: 700, color: '#fff',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name}
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--sidebar-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <LogOut size={11} /> Uitloggen
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
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px', borderRadius: '8px',
        fontSize: '.85rem',
        color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        textDecoration: 'none', transition: 'background .12s, color .12s',
        marginBottom: '1px', fontWeight: active ? 600 : 400,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, opacity: active ? 1 : 0.65 }}>{icon}</span>
      {label}
    </Link>
  )
}
