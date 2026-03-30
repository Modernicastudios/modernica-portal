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
