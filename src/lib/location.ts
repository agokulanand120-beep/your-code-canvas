/**
 * Location helpers — district-first resolution.
 *
 * Marketplace filters work on DISTRICT only (not locality / state), so every
 * surface must derive the same value from a free-text dealer address.
 */

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "New Delhi",
  "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh", "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli", "Daman and Diu", "Lakshadweep",
];

/** Districts we can recognise inside a free-text address. */
export const KNOWN_DISTRICTS = [
  // Tamil Nadu
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
  "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur",
  "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris",
  "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
  "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
  "Viluppuram", "Virudhunagar", "Ooty", "Hosur",
  // Kerala
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki",
  "Ernakulam", "Kochi", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad",
  "Kannur", "Kasaragod",
  // Karnataka / Telangana / AP
  "Bangalore", "Bengaluru", "Mysore", "Mysuru", "Mangalore", "Hubli", "Belgaum",
  "Davangere", "Shimoga", "Tumkur", "Bellary", "Gulbarga", "Udupi",
  "Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam",
  "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool", "Rajahmundry",
  // Maharashtra / Gujarat / West / North
  "Mumbai", "Thane", "Navi Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad",
  "Solapur", "Kolhapur", "Amravati", "Ahmedabad", "Surat", "Vadodara", "Rajkot",
  "Bhavnagar", "Jamnagar", "Gandhinagar",
  "Delhi", "New Delhi", "Gurgaon", "Gurugram", "Noida", "Ghaziabad", "Faridabad",
  "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Lucknow", "Kanpur", "Varanasi",
  "Agra", "Prayagraj", "Meerut", "Bareilly", "Chandigarh", "Ludhiana", "Amritsar",
  "Jalandhar", "Patiala", "Dehradun", "Shimla", "Srinagar", "Jammu",
  // East / Central
  "Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Patna", "Gaya",
  "Ranchi", "Jamshedpur", "Dhanbad", "Bhubaneswar", "Cuttack", "Rourkela",
  "Guwahati", "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Raipur",
  "Bilaspur", "Goa", "Panaji", "Puducherry",
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const STATE_SET = new Set(INDIAN_STATES.map(norm));
const DISTRICT_MAP = new Map(KNOWN_DISTRICTS.map((d) => [norm(d), d]));

/** Some districts are known by more than one name — collapse to a single label. */
const DISTRICT_ALIASES: Record<string, string> = {
  bengaluru: "Bangalore",
  mysuru: "Mysore",
  gurugram: "Gurgaon",
  kochi: "Ernakulam",
  ooty: "Nilgiris",
  "new delhi": "Delhi",
};

export const canonicalDistrict = (value: string): string => {
  const key = norm(value);
  const alias = DISTRICT_ALIASES[key];
  if (alias) return alias;
  return DISTRICT_MAP.get(key) || value.trim();
};

/**
 * Extracts the district from a free-text address.
 * "45, SM street, Kovaipudhur, Coimbatore, Tamil Nadu, 641010" -> "Coimbatore"
 */
export const extractDistrict = (address?: string | null): string | null => {
  if (!address) return null;

  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    // drop pincodes and country
    .filter((p) => !/^\d{5,6}$/.test(p) && norm(p) !== "india");

  if (!parts.length) return null;

  // 1) A part that exactly matches a known district (search from the end —
  //    localities come first, district last).
  for (let i = parts.length - 1; i >= 0; i--) {
    const cleaned = parts[i].replace(/\b(district|dist\.?|taluk|tq\.?)\b/gi, "").trim();
    if (DISTRICT_MAP.has(norm(cleaned)) || DISTRICT_ALIASES[norm(cleaned)]) {
      return canonicalDistrict(cleaned);
    }
  }

  // 2) A known district appearing inside a longer part ("Coimbatore - 641010")
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = norm(parts[i]);
    for (const [key, label] of DISTRICT_MAP) {
      if (p.includes(key)) return canonicalDistrict(label);
    }
  }

  // 3) Fallback — last part that isn't a state name.
  const nonState = parts.filter((p) => !STATE_SET.has(norm(p)));
  const fallback = nonState[nonState.length - 1] || parts[parts.length - 1];
  return fallback ? fallback.trim() : null;
};

/** State portion of an address, when present. */
export const extractState = (address?: string | null): string | null => {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (STATE_SET.has(norm(parts[i]))) return parts[i];
  }
  return null;
};

/** Unique, sorted district list from a set of addresses. */
export const districtsFromAddresses = (addresses: (string | null | undefined)[]): string[] => {
  const set = new Set<string>();
  addresses.forEach((a) => {
    const d = extractDistrict(a);
    if (d) set.add(d);
  });
  return [...set].sort((a, b) => a.localeCompare(b));
};

/**
 * Reverse-geocodes coordinates into a district using the free OSM Nominatim API.
 * Returns null on any failure — callers should degrade gracefully.
 */
export const reverseGeocodeDistrict = async (
  lat: number,
  lng: number,
): Promise<{ district: string | null; state: string | null }> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return { district: null, state: null };
    const json = await res.json();
    const a = json?.address || {};
    const raw =
      a.state_district || a.county || a.district || a.city || a.town || a.village || null;
    return {
      district: raw ? canonicalDistrict(String(raw).replace(/\bdistrict\b/i, "").trim()) : null,
      state: a.state || null,
    };
  } catch {
    return { district: null, state: null };
  }
};
