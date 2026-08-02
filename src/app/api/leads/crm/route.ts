// CRM API — één endpoint voor alle CRM acties
// POST /api/leads/crm  body: { action: 'log_call' | 'add_note' | 'schedule_meeting' | 'update_company' | 'update_contact' | 'update_outreach' | 'next_lead', payload: {...} }
// GET  /api/leads/crm?action=next_lead → volgende te bellen lead (voor mobiel)
// GET  /api/leads/crm?action=lead&id=xxx → volledige lead detail

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized', status: 401 as const }
  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) return { error: 'no agency', status: 403 as const }
  return { user, admin, profile }
}

export async function GET(req: NextRequest) {
  const ctx = await getCtx()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { admin, profile } = ctx
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'next_lead') {
    // Volgende lead: prioriteit → callback voor vandaag/nu → nieuw
    // Filter: alleen assigned aan huidige user OF onassigned
    const now = new Date().toISOString()

    // 1. Callbacks die aan tijd zijn
    const { data: callbacks } = await admin
      .from('lead_outreach')
      .select('*, lead_companies(*), lead_contacts(*)')
      .eq('agency_id', profile.agency_id)
      .eq('pipeline_stage', 'callback')
      .lte('next_action_at', now)
      .order('next_action_at', { ascending: true })
      .limit(1)

    if (callbacks?.length) return NextResponse.json({ lead: callbacks[0], reason: 'callback_due' })

    // 2. Nieuwe of geen-gehoor die assigned zijn aan user
    const { data: assigned } = await admin
      .from('lead_outreach')
      .select('*, lead_companies(*), lead_contacts(*)')
      .eq('agency_id', profile.agency_id)
      .eq('assigned_to', profile.id)
      .in('pipeline_stage', ['nieuw', 'gebeld_geen_gehoor'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)

    if (assigned?.length) return NextResponse.json({ lead: assigned[0], reason: 'assigned' })

    // 3. Anders: onassigned nieuwe leads (met telefoonnr)
    const { data: fresh } = await admin
      .from('lead_outreach')
      .select('*, lead_companies!inner(*), lead_contacts(*)')
      .eq('agency_id', profile.agency_id)
      .is('assigned_to', null)
      .in('pipeline_stage', ['nieuw', 'gebeld_geen_gehoor'])
      .not('lead_companies.phone', 'is', null)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)

    if (fresh?.length) return NextResponse.json({ lead: fresh[0], reason: 'fresh' })

    return NextResponse.json({ lead: null })
  }

  if (action === 'lead') {
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data: outreach } = await admin
      .from('lead_outreach')
      .select('*, lead_companies(*), lead_contacts(*)')
      .eq('id', id)
      .eq('agency_id', profile.agency_id)
      .single()

    if (!outreach) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const companyId = outreach.company_id
    const [calls, notes, meetings, activities] = await Promise.all([
      admin.from('lead_calls').select('*').eq('company_id', companyId).order('called_at', { ascending: false }),
      admin.from('lead_notes').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      admin.from('lead_meetings').select('*').eq('company_id', companyId).order('scheduled_at', { ascending: false }),
      admin.from('lead_activities').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100),
    ])

    return NextResponse.json({
      outreach,
      calls: calls.data || [],
      notes: notes.data || [],
      meetings: meetings.data || [],
      activities: activities.data || [],
    })
  }

  if (action === 'queue_stats') {
    const { data: outreaches } = await admin
      .from('lead_outreach')
      .select('pipeline_stage')
      .eq('agency_id', profile.agency_id)
    const stats: Record<string, number> = {}
    for (const o of outreaches || []) stats[o.pipeline_stage] = (stats[o.pipeline_stage] || 0) + 1

    // Vandaag te bellen
    const now = new Date().toISOString()
    const { count: callbackCount } = await admin
      .from('lead_outreach')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .eq('pipeline_stage', 'callback')
      .lte('next_action_at', now)

    return NextResponse.json({ by_stage: stats, callbacks_due: callbackCount || 0 })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const ctx = await getCtx()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { admin, profile } = ctx

  const body = await req.json()
  const { action, payload } = body

  if (action === 'log_call') {
    const { outreach_id, company_id, contact_id, outcome, notes, callback_at, duration_seconds } = payload
    if (!company_id || !outcome) return NextResponse.json({ error: 'company_id + outcome required' }, { status: 400 })

    const { data, error } = await admin.from('lead_calls').insert({
      agency_id: profile.agency_id,
      client_id: profile.client_id || null,
      company_id,
      contact_id,
      outreach_id,
      called_by: profile.id,
      outcome,
      notes,
      callback_at: callback_at || null,
      duration_seconds: duration_seconds || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, call: data })
  }

  if (action === 'add_note') {
    const { company_id, outreach_id, contact_id, body: noteBody, is_pinned } = payload
    if (!company_id || !noteBody) return NextResponse.json({ error: 'company_id + body required' }, { status: 400 })

    const { data, error } = await admin.from('lead_notes').insert({
      agency_id: profile.agency_id,
      client_id: profile.client_id || null,
      company_id,
      outreach_id,
      contact_id,
      author_id: profile.id,
      body: noteBody,
      is_pinned: !!is_pinned,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, note: data })
  }

  if (action === 'schedule_meeting') {
    const { company_id, outreach_id, contact_id, scheduled_at, duration_min, location, meeting_url, meeting_type, notes } = payload
    if (!company_id || !scheduled_at) return NextResponse.json({ error: 'company_id + scheduled_at required' }, { status: 400 })

    const { data, error } = await admin.from('lead_meetings').insert({
      agency_id: profile.agency_id,
      client_id: profile.client_id || null,
      company_id,
      outreach_id,
      contact_id,
      scheduled_by: profile.id,
      scheduled_at,
      duration_min: duration_min || 30,
      location: location || null,
      meeting_url: meeting_url || null,
      meeting_type: meeting_type || 'call',
      notes: notes || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (outreach_id) {
      await admin.from('lead_outreach').update({ pipeline_stage: 'gesprek_ingepland' }).eq('id', outreach_id)
    }
    return NextResponse.json({ ok: true, meeting: data })
  }

  if (action === 'update_company') {
    const { company_id, updates } = payload
    if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 })
    const allowed = ['name', 'phone', 'phone_secondary', 'website_url', 'address', 'city', 'postcode', 'province', 'industry', 'employee_count', 'notes']
    const clean: Record<string, unknown> = {}
    for (const k of allowed) if (k in updates) clean[k] = updates[k]

    const { data, error } = await admin.from('lead_companies')
      .update(clean)
      .eq('id', company_id)
      .eq('agency_id', profile.agency_id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin.from('lead_activities').insert({
      agency_id: profile.agency_id, company_id, actor_id: profile.id,
      type: 'company_updated', summary: 'Bedrijfsgegevens bijgewerkt',
      metadata: { fields: Object.keys(clean) },
    })
    return NextResponse.json({ ok: true, company: data })
  }

  if (action === 'update_contact') {
    const { contact_id, updates } = payload
    if (!contact_id) return NextResponse.json({ error: 'contact_id required' }, { status: 400 })
    const allowed = ['first_name', 'last_name', 'full_name', 'email', 'phone', 'role', 'linkedin_url', 'is_primary']
    const clean: Record<string, unknown> = {}
    for (const k of allowed) if (k in updates) clean[k] = updates[k]

    const { data, error } = await admin.from('lead_contacts')
      .update(clean).eq('id', contact_id).eq('agency_id', profile.agency_id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await admin.from('lead_activities').insert({
      agency_id: profile.agency_id, company_id: data.company_id, contact_id, actor_id: profile.id,
      type: 'contact_updated', summary: 'Contactgegevens bijgewerkt',
      metadata: { fields: Object.keys(clean) },
    })
    return NextResponse.json({ ok: true, contact: data })
  }

  if (action === 'update_outreach') {
    const { outreach_id, updates } = payload
    if (!outreach_id) return NextResponse.json({ error: 'outreach_id required' }, { status: 400 })
    const allowed = ['pipeline_stage', 'assigned_to', 'next_action_at', 'next_action_note', 'priority', 'service']
    const clean: Record<string, unknown> = {}
    for (const k of allowed) if (k in updates) clean[k] = updates[k]

    // Get old stage for activity log
    const { data: current } = await admin.from('lead_outreach').select('pipeline_stage, company_id')
      .eq('id', outreach_id).eq('agency_id', profile.agency_id).single()

    const { data, error } = await admin.from('lead_outreach')
      .update(clean).eq('id', outreach_id).eq('agency_id', profile.agency_id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (current && clean.pipeline_stage && clean.pipeline_stage !== current.pipeline_stage) {
      await admin.from('lead_activities').insert({
        agency_id: profile.agency_id, company_id: current.company_id, outreach_id, actor_id: profile.id,
        type: 'stage_changed',
        summary: `Van ${current.pipeline_stage} → ${clean.pipeline_stage}`,
        metadata: { from: current.pipeline_stage, to: clean.pipeline_stage },
      })
    }
    return NextResponse.json({ ok: true, outreach: data })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
