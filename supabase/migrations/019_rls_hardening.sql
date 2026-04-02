-- ============================================================
-- 019_rls_hardening.sql
-- Volledige RLS hardening voor alle pre-existing tabellen
-- Zorgt voor volledige agency_id isolatie bij multi-tenancy
-- ============================================================

-- ── HELPER: super_admin check ─────────────────────────────────────────────────
-- Super admins (Modernica zelf) mogen alles zien via service role.
-- Via de anon/authenticated role gebruiken we agency_id isolatie.

-- ── 1. AGENCIES ───────────────────────────────────────────────────────────────
-- Leden mogen alleen hun eigen agency zien en aanpassen.
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agencies_select" ON agencies;
DROP POLICY IF EXISTS "agencies_update" ON agencies;
DROP POLICY IF EXISTS "agencies_insert" ON agencies;

-- Lees: je bent lid van deze agency
CREATE POLICY "agencies_select" ON agencies FOR SELECT
  USING (
    id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

-- Update: alleen admins/managers van de agency
CREATE POLICY "agencies_update" ON agencies FOR UPDATE
  USING (
    id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 2. USER_PROFILES ──────────────────────────────────────────────────────────
-- Leden mogen profielen zien van iedereen in hun agency.
-- Alleen jezelf mag je eigen profiel aanpassen.
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;

-- Lees: zelfde agency óf je eigen profiel
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM user_profiles up2 WHERE up2.id = auth.uid())
    OR id = auth.uid()
  );

-- Update: alleen je eigen profiel
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Insert: bij aanmaken account (signup/invite flow)
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── 3. BRAND_KITS ─────────────────────────────────────────────────────────────
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_kits_select" ON brand_kits;
DROP POLICY IF EXISTS "brand_kits_update" ON brand_kits;
DROP POLICY IF EXISTS "brand_kits_insert" ON brand_kits;

CREATE POLICY "brand_kits_select" ON brand_kits FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "brand_kits_update" ON brand_kits FOR UPDATE
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

CREATE POLICY "brand_kits_insert" ON brand_kits FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 4. PROJECTS ───────────────────────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

-- Lees: agency leden zien alle projecten van hun agency
--       klanten zien alleen projecten die aan hun client_id gekoppeld zijn
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

-- Delete: alleen admins/managers
CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 5. PROJECT_TODOS ──────────────────────────────────────────────────────────
ALTER TABLE project_todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_todos_select" ON project_todos;
DROP POLICY IF EXISTS "project_todos_insert" ON project_todos;
DROP POLICY IF EXISTS "project_todos_update" ON project_todos;
DROP POLICY IF EXISTS "project_todos_delete" ON project_todos;

CREATE POLICY "project_todos_select" ON project_todos FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "project_todos_insert" ON project_todos FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "project_todos_update" ON project_todos FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "project_todos_delete" ON project_todos FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 6. PROJECT_NOTES ──────────────────────────────────────────────────────────
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_notes_select" ON project_notes;
DROP POLICY IF EXISTS "project_notes_insert" ON project_notes;
DROP POLICY IF EXISTS "project_notes_update" ON project_notes;
DROP POLICY IF EXISTS "project_notes_delete" ON project_notes;

CREATE POLICY "project_notes_select" ON project_notes FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "project_notes_insert" ON project_notes FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "project_notes_update" ON project_notes FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "project_notes_delete" ON project_notes FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 7. CONTENT_POSTS ──────────────────────────────────────────────────────────
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_posts_select" ON content_posts;
DROP POLICY IF EXISTS "content_posts_insert" ON content_posts;
DROP POLICY IF EXISTS "content_posts_update" ON content_posts;
DROP POLICY IF EXISTS "content_posts_delete" ON content_posts;

CREATE POLICY "content_posts_select" ON content_posts FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "content_posts_insert" ON content_posts FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "content_posts_update" ON content_posts FOR UPDATE
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "content_posts_delete" ON content_posts FOR DELETE
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 8. CONVERSATIONS (chat) ───────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;
DROP POLICY IF EXISTS "conversations_delete" ON conversations;

CREATE POLICY "conversations_select" ON conversations FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "conversations_insert" ON conversations FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "conversations_update" ON conversations FOR UPDATE
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "conversations_delete" ON conversations FOR DELETE
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 9. MESSAGES (chat berichten) ──────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;

CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "messages_delete" ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- ── 10. SOCIAL_METRICS ────────────────────────────────────────────────────────
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_metrics_select" ON social_metrics;
DROP POLICY IF EXISTS "social_metrics_insert" ON social_metrics;

CREATE POLICY "social_metrics_select" ON social_metrics FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "social_metrics_insert" ON social_metrics FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

-- ── 11. AUDIT_LOG ─────────────────────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;

-- Alleen admins/managers mogen de audit log lezen
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'super_admin')
  );

-- Inserts via service role (Edge Functions), authenticated users mogen ook loggen
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

-- ── 12. FIX APPROVAL_FEEDBACK ─────────────────────────────────────────────────
-- De oude policy liet iedereen (ook niet-ingelogd) submitten
DROP POLICY IF EXISTS "Anyone can submit feedback" ON approval_feedback;
DROP POLICY IF EXISTS "approval_feedback_insert" ON approval_feedback;
DROP POLICY IF EXISTS "approval_feedback_select" ON approval_feedback;

-- Alleen ingelogde gebruikers van de agency mogen feedback zien
CREATE POLICY "approval_feedback_select" ON approval_feedback FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM content_posts
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- Feedback submitten: alleen authenticated (voor klanten die via share token werken
-- gebruik de service role in de API route)
CREATE POLICY "approval_feedback_insert" ON approval_feedback FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
