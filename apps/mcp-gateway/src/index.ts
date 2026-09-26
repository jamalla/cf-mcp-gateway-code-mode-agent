import { Hono } from "hono";
import { cors } from "hono/cors";
import { TOOL_SPECS } from "./lib/spec-index";
import productsSpec from "./specs/products.openapi.json";
import fxSpec from "./specs/fx.openapi.json";
import cartIntelSpec from "./specs/cart-intel.openapi.json";
import registryServers from "./generated/registry.json";
import bundledSpecs from "./generated/specs.json";
import type { RegisteredServer } from "./lib/registry";

type Bindings = Record<string, never>;

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
);

const specMap: Record<string, unknown> = {
  products: productsSpec,
  fx: fxSpec,
  "cart-intel": cartIntelSpec
};

// Specs added later via "Add Tool OpenAPI Spec" PRs are picked up from the
// build-time bundle of src/specs/*.openapi.json; no code change needed.
const toolSpecs = [...TOOL_SPECS];
for (const entry of bundledSpecs as Array<{ key: string; name: string; version: string; description: string; spec: unknown }>) {
  if (specMap[entry.key]) continue;
  specMap[entry.key] = entry.spec;
  toolSpecs.push({
    key: entry.key,
    name: entry.name,
    version: entry.version,
    description: entry.description,
    fileName: `${entry.key}.openapi.json`
  });
}

// Third-party MCP servers accepted via the registration PR flow (registry/*.json).
const servers = registryServers as RegisteredServer[];

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
      cartIntelSpec: `${baseUrl}/specs/cart-intel`,
      servers: `${baseUrl}/servers`
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
    count: toolSpecs.length,
    tools: toolSpecs.map((tool) => ({
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

app.get("/servers", (c) => {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    ok: true,
    count: servers.length,
    servers: servers.map((s) => ({
      id: s.id,
      name: s.name,
      version: s.version,
      description: s.description,
      transport: s.transport,
      auth: s.auth.type,
      tags: s.tags,
      detailUrl: `${baseUrl}/servers/${s.id}`
    }))
  });
});

app.get("/servers/:id", (c) => {
  const id = c.req.param("id");
  const server = servers.find((s) => s.id === id);

  if (!server) {
    return c.json(
      {
        ok: false,
        error: "SERVER_NOT_FOUND",
        message: `No registered MCP server with id '${id}'.`
      },
      404
    );
  }

  return c.json({ ok: true, server });
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
