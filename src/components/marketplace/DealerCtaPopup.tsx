import { useEffect, useState } from "react";
import { Phone, MessageCircle, X, BadgeCheck } from "lucide-react";

interface DealerCtaPopupProps {
  /** Unique key so the popup only shows once per vehicle per session */
  storageKey: string;
  dealerName?: string | null;
  dealerPhone?: string | null;
  whatsappNumber?: string | null;
  vehicleTitle: string;
  priceLabel?: string;
  delayMs?: number;
  onCall?: () => void;
  onWhatsApp?: () => void;
}

const DealerCtaPopup = ({
  storageKey,
  dealerName,
  dealerPhone,
  whatsappNumber,
  vehicleTitle,
  priceLabel,
  delayMs = 25000,
  onCall,
  onWhatsApp,
}: DealerCtaPopupProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!dealerPhone && !whatsappNumber) return;
    let shown = false;
    try {
      shown = sessionStorage.getItem(`cta_popup_${storageKey}`) === "1";
    } catch {
      /* ignore */
    }
    if (shown) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(`cta_popup_${storageKey}`, "1");
      } catch {
        /* ignore */
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [storageKey, dealerPhone, whatsappNumber, delayMs]);

  if (!open) return null;

  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi, I'm interested in the ${vehicleTitle} listed on UpcurvHub Marketplace.`
      )}`
    : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 md:pb-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-4 animate-in slide-in-from-bottom-6 fade-in duration-500">
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute-none float-right ml-2 h-7 w-7 rounded-full bg-muted text-muted-foreground hover:bg-muted/70 flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-2 pr-8">
          <BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Still interested in this {vehicleTitle}?
            </p>
            <p className="text-xs text-muted-foreground">
              Talk to {dealerName || "the dealer"} directly{priceLabel ? ` · ${priceLabel}` : ""} — vehicles like this move fast.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {dealerPhone && (
            <a
              href={`tel:${dealerPhone}`}
              onClick={onCall}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-semibold py-2.5 hover:bg-blue-700 transition-colors"
            >
              <Phone className="h-4 w-4" /> Call dealer
            </a>
          )}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWhatsApp}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold py-2.5 hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealerCtaPopup;
