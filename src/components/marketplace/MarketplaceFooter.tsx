import { Link } from "react-router-dom";
import { Car, Facebook, Instagram, Youtube } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { cityPath } from "@/lib/cityPages";

const FOOTER_CITIES = [
  "Coimbatore", "Chennai", "Madurai", "Salem", "Tiruppur", "Erode",
  "Tiruchirappalli", "Bangalore", "Hyderabad", "Kochi", "Mumbai", "Pune",
];


const MarketplaceFooter = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">UpcurvHub</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              India's most trusted vehicle marketplace. Buy & sell with confidence.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/people/Upcurv-Hub/61593268940650/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UpcurvHub on Facebook"
                className="h-9 w-9 rounded-full bg-muted hover:bg-blue-600 hover:text-white text-muted-foreground flex items-center justify-center transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/upcurvhub?igsh=Y2p5YWNnMzlxbTcx"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UpcurvHub on Instagram"
                className="h-9 w-9 rounded-full bg-muted hover:bg-pink-600 hover:text-white text-muted-foreground flex items-center justify-center transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com/@upcurvhub?si=b-tg97qxmRio5BJi"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="UpcurvHub on YouTube"
                className="h-9 w-9 rounded-full bg-muted hover:bg-red-600 hover:text-white text-muted-foreground flex items-center justify-center transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Buyers</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/marketplace/vehicles" className="hover:text-foreground transition-colors">Browse All Vehicles</Link></li>
              <li><Link to="/marketplace/dealers" className="hover:text-foreground transition-colors">Browse Dealers</Link></li>
              <li><Link to="/models" className="hover:text-foreground transition-colors">Car &amp; Bike Models</Link></li>
              <li><Link to="/marketplace/compare" className="hover:text-foreground transition-colors">Compare Cars</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* For Dealers */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Dealers</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Dealer Login</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Register as Dealer</Link></li>
              <li><Link to="/sell-vehicle" className="hover:text-foreground transition-colors">List Your Vehicle</Link></li>
              <li><Link to="/shop" className="hover:text-foreground transition-colors">Car &amp; Bike Products Store</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Dealer Plans &amp; Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog &amp; Guides</Link></li>
              <li><Link to="/models/cars" className="hover:text-foreground transition-colors">Car Models</Link></li>
              <li><Link to="/models/bikes" className="hover:text-foreground transition-colors">Bike Models</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQs</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link to="/contact#report" className="hover:text-foreground transition-colors">Report an Issue</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* City landing pages — internal links for local search */}
        <div className="mt-10 pt-8 border-t border-border">
          <h4 className="font-semibold mb-3 text-foreground text-sm">Used Cars by City</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {FOOTER_CITIES.map((city) => (
              <Link key={`car-${city}`} to={cityPath("cars", city)} className="hover:text-foreground transition-colors">
                Used cars in {city}
              </Link>
            ))}
          </div>
          <h4 className="font-semibold mt-6 mb-3 text-foreground text-sm">Used Bikes by City</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {FOOTER_CITIES.map((city) => (
              <Link key={`bike-${city}`} to={cityPath("bikes", city)} className="hover:text-foreground transition-colors">
                Used bikes in {city}
              </Link>
            ))}
          </div>
        </div>
      </div>


      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} UpcurvHub. All rights reserved.
              <span className="ml-2 opacity-70">v{APP_VERSION}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketplaceFooter;
