import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import { extractDistrict } from "@/lib/location";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Star, Car,
  Building2, Clock, ExternalLink, Shield, CheckCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { getCatalogueUrl } from "@/lib/catalogueUrl";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { DealerPageSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import DealerEnquiryForm from "@/components/public/DealerEnquiryForm";
import { vehiclePath, dealerPath, dealerSlug, isUuid } from "@/lib/seoSlug";

/** Normalises stored working-hours strings (incl. legacy "Mon 10:00 AM - 7:00 PM"). */
const formatWorkingHours = (value?: string | null) => {
  const raw = value || "";
  if (!raw) return "";
  const compact = raw.toLowerCase().replace(/\s+/g, "");
  const times = raw.match(/\d{1,2}:\d{2}\s*[AP]M/gi) || [];
  if (times.length < 2) return raw;
  const day = compact.includes("mon-fri") ? "Mon-Fri" : compact.includes("alldays") ? "All Days" : "Mon-Sat";
  return `${day} ${times[0].toUpperCase()} - ${times[1].toUpperCase()}`;
};

const MarketplaceDealer = () => {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dealer, setDealer] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleImages, setVehicleImages] = useState<Record<string, string>>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [stats, setStats] = useState({ vehiclesSold: 0, avgRating: 0, totalReviews: 0 });

  useEffect(() => {
    if (dealerId) fetchDealer();
  }, [dealerId]);

  const fetchDealer = async () => {
    try {
      // Fetch dealer settings
      // Try public_page_id first, then fall back to user_id
      let dealerData: any = null;
      let error: any = null;

      // Resolve by SEO slug first, then legacy public_page_id / user_id URLs.
      const { data: bySlug } = await supabase
        .from("settings")
        .select("*")
        .eq("dealer_slug", dealerId)
        .eq("marketplace_enabled", true)
        .maybeSingle();

      if (bySlug) {
        dealerData = bySlug;
      } else {
        const { data: byPublicId } = await supabase
          .from("settings")
          .select("*")
          .eq("public_page_id", dealerId)
          .eq("marketplace_enabled", true)
          .maybeSingle();

        if (byPublicId) {
          dealerData = byPublicId;
        } else if (isUuid(dealerId)) {
          const { data: byUserId, error: err2 } = await supabase
            .from("settings")
            .select("*")
            .eq("user_id", dealerId)
            .eq("marketplace_enabled", true)
            .maybeSingle();
          dealerData = byUserId;
          error = err2;
        }
      }

      if (error || !dealerData) {
        setLoading(false);
        return;
      }

      setDealer(dealerData);
      const dealerUserId = dealerData.user_id;

      // Canonicalise legacy UUID / public-page URLs onto the slug URL.
      if (dealerData.dealer_slug && dealerId !== dealerData.dealer_slug) {
        navigate(dealerPath(dealerData), { replace: true });
      }

      // Track page view
      await trackPublicEvent({
        eventType: "dealer_view",
        dealerUserId,
        publicPageId: "marketplace"
      });

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", dealerUserId)
        .eq("is_public", true)
        .eq("status", "in_stock");

      setVehicles(vehiclesData || []);

      // Fetch vehicle images - get ALL images, not just primary
      if (vehiclesData && vehiclesData.length > 0) {
        const vehicleIds = vehiclesData.map(v => v.id);
        const { data: imagesData } = await supabase
          .from("vehicle_images")
          .select("*")
          .in("vehicle_id", vehicleIds);

        // Create image map - prefer primary, otherwise use first available
        const imageMap: Record<string, string> = {};
        (imagesData || []).forEach(img => {
          if (!imageMap[img.vehicle_id] || img.is_primary) {
            imageMap[img.vehicle_id] = img.image_url;
          }
        });
        setVehicleImages(imageMap);
      }

      // Fetch testimonials
      const { data: reviewsData } = await supabase
        .from("dealer_testimonials")
        .select("*")
        .eq("user_id", dealerUserId)
        .eq("is_verified", true)
        .order("created_at", { ascending: false })
        .limit(10);

      setTestimonials(reviewsData || []);

      // Fetch sales count
      const { data: salesData } = await supabase
        .from("sales")
        .select("id")
        .eq("user_id", dealerUserId)
        .eq("status", "completed");

      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        vehiclesSold: salesData?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviewsData?.length || 0
      });
    } catch (error) {
      console.error("Error fetching dealer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (dealer?.whatsapp_number) {
      const message = encodeURIComponent(
        `Hi, I found you on UpcurvHub Marketplace. I'm interested in your vehicles.`
      );
      window.open(`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${message}`, "_blank");
      
      trackPublicEvent({
        eventType: "cta_whatsapp",
        dealerUserId: dealerId!,
        publicPageId: "marketplace"
      });
    }
  };

  const handleCall = () => {
    if (dealer?.dealer_phone) {
      trackPublicEvent({
        eventType: "cta_call",
        dealerUserId: dealerId!,
        publicPageId: "marketplace"
      });
    }
  };

  const dealerCity = extractDistrict(dealer?.dealer_address) || "";
  const dealerUrl = dealer ? `https://upcurvhub.upcurv.in${dealerPath(dealer)}` : "";

  // Visible Q&A on the page, also emitted as FAQPage schema.
  const dealerFaqs = dealer
    ? [
        {
          q: `Where is ${dealer.dealer_name} located?`,
          a: dealer.dealer_address
            ? `${dealer.dealer_name} is located at ${dealer.dealer_address}. You can call ahead to confirm stock before visiting.`
            : `${dealer.dealer_name} serves buyers${dealerCity ? ` in and around ${dealerCity}` : " across India"}. Send an enquiry for the exact showroom address.`,
        },
        {
          q: `How many used vehicles does ${dealer.dealer_name} have in stock?`,
          a: `${vehicles.length} verified used vehicles are currently listed by ${dealer.dealer_name} on UpcurvHub, each with photos, kilometres driven and the asking price.`,
        },
        {
          q: `Does ${dealer.dealer_name} offer finance or EMI?`,
          a: `Yes — loan and EMI assistance is available on most vehicles. Use the EMI calculator on any listing to estimate your monthly instalment, then send an enquiry.`,
        },
        {
          q: `Are ${dealer.dealer_name}'s vehicles verified?`,
          a: `${dealer.dealer_name} is a verified UpcurvHub dealer. Listings include ownership count, service history and inspection details where available, plus support for RC transfer.`,
        },
      ]
    : [];

  const dealerJsonLd = dealer

    ? [
        {
          "@context": "https://schema.org",
          "@type": "AutoDealer",
          name: dealer.dealer_name,
          "@id": dealerUrl,
          url: dealerUrl,
          ...(stats.totalReviews > 0 && stats.avgRating > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: stats.avgRating,
                  reviewCount: stats.totalReviews,
                },
              }
            : {}),
          ...(dealerCity ? { areaServed: { "@type": "City", name: dealerCity } } : {}),
          image: dealer.shop_logo_url || "https://upcurvhub.upcurv.in/og-image.png",
          telephone: dealer.dealer_phone || undefined,
          address: {
            "@type": "PostalAddress",
            streetAddress: dealer.dealer_address || undefined,
            addressLocality: dealerCity || undefined,
            addressRegion: "Tamil Nadu",
            addressCountry: "IN",
          },
          makesOffer: vehicles.slice(0, 20).map((v: any) => ({
            "@type": "Offer",
            priceCurrency: "INR",
            price: v.selling_price,
            url: `https://upcurvhub.upcurv.in${vehiclePath(v)}`,
            itemOffered: {
              "@type": "Car",
              name: `${v.manufacturing_year} ${v.brand} ${v.model}`,
            },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Used vehicles at ${dealer.dealer_name}`,
          numberOfItems: vehicles.length,
          itemListElement: vehicles.slice(0, 20).map((v: any, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${v.manufacturing_year} ${v.brand} ${v.model}`,
            url: `https://upcurvhub.upcurv.in${vehiclePath(v)}`,
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://upcurvhub.upcurv.in/" },
            { "@type": "ListItem", position: 2, name: "Dealers", item: "https://upcurvhub.upcurv.in/marketplace/dealers" },
            { "@type": "ListItem", position: 3, name: dealer.dealer_name, item: dealerUrl },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: dealerFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        ...(testimonials.length > 0
          ? [
              {
                "@context": "https://schema.org",
                "@type": "AutoDealer",
                name: dealer.dealer_name,
                "@id": dealerUrl,
                review: testimonials.slice(0, 10).map((t: any) => ({
                  "@type": "Review",
                  author: { "@type": "Person", name: t.customer_name },
                  datePublished: t.created_at ? String(t.created_at).slice(0, 10) : undefined,
                  reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
                  ...(t.review ? { reviewBody: t.review } : {}),
                })),
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: (
                    testimonials.reduce((s: number, t: any) => s + (t.rating || 0), 0) / testimonials.length
                  ).toFixed(1),
                  reviewCount: testimonials.length,
                },
              },
            ]
          : []),
      ]

    : [];

  if (loading) {
    return <DealerPageSkeleton />;
  }

  if (!dealer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Dealer Not Found</h2>
          <p className="text-slate-500 mb-4">This dealer is not available on the marketplace.</p>
          <Button onClick={() => navigate("/")}>Back to Marketplace</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Seo
        title={`${dealer.dealer_name} — Used Cars & Bikes${dealerCity ? ` in ${dealerCity}` : ""} | UpcurvHub`}
        description={`Browse ${vehicles.length} verified used cars and bikes from ${dealer.dealer_name}${dealerCity ? `, ${dealerCity}` : ""}. Real prices, inspection details, EMI options and direct dealer contact on UpcurvHub.`}
        path={dealerPath(dealer)}
        image={dealer.shop_logo_url || undefined}
        jsonLd={dealerJsonLd}
      />
      {/* Header */}
      <MarketplaceTopBar showBack />

      {/* Dealer Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {dealer.shop_logo_url ? (
              <img 
                src={dealer.shop_logo_url} 
                alt={dealer.dealer_name} 
                className="h-24 w-24 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-12 w-12" />
              </div>
            )}
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{dealer.dealer_name}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Badge className="bg-white/20 text-white border-0">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                  {dealer.marketplace_badge && (
                    <Badge className="bg-amber-400 text-amber-900 border-0">
                      {dealer.marketplace_badge}
                    </Badge>
                  )}
                </div>
              </div>
              {(dealer.marketplace_tagline || dealer.shop_tagline) && (
                <p className="text-white/80 mb-3">{dealer.marketplace_tagline || dealer.shop_tagline}</p>
              )}
              {/* Google Reviews */}
              {dealer.google_reviews_rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  {dealer.google_reviews_url ? (
                    <a href={dealer.google_reviews_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                      <MapPin className="h-3.5 w-3.5" />
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-sm">{dealer.google_reviews_rating}</span>
                      <span className="text-white/70 text-xs">Google {dealer.google_reviews_count ? `(${dealer.google_reviews_count})` : ""}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-sm">{dealer.google_reviews_rating}</span>
                      <span className="text-white/70 text-xs">Google {dealer.google_reviews_count ? `(${dealer.google_reviews_count})` : ""}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                {stats.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{stats.avgRating}</span>
                    <span className="text-white/70">({stats.totalReviews} reviews)</span>
                  </div>
                )}
                <span className="text-white/50">•</span>
                <span>{vehicles.length} Vehicles</span>
                {stats.vehiclesSold > 0 && (
                  <>
                    <span className="text-white/50">•</span>
                    <span>{stats.vehiclesSold}+ Sold</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {dealer.dealer_phone && (
                <a href={`tel:${dealer.dealer_phone}`} onClick={handleCall}>
                  <Button variant="secondary" className="gap-2">
                    <Phone className="h-4 w-4" /> Call
                  </Button>
                </a>
              )}
              {dealer.whatsapp_number && (
                <Button 
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vehicles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dealer.dealer_address && (
                <Card className="p-4 border-0 shadow-sm rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Location</p>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {(() => {
                          const parts = dealer.dealer_address.split(",").map((s: string) => s.trim()).filter(Boolean);
                          // Show city + state (last 2-3 parts before postal code)
                          const cityParts = parts.filter((p: string) => !/^\d+$/.test(p)).slice(-2);
                          return cityParts.join(", ") || dealer.dealer_address;
                        })()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {dealer.marketplace_working_hours && (
                <Card className="p-4 border-0 shadow-sm rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Working Hours</p>
                      <p className="text-sm font-medium text-slate-900 break-words whitespace-pre-line">
                        {formatWorkingHours(dealer.marketplace_working_hours)}
                      </p>

                    </div>
                  </div>
                </Card>
              )}
              <Card className="p-4 border-0 shadow-sm rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Trust</p>
                    <p className="text-sm font-medium text-slate-900">Verified Dealer</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Description */}
            {dealer.marketplace_description && (
              <Card className="p-6 border-0 shadow-sm rounded-2xl">
                <h3 className="font-semibold text-slate-900 mb-3">About</h3>
                <p className="text-slate-600">{dealer.marketplace_description}</p>
              </Card>
            )}

            {/* Vehicles */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Available Vehicles ({vehicles.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicles.map(vehicle => (
                  <Link key={vehicle.id} to={vehiclePath(vehicle)} className="group">
                    <Card className="overflow-hidden border-0 shadow-sm rounded-2xl hover:shadow-lg transition-all">
                      <div className="relative aspect-[4/3] bg-slate-100">
                        {vehicleImages[vehicle.id] ? (
                          <img
                            src={vehicleImages[vehicle.id]}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-12 w-12 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                          {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{vehicle.fuel_type}</span>
                          <span>•</span>
                          <span>{vehicle.transmission}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="font-bold text-blue-600">
                            {formatCurrency(vehicle.selling_price)}
                          </span>
                          {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatCurrency(vehicle.strikeout_price)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {vehicles.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500">
                    No vehicles listed yet
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            {testimonials.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  {testimonials.slice(0, 5).map(review => (
                    <Card key={review.id} className="p-4 border-0 shadow-sm rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="font-semibold text-slate-600">
                            {review.customer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-900">{review.customer_name}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.review && (
                            <p className="text-sm text-slate-600">{review.review}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ — visible Q&A backing the FAQPage schema */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Frequently asked questions
              </h3>
              <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-100">
                {dealerFaqs.map((f) => (
                  <div key={f.q} className="p-4">
                    <h4 className="text-sm font-semibold text-slate-800">{f.q}</h4>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Right Column - Enquiry Form */}
          <div className="space-y-4">
            <div className="sticky top-20">
              <DealerEnquiryForm 
                dealerInfo={{ 
                  user_id: dealerId!, 
                  public_page_id: dealer.public_page_id,
                  dealer_name: dealer.dealer_name 
                }} 
                pageId="marketplace"
              />
            </div>

            {/* Public page link */}
            {dealer.dealer_name && (
              <Card className="p-4 border-0 shadow-sm rounded-xl">
                <Link 
                  to={getCatalogueUrl(dealer.dealer_name)}
                  className="flex items-center justify-between text-blue-600 hover:text-blue-700"
                >
                  <span className="text-sm font-medium">Visit Dealer's Website</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDealer;
