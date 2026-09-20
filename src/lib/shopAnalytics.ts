import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "vh_public_session_id";

const sessionId = (): string => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
};

type ShopEvent = "impression" | "click";

interface Row {
  product_id: string;
  event_type: ShopEvent;
  category: string | null;
  source_path: string | null;
  session_id: string;
}

let buffer: Row[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
// Avoid counting the same product impression twice per page session.
const seen = new Set<string>();

const flush = async () => {
  if (!buffer.length) return;
  const batch = buffer;
  buffer = [];
  try {
    await supabase.from("shop_product_events").insert(batch);
  } catch {
    /* analytics is best-effort */
  }
};

if (typeof window !== "undefined") {
  const onHide = () => flush();
  window.addEventListener("pagehide", onHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

export function trackShopEvent(
  eventType: ShopEvent,
  product: { id: string; category?: string | null },
) {
  if (!product?.id) return;
  if (eventType === "impression") {
    const key = `${product.id}:${typeof location !== "undefined" ? location.pathname : ""}`;
    if (seen.has(key)) return;
    seen.add(key);
  }

  buffer.push({
    product_id: product.id,
    event_type: eventType,
    category: product.category ?? null,
    source_path: typeof location !== "undefined" ? location.pathname : null,
    session_id: sessionId(),
  });

  if (timer) clearTimeout(timer);
  if (eventType === "click" || buffer.length >= 10) flush();
  else timer = setTimeout(flush, 1200);
}
