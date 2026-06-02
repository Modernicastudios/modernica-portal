-- ---------------------------------------------------------------------
-- 1) Ontbrekende profiel-kolommen (het profielscherm sloeg deze niet op)
-- ---------------------------------------------------------------------
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone     text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio       text;

-- ---------------------------------------------------------------------
-- 2) Admins mogen profielen binnen hun eigen agency bijwerken
--    (nodig voor "gebruiker koppelen aan klant"; RLS blokkeerde dit).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT role IN ('admin','manager','super_admin') FROM public.user_profiles WHERE id = auth.uid() $$;

DROP POLICY IF EXISTS user_profiles_admin_update ON public.user_profiles;
CREATE POLICY user_profiles_admin_update ON public.user_profiles FOR UPDATE
  USING (agency_id = public.app_agency_id() AND public.app_is_admin())
  WITH CHECK (agency_id = public.app_agency_id() AND public.app_is_admin());

NOTIFY pgrst, 'reload schema';
