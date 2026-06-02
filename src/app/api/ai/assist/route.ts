import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

type Msg = { role: 'user' | 'assistant'; content: string }

// AI-assistent in de app: helpt met schrijven (social posts, mails, teksten),
// brainstormen en vragen. Alleen voor ingelogde gebruikers.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: 'AI is nog niet ingesteld (ANTHROPIC_API_KEY).' }, { status: 400 })

  let body: { messages?: unknown } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 }) }

  const raw = Array.isArray(body.messages) ? body.messages : []
  // Opschonen + begrenzen: laatste 12 berichten, max ~4000 tekens elk.
  const messages: Msg[] = raw
    .filter((m: unknown): m is Msg => {
      const mm = m as { role?: unknown; content?: unknown }
      return (mm.role === 'user' || mm.role === 'assistant') && typeof mm.content === 'string'
    })
    .slice(-12)
    .map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Geen vraag ontvangen' }, { status: 400 })
  }

  // Agency-naam meegeven voor context.
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('agency_id, full_name').eq('id', user.id).single()
  let agencyName = 'het marketingbureau'
  if (profile?.agency_id) {
    const { data: agency } = await admin.from('agencies').select('name').eq('id', profile.agency_id).single()
    if (agency?.name) agencyName = agency.name
  }

  const system = `Je bent de behulpzame AI-assistent binnen het portaal van ${agencyName}, een marketingbureau. Je helpt het team met schrijven (social media posts, e-mails, advertentieteksten, ideeën, samenvattingen) en met vragen over hun werk.
Schrijf standaard in het Nederlands, helder en to-the-point. Vraag kort om verduidelijking als iets onduidelijk is. Geef bruikbare, concrete output — geen omhaal. Gebruik nette opmaak (korte alinea's, eventueel opsommingen) maar geen overdreven markdown-kopjes.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1024, system, messages }),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'De AI is even niet bereikbaar. Probeer het zo opnieuw.' }, { status: 502 })
    }
    const data = await res.json()
    const text = (data.content?.[0]?.text || '').trim()
    return NextResponse.json({ ok: true, text })
  } catch {
    return NextResponse.json({ error: 'Er ging iets mis met de AI.' }, { status: 500 })
  }
}
