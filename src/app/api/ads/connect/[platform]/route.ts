import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const AD_OAUTH_CONFIGS: Record<string, { authUrl: string; scopes: string; extraParams?: Record<string, string> }> = {
  meta_ads: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    scopes: 'ads_read,ads_management,business_management,read_insights',
  },
  google_ads: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: 'https://www.googleapis.com/auth/adwords',
    extraParams: { access_type: 'offline', prompt: 'consent' },
  },
  tiktok_ads: {
    authUrl: 'https://business-api.tiktok.com/portal/auth',
    scopes: 'report.read,campaign.read,adgroup.read,ad.read',
  },
  linkedin_ads: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scopes: 'r_ads,r_ads_reporting,rw_ads,r_organization_admin',
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

  const config = AD_OAUTH_CONFIGS[platform]
  if (!config) return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })

  const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`]
  if (!clientId) {
    return NextResponse.redirect(new URL(`/settings/integrations?error=platform_not_configured&platform=${platform}`, req.url))
  }

  const state = crypto.randomBytes(32).toString('hex')
  await supabase.from('oauth_states').insert({
    state,
    agency_id: profile.agency_id,
    user_id: user.id,
    platform,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })

  const redirectUri = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/oauth-callback`
  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', config.scopes)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')
  if (config.extraParams) Object.entries(config.extraParams).forEach(([k, v]) => authUrl.searchParams.set(k, v))

  return NextResponse.redirect(authUrl.toString())
}
