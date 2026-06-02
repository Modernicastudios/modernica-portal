import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

const ADMIN_ROLES = new Set(['admin', 'manager', 'super_admin'])

type TestResult = { ok: boolean; configured: boolean; message: string }

// Korte fetch met time-out, zodat een trage dienst de test niet laat hangen.
async function ping(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

// Live-test van de externe koppelingen. Doet minimale, (vrijwel) gratis calls
// om te bevestigen dat de sleutels niet alleen ingevuld zijn, maar ook WERKEN.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile?.role || !ADMIN_ROLES.has(profile.role)) {
    return NextResponse.json({ error: 'Geen rechten' }, { status: 403 })
  }

  const results: Record<string, TestResult> = {}

  // Apify — gratis /users/me endpoint.
  results.apify = await (async (): Promise<TestResult> => {
    const token = process.env.APIFY_TOKEN
    if (!token) return { ok: false, configured: false, message: 'Geen sleutel ingesteld' }
    try {
      const res = await ping(`https://api.apify.com/v2/users/me?token=${token}`)
      return res.ok
        ? { ok: true, configured: true, message: 'Verbinding werkt' }
        : { ok: false, configured: true, message: `Sleutel afgewezen (${res.status})` }
    } catch { return { ok: false, configured: true, message: 'Geen verbinding' } }
  })()

  // Anthropic — minimale messages-call (1 token), kost vrijwel niets.
  results.anthropic = await (async (): Promise<TestResult> => {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return { ok: false, configured: false, message: 'Geen sleutel ingesteld' }
    try {
      const res = await ping('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      })
      return res.ok
        ? { ok: true, configured: true, message: 'AI reageert' }
        : { ok: false, configured: true, message: `Afgewezen (${res.status})` }
    } catch { return { ok: false, configured: true, message: 'Geen verbinding' } }
  })()

  // Smartlead — gratis campagnelijst ophalen.
  results.smartlead = await (async (): Promise<TestResult> => {
    const key = process.env.SMARTLEAD_API_KEY
    if (!key) return { ok: false, configured: false, message: 'Geen sleutel ingesteld' }
    try {
      const res = await ping(`https://server.smartlead.ai/api/v1/campaigns?api_key=${key}`)
      return res.ok
        ? { ok: true, configured: true, message: 'Verbinding werkt' }
        : { ok: false, configured: true, message: `Sleutel afgewezen (${res.status})` }
    } catch { return { ok: false, configured: true, message: 'Geen verbinding' } }
  })()

  // MillionVerifier — gratis credits-endpoint.
  results.millionverifier = await (async (): Promise<TestResult> => {
    const key = process.env.MILLIONVERIFIER_API_KEY
    if (!key) return { ok: false, configured: false, message: 'Geen sleutel ingesteld (optioneel)' }
    try {
      const res = await ping(`https://api.millionverifier.com/api/v3/credits?api=${key}`)
      const data = await res.json().catch(() => ({}))
      return res.ok && data && data.credits !== undefined
        ? { ok: true, configured: true, message: `Werkt — ${data.credits} credits over` }
        : { ok: false, configured: true, message: 'Sleutel afgewezen' }
    } catch { return { ok: false, configured: true, message: 'Geen verbinding' } }
  })()

  return NextResponse.json({ ok: true, results })
}
