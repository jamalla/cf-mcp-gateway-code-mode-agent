import type { ExecuteRequest } from "./schema";
import { getJson, postJson } from "./http";

type ProductRecord = {
  id: string | number;
  title: string;
  category?: string;
  price: number;
  currency?: string;
  rating?: number;
  stock?: number;
  brand?: string;
  thumbnail?: string;
};

type MockExecutionResult = {
  ok: true;
  executionMode: "mock";
  selectedTools: string[];
  trace: string[];
  artifacts: {
    generatedCode: string;
  };
  toolResults: Record<string, unknown>;
  finalResult: unknown;
};

export async function runMockExecution(
  payload: ExecuteRequest
): Promise<MockExecutionResult> {
  const trace: string[] = [];
  const toolResults: Record<string, unknown> = {};

  let productsData: unknown = null;
  let fxData: unknown = null;
  let finalResult: unknown = null;

  if (payload.selectedTools.includes("products")) {
    const base = payload.toolBaseUrls.products;
    if (!base) throw new Error("Missing toolBaseUrls.products");

    trace.push("Calling products tool");
    productsData = await getJson(`${base}/products?limit=8`);
    toolResults.products = productsData;
  }

  if (payload.selectedTools.includes("fx")) {
    const base = payload.toolBaseUrls.fx;
    if (!base) throw new Error("Missing toolBaseUrls.fx");

    trace.push("Calling fx tool");
    fxData = await getJson(`${base}/rates?base=USD&symbols=MYR,SAR,EUR`);
    toolResults.fx = fxData;
  }

  if (payload.selectedTools.includes("cart-intel")) {
    const base = payload.toolBaseUrls["cart-intel"];
    if (!base) throw new Error("Missing toolBaseUrls.cart-intel");

    trace.push("Calling cart-intel tool");

    const candidateProducts =
      (((productsData as any)?.data?.products ?? []) as ProductRecord[]).map(
        (p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          price: p.price,
          currency: p.currency ?? "USD",
          rating: p.rating ?? 0,
          stock: p.stock ?? 0,
          brand: p.brand,
          thumbnail: p.thumbnail
        })
      );

    const rates = ((fxData as any)?.data?.rates ?? {}) as Record<string, number>;

    finalResult = await postJson(`${base}/analyze`, {
      targetCurrency: "MYR",
      rates,
      preferences: {
        prioritizeRating: true,
        prioritizeLowerPrice: true,
        inStockOnly: true,
        preferredCategory: "smartphones"
      },
      products: candidateProducts
    });

    toolResults["cart-intel"] = finalResult;
  } else {
    finalResult = {
      products: productsData,
      fx: fxData
    };
  }

  trace.push("Execution completed");

  return {
    ok: true,
    executionMode: "mock",
    selectedTools: payload.selectedTools,
    trace,
    artifacts: {
      generatedCode: payload.generatedCode
    },
    toolResults,
    finalResult
  };
}
