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
