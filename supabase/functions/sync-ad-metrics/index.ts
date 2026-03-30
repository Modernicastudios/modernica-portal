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
    const { data: adAccounts } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('is_active', true)

    const results = { synced: 0, failed: 0 }
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    for (const adAccount of (adAccounts || [])) {
      try {
        if (adAccount.platform === 'meta_ads') {
          // Sync Meta Ads campaigns
          const campaignsResp = await fetch(
            `https://graph.facebook.com/v18.0/${adAccount.platform_account_id}/campaigns?fields=id,name,status,objective&access_token=${adAccount.access_token}&limit=50`
          )
          const campaignsData = await campaignsResp.json()

          for (const campaign of (campaignsData.data || [])) {
            // Upsert campaign
            await supabase.from('ad_campaigns').upsert({
              ad_account_id: adAccount.id,
              agency_id: adAccount.agency_id,
              platform: 'meta_ads',
              platform_campaign_id: campaign.id,
              name: campaign.name,
              status: campaign.status?.toLowerCase(),
              objective: campaign.objective,
            }, { onConflict: 'platform_campaign_id' })

            // Get insights
            const insightsResp = await fetch(
              `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=spend,impressions,clicks,ctr,cpc,reach,actions&time_range={"since":"${thirtyDaysAgo}","until":"${today}"}&access_token=${adAccount.access_token}`
            )
            const insightsData = await insightsResp.json()

            if (insightsData.data?.[0]) {
              const insight = insightsData.data[0]
              const conversions = (insight.actions || []).find((a: any) => a.action_type === 'purchase')?.value || 0
              const conversionValue = (insight.actions || []).find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0

              const { data: campaignRecord } = await supabase
                .from('ad_campaigns')
                .select('id')
                .eq('platform_campaign_id', campaign.id)
                .single()

              if (campaignRecord) {
                await supabase.from('ad_metrics').upsert({
                  ad_account_id: adAccount.id,
                  campaign_id: campaignRecord.id,
                  agency_id: adAccount.agency_id,
                  date: today,
                  spend: parseFloat(insight.spend || '0'),
                  impressions: parseInt(insight.impressions || '0'),
                  clicks: parseInt(insight.clicks || '0'),
                  conversions: parseInt(conversions),
                  revenue: parseFloat(conversionValue),
                  ctr: parseFloat(insight.ctr || '0'),
                  cpc: parseFloat(insight.cpc || '0'),
                  reach: parseInt(insight.reach || '0'),
                }, { onConflict: 'campaign_id,date' })
              }
            }
          }
          results.synced++
        } else if (adAccount.platform === 'google_ads') {
          // Google Ads API requires developer token and customer ID
          // Using the Google Ads API REST endpoint
          const resp = await fetch(
            `https://googleads.googleapis.com/v14/customers/${adAccount.platform_account_id}/googleAds:searchStream`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${adAccount.access_token}`,
                'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date DURING LAST_30_DAYS`,
              }),
            }
          )

          if (resp.ok) {
            const data = await resp.json()
            for (const result of (data || [])) {
              for (const row of (result.results || [])) {
                await supabase.from('ad_campaigns').upsert({
                  ad_account_id: adAccount.id,
                  agency_id: adAccount.agency_id,
                  platform: 'google_ads',
                  platform_campaign_id: row.campaign.id,
                  name: row.campaign.name,
                  status: row.campaign.status?.toLowerCase(),
                }, { onConflict: 'platform_campaign_id' })
              }
            }
            results.synced++
          }
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
