-- ============================================================
-- 024_reenable_rls.sql
-- Zet de multi-tenant afscherming (RLS) weer AAN op de kern-tabellen.
--
-- Waarom stond het uit? De oude user_profiles-policy bevroeg user_profiles
-- zélf -> oneindige recursie zodra RLS aanstaat. Daarom is RLS ooit
-- uitgezet (snelle work-around, maar daardoor stond de deur open).
--
-- Oplossing: een SECURITY DEFINER-functie die de agency van de ingelogde
-- gebruiker ophaalt ZONDER RLS te triggeren. De policies gebruiken die
-- functie i.p.v. een sub-query op user_profiles -> geen recursie meer.
-- De server (service-role) blijft RLS sowieso omzeilen voor beheer.
-- ============================================================

-- ── Veilige helper (geen recursie) ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.app_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT agency_id FROM public.user_profiles WHERE id = auth.uid()
$$;

-- ── USER_PROFILES: alle oude policies weg, nieuwe niet-recursieve terug ────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select"     ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update"     ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert"     ON public.user_profiles;
DROP POLICY IF EXISTS "Users see own profile"    ON public.user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins see all profiles"  ON public.user_profiles;

-- Lezen: je eigen profiel óf iemand uit je eigen agency.
CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR agency_id = public.app_agency_id());

-- Aanpassen: alleen je eigen profiel.
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Aanmaken: alleen je eigen profiel (signup/invite).
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── RLS weer aanzetten op de overige tabellen ─────────────────────────────────
-- De bestaande policies hierop verwijzen naar user_profiles, wat nu veilig is.
ALTER TABLE public.agencies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- ── SUBSCRIPTION_PLANS: openbare prijslijst (iedereen mag lezen) ───────────────
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_plans_read ON public.subscription_plans;
CREATE POLICY subscription_plans_read ON public.subscription_plans FOR SELECT USING (true);

-- ── Hardening: vaste search_path op bestaande functies (WARN-meldingen) ────────
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'my_agency_id()','my_client_id()','is_admin()','get_auth_agency_id()','get_my_agency_id()',
    'handle_new_user()','set_post_agency_id()','set_project_agency_id()',
    'notify_on_message()','notify_on_approval_change()','create_conversation_for_client()'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public, pg_temp', fn);
    EXCEPTION WHEN others THEN NULL; -- functie bestaat niet (meer) -> overslaan
    END;
  END LOOP;
END $$;
