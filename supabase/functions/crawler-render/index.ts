// Server-rendered HTML for crawlers / social scrapers.
//
// GET /functions/v1/crawler-render?path=/marketplace/vehicle/<slug-or-id>
// Supported paths: /marketplace/vehicle/*, /marketplace/dealer/*,
// /marketplace/vehicles/used-(cars|bikes)-in-<city>, /marketplace/brand/<brand>.
//
// Returns a full document with a real <h1>, price, specs, dealer info,
// JSON-LD and internal links so non-JS crawlers see the actual page content.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  BIKE_TYPES, DEALER_LIVE_STATUSES, SITE, esc, extractDistrict, htmlDocument, inr, isUuid, sb, slugify,
} from "../_shared/seo.ts";

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });

const VEHICLE_COLS =
  "id, slug, brand, model, variant, manufacturing_year, registration_year, selling_price, strikeout_price, fuel_type, transmission, odometer_reading, color, vehicle_type, condition, number_of_owners, mileage, seating_capacity, service_history, hypothecation, public_description, public_highlights, public_features, seo_title, seo_description, seo_body, seo_faqs, user_id, updated_at, vehicle_images(image_url, is_primary, display_order)";

const DEALER_COLS =
  "user_id, dealer_name, dealer_slug, dealer_address, dealer_phone, dealer_email, shop_logo_url, shop_tagline, marketplace_tagline, marketplace_description, marketplace_working_hours, marketplace_badge, google_reviews_rating, google_reviews_count, seo_title, seo_description, seo_body, seo_faqs, public_page_id, marketplace_enabled, marketplace_status";

const faqSchema = (faqs: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

const faqHtml = (faqs: { q: string; a: string }[]) =>
  !faqs.length
    ? ""
    : `<section><h2>Frequently asked questions</h2>${faqs
        .map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`)
        .join("")}</section>`;

const parseFaqs = (raw: unknown): { q: string; a: string }[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f: any) => ({ q: String(f?.q ?? f?.question ?? ""), a: String(f?.a ?? f?.answer ?? "") }))
    .filter((f) => f.q && f.a);
};

async function renderVehicle(idOrSlug: string) {
  const client = sb();
  const query = client.from("vehicles").select(VEHICLE_COLS).limit(1);
  const { data } = isUuid(idOrSlug)
    ? await query.eq("id", idOrSlug)
    : await query.eq("slug", idOrSlug);
  const v: any = data?.[0];
  if (!v) return null;

  const { data: dealerRows } = await client
    .from("settings")
    .select(DEALER_COLS)
    .eq("user_id", v.user_id)
    .limit(1);
  const dealer: any = dealerRows?.[0];

  const images = (v.vehicle_images || [])
    .slice()
    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((i: any) => i.image_url);

  const name = [v.manufacturing_year, v.brand, v.model, v.variant].filter(Boolean).join(" ");
  const city = extractDistrict(dealer?.dealer_address);
  const title = v.seo_title || `Used ${name} for Sale${city ? ` in ${city}` : ""} | UpcurvHub`;
  const description =
    v.seo_description ||
    `Buy this used ${name}${city ? ` in ${city}` : ""} at ${inr(v.selling_price)}. ${
      v.odometer_reading ? `${Number(v.odometer_reading).toLocaleString("en-IN")} km, ` : ""
    }${[v.fuel_type, v.transmission].filter(Boolean).join(", ")}. Verified dealer listing on UpcurvHub.`;

  const specs: [string, unknown][] = [
    ["Price", inr(v.selling_price)],
    ["Year", v.manufacturing_year],
    ["Kilometres", v.odometer_reading ? `${Number(v.odometer_reading).toLocaleString("en-IN")} km` : ""],
    ["Fuel", v.fuel_type],
    ["Transmission", v.transmission],
    ["Owners", v.number_of_owners],
    ["Colour", v.color],
    ["Mileage", v.mileage ? `${v.mileage} kmpl` : ""],
    ["Seating", v.seating_capacity],
    ["Condition", v.condition],
    ["Service history", v.service_history],
    ["Hypothecation", v.hypothecation],
  ];

  const faqs = parseFaqs(v.seo_faqs).length
    ? parseFaqs(v.seo_faqs)
    : [
        { q: `Is this ${v.brand} ${v.model} available now?`, a: `Yes — this ${name} is listed as available by ${dealer?.dealer_name || "a verified UpcurvHub dealer"}${city ? ` in ${city}` : ""}. Contact the dealer through UpcurvHub to confirm and book a test drive.` },
        { q: `What is the price of this used ${v.brand} ${v.model}?`, a: `The asking price is ${inr(v.selling_price)}. Final on-road cost depends on RC transfer, insurance and any finance charges.` },
        { q: `Can I get finance on this vehicle?`, a: `Yes, most UpcurvHub dealers assist with used-vehicle loans. Use the EMI calculator on the listing to estimate your monthly instalment.` },
      ];

  const body = `
