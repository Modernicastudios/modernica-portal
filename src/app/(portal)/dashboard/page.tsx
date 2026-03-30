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

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: '📸',
  tiktok: '🎵',
  linkedin: '💼',
  youtube: '▶️',
  facebook: '👥',
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
  const agencyId = profile?.agency_id

  const today = new Date()
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)

  const [
    { count: clientCount },
    { count: activeProjectCount },
    { data: recentProjects },
    { data: pendingTasks },
    { data: thisWeekPosts },
    { count: pendingApprovalCount },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId || ''),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId || '')
      .in('status', ['in_progress', 'waiting_feedback', 'review']),
    supabase
      .from('projects')
      .select('*, clients(company_name)')
      .eq('agency_id', agencyId || '')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('project_todos')
      .select('*, projects(title, clients(company_name))')
      .eq('done', false)
      .limit(8),
    supabase
      .from('content_posts')
      .select('*')
      .eq('agency_id', agencyId || '')
      .gte('scheduled_at', today.toISOString())
      .lte('scheduled_at', sevenDaysLater.toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('content_posts')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId || '')
      .eq('status', 'pending_approval'),
  ])

  return (
    <div className="animate-fade-up">
      {/* HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent1) 0%, #2d5fff 60%, #7c5ff5 100%)',
        borderRadius: 'var(--radius)',
        padding: '36px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(26,63,228,.3)',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '30%',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,.07), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <h2 style={{
          fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
          fontSize: '1.9rem', color: '#fff', marginBottom: '8px', position: 'relative',
        }}>
          Goedendag, {profile?.full_name?.split(' ')[0] || 'daar'} 👋
        </h2>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.92rem', position: 'relative' }}>
          {isAdmin
            ? `Je bureau heeft ${clientCount || 0} klanten • ${activeProjectCount || 0} actieve projecten • ${pendingApprovalCount || 0} wachten op goedkeuring`
            : `Welkom terug in ${profile?.agencies?.name || 'je portaal'}`}
        </p>
      </div>

      {/* STATS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <StatCard
          label="Klanten"
          value={clientCount || 0}
          gradient="linear-gradient(90deg, #7c5ff5, var(--accent1))"
          color="#7c5ff5"
          icon="👥"
          href="/clients"
        />
        <StatCard
          label="Actieve projecten"
          value={activeProjectCount || 0}
          gradient="linear-gradient(90deg, var(--accent1), var(--accent2))"
          color="var(--accent1)"
          icon="📋"
          href="/projects"
        />
        <StatCard
          label="Posts deze week"
          value={thisWeekPosts?.length || 0}
          gradient="linear-gradient(90deg, #e1306c, #ff6b6b)"
          color="#e1306c"
          icon="📅"
          href="/content"
        />
        <StatCard
          label="Wachten op goedkeuring"
          value={pendingApprovalCount || 0}
          gradient="linear-gradient(90deg, var(--accent4), #ffaa70)"
          color="var(--accent4)"
          icon="⏳"
          href="/content"
        />
      </div>

      {/* TWO COLUMNS: Posts this week + Open tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* Posts deze week */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
              fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e1306c', display: 'inline-block' }} />
              Posts deze week
            </h3>
            <Link href="/content" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
              Alles bekijken →
            </Link>
          </div>

          {thisWeekPosts && thisWeekPosts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {thisWeekPosts.map((post: any) => {
                const platform = (post.platform || 'other').toLowerCase()
                const color = PLATFORM_COLORS[platform] || 'var(--muted)'
                const emoji = PLATFORM_EMOJI[platform] || '📄'
                const date = post.scheduled_at ? new Date(post.scheduled_at) : null
                return (
                  <div key={post.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px',
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${color}`,
                    border: `1px solid var(--border)`,
                    borderLeftWidth: '3px',
                    borderLeftColor: color,
                  }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: '.83rem', color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {post.title || 'Zonder titel'}
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                        {PLATFORM_LABELS[platform] || platform}
                      </div>
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>
                      {date ? (
                        <>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div>
                            {date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '32px 20px',
              color: 'var(--muted)', fontSize: '.85rem',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
              <div>Geen posts gepland voor deze week</div>
              <Link href="/content" style={{
                display: 'inline-block', marginTop: '12px',
                fontSize: '.78rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600,
              }}>
                Content plannen →
              </Link>
            </div>
          )}
        </div>

        {/* Open taken */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
              fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent3)', display: 'inline-block' }} />
              Open taken
            </h3>
            <Link href="/projects" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
              Alle projecten →
            </Link>
          </div>

          {pendingTasks && pendingTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingTasks.map((task: any) => (
                <div key={task.id} style={{
                  padding: '10px 12px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '.83rem', color: 'var(--text)' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '3px', display: 'flex', gap: '6px' }}>
                    <span>{task.projects?.title}</span>
                    {task.projects?.clients?.company_name && (
                      <>
                        <span>·</span>
                        <span>{task.projects.clients.company_name}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--muted)', fontSize: '.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
              <div>Geen open taken</div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM GRID — admin only */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Recente projecten */}
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(26,63,228,.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{
                fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent1)', display: 'inline-block' }} />
                Recente projecten
              </h3>
              <Link href="/projects" style={{ fontSize: '.75rem', color: 'var(--accent1)', textDecoration: 'none', fontWeight: 600 }}>
                Alle projecten →
              </Link>
            </div>
            {recentProjects && recentProjects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentProjects.map((project: any) => (
                  <div key={project.id} style={{
                    padding: '12px',
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: '6px', color: 'var(--text)' }}>
                      {project.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                        {project.clients?.company_name || 'Intern'}
                      </span>
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Nog geen projecten</p>
            )}
          </div>

          {/* Quick actions */}
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            boxShadow: '0 2px 12px rgba(26,63,228,.06)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem',
              marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent4)', display: 'inline-block' }} />
              Snelle acties
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { href: '/content', label: 'Content', sub: 'Posts & planning', emoji: '📝', color: '#e1306c', bg: 'rgba(225,48,108,.08)' },
                { href: '/projects', label: 'Projecten', sub: 'Beheer projecten', emoji: '📋', color: 'var(--accent1)', bg: 'rgba(26,63,228,.08)' },
                { href: '/ideas', label: 'Ideeën', sub: 'Brainstorm board', emoji: '💡', color: '#f5a623', bg: 'rgba(245,166,35,.08)' },
                { href: '/media', label: 'Media', sub: 'Bestanden & assets', emoji: '🗂️', color: '#7c5ff5', bg: 'rgba(124,95,245,.08)' },
                { href: '/clients', label: 'Klanten', sub: 'Klantenbeheer', emoji: '👥', color: '#00b89c', bg: 'rgba(0,184,156,.08)' },
              ].map(action => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '14px',
                    background: action.bg,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${action.color}22`,
                    cursor: 'pointer',
                    transition: 'transform .15s, box-shadow .15s',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>{action.emoji}</span>
                    <div style={{
                      fontFamily: 'var(--font-syne), sans-serif',
                      fontWeight: 700, fontSize: '.85rem', color: action.color,
                    }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                      {action.sub}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

function StatCard({
  label,
  value,
  gradient,
  color,
  icon,
  href,
}: {
  label: string
  value: number
  gradient: string
  color: string
  icon: string
  href?: string
}) {
  const content = (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(26,63,228,.07)',
      textDecoration: 'none',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        borderRadius: 'var(--radius) var(--radius) 0 0',
        background: gradient,
      }} />
      <div style={{
        position: 'absolute', top: '16px', right: '16px',
        fontSize: '1.5rem', opacity: .2,
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '.72rem', color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
        fontSize: '1.9rem', color,
      }}>
        {value}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        {content}
      </Link>
    )
  }
  return content
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    backlog: { label: 'Backlog', bg: 'rgba(107,120,168,.12)', color: 'var(--muted)' },
    in_progress: { label: 'In uitvoering', bg: 'rgba(26,63,228,.10)', color: 'var(--accent1)' },
    waiting_feedback: { label: 'Wacht op feedback', bg: 'rgba(245,166,35,.12)', color: '#f5a623' },
    review: { label: 'Review', bg: 'rgba(255,122,48,.10)', color: 'var(--accent4)' },
    approved: { label: 'Goedgekeurd', bg: 'rgba(0,184,156,.10)', color: 'var(--accent3)' },
    archived: { label: 'Archief', bg: 'rgba(107,120,168,.12)', color: 'var(--muted)' },
  }
  const c = config[status] || config.backlog
  return (
    <span style={{
      fontSize: '.68rem', fontWeight: 600, padding: '2px 8px',
      borderRadius: '50px', background: c.bg, color: c.color,
    }}>
      {c.label}
    </span>
  )
}
