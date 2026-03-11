# sandbox-runner

**Cloudflare Worker · Step 3 of 6 in the project flow**

Live URL: `https://cf-sandbox-runner.to-jamz.workers.dev`

## What it does

The sandbox runner is the **execution layer**. It receives the plan produced by `agent-py` — which includes the selected tools list and a generated TypeScript code artifact — and executes it in a controlled, deterministic way.

Rather than evaluating arbitrary TypeScript at runtime, it uses a **mock executor** that interprets `selectedTools` directly. For each selected tool it calls the corresponding Cloudflare service binding, collects results, and returns a structured execution trace. This keeps the execution surface predictable and safe while still demonstrating the full contract flow.

## Sequence position

```
[1] agent-web  ──► mcp-gateway /specs
[2]            ──► agent-py /plan
[3]            ──► sandbox-runner /execute  ◄── you are here
                       ├─► tool-products  (service binding: PRODUCTS_SERVICE)
                       ├─► tool-fx        (service binding: FX_SERVICE)
                       └─► tool-cart-intel(service binding: CART_INTEL_SERVICE)
```

## Why service bindings?

Cloudflare Workers cannot call other `workers.dev` subdomains via plain `fetch()` — requests return error 1042. Service bindings resolve this: they wire workers together at the platform layer so calls happen in the same datacenter with zero egress cost and no HTTP round-trip overhead.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check, reports `executorMode` |
| POST | `/execute` | Execute a plan and return tool results + trace |
| OPTIONS | `*` | CORS preflight |

### POST `/execute` request body

```json
{
  "prompt": "Find smartphones and convert to MYR",
  "selectedTools": ["products", "fx", "cart-intel"],
  "generatedCode": "export async function runTask(...) { ... }",
  "toolBaseUrls": {
    "products":   "https://cf-tool-products.to-jamz.workers.dev",
    "fx":         "https://cf-tool-fx.to-jamz.workers.dev",
    "cart-intel": "https://cf-tool-cart-intel.to-jamz.workers.dev"
  }
}
```

> `toolBaseUrls` are used to resolve which service binding to use. When a URL contains `workers.dev` the executor automatically routes via the matching service binding instead of a direct HTTP fetch.

### POST `/execute` response

```json
{
  "ok": true,
  "executionMode": "mock",
  "selectedTools": ["products", "fx", "cart-intel"],
  "trace": [
    "Calling products tool",
    "Calling fx tool",
    "Calling cart-intel tool",
    "Execution completed"
  ],
  "artifacts": { "generatedCode": "..." },
  "toolResults": {
    "products":   { "ok": true, "source": "dummyjson", "data": { ... } },
    "fx":         { "ok": true, "source": "frankfurter", "data": { ... } },
    "cart-intel": { ... }
  },
  "finalResult": { ... }
}
```

## Service bindings configured

| Binding name | Bound to |
|---|---|
| `PRODUCTS_SERVICE` | `cf-tool-products` |
| `FX_SERVICE` | `cf-tool-fx` |
| `CART_INTEL_SERVICE` | `cf-tool-cart-intel` |

## Stack

- Runtime: Cloudflare Workers (TypeScript, Hono, Zod)
- Executor mode: `mock` (set via `EXECUTOR_MODE` environment variable)
- CORS: enabled for all origins
