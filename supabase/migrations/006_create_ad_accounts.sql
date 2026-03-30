-- Advertentieplatform koppelingen
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads')),
  platform_account_id TEXT NOT NULL,
  platform_account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_by UUID REFERENCES user_profiles(id),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, platform, platform_account_id)
);

-- Campagne data (genormaliseerd)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  platform_campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  status TEXT,
  objective TEXT,
  daily_budget NUMERIC(12,2),
  lifetime_budget NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ad_account_id, platform_campaign_id)
);

-- Dagelijkse advertentie metrics
CREATE TABLE IF NOT EXISTS ad_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  cpm NUMERIC(10,4),
  cpc NUMERIC(10,4),
  ctr NUMERIC(8,4),
  roas NUMERIC(10,4),
  raw_data JSONB,
  UNIQUE(ad_campaign_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_accounts_agency_id ON ad_accounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_ad_account_id ON ad_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_agency_id ON ad_campaigns(agency_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_campaign_id ON ad_metrics(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_metrics(date);

-- RLS
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_accounts_agency_isolation" ON ad_accounts
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "ad_campaigns_agency_isolation" ON ad_campaigns
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "ad_metrics_via_campaign" ON ad_metrics
  USING (ad_campaign_id IN (
    SELECT id FROM ad_campaigns WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  ));
