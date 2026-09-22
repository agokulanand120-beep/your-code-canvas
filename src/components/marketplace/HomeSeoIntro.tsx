import { Link } from "react-router-dom";
import { cityPath } from "@/lib/cityPages";
import { slugify } from "@/lib/seoSlug";

/**
 * Crawlable homepage content block: a real H1-supporting intro plus internal
 * links to the brand, model and city landing pages. Keeps the homepage from
 * being an empty JS shell for crawlers and spreads link equity to the pages
 * that actually target commercial searches.
 */

const CAR_BRANDS = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Toyota", "Honda", "Kia", "Renault"];
const BIKE_BRANDS = ["Royal Enfield", "Yamaha", "Bajaj", "Honda", "Hero MotoCorp", "KTM", "Suzuki", "TVS"];
const CITIES = ["Coimbatore", "Chennai", "Madurai", "Salem", "Tiruppur", "Erode", "Tiruchirappalli"];

const LinkGrid = ({ links }: { links: { to: string; label: string }[] }) => (
  <ul className="flex flex-wrap gap-2">
    {links.map((l) => (
      <li key={l.to + l.label}>
        <Link
          to={l.to}
          className="inline-block rounded-full border border-border bg-card px-3 py-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          {l.label}
        </Link>
      </li>
    ))}
  </ul>
);

const HomeSeoIntro = () => (
  <section className="container mx-auto px-4 py-10 md:py-14 space-y-9">
    <div className="max-w-3xl">
      <h2 className="text-xl md:text-3xl font-bold text-foreground mb-3">
        Buy and sell used cars and bikes on UpcurvHub
      </h2>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
        Find used cars and bikes for sale on UpcurvHub. Browse pre-owned vehicles by brand, model, price,
        fuel type, transmission and location. Compare available vehicles and connect with verified dealers
        to find the right used car or bike.
      </p>
    </div>

    <div>
      <h2 className="text-lg md:text-2xl font-bold text-foreground mb-2">Used cars for sale</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Explore used cars from popular brands and models. Browse available pre-owned cars by price, fuel type,
        transmission and location.
      </p>
      <LinkGrid
        links={CAR_BRANDS.map((b) => ({
          to: `/marketplace/brand/${slugify(b)}`,
          label: `Used ${b} Cars`,
        }))}
      />
    </div>

    <div>
      <h2 className="text-lg md:text-2xl font-bold text-foreground mb-2">Used bikes for sale</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Browse used bikes from popular brands and models. Find pre-owned bikes by brand, price, location and
        vehicle type.
      </p>
      <LinkGrid
        links={BIKE_BRANDS.map((b) => ({
          to: `/marketplace/brand/${slugify(b)}`,
          label: `Used ${b} Bikes`,
        }))}
      />
    </div>

    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg md:text-2xl font-bold text-foreground mb-2">Used cars by city</h2>
        <p className="text-sm text-muted-foreground mb-4">
          See pre-owned cars listed by dealers in your city, with prices and photos.
        </p>
        <LinkGrid links={CITIES.map((c) => ({ to: cityPath("cars", c), label: `Used Cars in ${c}` }))} />
      </div>
      <div>
        <h2 className="text-lg md:text-2xl font-bold text-foreground mb-2">Used bikes by city</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Find second-hand bikes and scooters from dealers near you.
        </p>
        <LinkGrid links={CITIES.map((c) => ({ to: cityPath("bikes", c), label: `Used Bikes in ${c}` }))} />
      </div>
    </div>

    <div>
      <h2 className="text-lg md:text-2xl font-bold text-foreground mb-2">Popular models</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Model pages cover used prices, specifications, variants, mileage and the vehicles available right now.
      </p>
      <LinkGrid
        links={[
          { to: "/cars/toyota/innova-crysta", label: "Toyota Innova Crysta" },
          { to: "/cars/maruti-suzuki/dzire", label: "Maruti Suzuki Dzire" },
          { to: "/cars/maruti-suzuki/swift", label: "Maruti Suzuki Swift" },
          { to: "/cars/maruti-suzuki/baleno", label: "Maruti Suzuki Baleno" },
          { to: "/cars/hyundai/creta", label: "Hyundai Creta" },
          { to: "/cars/tata/nexon", label: "Tata Nexon" },
          { to: "/cars/mahindra/scorpio", label: "Mahindra Scorpio" },
          { to: "/models", label: "All models" },
        ]}
      />
    </div>
  </section>
);

export default HomeSeoIntro;
