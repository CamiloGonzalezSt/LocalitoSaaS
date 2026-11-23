import type { Product } from "@localito/shared";

/**
 * Local matching for Venta Rápida with large catalogs.
 *
 * Sending the whole catalog to the vision model does not scale: with ~400
 * products the request needs ~17k tokens and Groq's per-minute token limit
 * rejects it. Instead the model only describes what it sees (brand, name,
 * flavour, size) and this module finds the product in the tenant's catalog.
 */

export type ObservedQuickSaleItem = {
  observedLabel?: unknown;
  brand?: unknown;
  variant?: unknown;
  size?: unknown;
  quantity?: unknown;
  quantityUncertain?: unknown;
  quantityNote?: unknown;
  confidence?: unknown;
};

export type QuickSaleMatchScore = { product: Product; score: number; sizeMismatch: boolean };

type IndexedProduct = { product: Product; tokens: Set<string>; sizes: Set<string>; isPack: boolean };

export type QuickSaleCatalogIndex = { entries: IndexedProduct[]; idf: Map<string, number>; maxIdf: number };

const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "con", "en", "y", "para", "al", "a", "un", "una", "unid", "unidad", "unidades", "x"]);
const PACK_WORDS = /\b(pack|packs|caja|sixpack|tripack|bipack|six pack)\b/;
const SIZE_PATTERN = /(\d+(?:[.,]\d+)?)\s*(kilos?|kg|gramos?|grs?|g|litros?|lts?|lt|l|ml|cc|cm3)(?![a-z])/g;

function baseText(value: unknown) {
  return typeof value === "string"
    ? value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("es").replace(/['’`´]/g, "")
    : "";
}

function canonicalSize(amount: string, unit: string) {
  const value = Number(amount.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  if (/^(kilos?|kg)$/.test(unit)) return `g:${Math.round(value * 1000)}`;
  if (/^(gramos?|grs?|g)$/.test(unit)) return `g:${Math.round(value)}`;
  if (/^(litros?|lts?|lt|l)$/.test(unit)) return `ml:${Math.round(value * 1000)}`;
  return `ml:${Math.round(value)}`;
}

function stem(token: string) {
  return token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token;
}

export function describeText(...parts: unknown[]) {
  // "Sin azúcar" and "Zero" name the same versions on Chilean packaging.
  let text = parts.map(baseText).filter(Boolean).join(" ").replace(/\bsin azucar\b/g, "zero");
  const sizes = new Set<string>();
  text = text.replace(SIZE_PATTERN, (_match, amount: string, unit: string) => {
    const size = canonicalSize(amount, unit);
    if (size) sizes.add(size);
    return " ";
  });
  const isPack = PACK_WORDS.test(text) || /\b\d+\s*un\b/.test(text);
  const tokens = new Set(
    text
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((token) => token && !STOPWORDS.has(token) && (token.length > 1 || /\d/.test(token)))
      .map(stem)
  );
  return { tokens, sizes, isPack };
}

export function buildQuickSaleCatalogIndex(products: Product[]): QuickSaleCatalogIndex {
  const entries = products
    .filter((product) => product.active)
    .map((product) => ({ product, ...describeText(product.brand, product.name, product.variant) }));
  const documentFrequency = new Map<string, number>();
  for (const entry of entries) for (const token of entry.tokens) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  const total = Math.max(1, entries.length);
  const idf = new Map([...documentFrequency].map(([token, count]) => [token, Math.log(1 + total / count)]));
  return { entries, idf, maxIdf: Math.log(1 + total) };
}

function weight(index: QuickSaleCatalogIndex, token: string) {
  return index.idf.get(token) ?? index.maxIdf;
}

/** Ranks catalog products for one observed item; higher is better (roughly 0–1.5). */
export function rankQuickSaleMatches(observed: ObservedQuickSaleItem, index: QuickSaleCatalogIndex, limit = 3): QuickSaleMatchScore[] {
  const seen = describeText(observed.brand, observed.observedLabel, observed.variant, observed.size);
  const brand = describeText(observed.brand).tokens;
  // Words of the product name itself ("Ramitas", "Spaghetti"), without the brand.
  const label = [...describeText(observed.observedLabel).tokens].filter((token) => !brand.has(token));
  if (!seen.tokens.size) return [];
  const seenWeight = [...seen.tokens].reduce((sum, token) => sum + weight(index, token) ** 2, 0);

  const scored = index.entries.map(({ product, tokens, sizes, isPack }) => {
    let shared = 0;
    for (const token of seen.tokens) if (tokens.has(token)) shared += weight(index, token) ** 2;
    const productWeight = [...tokens].reduce((sum, token) => sum + weight(index, token) ** 2, 0);
    let score = shared / Math.sqrt(Math.max(seenWeight * productWeight, 1e-9));

    if (brand.size) {
      const brandHits = [...brand].filter((token) => tokens.has(token)).length;
      score += brandHits === brand.size ? 0.25 : brandHits ? 0.1 : -0.3;
    }
    // A product that shares brand, flavour and size but none of the name words is another product
    // (Cheetos Queso 110 g is not Ramitas Queso 110 g).
    if (label.length && !label.some((token) => tokens.has(token))) score -= 0.3;
    const sizeMismatch = Boolean(seen.sizes.size && sizes.size && ![...seen.sizes].some((size) => sizes.has(size)));
    if (seen.sizes.size && sizes.size) score += sizeMismatch ? -0.35 : 0.2;
    if (isPack !== seen.isPack) score -= isPack ? 0.2 : 0.1;
    return { product, score, sizeMismatch };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit);
}

function clampConfidence(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
}

/**
 * Converts the model's observations into the raw shape `normalizeQuickSaleAnalysis`
 * expects, choosing products from the catalog locally.
 */
export function matchObservedQuickSaleItems(rawItems: unknown, products: Product[]) {
  const index = buildQuickSaleCatalogIndex(products);
  const items = Array.isArray(rawItems) ? rawItems.slice(0, 30) : [];
  return items.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const observed = entry as ObservedQuickSaleItem;
    const ranked = rankQuickSaleMatches(observed, index);
    const [best, second] = ranked;
    const margin = best ? best.score - (second?.score ?? 0) : 0;
    const visionConfidence = clampConfidence(observed.confidence);
    const label = [observed.brand, observed.observedLabel, observed.variant, observed.size]
      .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
      .filter((part, position, all) => !all.slice(0, position).some((previous) => baseText(previous).includes(baseText(part))))
      .join(" ");

    let matchedProductId: string | null = null;
    let confidence = Math.min(visionConfidence, 0.4);
    if (best?.sizeMismatch) {
      // Never pick a different size on the cashier's behalf: show the options instead.
      confidence = Math.min(visionConfidence, 0.6);
    } else if (best && best.score >= 0.8 && margin >= 0.12) {
      matchedProductId = best.product.id;
      confidence = Math.min(visionConfidence, 0.95);
    } else if (best && best.score >= 0.55) {
      matchedProductId = best.product.id;
      confidence = Math.min(visionConfidence, 0.72);
    } else if (best && best.score >= 0.35) {
      confidence = Math.min(visionConfidence, 0.6);
    }

    return [{
      observedLabel: label || observed.observedLabel,
      matchedProductId,
      candidateProductIds: ranked.filter((entry) => entry.score >= 0.35).map((entry) => entry.product.id),
      quantity: observed.quantity,
      quantityUncertain: observed.quantityUncertain,
      quantityNote: observed.quantityNote,
      confidence
    }];
  });
}
