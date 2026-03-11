# agent-web

**Cloudflare Pages · UI Shell (orchestrates the full 3-step flow)**

Live URL: `https://cf-agent-web-qgi.pages.dev`

## What it does

The web UI is the **user-facing entry point**. It provides a run console where the user types a natural language prompt and triggers the complete end-to-end contract flow:

1. Fetch tool specs from `mcp-gateway`
2. Send the prompt + specs to `agent-py` to get a plan and generated TypeScript artifact
3. Send the plan to `sandbox-runner` to execute it with real tool data

Results are displayed in structured sections: selected tools, plan steps, execution trace, generated TypeScript, and the final JSON output from the tool chain.

The UI uses CopilotKit as a shell component for chat-style interaction, but the core orchestration runs through the `runEndToEnd` API helper — completely independent of any LLM.

## Sequence position

```
[1] agent-web  ──► mcp-gateway /specs     ◄── starts here
[2]            ──► agent-py /plan
[3]            ──► sandbox-runner /execute
                       ├─► tool-products
                       ├─► tool-fx
                       └─► tool-cart-intel
```

## Environment variables

Set in `.env.local` for local dev, or baked in at Pages build time as `NEXT_PUBLIC_*` variables.

| Variable | Default (local) | Production |
|---|---|---|
| `NEXT_PUBLIC_MCP_GATEWAY_URL` | `http://127.0.0.1:8787` | `https://cf-mcp-gateway.to-jamz.workers.dev` |
| `NEXT_PUBLIC_AGENT_PY_URL` | `http://127.0.0.1:8788` | `https://cf-agent-py.to-jamz.workers.dev` |
| `NEXT_PUBLIC_SANDBOX_RUNNER_URL` | `http://127.0.0.1:8789` | `https://cf-sandbox-runner.to-jamz.workers.dev` |
| `NEXT_PUBLIC_PRODUCTS_TOOL_URL` | `http://127.0.0.1:8790` | `https://cf-tool-products.to-jamz.workers.dev` |
| `NEXT_PUBLIC_FX_TOOL_URL` | `http://127.0.0.1:8791` | `https://cf-tool-fx.to-jamz.workers.dev` |
| `NEXT_PUBLIC_CART_INTEL_TOOL_URL` | `http://127.0.0.1:8792` | `https://cf-tool-cart-intel.to-jamz.workers.dev` |

## Key source files

| File | Purpose |
|---|---|
| `src/lib/api.ts` | `fetchToolSpecs`, `generatePlan`, `executePlan`, `runEndToEnd` |
| `src/lib/types.ts` | Shared types: `AgentPlanResponse`, `SandboxExecuteResponse`, `EndToEndRunResult` |
| `src/components/run-console.tsx` | Main run console UI with prompt editor and result panels |
| `src/components/copilot-shell.tsx` | CopilotKit UI wrapper (chat shell only, no backend LLM dependency) |

## What you see in the UI after a run

| Panel | Content |
|---|---|
| Selected Tools | Which tools the agent chose for the prompt |
| Plan Steps | Ordered reasoning steps from `agent-py` |
| Execution Trace | Step-by-step call log from `sandbox-runner` |
| Generated TypeScript | The code artifact produced by `agent-py` |
| Final Result | Raw JSON output of the full tool chain execution |

## Stack

- Framework: Next.js 14 (App Router)
- UI: CopilotKit + Tailwind CSS
- Deploy: Cloudflare Pages via `wrangler pages deploy`
- Build output: `out/` (static export)