<main>
<nav aria-label="Breadcrumb"><a href="${SITE}/">Home</a> › <a href="${SITE}/marketplace/vehicles">Used vehicles</a>${
    city ? ` › <a href="${SITE}/marketplace/vehicles/used-${BIKE_TYPES.includes(String(v.vehicle_type || "").toLowerCase()) ? "bikes" : "cars"}-in-${slugify(city)}">${esc(city)}</a>` : ""
  } › <span>${esc(name)}</span></nav>
<article>
<h1>Used ${esc(name)}${city ? ` in ${esc(city)}` : ""}</h1>
<p><strong>${esc(inr(v.selling_price))}</strong>${v.strikeout_price ? ` <s>${esc(inr(v.strikeout_price))}</s>` : ""}</p>
${images.map((src: string, i: number) => `<img src="${esc(src)}" width="1200" height="800" alt="Used ${esc(name)} for sale — photo ${i + 1} | UpcurvHub" />`).join("\n")}
<h2>Specifications</h2>
<table><tbody>${specs
    .filter(([, val]) => val !== null && val !== undefined && val !== "")
    .map(([k, val]) => `<tr><th>${esc(k)}</th><td>${esc(val)}</td></tr>`)
    .join("")}</tbody></table>
${v.seo_body ? `<h2>About this ${esc(v.brand)} ${esc(v.model)}</h2>${String(v.seo_body).split(/\n{2,}/).map((para: string) => `<p>${esc(para)}</p>`).join("")}` : ""}
${v.public_description ? `<p>${esc(v.public_description)}</p>` : ""}
${(v.public_highlights || []).length ? `<h2>Highlights</h2><ul>${(v.public_highlights || []).map((h: string) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
${(v.public_features || []).length ? `<h2>Features</h2><ul>${(v.public_features || []).map((h: string) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
${
    dealer
      ? `<h2>Dealer</h2><p><a href="${SITE}/marketplace/dealer/${esc(dealer.dealer_slug || dealer.user_id)}">${esc(dealer.dealer_name)}</a>${
          dealer.dealer_address ? ` — ${esc(dealer.dealer_address)}` : ""
        }${dealer.marketplace_working_hours ? `<br />Working hours: ${esc(dealer.marketplace_working_hours)}` : ""}</p>`
      : ""
  }
${faqHtml(faqs)}
</article>
</main>`;

  const schema: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Car",
      name: `Used ${name}`,
      brand: { "@type": "Brand", name: v.brand },
      model: v.model,
      vehicleConfiguration: v.variant || undefined,
      productionDate: v.manufacturing_year ? String(v.manufacturing_year) : undefined,
      fuelType: v.fuel_type || undefined,
      vehicleTransmission: v.transmission || undefined,
      color: v.color || undefined,
      numberOfPreviousOwners: v.number_of_owners ?? undefined,
      mileageFromOdometer: v.odometer_reading
        ? { "@type": "QuantitativeValue", value: v.odometer_reading, unitCode: "KMT" }
        : undefined,
      image: images,
      url: `${SITE}/marketplace/vehicle/${v.slug || v.id}`,
      offers: {
        "@type": "Offer",
        price: v.selling_price ?? undefined,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${SITE}/marketplace/vehicle/${v.slug || v.id}`,
        seller: dealer ? { "@type": "AutoDealer", name: dealer.dealer_name } : undefined,
      },
    },
    faqSchema(faqs),
  ];

  return htmlDocument({
    title,
    description,
    path: `/marketplace/vehicle/${v.slug || v.id}`,
    image: images[0],
    schema,
    body,
  });
}

