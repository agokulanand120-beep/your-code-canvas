ALTER TABLE public.model_docs ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';

GRANT EXECUTE ON FUNCTION public.is_marketplace_admin(uuid) TO anon, authenticated;
GRANT SELECT ON public.model_docs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_docs TO authenticated;
GRANT ALL ON public.model_docs TO service_role;

DROP POLICY IF EXISTS "Anyone can view active model docs" ON public.model_docs;
CREATE POLICY "Anyone can view active model docs"
ON public.model_docs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all model docs"
ON public.model_docs FOR SELECT TO authenticated
USING (public.is_marketplace_admin(auth.uid()));