ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'complete';

DO $$ BEGIN
  ALTER TABLE public.settings ADD CONSTRAINT settings_plan_check CHECK (plan IN ('lister','complete'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "Admins can view all settings" ON public.settings;
CREATE POLICY "Admins can view all settings"
ON public.settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all settings" ON public.settings;
CREATE POLICY "Admins can update all settings"
ON public.settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));