// GET /api/cron/crm-digest
// Draai deze cron dagelijks (bijv. via Vercel cron of externe service)
// Stuurt daily digest per agency: gebeld vandaag, callbacks vandaag, gesprekken deze week

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  // Simpele auth via cron secret
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Alle agencies
  const { data: agencies } = await admin.from('agencies').select('id, name')
  if (!agencies?.length) return NextResponse.json({ sent: 0 })

  const RESEND_KEY = process.env.RESEND_API_KEY
  const FROM = process.env.FROM_EMAIL || 'noreply@modernicastudios.com'
  const results: any[] = []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 86400 * 1000).toISOString()

  for (const agency of agencies) {
    // Get all managers for this agency
    const { data: managers } = await admin
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('agency_id', agency.id)
      .in('role', ['admin', 'manager', 'super_admin'])
    if (!managers?.length) continue

    // Stats
    const [callsTodayR, callbackR, meetingsR, wonR, activityR] = await Promise.all([
      admin.from('lead_calls').select('id, outcome, called_by', { count: 'exact' }).eq('agency_id', agency.id).gte('called_at', todayStart),
      admin.from('lead_outreach').select('id, lead_companies(name)', { count: 'exact' }).eq('agency_id', agency.id).eq('pipeline_stage', 'callback').lte('next_action_at', new Date(now.getTime() + 86400 * 1000).toISOString()),
      admin.from('lead_meetings').select('id, scheduled_at, lead_companies(name)').eq('agency_id', agency.id).gte('scheduled_at', now.toISOString()).lte('scheduled_at', new Date(now.getTime() + 7 * 86400 * 1000).toISOString()).eq('status', 'planned').order('scheduled_at'),
      admin.from('lead_outreach').select('id, lead_companies(name)').eq('agency_id', agency.id).eq('pipeline_stage', 'klant').gte('updated_at', weekAgo),
      admin.from('lead_activities').select('id, type, summary, created_at').eq('agency_id', agency.id).gte('created_at', todayStart).order('created_at', { ascending: false }).limit(10),
    ])

    const callsToday = callsTodayR.data || []
    const callbacksDue = callbackR.data || []
    const meetingsWeek = meetingsR.data || []
    const wonThisWeek = wonR.data || []
    const recentActivity = activityR.data || []

    // Outcome distribution
    const byOutcome: Record<string, number> = {}
    for (const c of callsToday) byOutcome[c.outcome] = (byOutcome[c.outcome] || 0) + 1

    // Skip als niks te melden
    if (callsToday.length === 0 && callbacksDue.length === 0 && meetingsWeek.length === 0 && wonThisWeek.length === 0) {
      continue
    }

    const html = renderDigestHtml({
      agencyName: agency.name,
      date: now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }),
      callsCount: callsToday.length,
      byOutcome,
      callbacksDue: callbacksDue.length,
      callbacksSample: callbacksDue.slice(0, 5).map((c: any) => c.lead_companies?.name).filter(Boolean),
      meetingsWeek: meetingsWeek.slice(0, 10).map((m: any) => ({
        name: m.lead_companies?.name || '?',
        when: new Date(m.scheduled_at).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      })),
      wonCount: wonThisWeek.length,
      recentActivity: recentActivity.map((a: any) => a.summary || a.type),
    })

    if (RESEND_KEY) {
      for (const mgr of managers) {
        if (!mgr.email) continue
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM,
            to: mgr.email,
            subject: `CRM digest ${agency.name} — ${callsToday.length} calls · ${callbacksDue.length} callbacks · ${meetingsWeek.length} afspraken`,
            html,
          }),
        })
        results.push({ agency: agency.name, to: mgr.email, status: r.status })
      }
    } else {
      results.push({ agency: agency.name, note: 'RESEND_API_KEY not set — email skipped', preview: html.slice(0, 200) })
    }
  }

  return NextResponse.json({ ok: true, results })
}

function renderDigestHtml(d: any): string {
  const outcomeRows = Object.entries(d.byOutcome).map(([k, v]) => `<li><strong>${v}</strong> ${k.replace(/_/g,' ')}</li>`).join('')
  const meetings = d.meetingsWeek.map((m: any) => `<li>${m.when} — <strong>${m.name}</strong></li>`).join('')
  const callbacks = d.callbacksSample.map((n: string) => `<li>${n}</li>`).join('')
  const activity = d.recentActivity.map((a: string) => `<li>${a}</li>`).join('')

  return `<!doctype html><html><body style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1A1730">
<div style="background:#3F06E3;color:white;padding:20px;border-radius:12px;margin-bottom:20px">
  <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.8">CRM DIGEST</div>
  <h1 style="margin:6px 0 0;font-size:24px">${d.agencyName}</h1>
  <div style="opacity:0.9;font-size:13px">${d.date}</div>
</div>

<div style="background:#F6F3FF;padding:20px;border-radius:12px;margin-bottom:16px">
  <div style="font-size:32px;font-weight:800;color:#3F06E3">${d.callsCount}</div>
  <div style="font-size:13px;color:#5F5A72;margin-bottom:12px">Gebeld vandaag</div>
  ${outcomeRows ? `<ul style="margin:0;padding-left:18px;font-size:13px;color:#5F5A72">${outcomeRows}</ul>` : ''}
</div>

${d.callbacksDue > 0 ? `<div style="padding:16px;background:#FFF9EF;border-left:4px solid #F59E0B;border-radius:8px;margin-bottom:16px">
  <strong>${d.callbacksDue} callbacks staan open</strong>
  ${callbacks ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:13px">${callbacks}</ul>` : ''}
</div>` : ''}

${d.meetingsWeek.length > 0 ? `<div style="padding:16px;background:#F0FDF4;border-left:4px solid #22C55E;border-radius:8px;margin-bottom:16px">
  <strong>Aankomende afspraken</strong>
  <ul style="margin:8px 0 0;padding-left:18px;font-size:13px">${meetings}</ul>
</div>` : ''}

${d.wonCount > 0 ? `<div style="padding:16px;background:#DCFCE7;border-radius:8px;margin-bottom:16px;text-align:center">
  🎉 <strong>${d.wonCount} nieuwe klanten deze week!</strong>
</div>` : ''}

${activity ? `<div style="padding:16px;background:white;border:1px solid #E7E2F4;border-radius:8px">
  <div style="font-size:11px;font-weight:700;color:#5F5A72;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Laatste activiteit</div>
  <ul style="margin:0;padding-left:18px;font-size:13px;color:#5F5A72">${activity}</ul>
</div>` : ''}

<div style="text-align:center;margin-top:20px;font-size:11px;color:#8F8AA3">
  Modernica CRM · <a href="https://modernica-portal.vercel.app/leads" style="color:#3F06E3">Open portal</a>
</div>
</body></html>`
}
