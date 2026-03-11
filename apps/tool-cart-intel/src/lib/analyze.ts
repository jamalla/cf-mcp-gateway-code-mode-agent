import type { AnalyzeRequest, ProductInput } from "./schema";

type RankedProduct = ProductInput & {
  normalizedPrice: number;
  normalizedCurrency: string;
  score: number;
  reasons: string[];
};

const normalizePrice = (
  price: number,
  sourceCurrency: string,
  targetCurrency: string,
  rates: Record<string, number>
): number => {
  const src = sourceCurrency.toUpperCase();
  const target = targetCurrency.toUpperCase();

  if (src === target) {
    return price;
  }

  if (src !== "USD") {
    return price;
  }

  const rate = rates[target];

  if (!rate) {
    return price;
  }

  return Number((price * rate).toFixed(2));
};

const scoreProduct = (
  product: ProductInput,
  normalizedPrice: number,
  request: AnalyzeRequest
) => {
  const reasons: string[] = [];
  let score = 0;

  const prefs = request.preferences ?? {};

  if (prefs.inStockOnly && (product.stock ?? 0) <= 0) {
    score -= 1000;
    reasons.push("Penalized: out of stock");
  } else if ((product.stock ?? 0) > 0) {
    score += 15;
    reasons.push("Boosted: in stock");
  }

  if (prefs.prioritizeRating) {
    const ratingBoost = (product.rating ?? 0) * 20;
    score += ratingBoost;
    reasons.push(`Boosted by rating: ${product.rating ?? 0}`);
  }

  if (prefs.prioritizeLowerPrice) {
    const priceBoost = Math.max(0, 100 - normalizedPrice);
    score += priceBoost;
    reasons.push(`Boosted by price competitiveness: ${normalizedPrice}`);
  }

  if (
    prefs.preferredCategory &&
    product.category.toLowerCase() === prefs.preferredCategory.toLowerCase()
  ) {
    score += 25;
    reasons.push(`Boosted: preferred category '${prefs.preferredCategory}'`);
  }

  return {
    score: Number(score.toFixed(2)),
    reasons
  };
};

export const analyzeProducts = (request: AnalyzeRequest) => {
  const ranked: RankedProduct[] = request.products.map((product) => {
    const normalizedPrice = normalizePrice(
      product.price,
      product.currency,
      request.targetCurrency,
      request.rates
    );

    const { score, reasons } = scoreProduct(product, normalizedPrice, request);

    return {
      ...product,
      normalizedPrice,
      normalizedCurrency: request.targetCurrency.toUpperCase(),
      score,
      reasons
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  return {
    ok: true,
    targetCurrency: request.targetCurrency.toUpperCase(),
    totalCandidates: ranked.length,
    shortlist: ranked.slice(0, 5),
    ranked
  };
};
