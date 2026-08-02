// POST /api/leads/talking-points
// Genereer 3-4 gesprekspunten voor een lead op basis van bedrijfsnaam + branche + stad
// Slaat resultaat op als pinned note

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) return NextResponse.json({ error: 'no agency' }, { status: 403 })

  const { outreach_id } = await req.json()
  if (!outreach_id) return NextResponse.json({ error: 'outreach_id required' }, { status: 400 })

  const { data: outreach } = await admin
    .from('lead_outreach')
    .select('*, lead_companies(*), lead_contacts(*)')
    .eq('id', outreach_id)
    .eq('agency_id', profile.agency_id)
    .single()

  if (!outreach) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const co = outreach.lead_companies
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const prompt = `Je bent een cold caller die zich voorbereidt op een gesprek met een MKB-bedrijf in Nederland.
Wij bieden: nieuwe websites, social media, video-content en online marketing.

Bedrijf: ${co.name}
Branche: ${co.industry || 'onbekend'}
Stad: ${co.city || 'onbekend'}
Website: ${co.website_url || 'geen'}

Geef 4 korte gesprekspunten (elk max 15 woorden) om aan te snijden tijdens het gesprek:
1. Iets over hun business dat opvalt of interessant is
2. Een concrete vraag over hun online zichtbaarheid
3. Een mogelijke pijnpunt voor deze branche
4. Een aanknopingspunt voor Modernica's diensten

Format: gewone Nederlandse zinnen, geen bullet points, geen emojis, geen inleiding.
Direct de 4 punten, elk op nieuwe regel beginnend met "•".`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const d = await res.json() as any
  const text = (d.content?.[0]?.text || '').trim()
  if (!text) return NextResponse.json({ error: 'no output' }, { status: 500 })

  // Save as pinned note
  const noteBody = `🤖 Gesprekspunten (AI-gegenereerd):\n\n${text}`
  const { data: note, error } = await admin.from('lead_notes').insert({
    agency_id: profile.agency_id,
    client_id: profile.client_id || null,
    company_id: outreach.company_id,
    outreach_id,
    contact_id: outreach.contact_id,
    author_id: profile.id,
    body: noteBody,
    is_pinned: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, note, text })
}
