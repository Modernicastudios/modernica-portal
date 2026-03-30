-- Add share_token to content_posts for public approval links
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS content_posts_share_token_idx ON content_posts(share_token);

-- Public review submissions (no auth required)
CREATE TABLE IF NOT EXISTS approval_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
  share_token UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'changes_requested')),
  feedback_note TEXT,
  reviewer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anyone to read content_posts by share_token (no RLS bypass needed - use service role in API)
-- Allow anyone to insert approval_feedback
ALTER TABLE approval_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit feedback" ON approval_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Agency can view feedback" ON approval_feedback FOR SELECT USING (
  post_id IN (SELECT id FROM content_posts WHERE agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
);
