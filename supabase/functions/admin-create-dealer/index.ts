import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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

    // Validate the caller and confirm they are an admin.
    const callerClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Admin check: marketplace admin table OR app admin role
    const [{ data: mpAdmin }, { data: roleRow }] = await Promise.all([
      admin.from("marketplace_admins").select("user_id").eq("user_id", userData.user.id).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle(),
    ]);
    if (!mpAdmin && !roleRow) return json({ error: "Forbidden: admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const dealerName = String(body.dealer_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const plan = body.plan === "lister" ? "lister" : "complete";

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
    if (!emailOk) return json({ error: "A valid email is required" }, 400);
    if (password.length < 8 || password.length > 72)
      return json({ error: "Password must be 8-72 characters" }, 400);
    if (!dealerName || dealerName.length > 150)
      return json({ error: "Dealer/shop name is required (max 150 chars)" }, 400);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { dealer_name: dealerName },
    });
    if (createErr) return json({ error: createErr.message }, 400);

    const newUserId = created.user!.id;

    const { error: settingsErr } = await admin
      .from("settings")
      .update({
        dealer_name: dealerName,
        dealer_phone: phone || null,
        dealer_email: email,
        dealer_address: address || null,
        plan,
        marketplace_enabled: plan === "lister" ? true : false,
      })
      .eq("user_id", newUserId);

    if (settingsErr) {
      // settings row is created by a trigger; retry as an insert if it wasn't there
      await admin.from("settings").insert({
        user_id: newUserId,
        dealer_name: dealerName,
        dealer_phone: phone || null,
        dealer_email: email,
        dealer_address: address || null,
        plan,
      });
    }

    return json({ ok: true, user_id: newUserId, email, plan });
  } catch (e) {
    console.error("admin-create-dealer failed:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
