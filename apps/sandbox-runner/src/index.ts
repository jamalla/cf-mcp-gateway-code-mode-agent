import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ExecuteRequestSchema } from "./lib/schema";
import { runMockExecution } from "./lib/mock-executor";

type Bindings = {
  EXECUTOR_MODE: string;
};

const app = new Hono<{ Bindings: Bindings }>();

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
      const result = await runMockExecution(payload);
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
