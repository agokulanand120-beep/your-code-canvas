import type { ModelCategory, ModelDoc } from "./types";

/**
 * Maps a `model_docs` database row into the same shape the static curated
 * model files use, so a model hub page can be seeded straight from SQL.
 */
export function modelDocFromRow(row: any): ModelDoc {
  const arr = (v: any): any[] => (Array.isArray(v) ? v : []);

  const rows = (v: any): [string, string][] => {
    if (!Array.isArray(v)) return [];

    return v
      .filter((r: any) => Array.isArray(r) && r.length >= 2)
      .map((r: any) => [String(r[0]), String(r[1])] as [string, string]);
  };

  const features = arr(row.features)
    .map((f: any) => ({
      group: String(f?.group || ""),
      items: arr(f?.items).map((i: any) => String(i)),
    }))
    .filter((f: any) => f.group || f.items.length);

  const specs = arr(row.specs)
    .map((g: any) => ({
      group: String(g?.group || ""),
      rows: rows(g?.rows),
    }))
    .filter((g: any) => g.group || g.rows.length);

  const mileage =
    row.mileage && typeof row.mileage === "object"
      ? {
          notes: arr(row.mileage.notes).map((n: any) => String(n)),
          rows: rows(row.mileage.rows),
        }
      : {
          notes: [],
          rows: [],
        };

  return {
    category: (row.category || "cars") as ModelCategory,
    brand: row.brand || "",
    model: row.model || "",

    segment: row.segment || "",
    bodyType: row.body_type || "",

    images: (
      typeof row.images === "string"
        ? row.images.split(",")
        : Array.isArray(row.images)
          ? row.images
          : []
    )
      .map((s: any) => String(s).trim())
      .filter(Boolean),

    overview: arr(row.overview).map((p: any) => String(p)),

    quickSpecs:
      row.quick_specs && typeof row.quick_specs === "object"
        ? row.quick_specs
        : {},

    newPrice: row.new_price || undefined,

    specs,

    mileage,

    features,

    safety: arr(row.safety).map((s: any) => String(s)),

    safetyRating: row.safety_rating || undefined,

    variants: arr(row.variants)
      .map((v: any) => ({
        name: String(v?.name || ""),
        engine: v?.engine ? String(v.engine) : undefined,
        fuel: v?.fuel ? String(v.fuel) : undefined,
        transmission: v?.transmission
          ? String(v.transmission)
          : undefined,
        highlights: v?.highlights
          ? String(v.highlights)
          : undefined,
      }))
      .filter((v: any) => v.name),

    variantAdvice: row.variant_advice || undefined,

    colours: arr(row.colours).map((c: any) => String(c)),

    generations: arr(row.generations)
      .map((g: any) => ({
        name: String(g?.name || ""),
        years: String(g?.years || ""),
        notes: String(g?.notes || ""),
      }))
      .filter((g: any) => g.name),

    yearChanges: rows(row.year_changes),

    pros: arr(row.pros).map((p: any) => String(p)),

    cons: arr(row.cons).map((c: any) => String(c)),

    ownership: arr(row.ownership).map((o: any) => String(o)),

    maintenanceVerdict:
      row.maintenance_verdict || undefined,

    buyingChecks: arr(row.buying_checks).map((c: any) => String(c)),

    goodFor: arr(row.good_for).map((g: any) => String(g)),

    considerAlternatives:
      row.consider_alternatives || undefined,

    alternatives: arr(row.alternatives)
      .map((a: any) => ({
        brand: String(a?.brand || ""),
        model: String(a?.model || ""),
      }))
      .filter((a: any) => a.brand && a.model),

    faqs: arr(row.faqs)
      .map((f: any) => ({
        q: String(f?.q || ""),
        a: String(f?.a || ""),
      }))
      .filter((f: any) => f.q && f.a),
  };
}
