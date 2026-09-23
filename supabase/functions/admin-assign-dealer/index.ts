import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const dealerUserId = String(body.user_id ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const claimId = body.claim_id ? String(body.claim_id) : null;

    if (!dealerUserId) return json({ error: "Dealer profile is required" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
      return json({ error: "A valid email is required" }, 400);
    if (password.length < 8 || password.length > 72)
      return json({ error: "Password must be 8-72 characters" }, 400);

    const { error: updErr } = await admin.auth.admin.updateUserById(dealerUserId, {
      email,
      password,
      email_confirm: true,
    });
    if (updErr) return json({ error: updErr.message }, 400);

    const { error: setErr } = await admin
      .from("settings")
      .update({
        dealer_email: email,
        is_admin_managed: false,
        claim_status: "claimed",
        claimed_at: new Date().toISOString(),
      })
      .eq("user_id", dealerUserId);
    if (setErr) return json({ error: setErr.message }, 400);

    if (claimId) {
      await admin.from("dealer_claims").update({ status: "approved" }).eq("id", claimId);
    }

    return json({ ok: true, user_id: dealerUserId, email });
  } catch (e) {
    console.error("admin-assign-dealer failed:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
