import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Refresh tokens that expire within 7 days
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: accounts, error } = await supabase
      .from('social_accounts')
      .select('*')
      .lt('token_expires_at', sevenDaysFromNow.toISOString())
      .eq('is_active', true)
      .not('refresh_token', 'is', null)

    if (error) throw error

    const results = { refreshed: 0, failed: 0, errors: [] as string[] }

    for (const account of (accounts || [])) {
      try {
        let newTokens: { access_token: string; expires_in?: number } | null = null

        if (account.platform === 'instagram' || account.platform === 'facebook') {
          // Meta long-lived token exchange
          const resp = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get('FACEBOOK_CLIENT_ID')}&client_secret=${Deno.env.get('FACEBOOK_CLIENT_SECRET')}&fb_exchange_token=${account.access_token}`
          )
          const data = await resp.json()
          if (data.access_token) newTokens = data
        } else if (account.platform === 'linkedin') {
          const resp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: account.refresh_token,
              client_id: Deno.env.get('LINKEDIN_CLIENT_ID')!,
              client_secret: Deno.env.get('LINKEDIN_CLIENT_SECRET')!,
            }),
          })
          const data = await resp.json()
          if (data.access_token) newTokens = data
        } else if (account.platform === 'tiktok') {
          const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_key: Deno.env.get('TIKTOK_CLIENT_ID')!,
              client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET')!,
              grant_type: 'refresh_token',
              refresh_token: account.refresh_token,
            }),
          })
          const data = await resp.json()
          if (data.data?.access_token) newTokens = { access_token: data.data.access_token, expires_in: data.data.expires_in }
        } else if (account.platform === 'youtube') {
          const resp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
              client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
              grant_type: 'refresh_token',
              refresh_token: account.refresh_token,
            }),
          })
          const data = await resp.json()
          if (data.access_token) newTokens = data
        }

        if (newTokens) {
          const expiresAt = newTokens.expires_in
            ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
            : null

          await supabase.from('social_accounts').update({
            access_token: newTokens.access_token,
            ...(expiresAt ? { token_expires_at: expiresAt } : {}),
            updated_at: now.toISOString(),
          }).eq('id', account.id)

          results.refreshed++
        }
      } catch (err: any) {
        results.failed++
        results.errors.push(`${account.platform}/${account.account_name}: ${err.message}`)
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
