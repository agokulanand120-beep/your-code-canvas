import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Star, Car, Heart,
  Fuel, Calendar, Gauge, Send, CheckCircle, ChevronLeft, ChevronRight,
  Shield, Award, Building2, Calculator, Share2, Users, Clock, Sparkles,
  Zap, Settings, FileText, Info, Camera, ThumbsUp, Wrench, Navigation
} from "lucide-react";
import { formatCurrency, formatIndianNumber } from "@/lib/formatters";
import { extractDistrict } from "@/lib/location";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import { createPublicLead } from "@/lib/leads";
import { trackPublicEvent } from "@/lib/publicAnalytics";
import { VehiclePageSkeleton } from "@/components/marketplace/ShimmerSkeleton";
import MarketplaceEMICalculator from "@/components/marketplace/MarketplaceEMICalculator";
import VehicleValuationCalculator from "@/components/marketplace/VehicleValuationCalculator";
import ShareDialog from "@/components/marketplace/ShareDialog";
import { Seo } from "@/components/Seo";
import DealerCtaPopup from "@/components/marketplace/DealerCtaPopup";
import DealerVehiclesSection from "@/components/marketplace/DealerVehiclesSection";
import RelatedVehiclesSection from "@/components/marketplace/RelatedVehiclesSection";
import useWishlist from "@/hooks/useWishlist";
import useRecentlyViewed from "@/hooks/useRecentlyViewed";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { vehiclePath, dealerPath, isUuid, imageAlt, slugify } from "@/lib/seoSlug";
import {
  trackVehicleView,
  trackVehicleLead,
  trackVehicleContact,
  trackVehicleWishlist,
  type MetaVehicleData,
} from "@/lib/metaPixel";

