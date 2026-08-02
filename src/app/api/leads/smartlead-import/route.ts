// POST /api/leads/smartlead-import
// Import alle leads uit Smartlead campagnes naar Supabase CRM (lead_companies + lead_contacts + lead_outreach)
// Ook email-activiteit (sent/opened/replied) als lead_activities.
// Idempotent: skip als email al bestaat voor deze agency.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SMARTLEAD_BASE = 'https://server.smartlead.ai/api/v1'

async function sl(path: string, key: string) {
  const url = `${SMARTLEAD_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${key}`
  const r = await fetch(url)
  return r.json()
}

function extractDomain(email: string): string {
  const at = email.indexOf('@')
  if (at < 0) return ''
  return email.slice(at + 1).toLowerCase().trim()
}

function guessNames(email: string, existingFirst?: string, existingLast?: string): { first_name: string, last_name: string } {
  if (existingFirst || existingLast) {
    return { first_name: existingFirst || '', last_name: existingLast || '' }
  }
  const local = email.split('@')[0] || ''
  // john.doe / johndoe / j.doe patterns
  if (local.includes('.')) {
    const parts = local.split('.')
    return {
      first_name: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
      last_name: parts.slice(1).join(' ').charAt(0).toUpperCase() + parts.slice(1).join(' ').slice(1),
    }
  }
  return { first_name: '', last_name: '' }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('user_profiles').select('*').eq('id', user.id).single()
    if (!profile?.agency_id) return NextResponse.json({ error: 'no agency' }, { status: 403 })

    const SMARTLEAD_KEY = process.env.SMARTLEAD_API_KEY
    if (!SMARTLEAD_KEY) return NextResponse.json({ error: 'SMARTLEAD_API_KEY not configured' }, { status: 500 })

    // Optioneel: filter op specifieke campagne ids in body
    const body = await req.json().catch(() => ({}))
    const filterCampaignIds: number[] | null = body.campaign_ids || null

    // Step 1: fetch all campaigns from Smartlead
    const campaigns: any[] = await sl('/campaigns', SMARTLEAD_KEY)
    const activeCamps = filterCampaignIds
      ? campaigns.filter(c => filterCampaignIds.includes(c.id))
      : campaigns.filter(c => !c.name?.toLowerCase().includes('test'))

    // Fetch existing emails for dedup
    const { data: existingCompanies } = await admin
      .from('lead_contacts')
      .select('email')
      .eq('agency_id', profile.agency_id)
    const existingEmails = new Set((existingCompanies || []).map((c: any) => (c.email || '').toLowerCase().trim()))

    let importedCompanies = 0
    let importedContacts = 0
    let importedOutreach = 0
    let importedActivities = 0
    let skipped = 0
    const errors: string[] = []

    for (const camp of activeCamps) {
      // Fetch leads
      let offset = 0
      const campaignLeads: any[] = []
      while (offset < 5000) {
        const r = await sl(`/campaigns/${camp.id}/leads?offset=${offset}&limit=100`, SMARTLEAD_KEY)
        const arr = r?.data || []
        if (!arr.length) break
        campaignLeads.push(...arr)
        if (arr.length < 100) break
        offset += arr.length
      }

      // Fetch email statistics for activity import
      const stats: any[] = []
      offset = 0
      while (offset < 10000) {
        const r = await sl(`/campaigns/${camp.id}/statistics?offset=${offset}&limit=500`, SMARTLEAD_KEY)
        const arr = r?.data || []
        if (!arr.length) break
        stats.push(...arr)
        if (arr.length < 500) break
        offset += arr.length
      }

      // Group stats by email
      const statsByEmail: Record<string, any[]> = {}
      for (const s of stats) {
        const em = (s.lead_email || '').toLowerCase().trim()
        if (!statsByEmail[em]) statsByEmail[em] = []
        statsByEmail[em].push(s)
      }

      for (const l of campaignLeads) {
        try {
          const email = (l.lead?.email || '').toLowerCase().trim()
          if (!email || !email.includes('@')) { skipped++; continue }
          if (existingEmails.has(email)) { skipped++; continue }
          existingEmails.add(email)

          const domain = extractDomain(email)
          const cf = l.lead?.custom_fields || {}
          const { first_name, last_name } = guessNames(email, l.lead?.first_name, l.lead?.last_name)

          // Upsert company (by domain within agency)
          const companyName = (l.lead?.company_name || '').trim() || domain || email
          let companyId: string | null = null

          const { data: existingCo } = await admin
            .from('lead_companies')
            .select('id')
            .eq('agency_id', profile.agency_id)
            .eq('domain', domain)
            .maybeSingle()

          if (existingCo) {
            companyId = existingCo.id
          } else {
            const { data: newCo, error: coErr } = await admin
              .from('lead_companies')
              .insert({
                agency_id: profile.agency_id,
                name: companyName,
                domain,
                website_url: domain ? `https://${domain}` : null,
                city: cf.city || null,
                industry: cf.category || null,
                province: cf.province || null,
                source: 'smartlead',
                smartlead_source: camp.name,
              })
              .select('id')
              .single()
            if (coErr) { errors.push(`company: ${coErr.message}`); continue }
            companyId = newCo.id
            importedCompanies++
          }

          // Insert contact
          const { data: newContact, error: cErr } = await admin
            .from('lead_contacts')
            .insert({
              agency_id: profile.agency_id,
              company_id: companyId,
              first_name,
              last_name,
              full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
              email,
              found_via: 'apollo',
              is_primary: true,
            })
            .select('id')
            .single()
          if (cErr) { errors.push(`contact: ${cErr.message}`); continue }
          importedContacts++

          // Map Smartlead status → CRM stage
          let stage = 'nieuw'
          if (l.status === 'INPROGRESS') stage = 'nieuw'
          if (l.status === 'COMPLETED') stage = 'nieuw'
          if (l.status === 'BLOCKED') stage = 'niet_geinteresseerd'

          // Insert outreach
          const { data: newOr, error: oErr } = await admin
            .from('lead_outreach')
            .insert({
              agency_id: profile.agency_id,
              company_id: companyId,
              contact_id: newContact.id,
              service: 'website',
              opening_line: cf.first_line || null,
              status: 'pushed',
              pipeline_stage: stage,
              smartlead_campaign_id: String(camp.id),
              last_contacted_at: l.created_at || null,
            })
            .select('id')
            .single()
          if (oErr) { errors.push(`outreach: ${oErr.message}`); continue }
          importedOutreach++

          // Import email activity
          const emailStats = statsByEmail[email] || []
          for (const es of emailStats) {
            if (es.sent_time) {
              await admin.from('lead_activities').insert({
                agency_id: profile.agency_id,
                company_id: companyId,
                contact_id: newContact.id,
                outreach_id: newOr.id,
                type: 'email_sent',
                summary: es.email_subject || `Email #${es.sequence_number}`,
                metadata: { seq: es.sequence_number, sent_at: es.sent_time },
                created_at: es.sent_time,
              })
              importedActivities++
            }
            if (es.open_time) {
              await admin.from('lead_activities').insert({
                agency_id: profile.agency_id,
                company_id: companyId,
                contact_id: newContact.id,
                outreach_id: newOr.id,
                type: 'email_opened',
                summary: `Geopend: ${es.email_subject || 'email'}`,
                metadata: { seq: es.sequence_number, open_count: es.open_count },
                created_at: es.open_time,
              })
              importedActivities++
            }
            if (es.reply_time) {
              await admin.from('lead_activities').insert({
                agency_id: profile.agency_id,
                company_id: companyId,
                contact_id: newContact.id,
                outreach_id: newOr.id,
                type: 'email_replied',
                summary: `Reactie op: ${es.email_subject || 'email'}`,
                metadata: { seq: es.sequence_number },
                created_at: es.reply_time,
              })
              importedActivities++
            }
          }

          // Import marker
          await admin.from('lead_activities').insert({
            agency_id: profile.agency_id,
            company_id: companyId,
            contact_id: newContact.id,
            outreach_id: newOr.id,
            type: 'imported',
            summary: `Geïmporteerd uit Smartlead: ${camp.name}`,
          })
        } catch (e: any) {
          errors.push(`lead: ${e?.message || 'unknown'}`)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      companies: importedCompanies,
      contacts: importedContacts,
      outreach: importedOutreach,
      activities: importedActivities,
      skipped,
      errors: errors.slice(0, 20),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 })
  }
}
