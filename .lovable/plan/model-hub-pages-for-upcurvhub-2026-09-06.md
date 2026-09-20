# Model Hub pages for UpcurvHub

Turn each vehicle model into a dedicated encyclopedia + buying guide + live inventory page, separate from the marketplace listing pages.

## URLs

- `/cars/{brand}/{model}` — e.g. `/cars/maruti-suzuki/swift`
- `/bikes/{brand}/{model}`
- `/commercial/{brand}/{model}`
- Variant pages (`/cars/{brand}/{model}/{variant}`) come later; the layout leaves room for them.
- Existing `/marketplace/brand/...` pages keep working and link across to the new model hubs; the model hub is the canonical "information" page, the marketplace pages stay the "search results" pages.

## Page structure (same for every model)

One H1 (`Brand Model`) plus a supporting line, then in order:

Hero with image and key stats → Key specifications box → Overview → Price (new, used range, UpcurvHub market data) → Used price by model year → Live used listings → Full specifications (engine, performance, transmission, dimensions, capacity, brakes, suspension, steering) → Mileage → Features by group → Safety → Variants table → Variant comparison and "which variant to buy" → Colours → Generations and year-by-year changes → Pros and cons → Maintenance and ownership → Used buying checklist → Who should buy it → Alternatives → Comparison links → City inventory → Dealers selling this model → FAQs → Related guides → More from the brand → Similar vehicles.

Sections with no verified data for a given model are hidden rather than filled with filler text.

## Two content layers

- **Permanent model knowledge** — hand-curated per model: specs, variants, features, safety, colours, generations, pros/cons, ownership notes, buying advice, alternatives, FAQs, overview copy. Stored as typed data files in the app so it is fast and crawlable.
- **Live UpcurvHub data** — pulled from the marketplace on every visit: listing count, lowest/average/highest price, model years available, price-by-year table, live listing cards, city availability, dealers stocking the model.

## Content coverage

Around 100 of the most-searched modern models in India, written in batches of roughly 20 so each batch can be checked before the next:

1. Maruti Suzuki + Hyundai (Swift, Baleno, Dzire, Wagon R, Alto K10, Brezza, Ertiga, Grand Vitara, Fronx, Celerio, i20, i10 Nios, Creta, Venue, Verna, Exter, Aura, Santro…)
2. Tata + Mahindra (Nexon, Punch, Tiago, Altroz, Harrier, Safari, Scorpio, Scorpio N, XUV700, XUV300, Bolero, Thar…)
3. Toyota, Honda, Kia, MG, Renault, Skoda, VW, Nissan (Innova Crysta, Fortuner, Glanza, City, Amaze, Jazz, Seltos, Sonet, Carens, Hector, Astor, Kwid, Triber, Slavia, Kushaq, Virtus, Taigun, Magnite…)
4. Bikes and scooters (Splendor, Activa, Pulsar, Apache, Classic 350, Hunter 350, Jupiter, Access 125, R15, FZ, Duke 200/390, Shine, Unicorn…)

Every model gets its own verified figures, its own strengths and weaknesses and its own FAQs — no cloned paragraphs.

## Images

Model hero images come from live UpcurvHub listings of that model first (real, always current). When there is no listing yet, the page falls back to a clean brand-marked placeholder rather than a stock photo, so nothing misleading is shown. Tell me if you would rather commission generated model illustrations instead.

## SEO

- Title: `{Brand} {Model} Price, Specifications, Features & Used Cars | UpcurvHub`
- Description built from the model's price band, mileage and live listing count.
- Self-referencing canonical, model-specific OG/Twitter tags with the hero image.
- Schema: BreadcrumbList (Home → Cars → Brand → Model), Car/Product with AggregateOffer from live listings, ItemList of available vehicles, FAQPage only where real FAQs render.
- Internal links: brand hub, city pages, alternatives, comparisons, dealer profiles, listings, guides.
- Model hubs added to the sitemap generator and the live sitemap function; brand pages, city pages and vehicle detail pages link into them.

## Technical notes

- New `src/data/models/` directory with one typed file per brand group and a registry keyed by `type/brand-slug/model-slug`.
- New route component `src/pages/model/ModelHub.tsx` plus section components under `src/components/model/`.
- Live data via a single React Query hook that aggregates marketplace listings for the model (count, price stats, years, cities, dealers).
- Routes registered in `App.tsx` with the existing shimmer suspense wrapper.
- Sitemap updates in `scripts/generate-sitemap.ts` and `supabase/functions/sitemap-xml`.
- Crawler render function extended so bots get server-rendered model hub HTML.

## Delivery order

1. Data model, registry, route, full page template, live-data hook, schema and sitemap — with the first ~20 models.
2. Batches 2–4 of model content.
3. Crawler-render support and internal linking sweep across brand, city and vehicle pages.
