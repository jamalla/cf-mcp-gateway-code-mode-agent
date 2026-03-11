import type { ExecuteRequest } from "./schema";
import { getJson, postJson, type FetchFn } from "./http";

type ServiceBinding = {
  fetch: FetchFn;
};

export type ToolServiceBindings = {
  PRODUCTS_SERVICE?: ServiceBinding;
  FX_SERVICE?: ServiceBinding;
  CART_INTEL_SERVICE?: ServiceBinding;
};

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
  payload: ExecuteRequest,
  bindings?: ToolServiceBindings
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
    const productsUrl = `${base}/products?limit=8`;
    const productsFetchFn = getToolFetchFn("products", productsUrl, bindings);
    productsData = await getJson(getFetchUrl(productsUrl), productsFetchFn);
    toolResults.products = productsData;
  }

  if (payload.selectedTools.includes("fx")) {
    const base = payload.toolBaseUrls.fx;
    if (!base) throw new Error("Missing toolBaseUrls.fx");

    trace.push("Calling fx tool");
    const fxUrl = `${base}/rates?base=USD&symbols=MYR,SAR,EUR`;
    const fxFetchFn = getToolFetchFn("fx", fxUrl, bindings);
    fxData = await getJson(getFetchUrl(fxUrl), fxFetchFn);
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

    const analyzeUrl = `${base}/analyze`;
    const cartFetchFn = getToolFetchFn("cart-intel", analyzeUrl, bindings);

    finalResult = await postJson(getFetchUrl(analyzeUrl), {
      targetCurrency: "MYR",
      rates,
      preferences: {
        prioritizeRating: true,
        prioritizeLowerPrice: true,
        inStockOnly: true,
        preferredCategory: "smartphones"
      },
      products: candidateProducts
    }, cartFetchFn);

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

function getFetchUrl(rawUrl: string): string {
  if (!rawUrl.includes("workers.dev")) return rawUrl;

  const parsed = new URL(rawUrl);
  return `https://tool.internal${parsed.pathname}${parsed.search}`;
}

function getToolFetchFn(
  tool: "products" | "fx" | "cart-intel",
  rawUrl: string,
  bindings?: ToolServiceBindings
): FetchFn {
  if (!rawUrl.includes("workers.dev") || !bindings) return fetch;

  if (tool === "products" && bindings.PRODUCTS_SERVICE) {
    return bindings.PRODUCTS_SERVICE.fetch.bind(bindings.PRODUCTS_SERVICE);
  }

  if (tool === "fx" && bindings.FX_SERVICE) {
    return bindings.FX_SERVICE.fetch.bind(bindings.FX_SERVICE);
  }

  if (tool === "cart-intel" && bindings.CART_INTEL_SERVICE) {
    return bindings.CART_INTEL_SERVICE.fetch.bind(bindings.CART_INTEL_SERVICE);
  }

  return fetch;
}
