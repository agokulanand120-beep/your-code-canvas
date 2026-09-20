/**
 * Cloudflare Pages advanced-mode worker for upcurvhub.upcurv.in.
 *
 * - Bots / social scrapers hitting vehicle, dealer, city and brand routes get
 *   fully server-rendered HTML from the `crawler-render` edge function.
 * - /sitemap.xml is proxied to the always-current `sitemap-xml` edge function.
 * - Everyone else gets the normal static SPA assets.
 */

const SUPABASE_FUNCTIONS = "https://edmssetawhjpeurzwadc.supabase.co/functions/v1";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbXNzZXRhd2hqcGV1cnp3YWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mzk2NDUsImV4cCI6MjA5MzIxNTY0NX0.7xwOvj54_6Uaa8wa4GT_S8JkSpJSVhfwW79sBxH3c1Q";

const BOT_RE =
  /(googlebot|google-inspectiontool|bingbot|bingpreview|yandex|duckduckbot|baiduspider|slurp|applebot|petalbot|sogou|exabot|ia_archiver|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterest|redditbot|embedly|quora link preview|skypeuripreview|vkshare|w3c_validator|screaming frog|ahrefsbot|semrushbot|mj12bot|dotbot|chatgpt|gptbot|oai-searchbot|perplexitybot|claudebot|anthropic-ai|amazonbot|bytespider)/i;

const RENDERABLE = [
  /^\/marketplace\/vehicle\/[^/]+$/,
  /^\/marketplace\/dealer\/[^/]+$/,
  // used-cars-in-x, used-honda-cars-in-x, used-honda-city-in-x, second-hand-* aliases
  /^\/marketplace\/vehicles\/(used|second-hand)-[a-z0-9-]+-in-[a-z0-9-]+$/,
  /^\/marketplace\/brand\/[a-z0-9-]+$/,
  /^\/marketplace\/brand\/[a-z0-9-]+\/[a-z0-9-]+$/,
  /^\/(cars|bikes|commercial)\/[a-z0-9-]+\/[a-z0-9-]+$/,
];

const fnHeaders = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // One canonical URL shape per page: redirect "/path/" → "/path".
    if (url.pathname !== "/" && url.pathname !== path) {
      return Response.redirect(`${url.origin}${path}${url.search}`, 301);
    }


    if (path === "/sitemap.xml") {
      try {
        const res = await fetch(`${SUPABASE_FUNCTIONS}/sitemap-xml`, { headers: fnHeaders });
        if (res.ok) {
          return new Response(res.body, {
            status: 200,
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=900",
            },
          });
        }
      } catch (_) {
        // fall through to the static sitemap in /public
      }
      return env.ASSETS.fetch(request);
    }

    const ua = request.headers.get("user-agent") || "";
    const isBot = BOT_RE.test(ua);

    if (isBot && request.method === "GET" && RENDERABLE.some((re) => re.test(path))) {
      try {
        const res = await fetch(
          `${SUPABASE_FUNCTIONS}/crawler-render?path=${encodeURIComponent(path)}`,
          { headers: fnHeaders },
        );
        if (res.ok) {
          return new Response(res.body, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=600",
              "X-Rendered-By": "crawler-render",
            },
          });
        }
      } catch (_) {
        // fall through to the SPA shell
      }
    }

    return env.ASSETS.fetch(request);
  },
};
