import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  // Load stats in parallel
  const [
    { count: clientCount },
    { count: projectCount },
    { data: recentProjects },
    { data: pendingTasks },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId || ''),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('agency_id', agencyId || '').in('status', ['in_progress', 'review']),
    supabase.from('projects').select('*, clients(company_name)').eq('agency_id', agencyId || '').order('created_at', { ascending: false }).limit(5),
    supabase.from('project_todos').select('*, projects(title, clients(company_name))').eq('done', false).limit(5),
  ])

  return (
    <div className="animate-fade-up">
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent1), #2d5fff)',
        borderRadius: 'var(--radius)',
        padding: '32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(26,63,228,.3)',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,.15), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#fff', marginBottom: '6px' }}>
          Goedendag, {profile?.full_name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.9rem' }}>
          {isAdmin
            ? `Je beheert ${clientCount || 0} klanten • ${projectCount || 0} actieve projecten`
            : 'Welkom in je portaal'}
        </p>
      </div>

      {/* Stats grid */}
      {isAdmin && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <StatCard label="Actieve klanten" value={clientCount || 0} color="blue" icon="👥" />
          <StatCard label="Lopende projecten" value={projectCount || 0} color="teal" icon="📋" />
          <StatCard label="Open taken" value={pendingTasks?.length || 0} color="orange" icon="✅" />
        </div>
      )}

      {/* Recent projects & open tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent projects */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent1)', display: 'inline-block' }} />
            Recente projecten
          </h3>
          {recentProjects && recentProjects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentProjects.map((project: any) => (
                <div key={project.id} style={{
                  padding: '12px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: '4px' }}>{project.title}</div>
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

        {/* Open tasks */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(26,63,228,.06)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent3)', display: 'inline-block' }} />
            Open taken
          </h3>
          {pendingTasks && pendingTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingTasks.map((task: any) => (
                <div key={task.id} style={{
                  padding: '10px 12px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: '.85rem',
                }}>
                  <div style={{ fontWeight: 500 }}>{task.title}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {task.projects?.title}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Geen open taken 🎉</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const colors: Record<string, string> = {
    blue: 'linear-gradient(90deg, var(--accent1), var(--accent2))',
    teal: 'linear-gradient(90deg, var(--accent3), #00dfc0)',
    orange: 'linear-gradient(90deg, var(--accent4), #ffaa70)',
    purple: 'linear-gradient(90deg, #7c5ff5, var(--accent1))',
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(26,63,228,.07)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        borderRadius: 'var(--radius) var(--radius) 0 0',
        background: colors[color] || colors.blue,
      }} />
      <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.4rem', opacity: .25 }}>{icon}</div>
      <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    backlog: { label: 'Backlog', bg: 'rgba(107,120,168,.12)', color: 'var(--muted)' },
    in_progress: { label: 'In uitvoering', bg: 'rgba(26,63,228,.1)', color: 'var(--accent1)' },
    review: { label: 'Review', bg: 'rgba(255,122,48,.1)', color: 'var(--accent4)' },
    approved: { label: 'Goedgekeurd', bg: 'rgba(0,184,156,.1)', color: 'var(--accent3)' },
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
