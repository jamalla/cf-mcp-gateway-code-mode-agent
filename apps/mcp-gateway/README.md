# mcp-gateway

**Cloudflare Worker · Step 1 of 6 in the project flow**

Live URL: `https://cf-mcp-gateway.to-jamz.workers.dev`

## What it does

The MCP gateway is the **entry point for tool discovery**. It stores OpenAPI specifications for every tool worker in the project and exposes them through a single `/specs` endpoint.

When the UI needs to start a run, it calls this service first to learn what tools exist, what they do, and the URL of each tool's full spec. The agent Python worker then uses that spec list to make its planning decision.

Nothing in this worker performs live API calls. It is a pure read-only spec registry.

## Sequence position

```
[1] agent-web  ──► mcp-gateway /specs   ◄── you are here
[2]            ──► agent-py /plan
[3]            ──► sandbox-runner /execute
                       ├─► tool-products
                       ├─► tool-fx
                       └─► tool-cart-intel
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info and link index |
| GET | `/health` | Liveness check |
| GET | `/specs` | List all registered tools with name, version, description, and specUrl |
| GET | `/specs/:toolName` | Full OpenAPI 3.1 specification for a single tool (`products`, `fx`, `cart-intel`) |
| GET | `/servers` | Third-party MCP servers accepted through the registration flow (see `registry/README.md`) |
| GET | `/servers/:id` | Full registry entry for one registered MCP server |

### Example — list tools

```bash
curl https://cf-mcp-gateway.to-jamz.workers.dev/specs
```

```json
{
  "ok": true,
  "count": 3,
  "tools": [
    { "key": "products", "name": "Trending Products Tool", "specUrl": "..." },
    { "key": "fx",       "name": "FX Rates Tool",          "specUrl": "..." },
    { "key": "cart-intel","name": "Cart Intelligence Tool", "specUrl": "..." }
  ]
}
```

### Example — fetch a single spec

```bash
curl https://cf-mcp-gateway.to-jamz.workers.dev/specs/fx
```

Returns the full OpenAPI 3.1 JSON for the FX tool.

## Why Code Mode uses this pattern

In Code Mode the agent **does not receive every OpenAPI definition upfront**. Instead it queries the gateway to discover which tools exist, then asks for only the spec it needs. This keeps the context window small and avoids token waste from ingesting hundreds of endpoint definitions the agent may never use.

## Stack

- Runtime: Cloudflare Workers (TypeScript, Hono)
- Specs stored as static JSON files bundled at deploy time
- CORS enabled for all origins (`GET`, `OPTIONS`)

## Adding a tool spec (issue → PR)

Anyone can open an issue with the **Add Tool OpenAPI Spec** template. The `tool-spec-request`
workflow validates it, closes the issue, and opens a PR adding
`src/specs/<tool-key>.openapi.json`. If the submitter doesn't paste a spec, the PR contains a
**generated mock spec** built from the operations they listed (`METHOD /path - summary`).

Merge the PR to publish it at `/specs/<tool-key>` (it's also listed in `/specs`), or close it to reject.
You don't need to edit any code: `scripts/mcp-registry/build.mjs` bundles every
`src/specs/*.openapi.json` at build time, and `deploy-mcp-gateway.yml` redeploys on merge.