const MarketplaceVehicle = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [emiOpen, setEmiOpen] = useState(false);
  const [valuationOpen, setValuationOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [enquirySheetOpen, setEnquirySheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Wishlist and recently viewed hooks
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const isWishlisted = vehicle ? isInWishlist(vehicle.id) : false;
  
  // State for dealer vehicles and all marketplace vehicles
  const [dealerVehicles, setDealerVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [allDealers, setAllDealers] = useState<any[]>([]);
  
  // Form state - Using individual states to avoid re-render issues
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [wantTestDrive, setWantTestDrive] = useState(false);
  const [testDriveDate, setTestDriveDate] = useState("");
  const [testDriveTime, setTestDriveTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formOpened, setFormOpened] = useState(false);

  const getMetaVehicle = useCallback((): MetaVehicleData | null => {
    if (!vehicle) return null;
    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      variant: vehicle.variant || null,
      year: vehicle.manufacturing_year,
      price: vehicle.selling_price,
      currency: "INR",
    };
  }, [vehicle]);

  // Track Meta Pixel ViewContent when vehicle loads
  useEffect(() => {
    if (vehicle && !loading) {
      trackVehicleView(getMetaVehicle());
    }
  }, [vehicle, loading, getMetaVehicle]);

  useEffect(() => {
    if (vehicleId) fetchVehicle();
  }, [vehicleId]);
  
  // Track recently viewed
  useEffect(() => {
    if (vehicle?.id) {
      addToRecentlyViewed(vehicle.id);
    }
  }, [vehicle?.id, addToRecentlyViewed]);

  const fetchVehicle = async () => {
    try {
      // Slug URLs are canonical; legacy UUID URLs still resolve.
      const query = supabase
        .from("vehicles")
        .select("*")
        .or("is_public.eq.true,marketplace_status.in.(approved,pending,featured,listed)");

      const { data: vehicleData, error } = isUuid(vehicleId)
        ? await query.eq("id", vehicleId).maybeSingle()
        : await query.eq("slug", vehicleId).maybeSingle();

      if (error || !vehicleData) {
        setLoading(false);
        return;
      }

      setVehicle(vehicleData);

      if ((vehicleData as any).slug && vehicleId !== (vehicleData as any).slug) {
        navigate(vehiclePath(vehicleData as any), { replace: true });
      }

      const { data: dealerData } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", vehicleData.user_id)
        .eq("marketplace_enabled", true)
        .single();

      if (dealerData) {
        setDealer(dealerData);

        await trackPublicEvent({
          eventType: "vehicle_view",
          dealerUserId: vehicleData.user_id,
          publicPageId: "marketplace",
          vehicleId: vehicleData.id
        });
      }

      const { data: imagesData } = await supabase
        .from("vehicle_images")
        .select("*")
        .eq("vehicle_id", vehicleData.id)
        .order("is_primary", { ascending: false })
        .order("display_order", { ascending: true });

      setImages(imagesData || []);
      
      // Fetch dealer's other vehicles
      const { data: dealerVehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", vehicleData.user_id)
        .or("is_public.eq.true,marketplace_status.in.(approved,pending,featured,listed)")
        .eq("status", "in_stock")
        .neq("id", vehicleData.id)
        .limit(10);
      
      // Get images for dealer vehicles
      if (dealerVehiclesData && dealerVehiclesData.length > 0) {
        const vehicleIds = dealerVehiclesData.map(v => v.id);
        const { data: dealerImagesData } = await supabase
          .from("vehicle_images")
          .select("*")
          .in("vehicle_id", vehicleIds);
        
        const imageMap: Record<string, string> = {};
        (dealerImagesData || []).forEach(img => {
          if (!imageMap[img.vehicle_id] || img.is_primary) {
            imageMap[img.vehicle_id] = img.image_url;
          }
        });
        
        setDealerVehicles(dealerVehiclesData.map(v => ({
          ...v,
          image_url: imageMap[v.id]
        })));
      }
      
      // Fetch all marketplace vehicles for related suggestions
      const { data: allDealersData } = await supabase
        .from("settings")
        .select("*")
        .eq("public_page_enabled", true)
        .eq("marketplace_enabled", true);
      
      if (allDealersData) {
        setAllDealers(allDealersData);
        const dealerIds = allDealersData.map(d => d.user_id);
        
        const { data: allVehiclesData } = await supabase
          .from("vehicles")
          .select("*")
          .or("is_public.eq.true,marketplace_status.in.(approved,pending,featured,listed)")
          .in("user_id", dealerIds)
          .eq("status", "in_stock")
          .limit(50);
        
        if (allVehiclesData && allVehiclesData.length > 0) {
          const allVehicleIds = allVehiclesData.map(v => v.id);
          const { data: allImagesData } = await supabase
            .from("vehicle_images")
            .select("*")
            .in("vehicle_id", allVehicleIds);
          
          const allImageMap: Record<string, string> = {};
          (allImagesData || []).forEach(img => {
            if (!allImageMap[img.vehicle_id] || img.is_primary) {
              allImageMap[img.vehicle_id] = img.image_url;
            }
          });
          
          setAllVehicles(allVehiclesData.map(v => ({
            ...v,
            image_url: allImageMap[v.id]
          })));
        }
      }
      
    } catch (error) {
      console.error("Error fetching vehicle:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to get dealer for related vehicles
  const getDealerForVehicle = useCallback((userId: string) => {
    return allDealers.find(d => d.user_id === userId);
  }, [allDealers]);

  const handleFormFocus = useCallback(() => {
    if (!formOpened && vehicle && dealer) {
      setFormOpened(true);
      trackPublicEvent({
        eventType: "form_opened",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });
    }
  }, [formOpened, vehicle, dealer]);

  useEffect(() => {
    return () => {
      if (formOpened && !submitted && vehicle && dealer) {
        trackPublicEvent({
          eventType: "form_abandoned",
          dealerUserId: vehicle.user_id,
          publicPageId: "marketplace",
          vehicleId: vehicle.id
        });
      }
    };
  }, [formOpened, submitted, vehicle, dealer]);

  const handleSubmit = async () => {
    if (!formName || !formPhone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }

    if (wantTestDrive && (!testDriveDate || !testDriveTime)) {
      toast({ title: "Please select test drive date and time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let notes = "[MARKETPLACE]";
      if (formMessage) notes += ` ${formMessage}`;
      
      if (wantTestDrive) {
        notes += ` [TEST DRIVE REQUESTED: ${testDriveDate} at ${testDriveTime}]`;
      }

      await createPublicLead({
        dealerUserId: vehicle.user_id,
        customerName: formName,
        phone: formPhone,
        email: formEmail || undefined,
        vehicleInterest: `${vehicle.brand} ${vehicle.model}`,
        notes,
        source: "marketplace",
      });

      await trackPublicEvent({
        eventType: "enquiry_submit",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });

      trackVehicleLead(getMetaVehicle(), {
        lead_type: wantTestDrive ? "test_drive" : "enquiry",
        source: "marketplace",
      });

      setSubmitted(true);
      setEnquirySheetOpen(false);
      toast({ title: wantTestDrive ? "Test drive request sent!" : "Enquiry sent successfully!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if (dealer?.whatsapp_number) {
      const message = encodeURIComponent(
        `Hi, I'm interested in the ${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model} listed on UpcurvHub Marketplace.`
      );
      window.open(`https://wa.me/${dealer.whatsapp_number.replace(/\D/g, "")}?text=${message}`, "_blank");
      
      trackPublicEvent({
        eventType: "cta_whatsapp",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });
      trackVehicleContact("whatsapp", getMetaVehicle());
    }
  };

  const handleCall = () => {
    if (dealer?.dealer_phone) {
      trackPublicEvent({
        eventType: "cta_call",
        dealerUserId: vehicle.user_id,
        publicPageId: "marketplace",
        vehicleId: vehicle.id
      });
      trackVehicleContact("call", getMetaVehicle());
    }
  };

  const handleWishlistToggle = () => {
    if (!vehicle) return;
    const willBeAdded = !isWishlisted;
    toggleWishlist(vehicle.id);
    trackVehicleWishlist(getMetaVehicle(), willBeAdded);
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  // Share the canonical, keyword-rich slug URL.
  const getShareUrl = () => `${window.location.origin}${vehiclePath(vehicle)}`;

  const getBadgeStyle = () => {
    if (vehicle?.image_badge_color) {
      const colorMap: Record<string, string> = {
        red: '#EF4444', orange: '#F97316', amber: '#F59E0B', yellow: '#EAB308',
        lime: '#84CC16', green: '#22C55E', emerald: '#10B981', teal: '#14B8A6',
        cyan: '#06B6D4', sky: '#0EA5E9', blue: '#3B82F6', indigo: '#6366F1',
        violet: '#8B5CF6', purple: '#A855F7', fuchsia: '#D946EF', pink: '#EC4899',
        rose: '#F43F5E', slate: '#64748B', gray: '#6B7280', zinc: '#71717A',
      };
      const color = colorMap[vehicle.image_badge_color.toLowerCase()];
      if (color) return { backgroundColor: color };
      if (vehicle.image_badge_color.startsWith('#')) return { backgroundColor: vehicle.image_badge_color };
      return { backgroundColor: '#10B981' };
    }
    return { backgroundColor: '#10B981' };
  };

  if (loading) {
    return <VehiclePageSkeleton />;
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Vehicle Not Found</h2>
          <p className="text-slate-500 mb-4">This vehicle is not available on the marketplace.</p>
          <Button onClick={() => navigate("/")}>Back to Marketplace</Button>
        </Card>
      </div>
    );
  }

  const monthlyEmi = Math.round(vehicle.selling_price / 48);
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.manufacturing_year;

  // Overview data for Cars24 style
  const overviewData = [
    { label: "Make Year", value: vehicle.manufacturing_year, icon: Calendar },
    { label: "Reg Year", value: vehicle.registration_year || vehicle.manufacturing_year, icon: FileText },
    { label: "Fuel Type", value: vehicle.fuel_type, icon: Fuel },
    { label: "KM Driven", value: vehicle.odometer_reading ? `${formatIndianNumber(vehicle.odometer_reading)} km` : "N/A", icon: Gauge },
    { label: "Transmission", value: vehicle.transmission, icon: Settings },
    { label: "No. of Owners", value: `${vehicle.number_of_owners || 1}${vehicle.number_of_owners === 1 ? 'st' : 'nd'} Owner`, icon: Users },
    { label: "Insurance", value: vehicle.insurance_expiry ? "Valid" : "Check with dealer", icon: Shield },
    { label: "RTO", value: vehicle.registration_number?.slice(0, 4) || "N/A", icon: Navigation },
  ];

  // Time slots for test drive
  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
  ];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Memoized form to prevent unnecessary re-renders
  const renderEnquiryForm = () => {
    if (submitted) {
      return (
        <div className="text-center py-6">
          <div className="h-16 w-16 rounded-full bg-green-100/80 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {wantTestDrive ? "Test Drive Scheduled!" : "Enquiry Sent!"}
          </h3>
          <p className="text-muted-foreground mb-4">The dealer will contact you shortly.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        <Input
          placeholder="Your Name *"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          onFocus={handleFormFocus}
          className="border-border rounded-xl h-12"
        />
        <Input
          placeholder="Phone Number *"
          value={formPhone}
          onChange={(e) => setFormPhone(e.target.value)}
          onFocus={handleFormFocus}
          className="border-border rounded-xl h-12"
        />
        <Input
          placeholder="Email (optional)"
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          onFocus={handleFormFocus}
          className="border-border rounded-xl h-12"
        />
        <Textarea
          placeholder="Message (optional)"
          value={formMessage}
          onChange={(e) => setFormMessage(e.target.value)}
          onFocus={handleFormFocus}
          className="border-border rounded-xl"
          rows={3}
        />
        
        {/* Test Drive Option */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="testDrive"
              checked={wantTestDrive}
              onCheckedChange={(checked) => setWantTestDrive(checked as boolean)}
            />
            <Label htmlFor="testDrive" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              I want a free test drive
            </Label>
          </div>

          {wantTestDrive && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Preferred Date</Label>
                <Input
                  type="date"
                  min={minDate}
                  value={testDriveDate}
                  onChange={(e) => setTestDriveDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Preferred Time</Label>
                <select
                  value={testDriveTime}
                  onChange={(e) => setTestDriveTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={submitting} 
          className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 text-base font-semibold"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Sending..." : wantTestDrive ? "Request Test Drive" : "Get Best Price"}
        </Button>
      </div>
    );
  };

  // Visible Q&A shown lower on the page; also emitted as FAQPage schema.
  const vehicleFaqs = vehicle
    ? [
        {
          q: `Is this ${vehicle.brand} ${vehicle.model} available for a test drive?`,
          a: `Yes. Request a test drive using the enquiry form on this page and ${dealer?.dealer_name || "the dealer"}${
            extractDistrict(dealer?.dealer_address) ? ` in ${extractDistrict(dealer?.dealer_address)}` : ""
          } will confirm a slot with you.`,
        },
        {
          q: `What is the EMI for this ${vehicle.brand} ${vehicle.model}?`,
          a: `At ${formatCurrency(vehicle.selling_price)}, the indicative EMI starts around ${formatCurrency(
            Math.round(vehicle.selling_price / 48),
          )} per month over 48 months. Use the EMI calculator on this page to change the down payment and tenure.`,
        },
        {
          q: `How many owners has this vehicle had?`,
          a: vehicle.number_of_owners
            ? `This ${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model} has had ${vehicle.number_of_owners} owner(s)${
                vehicle.odometer_reading ? ` and has run ${formatIndianNumber(vehicle.odometer_reading)} km` : ""
              }.`
            : `Ownership history is shared by the dealer on request — send an enquiry and you will get the RC and service details.`,
        },
        {
          q: `Does the dealer help with RC transfer and insurance?`,
          a: `Yes. Dealers listed on UpcurvHub handle RC ownership transfer, insurance transfer and finance paperwork for vehicles sold through the marketplace.`,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
      <Seo
        title={`${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model} for Sale | UpcurvHub`}
        description={`Buy a verified used ${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""} at ${formatCurrency(vehicle.selling_price)}${vehicle.odometer_reading ? ` — ${formatIndianNumber(vehicle.odometer_reading)} km driven` : ""}${vehicle.fuel_type ? `, ${vehicle.fuel_type}` : ""}. Inspection details, EMI options and dealer contact on UpcurvHub.`}
        path={vehiclePath(vehicle)}
        image={images[0]?.image_url}
        jsonLd={[{
          "@context": "https://schema.org",
          "@type": "Car",
          name: `${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`,
          "@id": `https://upcurvhub.upcurv.in${vehiclePath(vehicle)}`,
          url: `https://upcurvhub.upcurv.in${vehiclePath(vehicle)}`,
          sku: vehicle.code || vehicle.id,
          brand: { "@type": "Brand", name: vehicle.brand },
          model: vehicle.model,
          vehicleModelDate: vehicle.manufacturing_year,
          ...(vehicle.variant ? { vehicleConfiguration: vehicle.variant } : {}),
          ...(vehicle.number_of_owners ? { numberOfPreviousOwners: vehicle.number_of_owners } : {}),
          ...(vehicle.seating_capacity ? { seatingCapacity: vehicle.seating_capacity } : {}),
          ...(vehicle.registration_year ? { dateVehicleFirstRegistered: `${vehicle.registration_year}` } : {}),
          ...(vehicle.fuel_type ? { fuelType: vehicle.fuel_type } : {}),
          ...(vehicle.transmission ? { vehicleTransmission: vehicle.transmission } : {}),
          ...(vehicle.color ? { color: vehicle.color } : {}),
          ...(vehicle.odometer_reading
            ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.odometer_reading, unitCode: "KMT" } }
            : {}),
          image: images.map((img: any) => img.image_url).filter(Boolean),
          itemCondition: "https://schema.org/UsedCondition",
          offers: {
            "@type": "Offer",
            url: `https://upcurvhub.upcurv.in${vehiclePath(vehicle)}`,
            price: vehicle.selling_price,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/UsedCondition",
            ...(dealer?.dealer_name
              ? {
                  seller: {
                    "@type": "AutoDealer",
                    name: dealer.dealer_name,
                    url: `https://upcurvhub.upcurv.in${dealerPath(dealer)}`,
                    ...(dealer.dealer_phone ? { telephone: dealer.dealer_phone } : {}),
                  },
                }
              : {}),
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://upcurvhub.upcurv.in/" },
            { "@type": "ListItem", position: 2, name: "Used Vehicles", item: "https://upcurvhub.upcurv.in/marketplace/vehicles" },
            { "@type": "ListItem", position: 3, name: vehicle.brand, item: `https://upcurvhub.upcurv.in/marketplace/brand/${slugify(vehicle.brand)}` },
            { "@type": "ListItem", position: 4, name: `${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`, item: `https://upcurvhub.upcurv.in${vehiclePath(vehicle)}` },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: vehicleFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }]}
      />
      {/* Header - shared marketplace top bar */}
      <MarketplaceTopBar
        showBack
        actions={
          <>
            <button onClick={handleShare} aria-label="Share" className="p-2 hover:bg-muted rounded-full transition-colors">
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleWishlistToggle}
              aria-label="Save vehicle"
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Gallery - Cars24 Style with large hero */}
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl bg-white">
              <div className="relative aspect-[16/10] md:aspect-[16/9] bg-slate-900">
                {images.length > 0 ? (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
                      style={{ backgroundImage: `url(${images[currentImageIndex]?.image_url})` }}
                      aria-hidden="true"
                    />
                    <img
                      src={images[currentImageIndex]?.image_url}
                      alt={imageAlt(vehicle, currentImageIndex, dealer?.dealer_name)}
                      className="relative z-[1] w-full h-full object-contain"
                    />

                    {images.length > 1 && (
                      <>
                        <button 
                          type="button"
                          onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : images.length - 1)}
                          aria-label="Previous image"
                          className="absolute z-20 left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5 text-slate-700" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setCurrentImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                          aria-label="Next image"
                          className="absolute z-20 right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronRight className="h-5 w-5 text-slate-700" />
                        </button>
                      </>
                    )}

                    
                    {/* Image counter badge */}
                    <div className="absolute z-20 bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
                      <Camera className="h-4 w-4" />
                      {currentImageIndex + 1}/{images.length}
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute z-20 top-3 left-3 flex flex-col gap-2">
                      {vehicle.image_badge_text && (
                        <Badge 
                          className="text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold"
                          style={getBadgeStyle()}
                        >
                          {vehicle.image_badge_text}
                        </Badge>
                      )}
                      {vehicleAge <= 1 && (
                        <Badge className="bg-emerald-500 text-white border-0 shadow text-xs">Almost New</Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <Car className="h-24 w-24 text-slate-600" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip - Horizontal scroll */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-white">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden transition-all ${
                        i === currentImageIndex 
                          ? 'ring-2 ring-blue-500 ring-offset-1' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image_url} alt={imageAlt(vehicle, i, dealer?.dealer_name)} loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Vehicle Title & Price - Mobile Only */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl lg:hidden">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">{vehicle.variant}</p>
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(vehicle.selling_price)}
                </span>
                {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                  <span className="text-base text-slate-400 line-through">
                    {formatCurrency(vehicle.strikeout_price)}
                  </span>
                )}
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setEmiOpen(true)}
                  className="flex-1 text-sm text-blue-600 font-medium flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Calculator className="h-4 w-4" />
                  <span>EMI Calculator</span>
                </button>
                <button 
                  onClick={() => setValuationOpen(true)}
                  className="flex-1 text-sm text-emerald-600 font-medium flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  <span>Check Value</span>
                </button>
              </div>
            </Card>

            {/* Quick Specs Grid - No horizontal scroll */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Overview</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[
                  { icon: Gauge, label: "KM Driven", value: vehicle.odometer_reading ? `${(vehicle.odometer_reading / 1000).toFixed(0)}K` : "N/A" },
                  { icon: Fuel, label: "Fuel", value: vehicle.fuel_type },
                  { icon: Settings, label: "Transmission", value: vehicle.transmission },
                  { icon: Users, label: "Owner", value: `${vehicle.number_of_owners || 1}${vehicle.number_of_owners === 1 ? 'st' : 'nd'}` },
                  { icon: Calendar, label: "Year", value: vehicle.manufacturing_year },
                ].map((spec, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50"
                  >
                    <spec.icon className="h-5 w-5 text-primary mb-1" />
                    <span className="text-xs text-slate-500">{spec.label}</span>
                    <span className="text-sm font-semibold text-slate-800 capitalize">{spec.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Dealer Card - Cars24 Style */}
            {dealer && (
              <Link to={`/marketplace/dealer/${dealer.user_id}`}>
                <Card className="p-4 border-0 shadow-sm rounded-2xl hover:shadow-md transition-all group bg-white">
                  <div className="flex items-center gap-3">
                    {dealer.shop_logo_url ? (
                      <img src={dealer.shop_logo_url} alt={dealer.dealer_name} className="h-12 w-12 rounded-xl object-cover border border-slate-100" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{dealer.dealer_name}</span>
                        <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs text-slate-600 font-medium">{dealer.show_ratings ? "4.5" : "New"}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 truncate">
                          {(() => {
                            const parts = (dealer.dealer_address || "").split(",").map((s: string) => s.trim()).filter(Boolean);
                            return (
                              extractDistrict(dealer.dealer_address) ||
                              parts[parts.length - 2] ||
                              parts[0] ||
                              "India"
                            );
                          })()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </div>
                </Card>
              </Link>
            )}

            {/* Tabs - Cars24 Style */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start gap-0 rounded-none border-b border-slate-100 bg-transparent h-12 p-0">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 h-full font-medium"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="features" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 h-full font-medium"
                  >
                    Features
                  </TabsTrigger>
                  <TabsTrigger 
                    value="specs" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-4 h-full font-medium"
                  >
                    Specs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-5 mt-0">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Car Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {overviewData.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <item.icon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          <p className="text-sm font-medium text-slate-900 capitalize truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="p-5 mt-0">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    Features
                  </h3>
                  {vehicle.public_features && vehicle.public_features.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {vehicle.public_features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No features listed</p>
                  )}
                </TabsContent>

                <TabsContent value="specs" className="p-5 mt-0">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-500" />
                    Specifications
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Engine", value: vehicle.engine_number && vehicle.show_engine_number ? vehicle.engine_number : (vehicle.engine_number ? "Available" : "Contact Dealer") },
                      { label: "Chassis", value: vehicle.chassis_number && vehicle.show_chassis_number ? vehicle.chassis_number : (vehicle.chassis_number ? "Available" : "Contact Dealer") },
                      { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage} kmpl` : "Contact Dealer" },
                      { label: "Color", value: vehicle.color || "Contact Dealer" },
                      { label: "Seating Capacity", value: vehicle.seating_capacity ? `${vehicle.seating_capacity} Seater` : "Contact Dealer" },
                      { label: "Boot Space", value: vehicle.boot_space || "Contact Dealer" },
                      { label: "Battery Health", value: vehicle.battery_health || (vehicle.fuel_type === 'electric' ? "Contact Dealer" : null) },
                      { label: "Tyre Condition", value: vehicle.tyre_condition || "Contact Dealer" },
                      { label: "Service History", value: vehicle.service_history || "Contact Dealer" },
                      { label: "Hypothecation", value: vehicle.hypothecation || "None" },
                      { label: "Insurance Valid Till", value: vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "Contact Dealer" },
                      { label: "PUC Valid Till", value: vehicle.puc_expiry ? new Date(vehicle.puc_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "Contact Dealer" },
                      { label: "Fitness Valid Till", value: vehicle.fitness_expiry ? new Date(vehicle.fitness_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "Contact Dealer" },
                      { label: "Road Tax Valid Till", value: vehicle.road_tax_expiry ? new Date(vehicle.road_tax_expiry).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "Contact Dealer" },
                      { label: "Last Service", value: vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "Contact Dealer" },
                    ].filter(spec => spec.value !== null).map((spec, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-500">{spec.label}</span>
                        <span className="text-sm font-medium text-slate-900 capitalize">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Key Highlights - Cars24 Style */}
            {vehicle.public_highlights && vehicle.public_highlights.length > 0 && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl bg-white">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Why This Car?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {vehicle.public_highlights.map((highlight: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <ThumbsUp className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-snug">{highlight}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Description */}
            {vehicle.public_description && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl bg-white">
                <h3 className="font-semibold text-slate-900 mb-3">About This Vehicle</h3>
                <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">{vehicle.public_description}</p>
              </Card>
            )}

            {/* Trust Badges - Mobile */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 lg:hidden">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">Verified</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">Documents</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <Wrench className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">Inspected</p>
                </div>
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-1.5">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">24hr Support</p>
                </div>
              </div>
            </Card>

            {/* FAQ — visible Q&A backing the FAQPage schema above */}
            {vehicleFaqs.length > 0 && (
              <Card className="p-5 border-0 shadow-sm rounded-2xl bg-white">
                <h2 className="text-base font-bold text-slate-900 mb-3">
                  Questions about this {vehicle.brand} {vehicle.model}
                </h2>
                <div className="divide-y divide-slate-100">
                  {vehicleFaqs.map((f) => (
                    <div key={f.q} className="py-3">
                      <h3 className="text-sm font-semibold text-slate-800">{f.q}</h3>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>


          {/* Right Column - Price & Enquiry (Desktop) */}
          <div className="hidden lg:block space-y-4">
            {/* Price Card - Sticky */}
            <Card className="p-5 border-0 shadow-lg rounded-2xl sticky top-20 bg-white">
              {/* Not an <h1>: the mobile title card above already renders the
                  page's single h1, and both blocks live in the DOM at once. */}
              <div className="text-xl font-bold text-slate-900 leading-tight">
                {vehicle.manufacturing_year} {vehicle.brand} {vehicle.model}
              </div>
              <p className="text-slate-500 text-sm mt-1">{vehicle.variant}</p>
              
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-bold text-slate-900">
                  {formatCurrency(vehicle.selling_price)}
                </span>
                {vehicle.strikeout_price && vehicle.strikeout_price > vehicle.selling_price && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatCurrency(vehicle.strikeout_price)}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl h-11"
                  onClick={() => setEmiOpen(true)}
                >
                  <Calculator className="h-4 w-4" />
                  EMI Calculator
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl h-11"
                  onClick={() => setValuationOpen(true)}
                >
                  <Zap className="h-4 w-4" />
                  Valuation
                </Button>
              </div>

              <div className="border-t border-slate-100 mt-5 pt-5">
                <h3 className="font-semibold text-slate-900 mb-1">Interested?</h3>
                <p className="text-sm text-slate-500 mb-4">Share your details for best price</p>
                
                {renderEnquiryForm()}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  {dealer?.whatsapp_number && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-xl h-11"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                  {dealer?.dealer_phone && (
                    <a href={`tel:${dealer.dealer_phone}`} className="flex-1" onClick={handleCall}>
                      <Button variant="outline" className="w-full gap-2 rounded-xl h-11">
                        <Phone className="h-4 w-4" />
                        Call Now
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </Card>

            {/* Trust Badges */}
            <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white">
              <div className="space-y-3">
                {[
                  { icon: Shield, color: "blue", text: "Verified by UpcurvHub" },
                  { icon: CheckCircle, color: "emerald", text: "Complete documentation" },
                  { icon: Wrench, color: "amber", text: "150+ point inspection" },
                  { icon: Clock, color: "purple", text: "24-hour response guarantee" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`h-8 w-8 rounded-lg bg-${item.color}-50 flex items-center justify-center`}>
                      <item.icon className={`h-4 w-4 text-${item.color}-600`} />
                    </div>
                    <span className="text-slate-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        
        {/* More from this Dealer */}
        {dealerVehicles.length > 0 && vehicle && (
          <DealerVehiclesSection
            vehicles={dealerVehicles}
            dealer={dealer}
            currentVehicleId={vehicle.id}
          />
        )}
        
        {/* Similar/Related Vehicles */}
        {allVehicles.length > 0 && vehicle && (
          <RelatedVehiclesSection
            currentVehicle={vehicle}
            allVehicles={allVehicles}
            getDealerForVehicle={getDealerForVehicle}
          />
        )}
      </div>

      {/* Mobile Sticky CTA - Cars24 Style - Fixed properly */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 lg:hidden z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
        <div className="flex gap-2 max-w-full overflow-hidden">
          {dealer?.dealer_phone && (
            <a href={`tel:${dealer.dealer_phone}`} onClick={handleCall} className="shrink-0">
              <Button variant="outline" size="default" className="gap-2 rounded-xl h-12 w-12 p-0 border-slate-300">
                <Phone className="h-5 w-5" />
              </Button>
            </a>
          )}
          {dealer?.whatsapp_number && (
            <Button
              size="default"
              className="flex-1 min-w-0 gap-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl h-12 px-3"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">WhatsApp</span>
            </Button>
          )}
          <Sheet open={enquirySheetOpen} onOpenChange={setEnquirySheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="default"
                className="flex-1 min-w-0 gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl h-12 px-3"
              >
                <Send className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm">Enquire Now</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader className="mb-4">
                <SheetTitle>Get Best Price for This Car</SheetTitle>
              </SheetHeader>
              {renderEnquiryForm()}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* EMI Calculator Dialog */}
      <MarketplaceEMICalculator
        open={emiOpen}
        onOpenChange={setEmiOpen}
        vehiclePrice={vehicle.selling_price}
        vehicleName={`${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`}
      />

      {/* Valuation Calculator with vehicle data */}
      <VehicleValuationCalculator
        open={valuationOpen}
        onOpenChange={setValuationOpen}
        vehicleData={{
          vehicleType: vehicle.vehicle_type,
          sellingPrice: vehicle.selling_price,
          manufacturingYear: vehicle.manufacturing_year,
          odometerReading: vehicle.odometer_reading,
          condition: vehicle.condition,
          variant: vehicle.variant,
        }}
      />

      {/* Dealer CTA popup after 25s on page */}
      <DealerCtaPopup
        storageKey={vehicle.id}
        dealerName={dealer?.dealer_name}
        dealerPhone={dealer?.dealer_phone}
        whatsappNumber={dealer?.whatsapp_number}
        vehicleTitle={`${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`}
        priceLabel={formatCurrency(vehicle.selling_price)}
        onCall={handleCall}
        onWhatsApp={() =>
          trackPublicEvent({
            eventType: "cta_whatsapp",
            dealerUserId: vehicle.user_id,
            publicPageId: "marketplace",
            vehicleId: vehicle.id,
          })
        }
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={`${vehicle.manufacturing_year} ${vehicle.brand} ${vehicle.model}`}
        url={getShareUrl()}
        description={`Check out this ${vehicle.brand} ${vehicle.model} on UpcurvHub Marketplace. Price: ${formatCurrency(vehicle.selling_price)}`}
      />

      {/* Footer */}
      <MarketplaceFooter />
    </div>
  );
};

export default MarketplaceVehicle;
