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
