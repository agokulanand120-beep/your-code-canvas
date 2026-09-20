# Fix model sitemap and add model management

## What will change

- Make the live sitemap include every active model row immediately, report database query failures instead of silently returning an incomplete sitemap, remove duplicate URLs, and include model pages in crawler rendering.
- Add an admin **Model Pages** screen to create, edit, activate, preview, and delete model pages.
- Provide category, brand, and model selectors sourced from the vehicle catalogue, with manual entry available for new records.
- Support multiple model images through pasted links and direct media uploads, preserving image order and storing uploaded files in the existing public vehicle media bucket.
- Add Maruti Suzuki S-Cross and common variants to the inventory catalogue and ensure its model-page record is available.
- Improve each model page with a prominent blue ex-showroom price range, a model-aware EMI finance calculator, a shorter overview, and cleaner section density.
- Bump the displayed app version and verify the sitemap, model URL, admin editor, and mobile/desktop model layout.

## Sitemap behavior

- `/sitemap.xml` will continue reading `model_docs` live from Supabase, so an active row appears without a new app build.
- Sitemap responses will avoid serving a stale static fallback as if it were current and will use a short cache window.
- Active model insert/update events will continue notifying IndexNow; Google still discovers updates by periodically re-reading the submitted sitemap.

## Technical details

- Reuse the existing `model_docs` JSON fields and `images text[]`; no new content table is required.
- Keep writes restricted to marketplace admins through the existing server-validated role policies.
- Add the new route under the existing admin shell and reuse current form, dialog, upload, and notification patterns.
- Use semantic design tokens and the existing EMI dialog rather than adding a second calculator implementation.
