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
