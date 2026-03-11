import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { analyzeProducts } from "./lib/analyze";
import { AnalyzeRequestSchema } from "./lib/schema";

type Bindings = Record<string, never>;

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    ok: true,
    service: "tool-cart-intel",
    definition: "Internal cart intelligence ranking tool.",
    goal: "Normalize and rank product candidates into a shortlist.",
    links: {
      health: `${baseUrl}/health`,
      analyze: `${baseUrl}/analyze`
    }
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "tool-cart-intel",
    timestamp: new Date().toISOString()
  });
});

app.post(
  "/analyze",
  zValidator("json", AnalyzeRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          message: "Invalid analyze request payload.",
          details: result.error.flatten()
        },
        400
      );
    }
  }),
  async (c) => {
    const payload = c.req.valid("json");
    const result = analyzeProducts(payload);

    return c.json(result);
  }
);

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
  console.error("tool-cart-intel-error", err);

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
