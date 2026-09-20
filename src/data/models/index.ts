import { slugify } from "@/lib/seoSlug";
import type { ModelCategory, ModelDoc } from "./types";
import { marutiHyundaiModels } from "./maruti-hyundai";
import { tataMahindraModels } from "./tata-mahindra";
import { otherCarModels } from "./other-cars";
import { bikeModels } from "./bikes";

export * from "./types";

export const ALL_MODELS: ModelDoc[] = [
  ...marutiHyundaiModels,
  ...tataMahindraModels,
  ...otherCarModels,
  ...bikeModels,
];

export const modelKey = (category: ModelCategory, brand: string, model: string) =>
  `${category}/${slugify(brand)}/${slugify(model)}`;

const REGISTRY = new Map<string, ModelDoc>(
  ALL_MODELS.map((m) => [modelKey(m.category, m.brand, m.model), m]),
);

/** Path for a model hub page, e.g. /cars/maruti-suzuki/swift */
export const modelPath = (m: Pick<ModelDoc, "category" | "brand" | "model">) =>
  `/${m.category}/${slugify(m.brand)}/${slugify(m.model)}`;

export const getModel = (category: string, brandSlug: string, modelSlug: string) =>
  REGISTRY.get(`${category}/${brandSlug}/${modelSlug}`);

/** Finds the hub for a live listing's brand/model, if one exists. */
export function findModelDoc(brand?: string | null, model?: string | null): ModelDoc | undefined {
  if (!brand || !model) return undefined;
  const b = slugify(brand);
  const m = slugify(model);
  return (
    REGISTRY.get(`cars/${b}/${m}`) ||
    REGISTRY.get(`bikes/${b}/${m}`) ||
    REGISTRY.get(`commercial/${b}/${m}`)
  );
}

export const modelsByBrand = (brand: string) =>
  ALL_MODELS.filter((m) => slugify(m.brand) === slugify(brand));

export const modelHubPaths = () => ALL_MODELS.map(modelPath);
