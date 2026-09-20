import { supabase } from "@/integrations/supabase/client";

/**
 * Generates or retrieves an anonymous session ID
 */
const getSessionId = (): string => {
  const key = "vh_public_session_id";
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }

  return sessionId;
};

export type PublicEventType =
  | "page_view"
  | "dealer_view"
  | "vehicle_view"
  | "enquiry_submit"
  | "cta_whatsapp"
  | "cta_call"
  | "scroll_25"
  | "scroll_50"
  | "scroll_75"
  | "scroll_100"
  | "engaged_30s"
  | "engaged_60s"
  | "engaged_120s"
  | "form_opened"
  | "form_abandoned";

interface TrackEventParams {
  eventType: PublicEventType;
  dealerUserId: string;
  publicPageId: string;
  vehicleId?: string;
}

// Debounce buffer to batch analytics inserts
let eventBuffer: Array<{
  event_type: string;
  user_id: string;
  public_page_id: string;
  vehicle_id: string | null;
  session_id: string;
}> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const SUPABASE_URL = "https://edmssetawhjpeurzwadc.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbXNzZXRhd2hqcGV1cnp3YWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mzk2NDUsImV4cCI6MjA5MzIxNTY0NX0.7xwOvj54_6Uaa8wa4GT_S8JkSpJSVhfwW79sBxH3c1Q";

const beaconFlush = (batch: typeof eventBuffer): boolean => {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return false;
  try {
    const blob = new Blob([JSON.stringify(batch)], { type: "application/json" });
    // PostgREST accepts unauthenticated inserts when RLS allows; include apikey via URL param not possible with beacon,
    // so fall through to fetch on failure.
    const url = `${SUPABASE_URL}/rest/v1/public_page_events?apikey=${SUPABASE_ANON}`;
    return navigator.sendBeacon(url, blob);
  } catch {
    return false;
  }
};

const flushEvents = async (viaBeacon = false) => {
  if (eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  eventBuffer = [];

  if (viaBeacon && beaconFlush(batch)) return;

  try {
    const { error } = await supabase.from("public_page_events").insert(batch as any);
    if (error) console.error("❌ Analytics batch insert failed:", error);
  } catch (e) {
    console.error("❌ Analytics exception:", e);
  }
};

// Flush on page hide / tab close so buffered events aren't lost on navigation.
if (typeof window !== "undefined") {
  const onHide = () => flushEvents(true);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEvents(true);
  });
}

export const trackPublicEvent = async ({
  eventType,
  dealerUserId,
  publicPageId,
  vehicleId,
}: TrackEventParams) => {
  eventBuffer.push({
    event_type: eventType,
    user_id: dealerUserId,
    public_page_id: publicPageId,
    vehicle_id: vehicleId ?? null,
    session_id: getSessionId(),
  });

  // Flush after 800ms of inactivity (batches rapid events but keeps events fresh).
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushEvents(false), 800);

  // Flush immediately for high-signal events or when buffer gets large
  if (eventBuffer.length >= 5 || eventType === "cta_call" || eventType === "cta_whatsapp" || eventType === "form_opened") {
    if (flushTimer) clearTimeout(flushTimer);
    flushEvents(false);
  }
};

