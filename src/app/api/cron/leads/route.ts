import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runCampaign } from '@/lib/leadmachine/pipeline'
import { pushQueuedForCampaign } from '@/lib/leadmachine/dispatch'

export const maxDuration = 60

// Dagelijkse automatische run. Vercel Cron roept dit aan (zie vercel.json) en
// stuurt 'Authorization: Bearer <CRON_SECRET>'. Voor elke ACTIEVE campagne:
//   1. vind een dagelijkse batch nieuwe bedrijven (binnen de maandlimiet),
//   2. duw de wachtende, goedgekeurde leads naar Smartlead (mits gekoppeld).
// Zo loopt de leadmachine zelfstandig zonder dat iemand op een knop hoeft te drukken.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Niet toegestaan' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: campaigns } = await admin
    .from('lead_campaigns')
    .select('id, agency_id, client_id, settings, status')
    .eq('status', 'active')
  if (!campaigns || campaigns.length === 0) return NextResponse.json({ ok: true, campaigns: 0 })

  const monthlyCap = Number(process.env.LEAD_MONTHLY_CAP) || 2000
  const dailyDefault = Number(process.env.LEAD_DAILY_LIMIT) || 25
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // Feature-flag per agency cachen (1 lookup per agency).
  const featureCache = new Map<string, boolean>()
  const results: Array<{ campaign: string; found?: number; sent?: number; error?: string }> = []

  for (const c of campaigns) {
    try {
      let on = featureCache.get(c.agency_id)
      if (on === undefined) {
        const { data: ag } = await admin.from('agencies').select('features').eq('id', c.agency_id).single()
        on = Boolean((ag?.features as Record<string, boolean> | null)?.lead_machine)
        featureCache.set(c.agency_id, on)
      }
      if (!on) continue // leadmachine staat uit voor deze agency → overslaan

      // Kostenrem: harde maandlimiet per agency.
      const { count } = await admin.from('lead_companies')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', c.agency_id).gte('created_at', firstOfMonth)
      const used = count || 0

      let found = 0
      if (used < monthlyCap) {
        const settings = (c.settings as { daily_limit?: number } | null)
        const dailyLimit = Math.min(Number(settings?.daily_limit) || dailyDefault, monthlyCap - used)
        const summary = await runCampaign(c.id, dailyLimit)
        found = summary.found
      }

      // Verstuur wachtende leads (alleen als Smartlead-campagne-ID is ingevuld).
      const pushed = await pushQueuedForCampaign(
        { id: c.id, agency_id: c.agency_id, client_id: c.client_id, settings: c.settings as { smartlead_campaign_id?: string } | null },
        admin,
      )
      results.push({ campaign: c.id, found, sent: pushed.sent, error: pushed.error })
    } catch (e) {
      results.push({ campaign: c.id, error: e instanceof Error ? e.message : 'fout' })
    }
  }

  return NextResponse.json({ ok: true, campaigns: campaigns.length, results })
}
