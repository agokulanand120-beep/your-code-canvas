import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import MarketplaceTopBar from "@/components/marketplace/MarketplaceTopBar";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import DealerPricingSection from "@/components/marketplace/DealerPricingSection";
import Seo from "@/components/Seo";

const SITE = "https://upcurvhub.upcurv.in";

/** Dedicated dealer plans page: /pricing */
const PricingPage = () => (
  <div className="min-h-screen bg-background">
    <Seo
      title="Dealer Plans & Pricing — List Your Used Cars & Bikes | UpcurvHub"
      description="Compare UpcurvHub dealer plans. Get your used car and bike stock live with a managed listing service, dealer storefront, leads and marketplace visibility."
      path="/pricing"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE}/pricing` },
        ],
      }}
    />
    <MarketplaceTopBar />

    <main className="pb-8">
      <div className="container mx-auto px-3 md:px-4 pt-6">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Pricing</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dealer plans & pricing</h1>
        <p className="mt-2 max-w-3xl text-sm md:text-base text-muted-foreground">
          Choose a plan to get your showroom stock in front of buyers searching for used cars and
          bikes in your city. Our team can set everything up and manage your listings for you.
        </p>
      </div>

      <DealerPricingSection />
    </main>

    <MarketplaceFooter />
  </div>
);

export default PricingPage;
