// Instant indexing pings: IndexNow (Bing, Yandex, Seznam, Naver) plus an
// optional Google Indexing API call when GOOGLE_INDEXING_SERVICE_ACCOUNT is set.
//
// POST { urls: string[] }  or  { paths: string[] }

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { SITE } from "../_shared/seo.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function googleAccessToken(saJson: string) {
  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(
    enc.encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/indexing",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const pem = String(sa.private_key).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${header}.${claim}`)));
  const assertion = `${header}.${claim}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`google token: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const fromPaths = Array.isArray(body.paths) ? body.paths.map((p: string) => `${SITE}${p}`) : [];
    const urls: string[] = [...(Array.isArray(body.urls) ? body.urls : []), ...fromPaths]
      .filter((u: unknown) => typeof u === "string" && u.startsWith("http"))
      .slice(0, 100);

    if (!urls.length) return json({ error: "Provide urls[] or paths[]" }, 400);

    const results: Record<string, unknown> = {};

    const key = Deno.env.get("INDEXNOW_KEY");
    if (key) {
      const host = new URL(SITE).host;
      const res = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host, key, keyLocation: `${SITE}/${key}.txt`, urlList: urls }),
      });
      results.indexnow = { status: res.status };
    } else {
      results.indexnow = { skipped: "INDEXNOW_KEY not set" };
    }

    const sa = Deno.env.get("GOOGLE_INDEXING_SERVICE_ACCOUNT");
    if (sa) {
      try {
        const token = await googleAccessToken(sa);
        const statuses = await Promise.all(
          urls.slice(0, 50).map(async (url) => {
            const r = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url, type: "URL_UPDATED" }),
            });
            return r.status;
          }),
        );
        results.google = { statuses };
      } catch (e) {
        results.google = { error: (e as Error).message };
      }
    } else {
      results.google = { skipped: "GOOGLE_INDEXING_SERVICE_ACCOUNT not set" };
    }

    return json({ ok: true, count: urls.length, results });
  } catch (err) {
    console.error("notify-indexnow failed", err);
    return json({ error: (err as Error).message }, 500);
  }
});
