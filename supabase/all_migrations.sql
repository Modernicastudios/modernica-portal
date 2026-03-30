-- Voeg SaaS-kolommen toe aan agencies tabel
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS max_clients INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_social_accounts INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_ad_accounts INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS max_team_members INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Index op slug en custom_domain voor snelle tenant lookup
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_custom_domain ON agencies(custom_domain);
-- Voeg white-label kolommen toe aan brand_kits
ALTER TABLE brand_kits
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS login_bg_url TEXT,
  ADD COLUMN IF NOT EXISTS email_header_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_css TEXT,
  ADD COLUMN IF NOT EXISTS powered_by_visible BOOLEAN NOT NULL DEFAULT true;
-- Voeg extra kolommen toe aan user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0;

-- Index voor snelle agency-lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_id ON user_profiles(client_id);
-- Social media account koppelingen
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'tiktok', 'youtube')),
  platform_account_id TEXT NOT NULL,
  platform_username TEXT,
  platform_avatar_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, platform, platform_account_id)
);

-- OAuth state voor veilige OAuth flows
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT UNIQUE NOT NULL,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  redirect_url TEXT,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_agency_id ON social_accounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_client_id ON social_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);

-- RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Agency isolation policy
CREATE POLICY "social_accounts_agency_isolation" ON social_accounts
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "oauth_states_user_isolation" ON oauth_states
  USING (user_id = auth.uid());
-- Geplande social media posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  content_text TEXT,
  media_urls TEXT[],
  -- platforms: [{"account_id": "uuid", "platform": "instagram", "post_type": "feed"}]
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  platform_post_ids JSONB,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Media library
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_agency_id ON scheduled_posts(agency_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_client_id ON scheduled_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_agency_id ON media_assets(agency_id);

-- RLS
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduled_posts_agency_isolation" ON scheduled_posts
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "media_assets_agency_isolation" ON media_assets
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
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
-- Per-client takenlijsten (zowel agency als client kunnen aanvullen)
CREATE TABLE IF NOT EXISTS client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'waiting', 'done')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_tasks_agency_id ON client_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_client_id ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(status);

-- RLS
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

-- Agency members kunnen alles zien en bewerken
CREATE POLICY "client_tasks_agency_access" ON client_tasks
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

-- Clients kunnen hun eigen taken zien en aanmaken
CREATE POLICY "client_tasks_client_access" ON client_tasks
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL
    )
  );
-- Dagelijkse organic social metrics (vervangt social_latest)
CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  followers INTEGER,
  following INTEGER,
  posts_count INTEGER,
  impressions BIGINT,
  reach BIGINT,
  engagement_rate NUMERIC(8,4),
  profile_views BIGINT,
  website_clicks BIGINT,
  raw_data JSONB,
  UNIQUE(social_account_id, date)
);

-- Abonnementsplannen
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  price_monthly NUMERIC(8,2) NOT NULL,
  price_yearly NUMERIC(8,2),
  max_clients INTEGER NOT NULL,
  max_social_accounts INTEGER NOT NULL,
  max_ad_accounts INTEGER NOT NULL,
  max_team_members INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_metrics_account_id ON social_metrics(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_metrics_date ON social_metrics(date);
CREATE INDEX IF NOT EXISTS idx_audit_log_agency_id ON audit_log(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Seed default plannen
INSERT INTO subscription_plans (name, stripe_price_id, price_monthly, price_yearly, max_clients, max_social_accounts, max_ad_accounts, max_team_members, features, sort_order)
VALUES
  ('Starter', 'price_starter_placeholder', 49.00, 490.00, 5, 10, 2, 3, '{"white_label": false, "custom_domain": false, "api_access": false}'::jsonb, 1),
  ('Growth', 'price_growth_placeholder', 149.00, 1490.00, 25, 50, 10, 10, '{"white_label": true, "custom_domain": false, "api_access": false}'::jsonb, 2),
  ('Enterprise', 'price_enterprise_placeholder', 399.00, 3990.00, 999, 999, 999, 999, '{"white_label": true, "custom_domain": true, "api_access": true, "hide_powered_by": true}'::jsonb, 3)
ON CONFLICT DO NOTHING;
