-- Super admin wordt een toekenbare ROL (i.p.v. één hardcoded e-mailadres).
-- De bestaande CHECK-constraint stond 'super_admin' niet toe; dit herstelt dat.
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'manager', 'client'));
