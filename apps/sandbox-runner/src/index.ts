import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { ExecuteRequestSchema } from "./lib/schema";
import { runMockExecution } from "./lib/mock-executor";

type Bindings = {
  EXECUTOR_MODE: string;
  PRODUCTS_SERVICE?: {
    fetch: typeof fetch;
  };
  FX_SERVICE?: {
    fetch: typeof fetch;
  };
  CART_INTEL_SERVICE?: {
    fetch: typeof fetch;
  };
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
);

app.get("/", (c) => {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    ok: true,
    service: "sandbox-runner",
    definition: "Contract-first execution sandbox for code-mode agent plans.",
    goal: "Receive a plan from the agent (selected tools + generated TypeScript artifact), call each tool via Cloudflare service bindings, and return a structured execution trace and result.",
    description: "The sandbox never runs arbitrary code. It interprets the 'selectedTools' list deterministically, calling tool-products, tool-fx, and tool-cart-intel via service bindings (PRODUCTS_SERVICE, FX_SERVICE, CART_INTEL_SERVICE). This avoids cross-workers.dev fetch restrictions and keeps execution safe and observable.",
    flowPosition: "Step 3 of 3 — final execution layer, called by agent-web after agent-py returns a plan.",
    executorMode: c.env.EXECUTOR_MODE ?? "mock",
    links: {
      health: `${baseUrl}/health`,
      execute: `${baseUrl}/execute (POST)`
    }
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "sandbox-runner",
    executorMode: c.env.EXECUTOR_MODE ?? "mock",
    timestamp: new Date().toISOString()
  });
});

app.post(
  "/execute",
  zValidator("json", ExecuteRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          message: "Invalid execute payload.",
          details: result.error.flatten()
        },
        400
      );
    }
  }),
  async (c) => {
    const payload = c.req.valid("json");
    const executorMode = c.env.EXECUTOR_MODE ?? "mock";

    if (executorMode !== "mock") {
      return c.json(
        {
          ok: false,
          error: "EXECUTOR_NOT_IMPLEMENTED",
          message: `Executor mode '${executorMode}' is not implemented yet.`
        },
        501
      );
    }

    try {
      const result = await runMockExecution(payload, c.env);
      return c.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected execution error";

      return c.json(
        {
          ok: false,
          error: "EXECUTION_FAILED",
          message
        },
        500
      );
    }
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
  console.error("sandbox-runner-error", err);

  return c.json(
    {
      ok: false,
      error: "INTERNAL_ERROR",
      message: "Unexpected sandbox runner error."
    },
    500
  );
});

export default app;
