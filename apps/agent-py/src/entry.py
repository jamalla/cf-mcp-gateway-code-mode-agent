from workers import WorkerEntrypoint, Response
import json


def json_response(payload, status=200):
    return Response.new(
        json.dumps(payload),
        headers={"Content-Type": "application/json; charset=utf-8"},
        status=status,
    )


def pick_tools(prompt: str, tool_specs: list[dict]) -> list[str]:
    prompt_lower = prompt.lower()
    selected: list[str] = []

    for tool in tool_specs:
        key = tool.get("key", "")
        if key == "products":
            if any(
                word in prompt_lower
                for word in [
                    "product",
                    "products",
                    "phone",
                    "smartphone",
                    "laptop",
                    "category",
                    "catalog",
                ]
            ):
                selected.append("products")
        elif key == "fx":
            if any(
                word in prompt_lower
                for word in ["currency", "exchange", "convert", "myr", "sar", "usd", "eur", "price in"]
            ):
                selected.append("fx")
        elif key == "cart-intel":
            if any(word in prompt_lower for word in ["rank", "best", "recommend", "shortlist", "analyze", "compare"]):
                selected.append("cart-intel")

    if not selected:
        available = [tool.get("key") for tool in tool_specs if tool.get("key")]
        selected = available[:2]

    return selected


def build_typescript_code(prompt: str, selected_tools: list[str]) -> str:
    uses_products = "products" in selected_tools
    uses_fx = "fx" in selected_tools
    uses_cart = "cart-intel" in selected_tools

    lines = [
        'type ToolSpec = { key: string; specUrl: string; };',
        "",
        "type Product = {",
        "  id: string | number;",
        "  title: string;",
        "  category?: string;",
        "  price: number;",
        "  currency?: string;",
        "  rating?: number;",
        "  stock?: number;",
        "  brand?: string;",
        "  thumbnail?: string;",
        "};",
        "",
        "type RunInput = {",
        "  prompt: string;",
        "  gatewaySpecs: ToolSpec[];",
        "  toolBaseUrls: Record<string, string>;",
        "};",
        "",
        "export async function runTask(input: RunInput) {",
        "  const result: Record<string, unknown> = {",
        "    prompt: input.prompt,",
        "    selectedTools: [],",
        "  };",
        "",
        "  const selectedTools: string[] = [];",
    ]

    if uses_products:
        lines.extend(
            [
                '  selectedTools.push("products");',
                '  const productsUrl = `${input.toolBaseUrls["products"]}/products?limit=8`; ',
                "  const productsRes = await fetch(productsUrl);",
                "  const productsJson = await productsRes.json();",
                "  result.products = productsJson;",
                "",
            ]
        )

    if uses_fx:
        lines.extend(
            [
                '  selectedTools.push("fx");',
                '  const ratesUrl = `${input.toolBaseUrls["fx"]}/rates?base=USD&symbols=MYR,SAR,EUR`; ',
                "  const ratesRes = await fetch(ratesUrl);",
                "  const ratesJson = await ratesRes.json();",
                "  result.fx = ratesJson;",
                "",
            ]
        )

    if uses_cart:
        lines.extend(
            [
                '  selectedTools.push("cart-intel");',
                "  const candidateProducts: Product[] = (result.products as any)?.data?.products ?? [];",
                "  const rateMap = (result.fx as any)?.data?.rates ?? {};",
                '  const analyzeUrl = `${input.toolBaseUrls["cart-intel"]}/analyze`;',
                "  const analyzeRes = await fetch(analyzeUrl, {",
                '    method: "POST",',
                '    headers: { "Content-Type": "application/json" },',
                "    body: JSON.stringify({",
                '      targetCurrency: "MYR",',
                "      rates: rateMap,",
                "      preferences: {",
                "        prioritizeRating: true,",
                "        prioritizeLowerPrice: true,",
                "        inStockOnly: true,",
                '        preferredCategory: "smartphones"',
                "      },",
                "      products: candidateProducts",
                "    })",
                "  });",
                "  const analyzeJson = await analyzeRes.json();",
                "  result.analysis = analyzeJson;",
                "",
            ]
        )

    lines.extend(
        [
            "  result.selectedTools = selectedTools;",
            "  return result;",
            "}",
            "",
            f"// Original prompt: {prompt}",
        ]
    )

    return "\n".join(lines)


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        path = request.url.pathname

        if request.method == "GET" and path == "/health":
            return json_response(
                {
                    "ok": True,
                    "service": self.env.AGENT_NAME,
                    "runtime": "cloudflare-python-worker",
                    "mode": "contract-first",
                }
            )

        if request.method == "POST" and path == "/plan":
            try:
                body = await request.json()
            except Exception:
                return json_response(
                    {
                        "ok": False,
                        "error": "INVALID_JSON",
                        "message": "Request body must be valid JSON.",
                    },
                    400,
                )

            prompt = body.get("prompt", "").strip()
            tool_specs = body.get("toolSpecs", [])
            mode = body.get("mode", "code-mode")

            if not prompt:
                return json_response(
                    {
                        "ok": False,
                        "error": "VALIDATION_ERROR",
                        "message": "Field 'prompt' is required.",
                    },
                    400,
                )

            if not isinstance(tool_specs, list):
                return json_response(
                    {
                        "ok": False,
                        "error": "VALIDATION_ERROR",
                        "message": "Field 'toolSpecs' must be an array.",
                    },
                    400,
                )

            selected_tools = pick_tools(prompt, tool_specs)
            ts_code = build_typescript_code(prompt, selected_tools)

            return json_response(
                {
                    "ok": True,
                    "agent": self.env.AGENT_NAME,
                    "model": self.env.DEFAULT_MODEL,
                    "mode": mode,
                    "input": {
                        "prompt": prompt,
                        "toolSpecCount": len(tool_specs),
                    },
                    "plan": {
                        "selectedTools": selected_tools,
                        "steps": [
                            "Inspect tool specs from MCP gateway response.",
                            "Select relevant tools for the prompt.",
                            "Generate TypeScript execution code.",
                            "Pass generated code to sandbox runner.",
                            "Let sandbox runner call tools directly.",
                        ],
                    },
                    "artifacts": {
                        "language": "typescript",
                        "generatedCode": ts_code,
                    },
                }
            )

        return json_response(
            {
                "ok": False,
                "error": "NOT_FOUND",
                "message": "Route not found.",
            },
            404,
        )