async function renderDealer(idOrSlug: string) {
  const client = sb();
  const q = client.from("settings").select(DEALER_COLS).limit(1);
  const { data } = isUuid(idOrSlug) ? await q.eq("user_id", idOrSlug) : await q.eq("dealer_slug", idOrSlug);
  const d: any = data?.[0];
  if (!d) return null;

  const { data: vehicles } = await client
    .from("vehicles")
    .select("id, slug, brand, model, variant, manufacturing_year, selling_price, odometer_reading, fuel_type")
    .eq("user_id", d.user_id)
    .eq("status", "in_stock")
    .in("marketplace_status", ["approved", "featured"])
    .limit(60);

  const city = extractDistrict(d.dealer_address);
  const list = vehicles || [];
  const title = d.seo_title || `${d.dealer_name} — Used Cars & Bikes${city ? ` in ${city}` : ""} | UpcurvHub`;
  const description =
    d.seo_description ||
    d.marketplace_description ||
    `${d.dealer_name} is a verified used vehicle dealer${city ? ` in ${city}` : ""} on UpcurvHub with ${list.length} live listings, real photos and transparent pricing.`;

  const faqs = parseFaqs(d.seo_faqs).length
    ? parseFaqs(d.seo_faqs)
    : [
        { q: `Where is ${d.dealer_name} located?`, a: d.dealer_address || `${d.dealer_name} serves buyers${city ? ` in and around ${city}` : " across India"} through UpcurvHub.` },
        { q: `What are ${d.dealer_name}'s working hours?`, a: d.marketplace_working_hours || "Contact the dealer through UpcurvHub for current working hours." },
        { q: `How many vehicles does ${d.dealer_name} have in stock?`, a: `${list.length} verified vehicles are listed right now on UpcurvHub.` },
      ];

  const body = `
<main>
<nav aria-label="Breadcrumb"><a href="${SITE}/">Home</a> › <a href="${SITE}/marketplace/dealers">Dealers</a> › <span>${esc(d.dealer_name)}</span></nav>
<article>
<h1>${esc(d.dealer_name)} — Used Cars & Bikes${city ? ` in ${esc(city)}` : ""}</h1>
${d.marketplace_tagline || d.shop_tagline ? `<p>${esc(d.marketplace_tagline || d.shop_tagline)}</p>` : ""}
${d.seo_body ? String(d.seo_body).split(/\n{2,}/).map((p: string) => `<p>${esc(p)}</p>`).join("") : `<p>${esc(description)}</p>`}
<ul>
${d.dealer_address ? `<li>Address: ${esc(d.dealer_address)}</li>` : ""}
${d.dealer_phone ? `<li>Phone: ${esc(d.dealer_phone)}</li>` : ""}
${d.marketplace_working_hours ? `<li>Working hours: ${esc(d.marketplace_working_hours)}</li>` : ""}
${d.google_reviews_rating ? `<li>Rating: ${esc(d.google_reviews_rating)}/5 from ${esc(d.google_reviews_count || 0)} reviews</li>` : ""}
</ul>
<h2>Vehicles in stock (${list.length})</h2>
<ul>${list
    .map(
      (v: any) =>
        `<li><a href="${SITE}/marketplace/vehicle/${esc(v.slug || v.id)}">${esc(
          [v.manufacturing_year, v.brand, v.model, v.variant].filter(Boolean).join(" "),
        )}</a> — ${esc(inr(v.selling_price))}${v.odometer_reading ? `, ${Number(v.odometer_reading).toLocaleString("en-IN")} km` : ""}${v.fuel_type ? `, ${esc(v.fuel_type)}` : ""}</li>`,
    )
    .join("")}</ul>
${faqHtml(faqs)}
</article>
</main>`;

  const schema: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "AutoDealer",
      name: d.dealer_name,
      url: `${SITE}/marketplace/dealer/${d.dealer_slug || d.user_id}`,
      image: d.shop_logo_url || undefined,
      telephone: d.dealer_phone || undefined,
      email: d.dealer_email || undefined,
      address: d.dealer_address
        ? { "@type": "PostalAddress", streetAddress: d.dealer_address, addressLocality: city || undefined, addressCountry: "IN" }
        : undefined,
      openingHours: d.marketplace_working_hours || undefined,
      aggregateRating:
        d.google_reviews_rating && d.google_reviews_count
          ? {
              "@type": "AggregateRating",
              ratingValue: d.google_reviews_rating,
              reviewCount: d.google_reviews_count,
            }
          : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: list.slice(0, 30).map((v: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/marketplace/vehicle/${v.slug || v.id}`,
        name: [v.manufacturing_year, v.brand, v.model].filter(Boolean).join(" "),
      })),
    },
    faqSchema(faqs),
  ];

  return htmlDocument({
    title,
    description,
    path: `/marketplace/dealer/${d.dealer_slug || d.user_id}`,
    image: d.shop_logo_url,
    schema,
    body,
  });
}

interface CityFilter {
  /** brand slug for /used-<brand>-cars-in-<city> */
  brandSlug?: string;
  /** "<brand>-<model>" or "<model>" for /used-<brand>-<model>-in-<city> */
  subjectSlug?: string;
  /** Canonical URL path for this variant. */
  path: string;
}

async function renderCity(segment: "cars" | "bikes", citySlug: string, filter?: CityFilter) {
  const client = sb();
  const { data: dealers } = await client
    .from("settings")
    .select("user_id, dealer_name, dealer_slug, dealer_address")
    .eq("marketplace_enabled", true)
    .in("marketplace_status", DEALER_LIVE_STATUSES);

  const cityDealers = (dealers || []).filter((d: any) => slugify(extractDistrict(d.dealer_address) || "") === citySlug);
  const city =
    (cityDealers[0] && extractDistrict(cityDealers[0].dealer_address)) ||
    citySlug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

  let list: any[] = [];
  if (cityDealers.length) {
    const { data: vehicles } = await client
      .from("vehicles")
      .select("id, slug, brand, model, variant, manufacturing_year, selling_price, vehicle_type, odometer_reading")
      .in("user_id", cityDealers.map((d: any) => d.user_id))
      .eq("status", "in_stock")
      .in("marketplace_status", ["approved", "featured"])
      .limit(200);
    list = (vehicles || []).filter((v: any) => {
      const bike = BIKE_TYPES.includes(String(v.vehicle_type || "").toLowerCase());
      return segment === "bikes" ? bike : !bike;
    });
  }

  // Brand / model narrowing for /used-<brand>-cars-in-<city> and /used-<brand>-<model>-in-<city>
  if (filter?.brandSlug) list = list.filter((v: any) => slugify(v.brand || "") === filter.brandSlug);
  if (filter?.subjectSlug) {
    const wanted = filter.subjectSlug;
    list = list.filter((v: any) => {
      const brand = slugify(v.brand || "");
      const model = slugify(v.model || "");
      return `${brand}-${model}` === wanted || model === wanted || brand === wanted;
    });
  }

  // Thin doorway guard: a city page (plain, brand or model) with no matching
  // stock is never worth indexing, so crawlers get a 404 instead.
  if (list.length === 0) return null;

  const brandLabel = filter ? list[0]?.brand || "" : "";
  const modelLabel = filter?.subjectSlug ? list[0]?.model || "" : "";
  const subject = [brandLabel, modelLabel].filter(Boolean).join(" ");
  const noun = segment === "bikes" ? "bikes" : "cars";
  const single = segment === "bikes" ? "bike" : "car";
  const heading = subject
    ? `Used ${subject}${modelLabel ? "" : ` ${noun === "cars" ? "Cars" : "Bikes"}`} in ${city}`
    : `Used ${noun === "cars" ? "Cars" : "Bikes"} in ${city}`;
  const path = filter?.path ?? `/marketplace/vehicles/used-${segment}-in-${citySlug}`;
  const prices = list.map((v) => Number(v.selling_price)).filter(Boolean);
  const title = `${heading} — ${list.length} Verified Listing${list.length === 1 ? "" : "s"} | UpcurvHub`;
  const description = subject
    ? `${list.length} verified second hand ${subject} ${modelLabel ? "" : noun} for sale in ${city}${
        prices.length ? `, priced from ${inr(Math.min(...prices))}` : ""
      }. Real photos, honest kilometres, EMI options and RC transfer support.`
    : `Buy verified second-hand ${noun} in ${city} from ${cityDealers.length} trusted dealers. Real photos, honest kilometres, transparent prices${
        prices.length ? ` from ${inr(Math.min(...prices))}` : ""
      } and full RC transfer support.`;

  const models = [...new Map(
    list.filter((v: any) => v.brand && v.model).map((v: any) => [`${v.brand} ${v.model}`, v]),
  ).values()];

  const faqs = [
    { q: `How much does a used ${subject || single} cost in ${city}?`, a: prices.length ? `Listings in ${city} currently range from ${inr(Math.min(...prices))} to ${inr(Math.max(...prices))} depending on model, year and kilometres.` : `Prices vary by model, year and kilometres. Browse UpcurvHub to see live ${city} asking prices.` },
    { q: `Are used ${noun} in ${city} verified?`, a: `Yes. Every ${city} dealer on UpcurvHub is verified before listing, and vehicles carry ownership count, kilometres and service details where available.` },
    { q: `Can I get a loan on a used ${single} in ${city}?`, a: `Most ${city} dealers on UpcurvHub assist with used-vehicle finance; estimate your EMI on each listing before contacting the dealer.` },
  ];

  const body = `
<main>
<nav aria-label="Breadcrumb"><a href="${SITE}/">Home</a> › <a href="${SITE}/marketplace/vehicles">Used vehicles</a> › <a href="${SITE}/marketplace/vehicles/used-${segment}-in-${citySlug}">Used ${noun} in ${esc(city)}</a>${
    subject ? ` › <span>${esc(subject)}</span>` : ""
  }</nav>
<article>
<h1>${esc(heading)}</h1>
<p>${esc(description)}</p>
<h2>Listings (${list.length})</h2>
<ul>${list
    .slice(0, 100)
    .map(
      (v: any) =>
        `<li><a href="${SITE}/marketplace/vehicle/${esc(v.slug || v.id)}">${esc([v.manufacturing_year, v.brand, v.model, v.variant].filter(Boolean).join(" "))}</a> — ${esc(inr(v.selling_price))}</li>`,
    )
    .join("")}</ul>
${
    models.length
      ? `<h2>Popular models in ${esc(city)}</h2><ul>${models
          .slice(0, 30)
          .map(
            (v: any) =>
              `<li><a href="${SITE}/marketplace/vehicles/used-${slugify(`${v.brand} ${v.model}`)}-in-${citySlug}">Used ${esc(v.brand)} ${esc(v.model)} in ${esc(city)}</a> · <a href="${SITE}/${
                BIKE_TYPES.includes(String(v.vehicle_type || "").toLowerCase()) ? "bikes" : "cars"
              }/${slugify(v.brand)}/${slugify(v.model)}">${esc(v.brand)} ${esc(v.model)} price &amp; specs</a></li>`,
          )
          .join("")}</ul>`
      : ""
  }
<h2>Dealers in ${esc(city)} (${cityDealers.length})</h2>
<ul>${cityDealers
    .map((d: any) => `<li><a href="${SITE}/marketplace/dealer/${esc(d.dealer_slug || d.user_id)}">${esc(d.dealer_name)}</a></li>`)
    .join("")}</ul>
${faqHtml(faqs)}
</article>
</main>`;

  return htmlDocument({
    title,
    description,
    path,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        about: { "@type": "City", name: city },
        url: `${SITE}${path}`,
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: list.slice(0, 50).map((v: any, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE}/marketplace/vehicle/${v.slug || v.id}`,
          name: [v.manufacturing_year, v.brand, v.model].filter(Boolean).join(" "),
        })),
      },
      faqSchema(faqs),
    ],
    body,
  });
}


async function renderBrand(brandSlug: string, modelSlug?: string) {
  const client = sb();
  const { data: vehicles } = await client
    .from("vehicles")
    .select("id, slug, brand, model, variant, manufacturing_year, selling_price, vehicle_type, user_id")
    .eq("status", "in_stock")
    .in("marketplace_status", ["approved", "featured"])
    .limit(500);

  const brandList = (vehicles || []).filter((v: any) => slugify(v.brand || "") === brandSlug);
  const list = modelSlug ? brandList.filter((v: any) => slugify(v.model || "") === modelSlug) : brandList;
  if (modelSlug && list.length === 0) return null;

  const brand = brandList[0]?.brand || brandSlug.replace(/-/g, " ");
  const model = modelSlug ? list[0]?.model || modelSlug.replace(/-/g, " ") : "";
  const subject = [brand, model].filter(Boolean).join(" ");
  const path = modelSlug ? `/marketplace/brand/${brandSlug}/${modelSlug}` : `/marketplace/brand/${brandSlug}`;
  const isBike = BIKE_TYPES.includes(String(list[0]?.vehicle_type || "").toLowerCase());
  const prices = list.map((v: any) => Number(v.selling_price)).filter(Boolean);
  const title = modelSlug
    ? `Used ${subject} for Sale — ${list.length} Listing${list.length === 1 ? "" : "s"} | UpcurvHub`
    : `Used ${brand} Cars & Bikes for Sale — ${list.length} Listings | UpcurvHub`;
  const description = `Browse ${list.length} verified used ${subject} ${modelSlug ? "listings" : "vehicles"} on UpcurvHub${
    prices.length ? `, priced from ${inr(Math.min(...prices))}` : ""
  }. Real photos, inspected condition and direct dealer contact.`;

  const models = modelSlug
    ? []
    : [...new Map(brandList.filter((v: any) => v.model).map((v: any) => [slugify(v.model), v])).values()];

  const body = `
<main>
<nav aria-label="Breadcrumb"><a href="${SITE}/">Home</a> › <a href="${SITE}/marketplace/brands">Brands</a> › <a href="${SITE}/marketplace/brand/${esc(brandSlug)}">${esc(brand)}</a>${
    model ? ` › <span>${esc(model)}</span>` : ""
  }</nav>
<article>
<h1>Used ${esc(subject)}${modelSlug ? " for Sale" : " Vehicles for Sale"}</h1>
<p>${esc(description)}</p>
<ul>${list
    .slice(0, 100)
    .map(
      (v: any) =>
        `<li><a href="${SITE}/marketplace/vehicle/${esc(v.slug || v.id)}">${esc([v.manufacturing_year, v.brand, v.model, v.variant].filter(Boolean).join(" "))}</a> — ${esc(inr(v.selling_price))}</li>`,
    )
    .join("")}</ul>
${
    models.length
      ? `<h2>${esc(brand)} models</h2><ul>${models
          .map(
            (v: any) =>
              `<li><a href="${SITE}/marketplace/brand/${esc(brandSlug)}/${slugify(v.model)}">Used ${esc(brand)} ${esc(v.model)}</a> · <a href="${SITE}/${
                BIKE_TYPES.includes(String(v.vehicle_type || "").toLowerCase()) ? "bikes" : "cars"
              }/${esc(brandSlug)}/${slugify(v.model)}">${esc(brand)} ${esc(v.model)} price &amp; specs</a></li>`,
          )
          .join("")}</ul>`
      : ""
  }
${
    modelSlug
      ? `<p><a href="${SITE}/${isBike ? "bikes" : "cars"}/${esc(brandSlug)}/${esc(modelSlug)}">${esc(subject)} price, specifications and mileage</a> · <a href="${SITE}/marketplace/brand/${esc(brandSlug)}">All used ${esc(brand)} vehicles</a></p>`
      : ""
  }
</article>
</main>`;

  return htmlDocument({
    title,
    description,
    path: `/marketplace/brand/${brandSlug}`,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        url: `${SITE}/marketplace/brand/${brandSlug}`,
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: list.slice(0, 50).map((v: any, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE}/marketplace/vehicle/${v.slug || v.id}`,
          name: [v.manufacturing_year, v.brand, v.model].filter(Boolean).join(" "),
        })),
      },
    ],
    body,
  });
}

async function renderModel(category: string, brandSlug: string, modelSlug: string) {
  const client = sb();
  const { data, error } = await client
    .from("model_docs")
    .select("category, brand, model, segment, body_type, overview, quick_specs, new_price, specs, mileage, features, safety, safety_rating, variants, pros, cons, buying_checks, faqs, images, updated_at")
    .eq("category", category)
    .eq("brand_slug", brandSlug)
    .eq("model_slug", modelSlug)
    .eq("is_active", true)
    .limit(1);
  if (error) throw error;
  const model: any = data?.[0];
  if (!model) return null;

  const name = `${model.brand} ${model.model}`;
  const path = `/${category}/${brandSlug}/${modelSlug}`;
  const overview = Array.isArray(model.overview) ? model.overview.map(String) : [];
  const specs = Array.isArray(model.specs) ? model.specs : [];
  const variants = Array.isArray(model.variants) ? model.variants : [];
  const faqs = parseFaqs(model.faqs);
  const images = Array.isArray(model.images) ? model.images.filter(Boolean) : [];
  const quick = model.quick_specs && typeof model.quick_specs === "object" ? model.quick_specs : {};
  const title = `${name} Price, Specifications, Mileage & Used ${category === "bikes" ? "Bikes" : "Cars"} | UpcurvHub`;
  const description = `${name} price in India, specifications, mileage, variants, features, ownership guidance and live used ${name} listings from verified dealers.`;
  const body = `<main>
<nav aria-label="Breadcrumb"><a href="${SITE}/">Home</a> › <a href="${SITE}/models/${category}">${esc(category)}</a> › <span>${esc(name)}</span></nav>
<article>
<h1>${esc(name)} Price, Specifications and Used Listings</h1>
${images.slice(0, 8).map((src: string, index: number) => `<img src="${esc(src)}" width="1200" height="800" alt="${esc(name)} photo ${index + 1}" />`).join("\n")}
${model.new_price ? `<section><h2>${esc(name)} price in India</h2><p><strong>${esc(model.new_price)}</strong> ex-showroom.</p></section>` : ""}
${overview.length ? `<section><h2>${esc(name)} overview</h2>${overview.map((p: string) => `<p>${esc(p)}</p>`).join("")}</section>` : ""}
<section><h2>${esc(name)} key specifications</h2><table><tbody>${Object.entries(quick).filter(([, value]) => value).map(([key, value]) => `<tr><th>${esc(key.replace(/([A-Z])/g, " $1"))}</th><td>${esc(value)}</td></tr>`).join("")}</tbody></table></section>
${specs.map((group: any) => `<section><h2>${esc(group.group || `${name} specifications`)}</h2><table><tbody>${(Array.isArray(group.rows) ? group.rows : []).map((row: any[]) => `<tr><th>${esc(row?.[0])}</th><td>${esc(row?.[1])}</td></tr>`).join("")}</tbody></table></section>`).join("")}
${variants.length ? `<section><h2>${esc(name)} variants</h2><ul>${variants.map((variant: any) => `<li>${esc(variant?.name)}${variant?.fuel ? ` — ${esc(variant.fuel)}` : ""}${variant?.transmission ? `, ${esc(variant.transmission)}` : ""}</li>`).join("")}</ul></section>` : ""}
${faqHtml(faqs)}
<p><a href="${SITE}/marketplace/brand/${esc(brandSlug)}/${esc(modelSlug)}">View used ${esc(name)} listings</a></p>
</article></main>`;

  const schema: Record<string, unknown>[] = [{
    "@context": "https://schema.org",
    "@type": category === "bikes" ? "Motorcycle" : "Car",
    name,
    url: `${SITE}${path}`,
    image: images,
    description: overview[0] || description,
    brand: { "@type": "Brand", name: model.brand },
    model: model.model,
    bodyType: model.body_type || undefined,
    fuelType: quick.fuel || undefined,
    vehicleTransmission: quick.transmission || undefined,
  }];
  if (faqs.length) schema.push(faqSchema(faqs));
  schema.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE },
    { "@type": "ListItem", position: 2, name: `${category} models`, item: `${SITE}/models/${category}` },
    { "@type": "ListItem", position: 3, name, item: `${SITE}${path}` },
  ] });
  return htmlDocument({ title, description, path, image: images[0], schema, body });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = (url.searchParams.get("path") || "/").split("?")[0].replace(/\/+$/, "") || "/";

    let out: string | null = null;
    let m: RegExpExecArray | null;

    if ((m = /^\/marketplace\/vehicle\/([^/]+)$/.exec(path))) out = await renderVehicle(decodeURIComponent(m[1]));
    else if ((m = /^\/marketplace\/dealer\/([^/]+)$/.exec(path))) out = await renderDealer(decodeURIComponent(m[1]));
    // /used-cars-in-<city>, /second-hand-bikes-in-<city>
    else if ((m = /^\/marketplace\/vehicles\/(?:used|second-hand)-(cars|bikes)-in-([a-z0-9-]+)$/.exec(path)))
      out = await renderCity(m[1] as "cars" | "bikes", m[2]);
    // /used-<brand>-cars-in-<city>, /used-<brand>-bikes-in-<city>
    else if ((m = /^\/marketplace\/vehicles\/(?:used|second-hand)-([a-z0-9-]+)-(cars|bikes)-in-([a-z0-9-]+)$/.exec(path)))
      out = await renderCity(m[2] as "cars" | "bikes", m[3], { brandSlug: m[1], path });
    // /used-<brand>-<model>-in-<city> — try cars, then bikes
    else if ((m = /^\/marketplace\/vehicles\/(?:used|second-hand)-([a-z0-9-]+)-in-([a-z0-9-]+)$/.exec(path))) {
      const filter = { subjectSlug: m[1], path };
      out =
        (await renderCity("cars", m[2], filter)) ||
        (await renderCity("bikes", m[2], filter));
    }
    else if ((m = /^\/marketplace\/brand\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(path))) out = await renderBrand(m[1], m[2]);
    else if ((m = /^\/marketplace\/brand\/([a-z0-9-]+)$/.exec(path))) out = await renderBrand(m[1]);
    else if ((m = /^\/(cars|bikes|commercial)\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(path))) out = await renderModel(m[1], m[2], m[3]);

    if (!out) return html("<!doctype html><html><head><title>Not found | UpcurvHub</title><meta name=\"robots\" content=\"noindex\" /></head><body><h1>Page not found</h1></body></html>", 404);
    return html(out);
  } catch (err) {
    console.error("crawler-render failed", err);
    return html("<!doctype html><html><head><title>UpcurvHub</title></head><body><h1>UpcurvHub</h1></body></html>", 500);
  }
});
