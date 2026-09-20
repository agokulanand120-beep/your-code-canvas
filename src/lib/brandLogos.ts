import marutiLogo from "@/assets/brands/maruti-suzuki.png";
import mahindraLogo from "@/assets/brands/mahindra.png";
import hondaLogo from "@/assets/brands/honda.png";
import hyundaiLogo from "@/assets/brands/hyundai.png";
import skodaLogo from "@/assets/brands/skoda.png";
import tataLogo from "@/assets/brands/tata.png";
import toyotaLogo from "@/assets/brands/toyota.png";
import kiaLogo from "@/assets/brands/kia.png";
import volkswagenLogo from "@/assets/brands/volkswagen.png";
import renaultLogo from "@/assets/brands/renault.png";
import mgLogo from "@/assets/brands/mg.png";
import nissanLogo from "@/assets/brands/nissan.png";
import fordLogo from "@/assets/brands/ford.png";
import bmwLogo from "@/assets/brands/bmw.png";
import mercedesLogo from "@/assets/brands/mercedes.png";
import audiLogo from "@/assets/brands/audi.png";
import heroMotoLogo from "@/assets/brands/hero-moto.png";
import bajajLogo from "@/assets/brands/bajaj.png";
import royalEnfieldLogo from "@/assets/brands/royal-enfield.png";
import yamahaLogo from "@/assets/brands/yamaha.png";
import ktmLogo from "@/assets/brands/ktm.png";
import suzukiLogo from "@/assets/brands/suzuki.png";
import olaLogo from "@/assets/brands/ola-electric.png";

export interface BrandLogo {
  name: string;
  logo?: string;
  /** Rough segment used for grouping on the All Brands page */
  segment: "popular" | "premium" | "luxury" | "bike" | "other";
}

/** Single source of truth for marketplace brand logos. */
export const popularBrands: BrandLogo[] = [
  { name: "Maruti Suzuki", logo: marutiLogo, segment: "popular" },
  { name: "Mahindra", logo: mahindraLogo, segment: "popular" },
  { name: "Honda", logo: hondaLogo, segment: "popular" },
  { name: "Hyundai", logo: hyundaiLogo, segment: "popular" },
  { name: "Tata", logo: tataLogo, segment: "popular" },
  { name: "Toyota", logo: toyotaLogo, segment: "popular" },
  { name: "Kia", logo: kiaLogo, segment: "popular" },
  { name: "Renault", logo: renaultLogo, segment: "popular" },
  { name: "Nissan", logo: nissanLogo, segment: "popular" },
  { name: "MG", logo: mgLogo, segment: "premium" },
  { name: "Skoda", logo: skodaLogo, segment: "premium" },
  { name: "Volkswagen", logo: volkswagenLogo, segment: "premium" },
  { name: "Ford", logo: fordLogo, segment: "premium" },
  { name: "BMW", logo: bmwLogo, segment: "luxury" },
  { name: "Mercedes-Benz", logo: mercedesLogo, segment: "luxury" },
  { name: "Audi", logo: audiLogo, segment: "luxury" },
  { name: "Jeep", segment: "other" },
  { name: "Citroen", segment: "other" },
  { name: "Isuzu", segment: "other" },
  { name: "Volvo", segment: "luxury" },
  { name: "Jaguar", segment: "luxury" },
  { name: "Land Rover", segment: "luxury" },
  { name: "Lexus", segment: "luxury" },
  { name: "Datsun", segment: "other" },
  { name: "Fiat", segment: "other" },
  { name: "Chevrolet", segment: "other" },
];

/** Two-wheeler brands shown in the Bike Brands section. */
export const bikeBrands: BrandLogo[] = [
  { name: "Hero", logo: heroMotoLogo, segment: "bike" },
  { name: "Honda Bikes", logo: hondaLogo, segment: "bike" },
  { name: "Bajaj", logo: bajajLogo, segment: "bike" },
  { name: "TVS", segment: "bike" },
  { name: "Royal Enfield", logo: royalEnfieldLogo, segment: "bike" },
  { name: "Yamaha", logo: yamahaLogo, segment: "bike" },
  { name: "KTM", logo: ktmLogo, segment: "bike" },
  { name: "Suzuki", logo: suzukiLogo, segment: "bike" },
  { name: "Jawa", segment: "bike" },
  { name: "Ather", segment: "bike" },
  { name: "Ola Electric", logo: olaLogo, segment: "bike" },
];

/**
 * Mixed car + bike strip used by the home page "Explore by Brand" rail.
 * Interleaves the two lists so both vehicle types are visible without scrolling far.
 */
export const mixedBrands: BrandLogo[] = (() => {
  const cars = popularBrands.filter((b) => b.logo);
  const bikes = bikeBrands.filter((b) => b.logo && b.name !== "Honda Bikes");
  const out: BrandLogo[] = [];
  const max = Math.max(cars.length, bikes.length);
  for (let i = 0; i < max; i++) {
    if (cars[i]) out.push(cars[i]);
    if (i % 2 === 0 && bikes[i / 2]) out.push(bikes[i / 2]);
  }
  bikes.slice(Math.ceil(max / 2)).forEach((b) => out.push(b));
  return out.filter((b, i, arr) => arr.findIndex((x) => x.name === b.name) === i);
})();

export const brandInitials = (name: string) =>
  name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();

/** Logo lookup by brand name (case/spacing tolerant). */
export const getBrandLogo = (name?: string | null): string | undefined => {
  if (!name) return undefined;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = norm(name);
  const all = [...popularBrands, ...bikeBrands];
  const hit =
    all.find((b) => norm(b.name) === key) ||
    all.find((b) => norm(b.name).startsWith(key) || key.startsWith(norm(b.name)));
  return hit?.logo;
};
