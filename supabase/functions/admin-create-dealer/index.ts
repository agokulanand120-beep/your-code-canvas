import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROFILE_FIELDS = [
  "dealer_name",
  "dealer_phone",
  "dealer_email",
  "dealer_address",
  "dealer_gst",
  "whatsapp_number",
  "shop_logo_url",
  "shop_tagline",
  "dealer_tag",
  "gmap_link",
  "google_reviews_url",
  "marketplace_tagline",
  "marketplace_description",
  "marketplace_working_hours",
  "marketplace_badge",
  "managed_source_note",
  "seo_title",
  "seo_description",
] as const;

const randomToken = (n = 16) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)))
    .map((b) => b.toString(36))
    .join("")
    .slice(0, n);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const [{ data: mpAdmin }, { data: roleRow }] = await Promise.all([
      admin.from("marketplace_admins").select("user_id").eq("user_id", userData.user.id).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle(),
    ]);
    if (!mpAdmin && !roleRow) return json({ error: "Forbidden: admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const managed = body.managed === true;
    const dealerName = String(body.dealer_name ?? "").trim();
    if (!dealerName || dealerName.length > 150)
      return json({ error: "Dealer/shop name is required (max 150 chars)" }, 400);

    let email = String(body.email ?? "").trim().toLowerCase();
    let password = String(body.password ?? "");

    if (managed) {
      // Profile is maintained by the admin; no dealer login is handed out yet.
      email = `managed-${randomToken(10)}@profiles.upcurvhub.invalid`;
      password = `Mg-${randomToken(20)}`;
    } else {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
      if (!emailOk) return json({ error: "A valid email is required" }, 400);
      if (password.length < 8 || password.length > 72)
        return json({ error: "Password must be 8-72 characters" }, 400);
    }

    const plan = body.plan === "complete" ? "complete" : "lister";

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { dealer_name: dealerName, admin_managed: managed },
    });
    if (createErr) return json({ error: createErr.message }, 400);

    const newUserId = created.user!.id;

    const patch: Record<string, unknown> = {
      dealer_name: dealerName,
      plan,
      marketplace_enabled: body.marketplace_enabled === false ? false : true,
      marketplace_status: body.marketplace_status ?? "approved",
      marketplace_featured: body.marketplace_featured === true,
      public_page_enabled: true,
      is_admin_managed: managed,
      claim_status: managed ? "unclaimed" : "claimed",
      claimed_at: managed ? null : new Date().toISOString(),
    };

    for (const f of PROFILE_FIELDS) {
      const v = body[f];
      if (typeof v === "string") patch[f] = v.trim() || null;
    }
    if (!managed) patch.dealer_email = email;
    if (body.google_reviews_rating != null) patch.google_reviews_rating = Number(body.google_reviews_rating) || null;
    if (body.google_reviews_count != null) patch.google_reviews_count = Number(body.google_reviews_count) || null;

    const { error: settingsErr } = await admin.from("settings").update(patch).eq("user_id", newUserId);
    if (settingsErr) {
      await admin.from("settings").insert({ user_id: newUserId, ...patch });
    }

    return json({ ok: true, user_id: newUserId, email: managed ? null : email, plan, managed });
  } catch (e) {
    console.error("admin-create-dealer failed:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
