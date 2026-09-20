ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS admin_informed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_informed_at timestamp with time zone;

CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can update all leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE POLICY "Admins can view all page events"
ON public.public_page_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_marketplace_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ppe_created_at ON public.public_page_events (created_at DESC);