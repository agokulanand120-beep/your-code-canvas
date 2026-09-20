// Fired by DB triggers when a vehicle or dealer is published/updated.
// Generates unique long-form SEO copy (body + FAQs + meta) for the listing,
// stores it on the row, then pings IndexNow / Google for instant indexing.
//
// POST { type: "vehicle" | "dealer", id: string }

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { SITE, extractDistrict, inr, sb, slugify } from "../_shared/seo.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Copy {
  seo_title: string;
  seo_description: string;
  seo_body: string;
  seo_faqs: { q: string; a: string }[];
}

/** Lovable AI Gateway (optional). Falls back to deterministic copy when unset. */
async function aiCopy(prompt: string): Promise<Partial<Copy> | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You write concise, factual SEO copy for an Indian used-vehicle marketplace. Never invent specs. Reply with JSON only: {\"seo_title\":string(<=60 chars),\"seo_description\":string(<=155 chars),\"seo_body\":string(2-3 paragraphs, plain text, blank line between paragraphs),\"seo_faqs\":[{\"q\":string,\"a\":string}] (3-4 items)}.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error("ai gateway", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = String(data?.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("aiCopy failed", e);
    return null;
  }
}

async function handleVehicle(id: string) {
  const client = sb();
  const { data } = await client
    .from("vehicles")
    .select(
      "id, slug, brand, model, variant, manufacturing_year, selling_price, odometer_reading, fuel_type, transmission, number_of_owners, color, mileage, condition, vehicle_type, user_id, public_description",
    )
    .eq("id", id)
    .limit(1);
  const v: any = data?.[0];
  if (!v) return null;

  const { data: dealerRows } = await client
    .from("settings")
    .select("dealer_name, dealer_address")
    .eq("user_id", v.user_id)
    .limit(1);
  const dealer: any = dealerRows?.[0];
  const city = extractDistrict(dealer?.dealer_address);
  const name = [v.manufacturing_year, v.brand, v.model, v.variant].filter(Boolean).join(" ");
  const km = v.odometer_reading ? `${Number(v.odometer_reading).toLocaleString("en-IN")} km` : "";

  const fallback: Copy = {
    seo_title: `Used ${name} for Sale${city ? ` in ${city}` : ""} | UpcurvHub`.slice(0, 70),
    seo_description:
      `Buy this used ${name}${city ? ` in ${city}` : ""} at ${inr(v.selling_price)}. ${[km, v.fuel_type, v.transmission]
        .filter(Boolean)
        .join(", ")}. Verified dealer listing.`.slice(0, 158),
    seo_body: [
      `This ${name} is listed by ${dealer?.dealer_name || "a verified UpcurvHub dealer"}${city ? ` in ${city}` : ""} at ${inr(v.selling_price)}. ${km ? `It has covered ${km}` : "Odometer details are shared by the dealer"}${v.number_of_owners ? ` and has had ${v.number_of_owners} owner(s)` : ""}.`,
      `Key details: ${[v.fuel_type && `${v.fuel_type} fuel`, v.transmission && `${v.transmission} transmission`, v.color && `${v.color} exterior`, v.mileage && `${v.mileage} kmpl claimed mileage`, v.condition && `${v.condition} condition`]
        .filter(Boolean)
        .join(", ")}. Every UpcurvHub listing is checked for documentation before it goes live, and RC transfer support is available.`,
      v.public_description ||
        `Book a test drive through UpcurvHub to inspect the vehicle in person. Finance and insurance options can be arranged with the dealer, and the EMI calculator on this page estimates your monthly instalment before you commit.`,
    ].join("\n\n"),
    seo_faqs: [
      {
        q: `What is the price of this used ${v.brand} ${v.model}?`,
        a: `The asking price is ${inr(v.selling_price)}. Final on-road cost depends on RC transfer, insurance and any finance charges.`,
      },
      {
        q: `How many kilometres has this ${v.brand} ${v.model} run?`,
        a: km ? `It has covered ${km} as per the odometer at listing time.` : `The dealer shares exact odometer details on request.`,
      },
      {
        q: `Can I get a loan for this vehicle?`,
        a: `Yes. UpcurvHub dealers assist with used-vehicle loans; use the EMI calculator on the listing to plan your instalment.`,
      },
    ],
  };

  const ai = await aiCopy(
    `Write SEO copy for a used vehicle listing.\nVehicle: ${name}\nCity: ${city || "India"}\nDealer: ${dealer?.dealer_name || "verified dealer"}\nPrice: ${inr(v.selling_price)}\nOdometer: ${km || "n/a"}\nFuel: ${v.fuel_type || "n/a"}\nTransmission: ${v.transmission || "n/a"}\nOwners: ${v.number_of_owners ?? "n/a"}\nColour: ${v.color || "n/a"}\nCondition: ${v.condition || "n/a"}\nDealer note: ${v.public_description || "none"}`,
  );

  const copy: Copy = { ...fallback, ...(ai || {}) };

  await client
    .from("vehicles")
    .update({
      seo_title: copy.seo_title,
      seo_description: copy.seo_description,
      seo_body: copy.seo_body,
      seo_faqs: copy.seo_faqs,
      seo_generated_at: new Date().toISOString(),
    })
    .eq("id", id);

  const paths = [`/marketplace/vehicle/${v.slug || v.id}`];
  if (city) paths.push(`/marketplace/vehicles/used-cars-in-${slugify(city)}`);
  if (v.brand) paths.push(`/marketplace/brand/${slugify(v.brand)}`);
  return { source: ai ? "ai" : "template", paths };
}

