-- Add due_date to projects for planning calendar
ALTER TABLE projects ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Add rejection_note to content_posts for approval workflow
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS rejection_note TEXT;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Agency members can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ROI entries table
CREATE TABLE IF NOT EXISTS roi_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Meta Ads',
  ad_spend NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  leads INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roi_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage roi_entries"
  ON roi_entries FOR ALL
  USING (
    agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

-- Allow clients to view their own ROI entries
CREATE POLICY "Clients can view own roi_entries"
  ON roi_entries FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL
    )
  );

-- Storage buckets (run separately if buckets don't exist yet)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media-library', 'media-library', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('agency-assets', 'agency-assets', true) ON CONFLICT DO NOTHING;
