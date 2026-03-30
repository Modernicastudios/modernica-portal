import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATFORM_TOKEN_URLS: Record<string, string> = {
  instagram: 'https://graph.facebook.com/v19.0/oauth/access_token',
  facebook: 'https://graph.facebook.com/v19.0/oauth/access_token',
  linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
  tiktok: 'https://open.tiktokapis.com/v2/oauth/token/',
  youtube: 'https://oauth2.googleapis.com/token',
  meta_ads: 'https://graph.facebook.com/v19.0/oauth/access_token',
  google_ads: 'https://oauth2.googleapis.com/token',
  tiktok_ads: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
  linkedin_ads: 'https://www.linkedin.com/oauth/v2/accessToken',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return Response.redirect(`${Deno.env.get('APP_URL')}/settings/integrations?error=${error}`)
    }

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate state and get context
    const { data: oauthState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (stateError || !oauthState) {
      return Response.redirect(`${Deno.env.get('APP_URL')}/settings/integrations?error=invalid_state`)
    }

    const { platform, agency_id, user_id } = oauthState
    const isAdsPlatform = platform.includes('_ads') || platform === 'google_ads'
    const appType = isAdsPlatform ? 'ads' : 'social'

    // Get platform credentials from env
    const clientId = Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`)
    const clientSecret = Deno.env.get(`${platform.toUpperCase()}_CLIENT_SECRET`)
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-callback`

    if (!clientId || !clientSecret) {
      console.error(`Missing credentials for platform: ${platform}`)
      return Response.redirect(`${Deno.env.get('APP_URL')}/settings/integrations?error=missing_credentials`)
    }

    // Exchange code for tokens
    let tokenData: any = {}

    if (platform === 'instagram' || platform === 'facebook' || platform === 'meta_ads') {
      const resp = await fetch(PLATFORM_TOKEN_URLS[platform], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })
      tokenData = await resp.json()

      // Exchange for long-lived token (60 days)
      if (tokenData.access_token && !isAdsPlatform) {
        const llResp = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`)
        const llData = await llResp.json()
        if (llData.access_token) tokenData = { ...tokenData, ...llData }
      }
    } else if (platform === 'linkedin' || platform === 'linkedin_ads') {
      const resp = await fetch(PLATFORM_TOKEN_URLS[platform], {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })
      tokenData = await resp.json()
    } else if (platform === 'youtube' || platform === 'google_ads') {
      const resp = await fetch(PLATFORM_TOKEN_URLS[platform], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })
      tokenData = await resp.json()
    } else if (platform === 'tiktok' || platform === 'tiktok_ads') {
      const resp = await fetch(PLATFORM_TOKEN_URLS[platform], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_key: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code' }),
      })
      tokenData = await resp.json()
    }

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return Response.redirect(`${Deno.env.get('APP_URL')}/settings/integrations?error=token_exchange_failed`)
    }

    // Fetch account info
    let accountId = ''
    let username = ''
    let avatarUrl = ''

    try {
      if (platform === 'instagram') {
        const meResp = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`)
        const meData = await meResp.json()
        accountId = meData.id || ''
        username = meData.name || ''
      } else if (platform === 'linkedin') {
        const meResp = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        const meData = await meResp.json()
        accountId = meData.sub || ''
        username = meData.name || ''
        avatarUrl = meData.picture || ''
      } else if (platform === 'youtube') {
        const meResp = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        const meData = await meResp.json()
        const channel = meData.items?.[0]
        accountId = channel?.id || ''
        username = channel?.snippet?.title || ''
        avatarUrl = channel?.snippet?.thumbnails?.default?.url || ''
      }
    } catch (e) {
      console.error('Failed to fetch account info:', e)
    }

    // Store the account
    const tokenExpiry = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    if (isAdsPlatform) {
      await supabase.from('ad_accounts').upsert({
        agency_id,
        platform,
        platform_account_id: accountId || crypto.randomUUID(),
        platform_account_name: username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: tokenExpiry,
        connected_by: user_id,
        is_active: true,
      }, { onConflict: 'agency_id,platform,platform_account_id' })
    } else {
      await supabase.from('social_accounts').upsert({
        agency_id,
        platform,
        platform_account_id: accountId || crypto.randomUUID(),
        platform_username: username,
        platform_avatar_url: avatarUrl,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: tokenExpiry,
        connected_by: user_id,
        is_active: true,
      }, { onConflict: 'agency_id,platform,platform_account_id' })
    }

    // Clean up oauth state
    await supabase.from('oauth_states').delete().eq('state', state)

    return Response.redirect(`${Deno.env.get('APP_URL')}/settings/integrations?success=${platform}`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return Response.redirect(`${Deno.env.get('APP_URL')}/settings/integrations?error=server_error`)
  }
})
