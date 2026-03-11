# agent-py

**Cloudflare Python Worker · Step 2 of 6 in the project flow**

Live URL: `https://cf-agent-py.to-jamz.workers.dev`

## What it does

This is the **AI planning layer** of the system. It receives the user's natural language prompt and the list of available tool specs from the gateway, then:

1. Selects which tools are relevant to the prompt (keyword-weighted matching — no LLM call needed for the demo).
2. Generates a TypeScript code artifact that, when run in the sandbox, will call the selected tools in the correct order and combine their results.
3. Returns a structured plan contract so the sandbox runner knows exactly what to execute.

This worker sits between the UI and the execution layer. The UI never calls the tool workers directly — everything must first pass through this planner.

## Sequence position

```
[1] agent-web  ──► mcp-gateway /specs
[2]            ──► agent-py /plan          ◄── you are here
[3]            ──► sandbox-runner /execute
                       ├─► tool-products
                       ├─► tool-fx
                       └─► tool-cart-intel
```

## Why Python?

Demonstrates that Code Mode MCP is language-agnostic. The planning logic could later be swapped for a real LLM call (e.g. OpenAI via the `langchain-openai` dependency already in `pyproject.toml`) without changing the contract shape the rest of the stack depends on.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check, returns runtime info |
| POST | `/plan` | Generate a tool selection plan and TypeScript artifact |
| OPTIONS | `*` | CORS preflight |

### POST `/plan` request body

```json
{
  "prompt": "Find smartphones and show prices in MYR",
  "mode": "code-mode",
  "toolSpecs": [
    { "key": "products", "specUrl": "..." },
    { "key": "fx",       "specUrl": "..." },
    { "key": "cart-intel","specUrl": "..." }
  ]
}
```

### POST `/plan` response

```json
{
  "ok": true,
  "agent": "code-mode-agent-py",
  "mode": "code-mode",
  "input": { "prompt": "...", "toolSpecCount": 3 },
  "plan": {
    "selectedTools": ["products", "fx", "cart-intel"],
    "steps": [
      "Inspect tool specs from MCP gateway response.",
      "Select relevant tools for the prompt.",
      "Generate TypeScript execution code.",
      "Pass generated code to sandbox runner.",
      "Let sandbox runner call tools directly."
    ]
  },
  "artifacts": {
    "language": "typescript",
    "generatedCode": "export async function runTask(input) { ... }"
  }
}
```

## Tool selection logic

| Tool | Selected when prompt contains |
|------|-------------------------------|
| `products` | product, phone, smartphone, laptop, category, catalog |
| `fx` | currency, exchange, convert, MYR, SAR, USD, EUR, "price in" |
| `cart-intel` | rank, best, recommend, shortlist, analyze, compare |

If no keywords match, the first two available tools are selected as a fallback.

## Stack

- Runtime: Cloudflare Python Workers (`python_workers` flag, Pyodide)
- Language: Python 3.12
- Key imports: `workers` (WorkerEntrypoint), `js` (Response)
- Deploy: Wrangler with `compatibility_flags: ["python_workers"]`
- Local dev: blocked on Windows due to pyodide/uv venv path issue — deploy directly to get runtime behaviour
