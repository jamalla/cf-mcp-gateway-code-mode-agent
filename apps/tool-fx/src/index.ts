import { Hono } from "hono";
import { buildCurrenciesUrl, buildLatestRatesUrl } from "./lib/upstream";

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
        message: "Upstream FX API request failed.",
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
      source: "frankfurter",
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
    service: "tool-fx",
    definition: "FX rates tool backed by Frankfurter.",
    goal: "Provide exchange rates and currencies for price normalization.",
    links: {
      health: `${baseUrl}/health`,
      rates: `${baseUrl}/rates`,
      ratesExample: `${baseUrl}/rates?base=USD&symbols=MYR,SAR,EUR`,
      currencies: `${baseUrl}/currencies`
    }
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "tool-fx",
    timestamp: new Date().toISOString()
  });
});

app.get("/rates", async (c) => {
  const base = c.req.query("base");
  const symbols = c.req.query("symbols");

  const url = buildLatestRatesUrl({ base, symbols });

  return passThroughJson(url);
});

app.get("/currencies", async () => {
  const url = buildCurrenciesUrl();

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
  console.error("tool-fx-error", err);

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
