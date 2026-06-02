// AI-kosten meten + maandlimiet per agency bewaken.
// Bewust "fail-open": als de ai_usage-tabel (nog) niet bestaat of een query
// faalt, blokkeren we de AI niet — we loggen het verbruik dan gewoon niet.
import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

// Prijs per miljoen tokens (Haiku-achtig). Instelbaar via env als de prijs wijzigt.
const IN_PER_MTOK = Number(process.env.AI_PRICE_IN_USD) || 1.0
const OUT_PER_MTOK = Number(process.env.AI_PRICE_OUT_USD) || 5.0

// Globale standaard-maandlimiet per agency (USD) als er geen eigen limiet is gezet.
export const DEFAULT_MONTHLY_LIMIT_USD = Number(process.env.AI_MONTHLY_LIMIT_USD) || 50

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * IN_PER_MTOK + outputTokens * OUT_PER_MTOK) / 1_000_000
}

function firstOfMonthISO(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

// Verbruik wegschrijven. Faalt stil (mag de AI-call nooit breken).
export async function recordAiUsage(admin: Admin, opts: {
  agencyId: string
  clientId?: string | null
  kind: string
  inputTokens: number
  outputTokens: number
}): Promise<void> {
  try {
    const cost = estimateCost(opts.inputTokens, opts.outputTokens)
    await admin.from('ai_usage').insert({
      agency_id: opts.agencyId,
      client_id: opts.clientId ?? null,
      kind: opts.kind,
      input_tokens: opts.inputTokens,
      output_tokens: opts.outputTokens,
      cost_usd: cost,
    })
  } catch { /* tabel ontbreekt of insert faalde — negeren */ }
}

// Uitgaven deze maand voor één agency (USD).
export async function getMonthlySpend(admin: Admin, agencyId: string): Promise<number> {
  try {
    const { data } = await admin
      .from('ai_usage').select('cost_usd')
      .eq('agency_id', agencyId).gte('created_at', firstOfMonthISO())
    return (data || []).reduce((s: number, r: { cost_usd: number | string }) => s + Number(r.cost_usd), 0)
  } catch { return 0 }
}

// Limiet van een agency (eigen limiet of de globale standaard).
export async function getLimit(admin: Admin, agencyId: string): Promise<number> {
  try {
    const { data } = await admin.from('agencies').select('ai_monthly_limit_usd').eq('id', agencyId).single()
    const own = (data as { ai_monthly_limit_usd?: number | null } | null)?.ai_monthly_limit_usd
    return own != null ? Number(own) : DEFAULT_MONTHLY_LIMIT_USD
  } catch { return DEFAULT_MONTHLY_LIMIT_USD }
}

// Zit deze agency deze maand boven z'n AI-budget?
export async function isOverBudget(admin: Admin, agencyId: string): Promise<boolean> {
  const [spend, limit] = await Promise.all([getMonthlySpend(admin, agencyId), getLimit(admin, agencyId)])
  return spend >= limit
}
