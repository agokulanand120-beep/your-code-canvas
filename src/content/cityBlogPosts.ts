import buyingGuideImg from "@/assets/blog/used-car-buying-guide.jpg";
import under5LakhImg from "@/assets/blog/best-cars-under-5-lakh.jpg";
import inspectionImg from "@/assets/blog/vehicle-inspection-checklist.jpg";
import evGuideImg from "@/assets/blog/ev-buying-guide.jpg";
import type { BlogPost } from "./blogPosts";

/**
 * Location-intent blog posts for Tamil Nadu search demand
 * ("used cars in chennai", "second hand cars in erode", …) plus a
 * state-level hub that links every city landing page and model hub.
 * Each post carries city-specific facts so no two read the same.
 */

interface CitySeed {
  city: string;
  slug: string;
  segment: "cars" | "bikes";
  rto: string;
  areas: string[];
  demand: string;
  priceNote: string;
  localNote: string;
  models: { label: string; path: string }[];
  image: string;
  imageAlt: string;
  date: string;
  isoDate: string;
}

const seeds: CitySeed[] = [
  {
    city: "Chennai",
    slug: "used-cars-in-chennai",
    segment: "cars",
    rto: "TN-01 to TN-14 (Chennai city RTOs)",
    areas: ["Anna Nagar", "Velachery", "OMR / Thoraipakkam", "Ambattur", "Tambaram", "Porur"],
    demand:
      "Chennai has the deepest used car stock in Tamil Nadu, so prices for mainstream hatchbacks and compact SUVs are usually 3-6% lower than in tier-2 districts for the same year and variant.",
    priceNote:
      "Expect ₹3-5 lakh for a 2016-2019 hatchback, ₹6-9 lakh for a 2018-2021 compact SUV and ₹10 lakh and above for a 2020-onwards mid-size SUV.",
    localNote:
      "Coastal humidity and flooding history matter here. Check under the carpets and inside the spare wheel well for silt or a musty smell, and confirm the car was not registered in a flood-hit year insurance claim.",
    models: [
      { label: "Maruti Suzuki Swift", path: "/cars/maruti-suzuki/swift" },
      { label: "Hyundai i20", path: "/cars/hyundai/i20" },
      { label: "Hyundai Creta", path: "/cars/hyundai/creta" },
      { label: "Tata Nexon", path: "/cars/tata/nexon" },
      { label: "Honda City", path: "/cars/honda/city" },
    ],
    image: buyingGuideImg,
    imageAlt: "Used cars parked at a dealership yard in Chennai, Tamil Nadu",
    date: "Sep 12, 2026",
    isoDate: "2026-09-12",
  },
  {
    city: "Erode",
    slug: "used-cars-in-erode",
    segment: "cars",
    rto: "TN-33 (Erode) and TN-86 (Gobichettipalayam)",
    areas: ["Perundurai Road", "Surampatti", "Veerappanchatram", "Chithode", "Bhavani"],
    demand:
      "Erode buyers lean towards diesel MPVs and pickups because of textile and agri trade use, so petrol hatchbacks are often better value here than in Coimbatore.",
    priceNote:
      "A 2015-2018 diesel MPV typically sits at ₹5.5-8 lakh, while a 2017-2020 petrol hatchback lands between ₹3.5 lakh and ₹5.5 lakh.",
    localNote:
      "Vehicles used for textile transport rack up highway kilometres quickly. Ask for the odometer trend across service invoices rather than trusting a single reading.",
    models: [
      { label: "Maruti Suzuki Ertiga", path: "/cars/maruti-suzuki/ertiga" },
      { label: "Maruti Suzuki Dzire", path: "/cars/maruti-suzuki/dzire" },
      { label: "Mahindra Bolero", path: "/cars/mahindra/bolero" },
      { label: "Toyota Innova Crysta", path: "/cars/toyota/innova-crysta" },
      { label: "Hyundai Grand i10 Nios", path: "/cars/hyundai/grand-i10-nios" },
    ],
    image: under5LakhImg,
    imageAlt: "Second hand cars displayed at a used car showroom in Erode",
    date: "Sep 12, 2026",
    isoDate: "2026-09-12",
  },
  {
    city: "Salem",
    slug: "used-cars-in-salem",
    segment: "cars",
    rto: "TN-30 (Salem) and TN-54 (Salem West)",
    areas: ["Five Roads", "Hasthampatti", "Fairlands", "Omalur Road", "Ammapet"],
    demand:
      "Salem's hilly outskirts and Yercaud runs make SUV and higher-ground-clearance stock move fastest, which keeps hatchback prices reasonable through the year.",
    priceNote:
      "Budget ₹4-6 lakh for a 2016-2019 compact sedan and ₹7-11 lakh for a 2018-2021 mid-size SUV in good condition.",
    localNote:
      "Ghat driving is hard on clutches and brake discs. On the test drive, check for clutch slip on an incline start and for steering vibration under braking from 60 km/h.",
    models: [
      { label: "Hyundai Creta", path: "/cars/hyundai/creta" },
      { label: "Mahindra Scorpio", path: "/cars/mahindra/scorpio" },
      { label: "Maruti Suzuki Brezza", path: "/cars/maruti-suzuki/brezza" },
      { label: "Tata Punch", path: "/cars/tata/punch" },
      { label: "Maruti Suzuki Baleno", path: "/cars/maruti-suzuki/baleno" },
    ],
    image: inspectionImg,
    imageAlt: "Buyer inspecting a used SUV at a dealership in Salem",
    date: "Sep 12, 2026",
    isoDate: "2026-09-12",
  },
  {
    city: "Madurai",
    slug: "used-cars-in-madurai",
    segment: "cars",
    rto: "TN-58 (Madurai Central) and TN-64 (Madurai South)",
    areas: ["Anna Nagar", "K.K. Nagar", "Bypass Road", "Thirunagar", "Mattuthavani"],
    demand:
      "Madurai sees strong demand for seven-seaters used in tourism and family travel, so well-kept MPVs sell at a premium while premium hatchbacks are negotiable.",
    priceNote:
      "A 2015-2019 seven-seater usually asks ₹6-11 lakh; a 2017-2020 hatchback sits around ₹3.8-5.5 lakh.",
    localNote:
      "Tourist-run vehicles may be commercially registered. Confirm whether the RC is private or commercial before you plan insurance and resale, since the two are priced very differently.",
    models: [
      { label: "Toyota Innova Crysta", path: "/cars/toyota/innova-crysta" },
      { label: "Maruti Suzuki Ertiga", path: "/cars/maruti-suzuki/ertiga" },
      { label: "Maruti Suzuki Swift", path: "/cars/maruti-suzuki/swift" },
      { label: "Hyundai Venue", path: "/cars/hyundai/venue" },
      { label: "Tata Tiago", path: "/cars/tata/tiago" },
    ],
    image: buyingGuideImg,
    imageAlt: "Used seven-seater cars lined up at a Madurai used car dealer",
    date: "Sep 12, 2026",
    isoDate: "2026-09-12",
  },
  {
    city: "Tiruchirappalli",
    slug: "used-cars-in-trichy",
    segment: "cars",
    rto: "TN-45 (Tiruchirappalli) and TN-48 (Srirangam)",
    areas: ["Thillai Nagar", "Srirangam", "K.K. Nagar", "Cantonment", "Trichy Bypass"],
    demand:
      "Trichy is a steady mid-market: mainstream hatchbacks and compact sedans dominate listings, and stock turns over quickly around admission and festival months.",
    priceNote:
      "Most listings fall between ₹3.5 lakh and ₹8 lakh, with 2018-2021 compact SUVs at the upper end.",
    localNote:
      "Many cars here are single-owner family vehicles with low annual running. Verify a genuinely low odometer with stamped service invoices, not just the seller's word.",
    models: [
      { label: "Maruti Suzuki Baleno", path: "/cars/maruti-suzuki/baleno" },
      { label: "Honda City", path: "/cars/honda/city" },
      { label: "Hyundai i20", path: "/cars/hyundai/i20" },
      { label: "Tata Nexon", path: "/cars/tata/nexon" },
      { label: "Maruti Suzuki Wagon R", path: "/cars/maruti-suzuki/wagon-r" },
    ],
    image: under5LakhImg,
    imageAlt: "Second hand hatchbacks at a used car showroom in Tiruchirappalli",
    date: "Sep 12, 2026",
    isoDate: "2026-09-12",
  },
  {
    city: "Coimbatore",
    slug: "used-bikes-in-coimbatore",
    segment: "bikes",
    rto: "TN-37, TN-38 and TN-99 (Coimbatore RTOs)",
    areas: ["Gandhipuram", "Peelamedu", "Saibaba Colony", "Singanallur", "Vadavalli"],
    demand:
      "Coimbatore's student and factory-shift crowd keeps 100-125cc commuters and scooters in constant demand, while 350cc cruisers move well thanks to weekend Ooty and Kotagiri runs.",
    priceNote:
      "A 2018-2021 commuter costs about ₹35,000-60,000, a used Activa ₹45,000-70,000 and a Classic 350 ₹1.1-1.8 lakh depending on year.",
    localNote:
      "Hill runs wear brake pads and chains fast. Check chain slack, sprocket teeth and fork seals, and cold-start the bike to listen for tappet noise before you agree a price.",
    models: [
      { label: "Hero Splendor Plus", path: "/bikes/hero/splendor-plus" },
      { label: "Honda Activa", path: "/bikes/honda/activa" },
      { label: "Royal Enfield Classic 350", path: "/bikes/royal-enfield/classic-350" },
      { label: "Bajaj Pulsar 150", path: "/bikes/bajaj/pulsar-150" },
      { label: "TVS Apache RTR 160", path: "/bikes/tvs/apache-rtr-160" },
    ],
    image: evGuideImg,
    imageAlt: "Used motorcycles and scooters at a two-wheeler dealer in Coimbatore",
    date: "Sep 12, 2026",
    isoDate: "2026-09-12",
  },
];

