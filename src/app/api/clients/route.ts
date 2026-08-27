import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { rateLimit, rateLimitKey, rateLimitResponse } from '@/lib/rate-limit'
import { cached } from '@/lib/cache'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const rl = rateLimit(rateLimitKey(req, 'clients'), 60, 60_000)
  if (!rl.ok) return rateLimitResponse(rl.retryAfter)

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.warn('[/api/clients] auth error', { err: authError?.message })
      return NextResponse.json([], { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (profileError) logger.warn('[/api/clients] profile error', { err: profileError.message, userId: user.id })
    if (!profile?.agency_id) return NextResponse.json([])

    const clients = await cached(
      `clients:${profile.agency_id}`,
      30_000, // 30s cache
      async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('agency_id', profile.agency_id)
          .order('company_name')
        if (error) logger.error('[/api/clients] query error', { err: error.message })
        return data ?? []
      },
    )

    return NextResponse.json(clients)
  } catch (e) {
    logger.error('[/api/clients] unexpected error', { err: String(e) })
    return NextResponse.json([])
  }
}
