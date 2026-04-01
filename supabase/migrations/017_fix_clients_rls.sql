-- Fix RLS policies on clients table
-- The previous attempt used bare USING() syntax which is invalid

-- Drop any broken/partial policies first
DROP POLICY IF EXISTS "Agency can view own clients"    ON clients;
DROP POLICY IF EXISTS "Agency can insert clients"      ON clients;
DROP POLICY IF EXISTS "Agency can update clients"      ON clients;
DROP POLICY IF EXISTS "Agency can delete clients"      ON clients;
DROP POLICY IF EXISTS "clients_select_policy"          ON clients;
DROP POLICY IF EXISTS "clients_insert_policy"          ON clients;
DROP POLICY IF EXISTS "clients_update_policy"          ON clients;
DROP POLICY IF EXISTS "clients_delete_policy"          ON clients;

-- Make sure RLS is enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- SELECT: agency members see their own clients
CREATE POLICY "clients_select"
  ON clients FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- INSERT: agency members can add clients to their agency
CREATE POLICY "clients_insert"
  ON clients FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- UPDATE: agency members can update their own clients
CREATE POLICY "clients_update"
  ON clients FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- DELETE: agency members can delete their own clients
CREATE POLICY "clients_delete"
  ON clients FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id FROM user_profiles WHERE id = auth.uid()
    )
  );
