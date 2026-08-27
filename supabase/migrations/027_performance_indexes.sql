-- Performance indexes for frequently queried columns.
-- Run this migration in Supabase: Dashboard > SQL Editor > paste & run.

-- user_profiles: agency lookup is the most common query pattern
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- clients: all queries filter by agency_id
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);

-- notifications: user inbox + unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_agency_id ON notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- lead_companies: monthly cap check queries agency_id + created_at range
CREATE INDEX IF NOT EXISTS idx_lead_companies_agency_created ON lead_companies(agency_id, created_at);

-- lead_campaigns: lookup by agency
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_agency_id ON lead_campaigns(agency_id);

-- client_invitations: lookup by email and agency
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_agency_id ON client_invitations(agency_id);

-- Supabase Realtime needs replication enabled on the notifications table
-- Run this once if not already done:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
