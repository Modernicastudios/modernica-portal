-- ---------------------------------------------------------------------
-- Ontbrekende kolommen voor het Agency-instellingen-scherm, zodat álle
-- velden daadwerkelijk opgeslagen worden (niet alleen de naam).
-- ---------------------------------------------------------------------

-- Agency-gegevens
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS website    text;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS email      text;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS phone      text;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS address    text;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS vat_number text;

-- Brand kit: velden die het scherm toont maar nog niet bestonden
ALTER TABLE public.brand_kits ADD COLUMN IF NOT EXISTS contact_email    text;
ALTER TABLE public.brand_kits ADD COLUMN IF NOT EXISTS welcome_message  text;
ALTER TABLE public.brand_kits ADD COLUMN IF NOT EXISTS welcome_subtitle text;

-- Schema-cache meteen verversen, anders ziet de app de nieuwe kolommen pas later.
NOTIFY pgrst, 'reload schema';
