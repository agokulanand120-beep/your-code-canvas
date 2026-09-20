-- Add new value to existing emi_status enum
ALTER TYPE public.emi_status ADD VALUE IF NOT EXISTS 'partially_paid';

-- Settings: add missing columns
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS public_page_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS purchase_prefix TEXT DEFAULT 'PUR',
  ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';

-- Service records: add missing cost / date columns
ALTER TABLE public.service_records
  ADD COLUMN IF NOT EXISTS labor_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parts_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Vehicle inspections: add inspector_id
ALTER TABLE public.vehicle_inspections
  ADD COLUMN IF NOT EXISTS inspector_id UUID;

-- Documents: app inserts string reference_ids (e.g. for non-UUID refs). Convert to TEXT.
ALTER TABLE public.documents
  ALTER COLUMN reference_id TYPE TEXT USING reference_id::text;

-- Tighten public-write policies
-- Sticky notes already user-scoped. dealer_testimonials INSERT was permissive (intentional, public submit) - keep.
-- support_tickets INSERT permissive (intentional, public contact form) - keep.
-- public_page_events INSERT permissive (intentional, anon analytics) - keep.
-- leads INSERT permissive (intentional, public enquiry forms) - keep.

-- Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_marketplace_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_marketplace_admin(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;