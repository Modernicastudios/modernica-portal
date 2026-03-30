import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('is_active', true)

    const results = { synced: 0, failed: 0 }
    const today = new Date().toISOString().split('T')[0]

    for (const account of (accounts || [])) {
      try {
        let metrics: any = null

        if (account.platform === 'instagram') {
          const resp = await fetch(
            `https://graph.facebook.com/v18.0/${account.platform_account_id}?fields=followers_count,media_count,website&access_token=${account.access_token}`
          )
          const data = await resp.json()
          if (data.followers_count !== undefined) {
            metrics = { followers: data.followers_count, posts: data.media_count }
          }

          // Get recent media insights
          const mediaResp = await fetch(
            `https://graph.facebook.com/v18.0/${account.platform_account_id}/media?fields=like_count,comments_count,impressions,reach&limit=10&access_token=${account.access_token}`
          )
          const mediaData = await mediaResp.json()
          if (mediaData.data) {
            const totalLikes = mediaData.data.reduce((s: number, m: any) => s + (m.like_count || 0), 0)
            const totalComments = mediaData.data.reduce((s: number, m: any) => s + (m.comments_count || 0), 0)
            metrics = { ...metrics, likes: totalLikes, comments: totalComments }
          }
        } else if (account.platform === 'linkedin') {
          const resp = await fetch(
            `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${account.platform_account_id}`,
            { headers: { Authorization: `Bearer ${account.access_token}` } }
          )
          const data = await resp.json()
          if (data.elements?.[0]) {
            metrics = { followers: data.elements[0].followerCounts?.organicFollowerCount || 0 }
          }
        } else if (account.platform === 'youtube') {
          const resp = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${account.platform_account_id}&key=${Deno.env.get('YOUTUBE_CLIENT_ID')}`,
            { headers: { Authorization: `Bearer ${account.access_token}` } }
          )
          const data = await resp.json()
          if (data.items?.[0]?.statistics) {
            const stats = data.items[0].statistics
            metrics = {
              followers: parseInt(stats.subscriberCount || '0'),
              views: parseInt(stats.viewCount || '0'),
              videos: parseInt(stats.videoCount || '0'),
            }
          }
        }

        if (metrics) {
          await supabase.from('social_metrics').upsert({
            agency_id: account.agency_id,
            social_account_id: account.id,
            platform: account.platform,
            date: today,
            followers: metrics.followers || 0,
            reach: metrics.reach || 0,
            impressions: metrics.impressions || 0,
            engagement: ((metrics.likes || 0) + (metrics.comments || 0)),
            posts_count: metrics.posts || 0,
            raw_data: metrics,
          }, { onConflict: 'social_account_id,date' })

          results.synced++
        }
      } catch {
        results.failed++
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
