import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, CalendarDays, Sparkles, TrendingUp } from 'lucide-react'
import { PlatformIcon, PlatformBadge, PLATFORM_COLORS, PLATFORM_LABELS } from '@/components/ui/PlatformIcon'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  backlog:          { label: 'Backlog',        bg: 'rgba(107,114,128,.12)', color: '#6b7280' },
  in_progress:      { label: 'In uitvoering',  bg: 'rgba(26,63,228,.10)',   color: 'var(--accent1)' },
  waiting_feedback: { label: 'Wacht feedback', bg: 'rgba(245,166,35,.12)',  color: '#f5a623' },
  blocked:          { label: 'Geblokkeerd',    bg: 'rgba(229,57,53,.10)',   color: '#e53935' },
  review:           { label: 'Review',         bg: 'rgba(255,122,48,.10)',  color: '#ff7a30' },
  approved:         { label: 'Goedgekeurd',    bg: 'rgba(0,184,156,.10)',   color: '#00b89c' },
  archived:         { label: 'Archief',        bg: 'rgba(107,114,128,.12)', color: '#6b7280' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const agencyId = profile?.agency_id || ''
  const clientId = profile?.client_id || null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const in7days = new Date()
  in7days.setDate(in7days.getDate() + 7)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: pendingApprovalCount },
    { data: todayPosts },
    { data: upcomingPosts },
    { data: activeProjects },
    { data: openTasks },
    { data: todayMeetings },
    { data: brandKitRow },
    { data: roiEntries },
    { data: platformPostsRaw },
  ] = await Promise.all([
    // Pending approvals
    (() => {
      let q = supabase
        .from('content_posts')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'pending_approval')
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Posts vandaag
    (() => {
      let q = supabase
        .from('content_posts')
        .select('id, title, platform, scheduled_at, status, clients(company_name)')
        .eq('agency_id', agencyId)
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .order('scheduled_at', { ascending: true })
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Komende posts (morgen t/m 7 dagen)
    (() => {
      let q = supabase
        .from('content_posts')
        .select('id, title, platform, scheduled_at, status, clients(company_name)')
        .eq('agency_id', agencyId)
        .gt('scheduled_at', todayEnd.toISOString())
        .lte('scheduled_at', in7days.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(6)
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Actieve projecten
    (() => {
      let q = supabase
        .from('projects')
        .select('id, title, status, priority, clients(company_name)')
        .eq('agency_id', agencyId)
        .in('status', ['in_progress', 'waiting_feedback', 'review', 'blocked'])
        .order('updated_at', { ascending: false })
        .limit(5)
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Open taken
    (() => {
      let q = supabase
        .from('project_todos')
        .select('id, title, projects!inner(title, agency_id, clients(company_name))')
        .eq('done', false)
        .eq('projects.agency_id', agencyId)
        .limit(5)
      return q
    })(),

    // Vergaderingen vandaag
    supabase
      .from('meeting_notes')
      .select('id, title, meeting_date, status')
      .eq('agency_id', agencyId)
      .gte('meeting_date', todayStart.toISOString())
      .lte('meeting_date', todayEnd.toISOString()),

    // Brand kit (voor setup banner)
    supabase
      .from('brand_kits')
      .select('logo_url')
      .eq('agency_id', agencyId)
      .maybeSingle(),

    // ROI entries last 3 months
    supabase
      .from('roi_entries')
      .select('platform, ad_spend, revenue, leads, month, year, client_id')
      .eq('agency_id', agencyId)
      .gte('year', threeMonthsAgo.getFullYear())
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(20),

    // Content posts platform breakdown last 30 days
    supabase
      .from('content_posts')
      .select('platform')
      .eq('agency_id', agencyId)
      .eq('status', 'published')
      .gte('scheduled_at', thirtyDaysAgo.toISOString()),
  ])

  const showSetupBanner = isAdmin && !brandKitRow?.logo_url
  const firstName = profile?.full_name?.split(' ')[0] || 'daar'
  const dayName = new Date().toLocaleDateString('nl-NL', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  // ROI aggregations
  const thisMonthRoi = (roiEntries || []).filter(e => e.month === currentMonth && e.year === currentYear)
  const roiSpend = thisMonthRoi.reduce((s: number, e: any) => s + (e.ad_spend || 0), 0)
  const roiRevenue = thisMonthRoi.reduce((s: number, e: any) => s + (e.revenue || 0), 0)
  const roiLeads = thisMonthRoi.reduce((s: number, e: any) => s + (e.leads || 0), 0)
  const roiRoas = roiSpend > 0 ? roiRevenue / roiSpend : 0
  const roasColor = roiRoas > 3 ? '#00b89c' : roiRoas > 1.5 ? '#f5a623' : roiRoas > 0 ? '#e53935' : 'var(--muted)'

  function fmtEur(n: number): string {
    return '€' + n.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  // Platform post counts last 30 days
  const platformCounts: Record<string, number> = {}
  for (const post of platformPostsRaw || []) {
    const p = (post.platform || '').toLowerCase()
    if (p) platformCounts[p] = (platformCounts[p] || 0) + 1
  }
  const platformEntries = Object.entries(platformCounts).filter(([, count]) => count > 0)

  return (
    <div style={{ fontFamily: 'var(--font-syne), sans-serif', maxWidth: '1200px', margin: '0 auto' }}>

      {/* SETUP BANNER */}
      {showSetupBanner && (
        <a href="/onboarding" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(90deg, #f5a623, #ffcc70)',
          borderRadius: 'var(--radius)', padding: '12px 20px',
          marginBottom: '20px', textDecoration: 'none',
          boxShadow: '0 2px 12px rgba(245,166,35,.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#7a4800' }}>
              Stel je agency in — logo, kleuren en eerste klant
            </span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '.82rem', color: '#7a4800' }}>Onboarding →</span>
        </a>
      )}

      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.7rem', color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
              Goedendag, {firstName}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginTop: '4px', textTransform: 'capitalize' }}>
              {dayName} · {dateStr}
            </p>
          </div>
          <Link href="/content/compose" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent1)', color: '#fff',
            borderRadius: 'var(--radius)', padding: '10px 18px',
            textDecoration: 'none', fontWeight: 700, fontSize: '.88rem',
          }}>
            <Plus size={16} /> Nieuwe post
          </Link>
        </div>
      </div>

      {/* ACTIE VEREIST — alleen als er iets urgent is */}
      {(pendingApprovalCount ?? 0) > 0 && (
        <Link href="/approve" style={{ textDecoration: 'none', display: 'block', marginBottom: '20px' }}>
          <div style={{
            background: 'linear-gradient(90deg, rgba(26,63,228,.08), rgba(26,63,228,.04))',
            border: '1px solid rgba(26,63,228,.2)',
            borderLeft: '4px solid var(--accent1)',
            borderRadius: 'var(--radius)', padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: 'var(--accent1)', color: '#fff',
                borderRadius: '50%', width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '.82rem', flexShrink: 0,
              }}>{pendingApprovalCount}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>
                  {pendingApprovalCount === 1 ? '1 post wacht op goedkeuring' : `${pendingApprovalCount} posts wachten op goedkeuring`}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Klik om te bekijken en goed te keuren
                </div>
              </div>
            </div>
            <span style={{ color: 'var(--accent1)', fontWeight: 700, fontSize: '.85rem' }}>Bekijken →</span>
          </div>
        </Link>
      )}

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* VANDAAG */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--accent1)', display: 'inline-block',
                }} />
                <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Vandaag</span>
                {todayMeetings && todayMeetings.length > 0 && (
                  <span style={{
                    background: '#00b89c22', color: '#00b89c',
                    borderRadius: '50px', padding: '2px 8px',
                    fontSize: '.72rem', fontWeight: 700,
                  }}>
                    {todayMeetings.length} vergadering{todayMeetings.length > 1 ? 'en' : ''}
                  </span>
                )}
              </div>
              <Link href="/planning" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                Planning →
              </Link>
            </div>

            {/* Vergaderingen vandaag */}
            {todayMeetings && todayMeetings.map((m: any) => (
              <div key={m.id} style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '14px',
                background: 'rgba(0,184,156,.04)',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                  background: '#00b89c22', color: '#00b89c',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}><CalendarDays size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)' }}>{m.title}</div>
                  <div style={{ fontSize: '.75rem', color: '#00b89c', marginTop: '2px' }}>
                    Vergadering · {new Date(m.meeting_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <Link href="/meetings" style={{ fontSize: '.75rem', color: 'var(--muted)', textDecoration: 'none' }}>Bekijken →</Link>
              </div>
            ))}

            {/* Posts vandaag */}
            {todayPosts && todayPosts.length > 0 ? (
              todayPosts.map((post: any) => {
                const platform = (post.platform || '').toLowerCase()
                const color = PLATFORM_COLORS[platform] || '#6b7280'
                return (
                  <div key={post.id} style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                      background: `${color}18`, border: `1px solid ${color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <PlatformIcon platform={platform} size={18} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: '.88rem', color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {post.title || 'Zonder titel'}
                      </div>
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                        {(post.clients as any)?.company_name && `${(post.clients as any).company_name} · `}
                        {new Date(post.scheduled_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '.7rem', fontWeight: 700, padding: '3px 8px',
                      borderRadius: '50px',
                      background: post.status === 'published' ? '#00b89c22' : post.status === 'scheduled' ? 'rgba(26,63,228,.1)' : '#f5a62322',
                      color: post.status === 'published' ? '#00b89c' : post.status === 'scheduled' ? 'var(--accent1)' : '#f5a623',
                    }}>
                      {post.status === 'published' ? 'Gepubliceerd' : post.status === 'scheduled' ? 'Ingepland' : 'Concept'}
                    </span>
                  </div>
                )
              })
            ) : (
              !todayMeetings?.length && (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem' }}>
                  <Sparkles size={28} style={{ marginBottom: '8px', opacity: 0.35 }} />
                  Niets gepland voor vandaag
                </div>
              )
            )}
          </div>

          {/* DEZE WEEK */}
          {upcomingPosts && upcomingPosts.length > 0 && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e1306c', display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Komende 7 dagen</span>
                </div>
                <Link href="/content" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                  Alles →
                </Link>
              </div>
              {upcomingPosts.map((post: any) => {
                const platform = (post.platform || '').toLowerCase()
                const color = PLATFORM_COLORS[platform] || '#6b7280'
                const date = new Date(post.scheduled_at)
                return (
                  <div key={post.id} style={{
                    padding: '12px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <div style={{
                      width: '40px', textAlign: 'center', flexShrink: 0,
                    }}>
                      <div style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {date.toLocaleDateString('nl-NL', { weekday: 'short' })}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.1 }}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div style={{
                      width: '3px', height: '32px', borderRadius: '2px',
                      background: color, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: '.85rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {post.title || 'Zonder titel'}
                      </div>
                      <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <PlatformIcon platform={platform} size={12} color={color} />
                        {PLATFORM_LABELS[platform] || platform}
                        {(post.clients as any)?.company_name && ` · ${(post.clients as any).company_name}`}
                      </div>
                    </div>
                    <div style={{ fontSize: '.73rem', color: 'var(--muted)', flexShrink: 0 }}>
                      {date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ROI SNAPSHOT — admin only */}
          {isAdmin && (roiEntries || []).length > 0 && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <TrendingUp size={16} color="var(--accent1)" />
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>ROI Snapshot — deze maand</span>
                </div>
                <Link href="/roi" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                  ROI Dashboard →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
                {[
                  {
                    label: 'Totaal spend',
                    value: fmtEur(roiSpend),
                    color: '#1877f2',
                  },
                  {
                    label: 'Totaal omzet',
                    value: fmtEur(roiRevenue),
                    color: '#00b89c',
                  },
                  {
                    label: 'Gem. ROAS',
                    value: roiSpend > 0 ? `${roiRoas.toFixed(2)}×` : '—',
                    color: roasColor,
                  },
                  {
                    label: 'Leads',
                    value: roiLeads.toString(),
                    color: 'var(--accent1)',
                  },
                ].map((kpi, i, arr) => (
                  <Link key={kpi.label} href="/roi" style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '18px 20px',
                      borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: '3px', background: kpi.color,
                      }} />
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '6px' }}>
                        {kpi.label}
                      </div>
                      <div style={{
                        fontWeight: 800, fontSize: '1.35rem', color: kpi.color,
                        fontFamily: 'var(--font-syne), sans-serif',
                      }}>
                        {kpi.value}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PLATFORM ACTIVITY — last 30 days */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c5ff5', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Platform activiteit</span>
                <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>laatste 30 dagen</span>
              </div>
              <Link href="/content" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                Content →
              </Link>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {platformEntries.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {platformEntries.sort((a, b) => b[1] - a[1]).map(([platform, count]) => {
                    const color = PLATFORM_COLORS[platform] || '#6b7280'
                    const label = PLATFORM_LABELS[platform] || platform
                    return (
                      <Link key={platform} href="/content" style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          background: `${color}12`, border: `1px solid ${color}30`,
                          borderRadius: '50px', padding: '7px 14px',
                        }}>
                          <PlatformIcon platform={platform} size={15} color={color} />
                          <span style={{ fontSize: '.82rem', fontWeight: 600, color }}>
                            {label}
                          </span>
                          <span style={{
                            background: color, color: '#fff',
                            borderRadius: '50px', padding: '1px 7px',
                            fontSize: '.7rem', fontWeight: 800,
                          }}>
                            {count}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: '.85rem', textAlign: 'center', padding: '12px 0' }}>
                  Nog geen posts gepubliceerd
                </div>
              )}
            </div>
          </div>

          {/* ACTIEVE PROJECTEN */}
          {activeProjects && activeProjects.length > 0 && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent4)', display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Actieve projecten</span>
                </div>
                <Link href="/projects" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                  Alle projecten →
                </Link>
              </div>
              {activeProjects.map((project: any) => {
                const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG.backlog
                return (
                  <div key={project.id} style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '14px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)' }}>
                        {project.title}
                      </div>
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                        {(project.clients as any)?.company_name || 'Intern'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '.7rem', fontWeight: 700, padding: '3px 9px',
                      borderRadius: '50px', background: sc.bg, color: sc.color, flexShrink: 0,
                    }}>
                      {sc.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* STATS */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}>
            {[
              {
                label: 'Wachten op goedkeuring',
                value: pendingApprovalCount ?? 0,
                color: 'var(--accent1)',
                href: '/approve',
              },
              {
                label: 'Posts vandaag',
                value: todayPosts?.length ?? 0,
                color: '#e1306c',
                href: '/content',
              },
              {
                label: 'Open taken',
                value: openTasks?.length ?? 0,
                color: '#f5a623',
                href: '/projects',
              },
            ].map((stat, i, arr) => (
              <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background .15s',
                }}>
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 500 }}>{stat.label}</span>
                  <span style={{
                    fontWeight: 800, fontSize: '1.3rem', color: stat.value > 0 ? stat.color : 'var(--muted)',
                    fontFamily: 'var(--font-syne), sans-serif',
                  }}>{stat.value}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* QUICK ROI ROW */}
          {isAdmin && thisMonthRoi.length > 0 && (
            <Link href="/roi" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <TrendingUp size={16} color="var(--accent1)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '3px' }}>
                    ROI deze maand
                  </div>
                  <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Spend: {fmtEur(roiSpend)} &nbsp;·&nbsp;
                    <span style={{ color: roasColor }}>ROAS: {roiSpend > 0 ? `${roiRoas.toFixed(1)}×` : '—'}</span>
                  </div>
                </div>
                <span style={{ fontSize: '.72rem', color: 'var(--accent1)', fontWeight: 600, flexShrink: 0 }}>→</span>
              </div>
            </Link>
          )}

          {/* OPEN TAKEN */}
          {openTasks && openTasks.length > 0 && (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.88rem' }}>
                Open taken
              </div>
              {openTasks.map((task: any) => (
                <div key={task.id} style={{
                  padding: '11px 18px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid var(--border)', flexShrink: 0, marginTop: '2px',
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '.83rem', fontWeight: 600, color: 'var(--text)' }}>{task.title}</div>
                    {task.projects && (
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                        {(task.projects as any).title}
                        {(task.projects as any).clients?.company_name && ` · ${(task.projects as any).clients.company_name}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <Link href="/projects" style={{
                display: 'block', padding: '11px 18px',
                fontSize: '.78rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600,
              }}>
                Alle taken bekijken →
              </Link>
            </div>
          )}

          {/* SNELLE LINKS */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px',
          }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '12px', paddingLeft: '2px' }}>
              Snelle acties
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { href: '/content/compose', label: 'Nieuwe post aanmaken', color: 'var(--accent1)' },
                { href: '/projects',        label: 'Nieuw project',         color: '#7c5ff5' },
                { href: '/meetings',        label: 'Vergadering plannen',   color: '#00b89c' },
                { href: '/clients',         label: 'Klant toevoegen',       color: '#f5a623' },
              ].map(action => (
                <Link key={action.href} href={action.href} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                  fontSize: '.82rem', fontWeight: 600, color: action.color,
                  transition: 'border-color .15s',
                }}>
                  <Plus size={14} style={{ flexShrink: 0 }} />{action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
