import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#e1306c',
  tiktok: '#010101',
  linkedin: '#0077b5',
  youtube: '#ff0000',
  facebook: '#1877f2',
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

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

  const [
    { count: pendingApprovalCount },
    { data: todayPosts },
    { data: upcomingPosts },
    { data: activeProjects },
    { data: openTasks },
    { data: todayMeetings },
    { data: brandKitRow },
  ] = await Promise.all([
    // Pending approvals
    supabase
      .from('content_posts')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'pending_approval'),

    // Posts vandaag
    supabase
      .from('content_posts')
      .select('id, title, platform, scheduled_at, status, clients(company_name)')
      .eq('agency_id', agencyId)
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .order('scheduled_at', { ascending: true }),

    // Komende posts (morgen t/m 7 dagen)
    supabase
      .from('content_posts')
      .select('id, title, platform, scheduled_at, status, clients(company_name)')
      .eq('agency_id', agencyId)
      .gt('scheduled_at', todayEnd.toISOString())
      .lte('scheduled_at', in7days.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(6),

    // Actieve projecten
    supabase
      .from('projects')
      .select('id, title, status, priority, clients(company_name)')
      .eq('agency_id', agencyId)
      .in('status', ['in_progress', 'waiting_feedback', 'review', 'blocked'])
      .order('updated_at', { ascending: false })
      .limit(5),

    // Open taken
    supabase
      .from('project_todos')
      .select('id, title, projects(title, clients(company_name))')
      .eq('done', false)
      .limit(5),

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
  ])

  const showSetupBanner = isAdmin && !brandKitRow?.logo_url
  const firstName = profile?.full_name?.split(' ')[0] || 'daar'
  const dayName = new Date().toLocaleDateString('nl-NL', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

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
            <span>🚀</span>
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
              Goedendag, {firstName} 👋
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
            <span style={{ fontSize: '1rem' }}>+</span> Nieuwe post
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
                  fontSize: '1rem', flexShrink: 0,
                }}>📅</div>
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
                      fontSize: '.7rem', fontWeight: 800, color, flexShrink: 0, textTransform: 'uppercase',
                    }}>
                      {(PLATFORM_LABELS[platform] || platform).slice(0, 2)}
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
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✨</div>
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
                      <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: '2px' }}>
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
                { href: '/content/compose', label: '+ Nieuwe post aanmaken', color: 'var(--accent1)' },
                { href: '/projects',        label: '+ Nieuw project',         color: '#7c5ff5' },
                { href: '/meetings',        label: '+ Vergadering plannen',   color: '#00b89c' },
                { href: '/clients',         label: '+ Klant toevoegen',       color: '#f5a623' },
              ].map(action => (
                <Link key={action.href} href={action.href} style={{
                  display: 'block', padding: '9px 14px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                  fontSize: '.82rem', fontWeight: 600, color: action.color,
                  transition: 'border-color .15s',
                }}>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
