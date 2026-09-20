import buyingGuideImg from "@/assets/blog/used-car-buying-guide.jpg";
import under5LakhImg from "@/assets/blog/best-cars-under-5-lakh.jpg";
import evGuideImg from "@/assets/blog/ev-buying-guide.jpg";
import inspectionImg from "@/assets/blog/vehicle-inspection-checklist.jpg";

export interface BlogSection {
  heading: string;
  body: string[];
  list?: string[];
}

export interface BlogPost {
  /** SEO slug — also the route: /blog/<slug> */
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  date: string;        // display date
  isoDate: string;     // for <time> and JSON-LD
  readTime: string;
  author: string;
  image: string;
  imageAlt: string;
  keywords: string[];
  sections: BlogSection[];
  faqs: { q: string; a: string }[];
  /** Internal links to model hub pages, e.g. /cars/maruti-suzuki/swift */
  relatedModels?: { label: string; path: string }[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "used-car-buying-guide-india",
    title: "Complete Guide to Buying a Used Car in India (2026)",
    metaTitle: "Used Car Buying Guide India 2026 — Checklist, Papers & Price Tips",
    metaDescription:
      "Step-by-step guide to buying a used car in India in 2026: budget, inspection, RC and insurance checks, negotiation and RTO transfer — from UpcurvHub.",
    excerpt:
      "Everything you need to know before buying a pre-owned car — budgeting, inspection, paperwork and negotiation.",
    category: "Buying Guide",
    date: "Feb 8, 2026",
    isoDate: "2026-02-08",
    readTime: "8 min read",
    author: "UpcurvHub Team",
    image: buyingGuideImg,
    imageAlt: "Buyers inspecting a used hatchback with a dealer at an Indian used car showroom",
    keywords: ["used car buying guide india", "second hand car checklist", "buy used car tips"],
    sections: [
      {
        heading: "1. Fix a realistic on-road budget",
        body: [
          "The sticker price is never the full cost. Budget for insurance transfer, RTO ownership transfer, an immediate service and a small repair buffer. A safe rule is to keep about 10% of the vehicle price aside for these.",
          "If you are financing, keep the EMI under 15% of your monthly take-home. Most lenders fund 70-85% of the valuation of a used car, so plan the down payment early.",
        ],
      },
      {
        heading: "2. Shortlist by ownership cost, not just price",
        body: [
          "Two cars at the same price can differ hugely in running cost. Compare fuel efficiency, service interval pricing, common spare part rates and insurance premium before you fall in love with a listing.",
        ],
        list: [
          "Petrol hatchbacks: lowest maintenance, best for city use under 40 km/day",
          "Diesel sedans and SUVs: worth it above roughly 1,500 km per month",
          "CNG: cheapest per km, but check the cylinder's hydro-test date",
          "Electric: lowest running cost, verify battery health report and warranty transfer",
        ],
      },
      {
        heading: "3. Verify the paperwork before the test drive",
        body: [
          "Ask for photos of the documents before you travel. A clean paper trail matters more than a shiny body.",
        ],
        list: [
          "Registration Certificate (RC) — name, chassis and engine number must match the car",
          "Insurance policy with No Claim Bonus details",
          "Valid PUC certificate",
          "Service history and last service invoice",
          "Loan closure / NOC from the bank if the car was financed (hypothecation removed)",
        ],
      },
      {
        heading: "4. Inspect and test drive properly",
        body: [
          "Drive the car cold — a warmed-up engine hides starting trouble. Test it on a rough patch, a speed breaker and at highway speed. Listen for suspension knocks, check for pulling to one side under braking, and watch the exhaust colour on hard acceleration.",
          "Every vehicle listed on UpcurvHub carries dealer-declared inspection details, odometer reading and document expiry dates so you can filter out problem cars before you drive out.",
        ],
      },
      {
        heading: "5. Negotiate with data",
        body: [
          "Quote real numbers: pending service costs, tyre replacement, upcoming insurance renewal and comparable listings of the same year and variant. A documented list of work needed is the single most effective negotiating tool.",
        ],
      },
      {
        heading: "6. Complete the RTO transfer",
        body: [
          "Ownership transfer is done through Form 29 and Form 30 at the RTO (or on the Parivahan portal). Transfer the insurance to your name within 14 days, otherwise a claim can be rejected. Keep a copy of everything you sign.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many kilometres is too much for a used car?",
        a: "Around 10,000-12,000 km per year is normal in India. A well-serviced car with 1,00,000 km is often a better buy than a neglected one with 40,000 km, so judge service history over the odometer alone.",
      },
      {
        q: "Should I buy from a dealer or a private seller?",
        a: "A verified dealer handles paperwork, RTO transfer and usually offers some warranty, while private sales can be slightly cheaper but riskier. UpcurvHub lists only verified dealers.",
      },
      {
        q: "Can I get a loan on a used car in India?",
        a: "Yes. Banks and NBFCs fund used cars up to about 8-10 years old, typically covering 70-85% of the valuation at rates between 11% and 16% per annum.",
      },
    ],
  },
  {
    slug: "best-used-cars-under-5-lakh",
    title: "Top 10 Best Used Cars Under ₹5 Lakh in 2026",
    metaTitle: "Best Used Cars Under ₹5 Lakh in India (2026) — Top 10 Picks",
    metaDescription:
      "The 10 most reliable used cars under ₹5 lakh in India for 2026, with realistic mileage, maintenance cost and what to check before buying each one.",
    excerpt: "The most value-for-money second-hand cars you can buy under ₹5 lakh right now.",
    category: "Top Picks",
    date: "Feb 5, 2026",
    isoDate: "2026-02-05",
    readTime: "6 min read",
    author: "UpcurvHub Team",
    image: under5LakhImg,
    imageAlt: "Row of affordable used cars with price tags at an Indian used car lot",
    keywords: ["used cars under 5 lakh", "best second hand cars india", "cheap used cars"],
    sections: [
      {
        heading: "What ₹5 lakh buys in 2026",
        body: [
          "At this budget you are typically looking at a 2016-2020 hatchback or a slightly older compact sedan with 50,000-90,000 km on the clock. Prioritise service history and a single-owner record over cosmetic condition.",
        ],
      },
      {
        heading: "The 10 picks",
        body: ["These models hold up best on reliability, spare part availability and resale in the Indian market."],
        list: [
          "Maruti Suzuki Swift — cheapest to run, parts everywhere, 18-20 kmpl real world",
          "Hyundai Grand i10 — most comfortable cabin in the class",
          "Maruti Suzuki Baleno — spacious, strong resale, good for highway use",
          "Tata Tiago — best build quality and safety at this price",
          "Hyundai i20 (older gen) — premium feel, slightly higher service cost",
          "Maruti Suzuki Dzire — the safest compact sedan buy for cab and family use",
          "Honda Amaze — smooth petrol engine, excellent reliability record",
          "Renault Kwid — lowest entry price, SUV-ish stance, cheap upkeep",
          "Tata Nexon (early diesel) — occasionally available at the top of this budget",
          "Maruti Suzuki Wagon R — unbeatable practicality and CNG availability",
        ],
      },
      {
        heading: "Before you pay",
        body: [
          "Check tyre manufacturing dates, clutch travel, AC cooling and all four power windows. On CNG variants, confirm the endorsement on the RC and the cylinder test date.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which used car has the lowest maintenance cost in India?",
        a: "Maruti Suzuki models — Swift, Wagon R and Alto — have the widest service network and cheapest spare parts, which keeps annual maintenance in the ₹4,000-₹8,000 range for normal usage.",
      },
      {
        q: "Is a 7-year-old car worth buying?",
        a: "Yes, if it has a documented service history and clean paperwork. Petrol cars can run comfortably past 15 years; note diesel vehicles face a 10-year limit in some NCR regions.",
      },
    ],
  },
  {
    slug: "used-electric-vehicle-buying-guide",
    title: "Should You Buy a Used Electric Vehicle? Pros, Cons & Battery Checks",
    metaTitle: "Used Electric Car Buying Guide India 2026 — Battery Health & Costs",
    metaDescription:
      "Is a used EV worth it in India? Battery health checks, warranty transfer, charging costs and resale value explained for second-hand electric car buyers.",
    excerpt: "What to check on a pre-owned EV — battery health, warranty transfer and true running cost.",
    category: "Electric Vehicles",
    date: "Jan 28, 2026",
    isoDate: "2026-01-28",
    readTime: "7 min read",
    author: "UpcurvHub Team",
    image: evGuideImg,
    imageAlt: "Electric car charging with a blue cable at a public charging station in India",
    keywords: ["used electric car india", "ev battery health check", "second hand ev"],
    sections: [
      {
        heading: "The running-cost case",
        body: [
          "An EV costs roughly ₹1-1.5 per km on home charging against ₹6-8 per km for petrol. Over 15,000 km a year that is a saving of about ₹75,000, which is exactly why used EV prices have firmed up in 2026.",
        ],
      },
      {
        heading: "Battery health is the whole deal",
        body: [
          "The battery is 40-50% of the vehicle's value. Ask for a state-of-health (SoH) report from an authorised service centre — anything above 85% after four years is healthy.",
        ],
        list: [
          "Check SoH percentage, not just the range shown on the dashboard",
          "Confirm the battery warranty is transferable to the second owner",
          "Ask how often DC fast charging was used — heavy fast charging ages cells faster",
          "Verify the charging cable and home charger are included",
        ],
      },
      {
        heading: "Where used EVs still fall short",
        body: [
          "Charging infrastructure outside metros is thin, insurance premiums are slightly higher, and out-of-warranty battery replacement is expensive. If you drive long inter-city routes weekly, a hybrid or petrol car may still be the safer buy.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long does an EV battery last in India?",
        a: "Most modern lithium-ion packs retain 80% or more capacity after 8 years or 1,60,000 km, and manufacturers typically warrant them for that period.",
      },
      {
        q: "Is EV insurance costlier for used electric cars?",
        a: "Premiums run about 10-15% higher than an equivalent petrol car because of the battery's replacement value, though several insurers now offer EV-specific discounts.",
      },
    ],
  },
  {
    slug: "vehicle-inspection-checklist",
    title: "150-Point Used Vehicle Inspection Checklist for Buyers",
    metaTitle: "Used Car Inspection Checklist (2026) — 150 Points to Check Before Buying",
    metaDescription:
      "A practical used car and bike inspection checklist covering engine, suspension, electricals, body panels, tyres and documents before you pay.",
    excerpt: "A practical checklist to evaluate any used car or bike before you hand over money.",
    category: "Inspection",
    date: "Jan 15, 2026",
    isoDate: "2026-01-15",
    readTime: "10 min read",
    author: "UpcurvHub Team",
    image: inspectionImg,
    imageAlt: "Mechanic inspecting a used car engine bay with a digital checklist",
    keywords: ["used car inspection checklist", "pre purchase car inspection india"],
    sections: [
      {
        heading: "Body and paint",
        body: ["Walk around the car in daylight. Uneven panel gaps and mismatched paint texture usually mean accident repair."],
        list: [
          "Panel gaps even on both sides",
          "Paint shade consistent across doors, bumpers and roof",
          "No rust at the wheel arches, door bottoms or boot floor",
          "Windscreen free of cracks; all glass from the same brand and year",
        ],
      },
      {
        heading: "Engine and transmission",
        body: ["Start the engine cold and let it idle for two minutes."],
        list: [
          "No blue or white smoke after warm-up",
          "Engine oil clean, not milky or gritty",
          "Coolant level correct and not rusty",
          "No oil seepage around the head gasket or sump",
          "Clutch bites in the lower half of the pedal travel",
          "Automatic gearbox shifts without jerks or delay",
        ],
      },
      {
        heading: "Suspension, brakes and tyres",
        body: [],
        list: [
          "No knocking over speed breakers",
          "Car tracks straight under hard braking",
          "Tyres from the same brand with 4mm+ tread and no uneven wear",
          "Spare tyre, jack and tool kit present",
        ],
      },
      {
        heading: "Electricals and interior",
        body: [],
        list: [
          "All lights, indicators and wipers working",
          "AC cools within two minutes and blows cold at idle",
          "Power windows, central locking and both key fobs working",
          "No warning lamps left on after start-up",
          "Infotainment, reverse camera and speakers functional",
        ],
      },
      {
        heading: "Documents",
        body: [
          "Match the chassis and engine number physically against the RC. Then verify insurance validity, PUC, road tax, fitness (for commercial) and, if applicable, the bank NOC.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much does a professional pre-purchase inspection cost in India?",
        a: "Independent inspection services charge roughly ₹1,500-₹3,000 for a detailed report, which is worth it on any car above ₹3 lakh.",
      },
      {
        q: "What are the biggest red flags in a used car?",
        a: "Welded or repainted chassis members, a milky engine oil cap, a tampered odometer, mismatched chassis numbers and an unavailable bank NOC.",
      },
    ],
  },
  {
    slug: "sell-your-car-at-best-price",
    title: "How to Sell Your Car at the Best Price in India",
    metaTitle: "How to Sell Your Used Car Fast at the Best Price (2026 Guide)",
    metaDescription:
      "Get more for your used car: pricing, photos, paperwork, detailing and negotiation tips, plus how dealer bidding works on UpcurvHub.",
    excerpt: "Pricing, presentation and paperwork tips that add real money to your resale value.",
    category: "Selling Tips",
    date: "Jan 10, 2026",
    isoDate: "2026-01-10",
    readTime: "6 min read",
    author: "UpcurvHub Team",
    image: buyingGuideImg,
    imageAlt: "Seller handing over car keys to a buyer at a dealership",
    keywords: ["sell used car india", "best price for my car", "car resale value tips"],
    sections: [
      {
        heading: "Price it against live listings",
        body: [
          "Search the same brand, model, variant and year on UpcurvHub, note the asking prices of five comparable cars, and set yours near the median. Overpricing by 10% typically doubles the time to sell.",
        ],
      },
      {
        heading: "Spend ₹3,000 to earn ₹30,000",
        body: [
          "A full interior and exterior detail, headlamp polishing and new floor mats change the first impression more than any discount. Fix cheap irritants — a blown bulb, a dead key fob battery, worn wiper blades.",
        ],
      },
      {
        heading: "Photograph it properly",
        body: [
          "Shoot 12-15 photos in soft morning light: front three-quarter, rear three-quarter, both sides, dashboard with odometer, engine bay, boot and tyres. Honest photos of small dents build trust and reduce haggling later.",
        ],
      },
      {
        heading: "Have the paperwork ready",
        body: [
          "RC, insurance, PUC, service records and bank NOC in one folder tells a buyer this car was cared for and closes the deal faster.",
        ],
      },
      {
        heading: "Let dealers compete",
        body: [
          "Listing on UpcurvHub puts your car in front of verified dealers across Tamil Nadu and the rest of India, so you get multiple quotes instead of one lowball offer.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the best month to sell a used car in India?",
        a: "Demand peaks before the festive season (September-November) and again in March, when buyers close purchases before the financial year ends.",
      },
      {
        q: "Do I need to close my car loan before selling?",
        a: "Yes. The buyer cannot transfer the RC until the hypothecation is removed, which needs the bank's NOC and Form 35.",
      },
    ],
  },
  {
    slug: "rto-ownership-transfer-process",
    title: "RTO Ownership Transfer: Step-by-Step Guide for Used Vehicles",
    metaTitle: "RTO Transfer Process for Used Cars in India — Forms, Fees & Timeline",
    metaDescription:
      "How to transfer ownership of a used car or bike in India: Form 29 and 30, NOC, insurance transfer, fees, timelines and common rejection reasons.",
    excerpt: "Forms, fees, timelines and the mistakes that get transfer applications rejected.",
    category: "Legal",
    date: "Dec 28, 2025",
    isoDate: "2025-12-28",
    readTime: "8 min read",
    author: "UpcurvHub Team",
    image: inspectionImg,
    imageAlt: "Vehicle registration documents and keys on a desk",
    keywords: ["rto transfer process", "form 29 form 30", "vehicle ownership transfer india"],
    sections: [
      {
        heading: "Documents you need",
        body: [],
        list: [
          "Original RC",
          "Form 29 (two copies) and Form 30, signed by both parties",
          "Valid insurance and PUC certificate",
          "Address and identity proof of the buyer",
          "PAN card or Form 60",
          "Bank NOC and Form 35 if the vehicle was financed",
          "NOC from the original RTO if the vehicle moves to another state",
        ],
      },
      {
        heading: "The process",
        body: [
          "Apply on the Parivahan portal or at the RTO, pay the transfer fee (roughly ₹300-₹1,000 depending on vehicle class and state), submit the forms, and complete the vehicle inspection if the RTO asks for it. Transfer is usually reflected within 15-30 days.",
        ],
      },
      {
        heading: "Do not skip the insurance transfer",
        body: [
          "Transfer the policy into the buyer's name within 14 days of sale. Until then a claim can be denied, and the seller stays exposed to third-party liability.",
        ],
      },
      {
        heading: "Common rejection reasons",
        body: [],
        list: [
          "Pending challans against the vehicle",
          "Hypothecation not removed",
          "Signature mismatch on Form 29/30",
          "Expired insurance or PUC on the date of application",
        ],
      },
    ],
    faqs: [
      {
        q: "How long does RTO ownership transfer take in India?",
        a: "Typically 15-30 days within the same state, and 30-60 days for an inter-state transfer that needs an NOC from the original RTO.",
      },
      {
        q: "Who pays the RTO transfer fee, buyer or seller?",
        a: "By convention the buyer pays, but it is negotiable and should be agreed in writing along with the sale price.",
      },
    ],
  },
  {
    slug: "used-car-loan-emi-guide",
    title: "Used Car Loan & EMI Guide: Rates, Eligibility and Documents",
    metaTitle: "Used Car Loan India 2026 — Interest Rates, EMI & Eligibility",
    metaDescription:
      "Compare used car loan interest rates, down payment norms, eligibility and documents in India, and learn how to calculate your EMI before you buy.",
    excerpt: "How much you can borrow, at what rate, and how to keep the total interest low.",
    category: "Finance",
    date: "Jan 5, 2026",
    isoDate: "2026-01-05",
    readTime: "7 min read",
    author: "UpcurvHub Team",
    image: under5LakhImg,
    imageAlt: "Customer signing a used car loan agreement at a dealership desk",
    keywords: ["used car loan interest rate", "second hand car emi", "car finance india"],
    sections: [
      {
        heading: "What lenders offer in 2026",
        body: [
          "Banks fund 70-85% of the assessed value of a used car at 11-16% per annum for tenures of 1-5 years. NBFCs approve older vehicles and thinner credit profiles but price 2-4% higher.",
        ],
      },
      {
        heading: "Eligibility basics",
        body: [],
        list: [
          "Vehicle age usually under 8-10 years at loan maturity",
          "Credit score of 700+ for the best rates",
          "Salaried: 3 months' payslips and 6 months' bank statement",
          "Self-employed: 2 years' ITR and business proof",
        ],
      },
      {
        heading: "Keep the total interest low",
        body: [
          "A shorter tenure at a slightly higher EMI can save tens of thousands. On a ₹5,00,000 loan at 13%, moving from 5 years to 3 years cuts total interest by roughly ₹75,000. Check the prepayment charges before signing — many lenders allow part-prepayment free after 6 EMIs.",
        ],
      },
      {
        heading: "Calculate before you commit",
        body: [
          "Every vehicle listing on UpcurvHub includes an EMI calculator so you can test down payment and tenure combinations against the actual asking price.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the interest rate for a used car loan in India?",
        a: "Most lenders charge between 11% and 16% per annum for used cars in 2026, depending on the vehicle's age, your credit score and the loan-to-value ratio.",
      },
      {
        q: "Can I get 100% finance on a used car?",
        a: "Rarely. Lenders fund 70-85% of the valuation, so plan for a down payment of at least 15-30% of the price.",
      },
    ],
  },
  {
    slug: "used-car-insurance-guide",
    title: "Insurance for Used Cars and Bikes: Transfer, Renewal and NCB",
    metaTitle: "Used Car Insurance India — Transfer, IDV, NCB & Renewal Guide",
    metaDescription:
      "How to transfer, renew and price insurance on a second-hand car or bike in India, including IDV, No Claim Bonus rules and the 14-day transfer window.",
    excerpt: "Transfer rules, IDV, No Claim Bonus and how to avoid a rejected claim.",
    category: "Insurance",
    date: "Jan 20, 2026",
    isoDate: "2026-01-20",
    readTime: "5 min read",
    author: "UpcurvHub Team",
    image: evGuideImg,
    imageAlt: "Insurance policy document with car keys",
    keywords: ["used car insurance transfer", "idv meaning", "no claim bonus transfer"],
    sections: [
      {
        heading: "The 14-day rule",
        body: [
          "Motor insurance must be transferred to the new owner within 14 days of the sale. Third-party cover carries over automatically, but own-damage cover does not pay out if the policy is still in the seller's name.",
        ],
      },
      {
        heading: "Understand IDV",
        body: [
          "Insured Declared Value is the maximum payout on a total loss. A low IDV cuts your premium but also your claim. On a used car, pick an IDV close to the realistic market value.",
        ],
      },
      {
        heading: "No Claim Bonus stays with the person",
        body: [
          "NCB belongs to the seller, not the car. Sellers should get an NCB retention letter within 3 years and carry the discount (20-50%) to their next vehicle.",
        ],
      },
      {
        heading: "Worthwhile add-ons",
        body: [],
        list: [
          "Zero depreciation — worth it on vehicles under 5 years old",
          "Roadside assistance",
          "Engine protection, especially in flood-prone cities",
          "Consumables cover",
        ],
      },
    ],
    faqs: [
      {
        q: "What documents are needed to transfer car insurance?",
        a: "The existing policy, the new RC or transfer application, Form 29/30, the buyer's ID proof and an inspection report if the insurer asks for one.",
      },
      {
        q: "What happens if insurance is not transferred after buying a used car?",
        a: "Own-damage claims are rejected because the policyholder no longer owns the vehicle, and the seller can still be pulled into third-party liability.",
      },
    ],
  },
  {
    slug: "buying-used-bike-in-india",
    title: "Buying a Used Bike in India: Checklist, Prices and Paperwork",
    metaTitle: "Used Bike Buying Guide India 2026 — Checklist, Prices & RC Transfer",
    metaDescription:
      "How to buy a second-hand bike in India: what to inspect on the engine and chain, fair price ranges by segment, and the RC transfer paperwork.",
    excerpt: "Engine, chain, frame and paperwork checks for second-hand two-wheeler buyers.",
    category: "Buying Guide",
    date: "Feb 2, 2026",
    isoDate: "2026-02-02",
    readTime: "6 min read",
    author: "UpcurvHub Team",
    image: buyingGuideImg,
    imageAlt: "Used motorcycles lined up for sale at a two-wheeler dealership in India",
    keywords: ["used bike buying guide", "second hand bike checklist india", "buy used motorcycle"],
    sections: [
      {
        heading: "What to inspect",
        body: [],
        list: [
          "Cold start — the engine should fire in one or two cranks with no rattle",
          "Chain slack and sprocket teeth; a worn set costs ₹2,000-₹4,000",
          "Fork seals dry, no oil film on the stanchions",
          "Frame near the headstock free of weld marks or ripples",
          "Even tyre wear and disc thickness",
          "Battery, all lights, self-start and the odometer console",
        ],
      },
      {
        heading: "Segment price sense in 2026",
        body: [],
        list: [
          "100-125cc commuters (Splendor, Shine): ₹30,000-₹60,000",
          "150-160cc (Apache, FZ, Pulsar): ₹55,000-₹95,000",
          "Royal Enfield 350: ₹85,000-₹1,60,000 depending on year",
          "Scooters (Activa, Jupiter): ₹35,000-₹70,000",
        ],
      },
      {
        heading: "Paperwork is identical to a car",
        body: [
          "RC, insurance, PUC and, for a financed bike, the NOC. Ownership transfer uses the same Form 29 and Form 30 route at the RTO.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many kilometres is acceptable on a used bike?",
        a: "Under 10,000 km per year is normal for commuters. Above 60,000 km, budget for a top-end overhaul on smaller engines.",
      },
      {
        q: "Is a used Royal Enfield expensive to maintain?",
        a: "Modern J-series 350s are reliable and cost roughly ₹4,000-₹6,000 a year in servicing; older UCE and cast-iron models need more frequent attention.",
      },
    ],
  },
  {
    slug: "buy-used-cars-in-coimbatore",
    title: "Buying a Used Car in Coimbatore: Prices, Areas and Dealer Tips",
    metaTitle: "Used Cars in Coimbatore — Prices, Best Areas & Verified Dealers (2026)",
    metaDescription:
      "A local guide to buying a second-hand car in Coimbatore: realistic price ranges, where dealers cluster, RTO transfer at TN-37/TN-66 and inspection tips.",
    excerpt: "A local buyer's guide to the Coimbatore used car market — prices, areas and RTO details.",
    category: "City Guide",
    date: "Feb 10, 2026",
    isoDate: "2026-02-10",
    readTime: "6 min read",
    author: "UpcurvHub Team",
    image: under5LakhImg,
    imageAlt: "Used cars for sale at a dealership yard in Coimbatore, Tamil Nadu",
    keywords: ["used cars in coimbatore", "second hand cars coimbatore", "used car dealers coimbatore"],
    sections: [
      {
        heading: "What the Coimbatore market looks like",
        body: [
          "Coimbatore has one of Tamil Nadu's deepest used car markets, with strong supply of single-owner hatchbacks from IT and textile professionals. Petrol hatchbacks under ₹6 lakh move fastest; diesel SUVs hold value well because of the Nilgiris and Kerala highway runs.",
        ],
      },
      {
        heading: "Where dealers cluster",
        body: [],
        list: [
          "Avinashi Road and Peelamedu — premium and certified pre-owned stock",
          "Trichy Road and Singanallur — mid-budget hatchbacks and sedans",
          "Mettupalayam Road — SUVs and commercial vehicles",
          "Saibaba Colony and R.S. Puram — single-owner family cars",
        ],
      },
      {
        heading: "RTO and paperwork in Coimbatore",
        body: [
          "Vehicles here register under TN-37 (Coimbatore Central), TN-38, TN-66 and TN-99 depending on the zone. Transfer is done at the RTO covering the buyer's address; keep an eye out for pending e-challans, which are common on city-registered cars.",
        ],
      },
      {
        heading: "Buy from verified local dealers",
        body: [
          "UpcurvHub lists verified used car and bike dealers across Coimbatore with live stock, inspection details and direct contact, so you can compare prices before travelling across the city.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the cheapest reliable used car in Coimbatore?",
        a: "A 2015-2018 Maruti Suzuki Alto, Wagon R or Hyundai Eon in the ₹2-3.5 lakh range is the most common reliable entry point in the Coimbatore market.",
      },
      {
        q: "Do Coimbatore dealers help with RTO transfer?",
        a: "Most verified dealers handle Form 29/30 submission and insurance transfer as part of the sale; confirm whether the fee is included in the quoted price.",
      },
    ],
  },
  {
    slug: "best-used-hatchbacks-india",
    title: "Best Used Hatchbacks to Buy in India (2026)",
    metaTitle: "Best Used Hatchbacks in India 2026 — Swift, i20, Baleno & More",
    metaDescription:
      "Compare the best used hatchbacks in India for 2026 — Maruti Swift, Baleno, Hyundai i20, Tata Tiago and Altroz — with prices, mileage and buying tips.",
    excerpt:
      "The hatchbacks that hold value, cost the least to run and are easiest to resell in the Indian used market.",
    category: "Model Guide",
    date: "Sep 8, 2026",
    isoDate: "2026-09-08",
    readTime: "7 min read",
    author: "UpcurvHub Team",
    image: under5LakhImg,
    imageAlt: "Row of used hatchbacks parked at an Indian used car dealership",
    keywords: ["best used hatchback india", "used swift price", "second hand i20", "used baleno"],
    sections: [
      {
        heading: "Why hatchbacks dominate the used market",
        body: [
          "Hatchbacks make up the largest share of used car listings in India because they are the most common first car, are cheap to service and fit narrow city streets. Resale demand stays strong even at eight to ten years of age.",
          "For most buyers the shortlist comes down to the Maruti Suzuki Swift, Baleno and Wagon R, the Hyundai i20 and Grand i10 Nios, and the Tata Tiago and Altroz.",
        ],
      },
      {
        heading: "The shortlist, and what each is good at",
        body: [],
        list: [
          "Maruti Suzuki Swift — cheapest to service, widest parts network, strongest resale",
          "Maruti Suzuki Baleno — most cabin space and features for the money",
          "Hyundai i20 — best ride quality and equipment on higher variants",
          "Tata Altroz — strongest body build and crash safety in the segment",
          "Tata Tiago — best value under six lakh with a solid feel",
        ],
      },
      {
        heading: "What to check before you pay",
        body: [
          "Ask for the full service history, check for uneven panel gaps and repainted panels, and always test drive over a speed breaker to hear the suspension. On CNG-fitted cars, confirm the endorsement is on the RC.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which used hatchback has the lowest running cost in India?",
        a: "The Maruti Suzuki Swift and Wagon R have the lowest combined service and spare part costs, thanks to the widest workshop network in the country.",
      },
      {
        q: "Is a used Tata Altroz a good buy?",
        a: "Yes — it has a 5-star Global NCAP rating and a strong body shell, and it depreciates faster than Maruti rivals, which makes it good value used.",
      },
    ],
    relatedModels: [
      { label: "Maruti Suzuki Swift", path: "/cars/maruti-suzuki/swift" },
      { label: "Maruti Suzuki Baleno", path: "/cars/maruti-suzuki/baleno" },
      { label: "Hyundai i20", path: "/cars/hyundai/i20" },
      { label: "Tata Altroz", path: "/cars/tata/altroz" },
      { label: "Tata Tiago", path: "/cars/tata/tiago" },
    ],
  },
  {
    slug: "best-used-compact-suvs-india",
    title: "Best Used Compact SUVs in India (2026)",
    metaTitle: "Best Used Compact SUVs India 2026 — Nexon, Venue, Brezza, Sonet",
    metaDescription:
      "A buyer's guide to the best used compact SUVs in India: Tata Nexon, Hyundai Venue, Maruti Brezza, Kia Sonet and Mahindra XUV300 — prices, mileage and checks.",
    excerpt:
      "Compact SUVs are the fastest-moving used segment in India. Here is how the top five compare on cost, safety and reliability.",
    category: "Model Guide",
    date: "Sep 8, 2026",
    isoDate: "2026-09-08",
    readTime: "8 min read",
    author: "UpcurvHub Team",
    image: buyingGuideImg,
    imageAlt: "Used compact SUVs lined up at an Indian dealership forecourt",
    keywords: ["used compact suv india", "second hand nexon", "used venue price", "used brezza"],
    sections: [
      {
        heading: "Why this segment holds value",
        body: [
          "Sub-four-metre SUVs combine higher ground clearance with small-car taxation, so demand stays high and depreciation is slower than in sedans. A three-year-old compact SUV typically retains 65-70% of its price.",
        ],
      },
      {
        heading: "How the top five compare",
        body: [],
        list: [
          "Tata Nexon — 5-star safety, strong diesel, best value used",
          "Hyundai Venue — most features and the smoothest turbo petrol",
          "Maruti Brezza — cheapest to run and easiest to resell",
          "Kia Sonet — best equipped top variants, strong diesel automatic",
          "Mahindra XUV300 — widest cabin and the best brakes in the class",
        ],
      },
      {
        heading: "Inspection points specific to SUVs",
        body: [
          "Check suspension bushes and shock absorbers — heavier SUVs wear these faster. On turbo petrol cars, confirm the service history shows on-time oil changes; on diesels, check for DPF warnings on cars used mainly in the city.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which used compact SUV is safest?",
        a: "The Tata Nexon and Mahindra XUV300 both carry 5-star Global NCAP adult occupant ratings, making them the safest picks in the used compact SUV segment.",
      },
      {
        q: "What is a fair price for a 2020 Tata Nexon?",
        a: "Depending on variant, fuel and condition, 2020 Nexons typically trade between ₹7 lakh and ₹10 lakh; check live listings for your city for current pricing.",
      },
    ],
    relatedModels: [
      { label: "Tata Nexon", path: "/cars/tata/nexon" },
      { label: "Hyundai Venue", path: "/cars/hyundai/venue" },
      { label: "Maruti Suzuki Brezza", path: "/cars/maruti-suzuki/brezza" },
      { label: "Kia Sonet", path: "/cars/kia/sonet" },
      { label: "Mahindra XUV300", path: "/cars/mahindra/xuv300" },
    ],
  },
  {
    slug: "best-used-bikes-india",
    title: "Best Used Bikes to Buy in India (2026)",
    metaTitle: "Best Used Bikes in India 2026 — Splendor, Pulsar, Classic 350, Apache",
    metaDescription:
      "The best used bikes in India for 2026: Hero Splendor, Bajaj Pulsar, Royal Enfield Classic 350, TVS Apache and Honda Activa — prices, mileage and buying checks.",
    excerpt:
      "From 100cc commuters to 350cc cruisers, these are the used two-wheelers with the best reliability and resale in India.",
    category: "Model Guide",
    date: "Sep 8, 2026",
    isoDate: "2026-09-08",
    readTime: "6 min read",
    author: "UpcurvHub Team",
    image: inspectionImg,
    imageAlt: "Used motorcycles and scooters parked at a two-wheeler dealership in India",
    keywords: ["best used bike india", "second hand pulsar", "used classic 350", "used activa price"],
    sections: [
      {
        heading: "Pick by use, not by looks",
        body: [
          "For daily commuting under 20 km, a 100-125cc commuter or a scooter is the cheapest to own. For highway runs, a 160-350cc bike is far more comfortable and safer to overtake with.",
        ],
      },
      {
        heading: "The most reliable used two-wheelers",
        body: [],
        list: [
          "Hero Splendor Plus — unmatched mileage and service reach",
          "Honda Activa — the safest used scooter bet for resale",
          "Bajaj Pulsar 150 — best performance per rupee",
          "TVS Apache RTR 160 — sharp handling, strong parts availability",
          "Royal Enfield Classic 350 — best long-distance comfort, holds value well",
        ],
      },
      {
        heading: "Used bike inspection checklist",
        body: [
          "Cold-start the engine to hear knocking, check chain slack and sprocket teeth, look for fork oil seepage, and inspect the frame near the headstock for accident repairs. Verify the chassis number against the RC before paying.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many kilometres is too much for a used bike?",
        a: "Above 60,000 km on a commuter or 40,000 km on a performance bike, expect engine work soon — price the bike accordingly and insist on service records.",
      },
      {
        q: "Is a used Royal Enfield expensive to maintain?",
        a: "Modern J-platform Classic 350s are reliable and service costs are moderate; older UCE models need more frequent attention to oil leaks and electricals.",
      },
    ],
    relatedModels: [
      { label: "Hero Splendor Plus", path: "/bikes/hero/splendor-plus" },
      { label: "Honda Activa", path: "/bikes/honda/activa" },
      { label: "Bajaj Pulsar 150", path: "/bikes/bajaj/pulsar-150" },
      { label: "TVS Apache RTR 160", path: "/bikes/tvs/apache-rtr-160" },
      { label: "Royal Enfield Classic 350", path: "/bikes/royal-enfield/classic-350" },
    ],
  },
];


import { cityBlogPosts } from "./cityBlogPosts";

blogPosts.push(...cityBlogPosts);

export const getBlogPost = (slug?: string) => blogPosts.find((p) => p.slug === slug);
