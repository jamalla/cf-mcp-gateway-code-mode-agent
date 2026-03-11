import { Hono } from "hono";
import {
  buildCategoriesUrl,
  buildProductsByCategoryUrl,
  buildProductsUrl
} from "./lib/upstream";

type Bindings = Record<string, never>;

const app = new Hono<{ Bindings: Bindings }>();

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
};

const passThroughJson = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    const bodyText = await response.text();

    return new Response(
      JSON.stringify({
        ok: false,
        error: "UPSTREAM_ERROR",
        upstreamStatus: response.status,
        message: "Upstream product API request failed.",
        upstreamBody: bodyText
      }),
      {
        status: 502,
        headers: jsonHeaders
      }
    );
  }

  const data = await response.json();

  return new Response(
    JSON.stringify({
      ok: true,
      source: "dummyjson",
      data
    }),
    {
      status: 200,
      headers: jsonHeaders
    }
  );
};

app.get("/", (c) => {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    ok: true,
    service: "tool-products",
    definition: "Product catalog tool backed by DummyJSON.",
    goal: "Provide products, categories, and category views for agent workflows.",
    links: {
      health: `${baseUrl}/health`,
      products: `${baseUrl}/products`,
      categories: `${baseUrl}/products/categories`,
      byCategory: `${baseUrl}/products/category/smartphones`
    }
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "tool-products",
    timestamp: new Date().toISOString()
  });
});

app.get("/products", async (c) => {
  const limit = c.req.query("limit");
  const skip = c.req.query("skip");
  const sortBy = c.req.query("sortBy");
  const order = c.req.query("order");
  const q = c.req.query("q");

  const url = buildProductsUrl({ limit, skip, sortBy, order, q });

  return passThroughJson(url);
});

app.get("/products/categories", async () => {
  const url = buildCategoriesUrl();

  return passThroughJson(url);
});

app.get("/products/category/:slug", async (c) => {
  const slug = c.req.param("slug");
  const limit = c.req.query("limit");
  const skip = c.req.query("skip");
  const sortBy = c.req.query("sortBy");
  const order = c.req.query("order");

  const url = buildProductsByCategoryUrl(slug, {
    limit,
    skip,
    sortBy,
    order
  });

  return passThroughJson(url);
});

app.notFound((c) => {
  return c.json(
    {
      ok: false,
      error: "NOT_FOUND",
      message: "Route not found."
    },
    404
  );
});

app.onError((err, c) => {
  console.error("tool-products-error", err);

  return c.json(
    {
      ok: false,
      error: "INTERNAL_ERROR",
      message: "Unexpected tool error."
    },
    500
  );
});

export default app;