const vehicleWord = (segment: "cars" | "bikes") => (segment === "bikes" ? "bikes" : "cars");
const singular = (segment: "cars" | "bikes") => (segment === "bikes" ? "bike" : "car");

const buildPost = (seed: CitySeed): BlogPost => {
  const plural = vehicleWord(seed.segment);
  const one = singular(seed.segment);
  const citySlug = seed.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const listingPath = `/marketplace/vehicles/used-${plural}-in-${citySlug}`;
  return {
    slug: seed.slug,
    title: `Buying a Used ${seed.segment === "bikes" ? "Bike" : "Car"} in ${seed.city}: Prices, Areas and Dealer Tips (2026)`,
    metaTitle: `Used ${seed.segment === "bikes" ? "Bikes" : "Cars"} in ${seed.city} — Prices, Best Areas & Checks (2026)`,
    metaDescription: `Second hand ${plural} in ${seed.city}: real price bands, the best areas and dealers to look at, RTO transfer steps and local inspection checks — updated for 2026 by UpcurvHub.`,
    excerpt: `What a used ${one} really costs in ${seed.city} today, where to look, and the local checks that matter before you pay.`,
    category: "City Guide",
    date: seed.date,
    isoDate: seed.isoDate,
    readTime: "7 min read",
    author: "UpcurvHub Team",
    image: seed.image,
    imageAlt: seed.imageAlt,
    keywords: [
      `used ${plural} in ${seed.city.toLowerCase()}`,
      `second hand ${plural} in ${seed.city.toLowerCase()}`,
      `used ${one} price ${seed.city.toLowerCase()}`,
      `${seed.city.toLowerCase()} used ${one} dealers`,
    ],
    sections: [
      {
        heading: `What the ${seed.city} market looks like in 2026`,
        body: [seed.demand, seed.priceNote],
      },
      {
        heading: `Where to look for used ${plural} in ${seed.city}`,
        body: [
          `Most verified dealers cluster around a handful of stretches, which makes it practical to see three or four ${plural} in one trip.`,
        ],
        list: seed.areas.map((area) => `${area} — dealer showrooms and consignment yards`),
      },
      {
        heading: `Local checks specific to ${seed.city}`,
        body: [seed.localNote],
      },
      {
        heading: "Paperwork and RTO transfer",
        body: [
          `${seed.city} registrations fall under ${seed.rto}. Ownership transfer runs on Form 29 and Form 30, and the insurance must be moved to your name within 14 days of delivery or a claim can be rejected.`,
          "Ask for the RC, insurance with NCB details, PUC, service history and a bank NOC if the vehicle was financed. Match the chassis number on the RC with the one stamped on the vehicle before any payment.",
        ],
      },
      {
        heading: `How much to negotiate in ${seed.city}`,
        body: [
          `Price the work the ${one} needs — tyres, battery, upcoming service, insurance renewal — and quote comparable listings of the same year and variant. A written list of pending work is the strongest lever you have.`,
        ],
      },
      {
        heading: `See live ${plural} available in ${seed.city}`,
        body: [
          `Every listing on UpcurvHub comes from a verified ${seed.city} dealer with declared kilometres, ownership and document validity, so you can filter before you travel. Browse the live stock at ${listingPath}.`,
        ],
      },
    ],
    faqs: [
      {
        q: `What is the cheapest used ${one} worth buying in ${seed.city}?`,
        a: `${seed.priceNote} Below those bands you are usually looking at higher-kilometre or accident-repaired stock, so budget for immediate repairs.`,
      },
      {
        q: `Is it safe to buy a second hand ${one} from a dealer in ${seed.city}?`,
        a: `Yes, when the dealer is verified and hands over the RC, insurance and service history. UpcurvHub lists only verified ${seed.city} dealers with declared vehicle condition.`,
      },
      {
        q: `Can I get finance on a used ${one} in ${seed.city}?`,
        a: `Yes. Banks and NBFCs fund used ${plural} up to roughly 8-10 years old at 11-16% per annum, covering about 70-85% of the valuation. Use the EMI calculator on any listing to check the monthly outgo.`,
      },
      {
        q: `How long does RTO transfer take in ${seed.city}?`,
        a: `Under ${seed.rto}, a clean transfer is usually completed in 7-15 working days once Form 29 and Form 30 are submitted with the NOC, if required.`,
      },
    ],
    relatedModels: seed.models,
  };
};

