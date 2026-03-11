import { Hono } from "hono";
import { TOOL_SPECS } from "./lib/spec-index";
import productsSpec from "./specs/products.openapi.json";
import fxSpec from "./specs/fx.openapi.json";
import cartIntelSpec from "./specs/cart-intel.openapi.json";

type Bindings = Record<string, never>;

const app = new Hono<{ Bindings: Bindings }>();

const specMap: Record<string, unknown> = {
  products: productsSpec,
  fx: fxSpec,
  "cart-intel": cartIntelSpec
};

app.get("/", (c) => {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    ok: true,
    service: "mcp-gateway",
    definition: "Tool specification gateway for code-mode agent flows.",
    goal: "Expose tool metadata and OpenAPI specs for agent discovery.",
    links: {
      health: `${baseUrl}/health`,
      specs: `${baseUrl}/specs`,
      productsSpec: `${baseUrl}/specs/products`,
      fxSpec: `${baseUrl}/specs/fx`,
      cartIntelSpec: `${baseUrl}/specs/cart-intel`
    }
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "mcp-gateway",
    timestamp: new Date().toISOString()
  });
});

app.get("/specs", (c) => {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    ok: true,
    count: TOOL_SPECS.length,
    tools: TOOL_SPECS.map((tool) => ({
      key: tool.key,
      name: tool.name,
      version: tool.version,
      description: tool.description,
      specUrl: `${baseUrl}/specs/${tool.key}`
    }))
  });
});

app.get("/specs/:toolName", (c) => {
  const toolName = c.req.param("toolName");
  const spec = specMap[toolName];

  if (!spec) {
    return c.json(
      {
        ok: false,
        error: "SPEC_NOT_FOUND",
        message: `No spec found for tool '${toolName}'.`
      },
      404
    );
  }

  return c.json(spec);
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
  console.error("mcp-gateway-error", err);

  return c.json(
    {
      ok: false,
      error: "INTERNAL_ERROR",
      message: "Unexpected gateway error."
    },
    500
  );
});

export default app;
