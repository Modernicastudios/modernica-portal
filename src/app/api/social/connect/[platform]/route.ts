import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const OAUTH_CONFIGS: Record<string, { authUrl: string; scopes: string; extraParams?: Record<string, string> }> = {
  instagram: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_insights,business_management',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: 'pages_show_list,pages_read_engagement,pages_manage_posts,read_insights',
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: 'openid profile w_member_social r_organization_social w_organization_social',
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    scopes: 'user.info.basic,video.publish,video.upload,video.list',
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/yt-analytics.readonly',
    extraParams: { access_type: 'offline', prompt: 'consent' },
  },
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('user_profiles').select('agency_id').eq('id', user.id).single()
  if (!profile?.agency_id) return NextResponse.json({ error: 'No agency' }, { status: 400 })

  const config = OAUTH_CONFIGS[platform]
  if (!config) return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })

  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`]
  if (!clientId) {
    return NextResponse.redirect(new URL(`/settings/integrations?error=platform_not_configured&platform=${platform}`, req.url))
  }

  // Generate and store state
  const state = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabase.from('oauth_states').insert({
    state,
    agency_id: profile.agency_id,
    user_id: user.id,
    platform,
    expires_at: expiresAt,
  })

  const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/oauth-callback`

  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', config.scopes)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')

  if (config.extraParams) {
    Object.entries(config.extraParams).forEach(([k, v]) => authUrl.searchParams.set(k, v))
  }

  return NextResponse.redirect(authUrl.toString())
}
