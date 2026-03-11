# cf-mcp-gateway-code-mode-agent

A Cloudflare-first demo monorepo for showcasing:

- MCP-style gateway for tool specification discovery
- Remote tool workers exposed through OpenAPI
- AI agent workflow in code mode
- TypeScript sandbox/runtime execution
- CopilotKit-based web UI

## Core Architecture

1. The user sends a prompt from the web UI.
2. The AI agent fetches tool specifications from the MCP Gateway.
3. The AI agent generates task-specific code.
4. The generated code runs in an isolated runtime.
5. The generated code directly calls allowed remote tool APIs.
6. The result is returned to the UI.

## Monorepo Apps

- `apps/mcp-gateway` — serves tool specifications
- `apps/tool-products` — trending products tool
- `apps/tool-fx` — exchange rates tool
- `apps/agent-web` — UI for interacting with the agent

## Planned Apps

- `apps/agent-py` — Python/LangChain worker
- `apps/sandbox-runner` — isolated TypeScript execution runtime

## Initial Goal

Deliver a working end-to-end demo where a user asks for product insights, the system fetches specs, generates code, calls remote tools, and returns a composed answer.