const tamilNaduHub: BlogPost = {
  slug: "used-cars-in-tamil-nadu",
  title: "Used Cars in Tamil Nadu: City-by-City Prices and Buying Guide (2026)",
  metaTitle: "Used Cars in Tamil Nadu 2026 — City Prices, Dealers & RTO Guide",
  metaDescription:
    "Second hand car prices across Tamil Nadu — Chennai, Coimbatore, Madurai, Salem, Erode, Trichy and more — plus RTO transfer, finance and inspection checks from UpcurvHub.",
  excerpt:
    "Where used cars are cheapest in Tamil Nadu, what each city's market is known for, and how to complete the transfer safely.",
  category: "City Guide",
  date: "Sep 12, 2026",
  isoDate: "2026-09-12",
  readTime: "9 min read",
  author: "UpcurvHub Team",
  image: buyingGuideImg,
  imageAlt: "Used cars for sale across Tamil Nadu dealerships",
  keywords: [
    "used cars in tamil nadu",
    "second hand cars tamil nadu",
    "used car price tamil nadu",
    "tamil nadu used car dealers",
  ],
  sections: [
    {
      heading: "Tamil Nadu is not one used car market",
      body: [
        "Prices swing meaningfully between districts. Chennai has the deepest stock and the sharpest prices on mainstream hatchbacks. Coimbatore and Trichy sit slightly higher but offer better-maintained single-owner cars. Madurai and Erode favour seven-seaters and diesels used in tourism and trade.",
        "Because registration and transfer are state-wide, buying in a neighbouring district is usually straightforward — it is often worth a two-hour drive for a better car.",
      ],
    },
    {
      heading: "City guides and live stock",
      body: ["Start with the city closest to you, then widen the search."],
      list: [
        "Chennai — /marketplace/vehicles/used-cars-in-chennai",
        "Coimbatore — /marketplace/vehicles/used-cars-in-coimbatore",
        "Madurai — /marketplace/vehicles/used-cars-in-madurai",
        "Salem — /marketplace/vehicles/used-cars-in-salem",
        "Erode — /marketplace/vehicles/used-cars-in-erode",
        "Tiruppur — /marketplace/vehicles/used-cars-in-tiruppur",
        "Tiruchirappalli — /marketplace/vehicles/used-cars-in-tiruchirappalli",
        "Tirunelveli — /marketplace/vehicles/used-cars-in-tirunelveli",
        "Vellore — /marketplace/vehicles/used-cars-in-vellore",
        "Thanjavur — /marketplace/vehicles/used-cars-in-thanjavur",
      ],
    },
    {
      heading: "What to budget by body style",
      body: [],
      list: [
        "Hatchback (2016-2019): ₹3-5.5 lakh",
        "Compact sedan (2016-2019): ₹4-6.5 lakh",
        "Compact SUV (2018-2021): ₹6.5-11 lakh",
        "Seven-seater MPV (2015-2019): ₹6-11 lakh",
        "Mid-size SUV (2019-2022): ₹11-18 lakh",
      ],
    },
    {
      heading: "Tamil Nadu RTO transfer, in short",
      body: [
        "Ownership moves with Form 29 and Form 30, submitted at the seller's RTO or through the Parivahan portal. A bank NOC is needed if the vehicle was financed, and road tax is already paid for TN-registered vehicles, so only the transfer fee applies.",
        "If you are bringing a vehicle from another state, budget for re-registration and a road tax difference — that can add a significant amount, so factor it into the price.",
      ],
    },
    {
      heading: "Research the model before the listing",
      body: [
        "Every model on UpcurvHub has a dedicated information page with specs, variants, mileage, common problems, ownership costs and live used listings, so you can compare two shortlisted cars properly before you visit a dealer.",
      ],
    },
  ],
  faqs: [
    {
      q: "Which city in Tamil Nadu has the cheapest used cars?",
      a: "Chennai generally has the lowest asking prices for mainstream hatchbacks and sedans because supply is highest, though tier-2 districts often have better-kept, lower-kilometre cars for a small premium.",
    },
    {
      q: "Can I buy a used car from another Tamil Nadu district?",
      a: "Yes. Within the same state there is no re-registration or road tax difference — only the standard ownership transfer through Form 29 and Form 30.",
    },
    {
      q: "Is a car from another state worth buying?",
      a: "Only if the price gap is large. Re-registration in Tamil Nadu means a NOC from the original RTO plus road tax, which frequently offsets the saving.",
    },
  ],
  relatedModels: [
    { label: "Maruti Suzuki Swift", path: "/cars/maruti-suzuki/swift" },
    { label: "Hyundai Creta", path: "/cars/hyundai/creta" },
    { label: "Tata Nexon", path: "/cars/tata/nexon" },
    { label: "Toyota Innova Crysta", path: "/cars/toyota/innova-crysta" },
    { label: "Honda City", path: "/cars/honda/city" },
  ],
};

export const cityBlogPosts: BlogPost[] = [tamilNaduHub, ...seeds.map(buildPost)];

export const cityBlogSlugs = cityBlogPosts.map((post) => post.slug);
