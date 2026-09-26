# MCP Server Registry

Each `*.json` file here is one third-party MCP server served by `apps/mcp-gateway`
at `GET /servers` and `GET /servers/:id`.

**Don't add files by hand.** Open an issue using the
**Register Custom MCP Server** template. The `mcp-registration` workflow validates it,
closes the issue, and opens a PR that adds `registry/<server-id>.json`.

- **Merge the PR** → accepted. `deploy-mcp-gateway.yml` rebuilds and redeploys the gateway.
- **Close the PR** → rejected. Nothing gets added.

To take a server offline later, set `"status": "disabled"` in its file (or delete the file) and merge.

## Entry format

```json
{
  "id": "weather-tools",
  "name": "Weather Tools MCP",
  "description": "Current conditions and 7-day forecasts.",
  "version": "1.0.0",
  "endpoint": "https://weather-mcp.example.com/mcp",
  "transport": "streamable-http",
  "openapiUrl": null,
  "auth": { "type": "none" },
  "docsUrl": "https://github.com/you/weather-mcp",
  "owner": { "github": "you", "contact": "you@example.com" },
  "tags": ["weather"],
  "status": "active",
  "submittedAt": "2026-09-26T00:00:00.000Z",
  "sourceIssue": 12
}
```

Validation rules live in `scripts/mcp-registry/validate.cjs`. The gateway build
(`node scripts/mcp-registry/build.mjs`) runs the same checks, so an invalid file stops the deploy.
