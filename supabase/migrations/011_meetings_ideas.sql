-- Meeting notes table
CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attendees TEXT,
  agenda TEXT,
  notes TEXT,
  summary TEXT,
  action_items TEXT,
  status TEXT NOT NULL DEFAULT 'gepland' CHECK (status IN ('gepland', 'afgerond', 'geannuleerd')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for meeting_notes
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view meeting notes"
  ON meeting_notes FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage meeting notes"
  ON meeting_notes FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Add meeting_id column to project_todos (for meeting action items sync)
ALTER TABLE project_todos ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES meeting_notes(id) ON DELETE SET NULL;
ALTER TABLE project_todos ALTER COLUMN project_id DROP NOT NULL;

-- Content posts: allow 'idea' as status value
-- (If there's a check constraint on status, this removes it and adds a broader one)
ALTER TABLE content_posts DROP CONSTRAINT IF EXISTS content_posts_status_check;
ALTER TABLE content_posts ADD CONSTRAINT content_posts_status_check
  CHECK (status IN ('concept', 'pending_approval', 'scheduled', 'published', 'idea'));

-- Create media-library storage bucket (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media-library', 'media-library', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('agency-assets', 'agency-assets', true) ON CONFLICT DO NOTHING;

-- Storage policies for media-library (run after bucket creation)
-- CREATE POLICY "Agency members can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media-library' AND auth.role() = 'authenticated');
-- CREATE POLICY "Media is publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'media-library');
-- CREATE POLICY "Agency members can delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);