async function handleDealer(userId: string) {
  const client = sb();
  const { data } = await client
    .from("settings")
    .select("user_id, dealer_slug, dealer_name, dealer_address, dealer_description, marketplace_badge")
    .eq("user_id", userId)
    .limit(1);
  const d: any = data?.[0];
  if (!d) return null;

  const { count } = await client
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "in_stock")
    .in("marketplace_status", ["approved", "featured"]);

  const city = extractDistrict(d.dealer_address);
  const stock = count ?? 0;

  const fallback: Copy = {
    seo_title: `${d.dealer_name} — Used Cars & Bikes${city ? ` in ${city}` : ""} | UpcurvHub`.slice(0, 70),
    seo_description: `${d.dealer_name} lists ${stock} verified used vehicles${city ? ` in ${city}` : ""} on UpcurvHub. See live stock, prices, photos and contact details.`.slice(0, 158),
    seo_body: [
      `${d.dealer_name} is a verified pre-owned vehicle dealer${city ? ` based in ${city}` : ""} listing ${stock} vehicles on UpcurvHub. Stock, prices and photos on this page are updated directly by the dealer.`,
      d.dealer_description ||
        `Buyers can browse the dealer's live inventory, compare prices, send an enquiry and book a test drive without leaving UpcurvHub. Finance, insurance and RC transfer help are available on request.`,
    ].join("\n\n"),
    seo_faqs: [
      {
        q: `Where is ${d.dealer_name} located?`,
        a: d.dealer_address || `Contact ${d.dealer_name} through UpcurvHub for the showroom address and directions.`,
      },
      {
        q: `How many vehicles does ${d.dealer_name} have in stock?`,
        a: `${stock} verified vehicles are currently listed on UpcurvHub, and the list updates as vehicles are added or sold.`,
      },
      {
        q: `Is ${d.dealer_name} a verified dealer?`,
        a: `Yes — this dealer is approved on the UpcurvHub marketplace${d.marketplace_badge ? ` and carries the ${d.marketplace_badge} badge` : ""}.`,
      },
    ],
  };

  const ai = await aiCopy(
    `Write SEO copy for a used-vehicle dealer page.\nDealer: ${d.dealer_name}\nCity: ${city || "India"}\nAddress: ${d.dealer_address || "n/a"}\nVehicles in stock: ${stock}\nDealer note: ${d.dealer_description || "none"}`,
  );

  const copy: Copy = { ...fallback, ...(ai || {}) };

  await client
    .from("settings")
    .update({
      seo_title: copy.seo_title,
      seo_description: copy.seo_description,
      seo_body: copy.seo_body,
      seo_faqs: copy.seo_faqs,
      seo_generated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  const paths = [`/marketplace/dealer/${d.dealer_slug || d.user_id}`];
  if (city) paths.push(`/marketplace/vehicles/used-cars-in-${slugify(city)}`);
  return { source: ai ? "ai" : "template", paths };
}

async function ping(paths: string[]) {
  try {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-indexnow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({ paths: [...new Set([...paths, "/", "/marketplace/vehicles"])] }),
    });
    return { status: res.status };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type;
    const id = typeof body?.id === "string" ? body.id : "";
    if ((type !== "vehicle" && type !== "dealer") || !id) {
      return json({ error: "Expected { type: 'vehicle' | 'dealer', id: string }" }, 400);
    }

    const out = type === "vehicle" ? await handleVehicle(id) : await handleDealer(id);
    if (!out) return json({ error: "Not found" }, 404);

    const indexing = await ping(out.paths);
    return json({ ok: true, type, id, source: out.source, paths: out.paths, indexing });
  } catch (err) {
    console.error("on-listing-publish failed", err);
    return json({ error: (err as Error).message }, 500);
  }
});
