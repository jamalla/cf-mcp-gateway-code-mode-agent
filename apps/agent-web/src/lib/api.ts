import type {
  AgentPlanResponse,
  EndToEndRunResult,
  SandboxExecuteResponse,
  ToolSpecListResponse
} from "./types";

const gatewayUrl =
  process.env.NEXT_PUBLIC_MCP_GATEWAY_URL ?? "http://127.0.0.1:8787";

const agentPyUrl =
  process.env.NEXT_PUBLIC_AGENT_PY_URL ?? "http://127.0.0.1:8788";

const sandboxRunnerUrl =
  process.env.NEXT_PUBLIC_SANDBOX_RUNNER_URL ?? "http://127.0.0.1:8789";

const toolBaseUrls = {
  products:
    process.env.NEXT_PUBLIC_PRODUCTS_TOOL_URL ?? "http://127.0.0.1:8790",
  fx: process.env.NEXT_PUBLIC_FX_TOOL_URL ?? "http://127.0.0.1:8791",
  "cart-intel":
    process.env.NEXT_PUBLIC_CART_INTEL_TOOL_URL ?? "http://127.0.0.1:8792"
};

export async function fetchToolSpecs(): Promise<ToolSpecListResponse> {
  const response = await fetch(`${gatewayUrl}/specs`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch specs: ${response.status}`);
  }

  return response.json();
}

export async function fetchSingleSpec(toolName: string): Promise<unknown> {
  const response = await fetch(`${gatewayUrl}/specs/${toolName}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch spec '${toolName}': ${response.status}`);
  }

  return response.json();
}

export async function generatePlan(
  prompt: string
): Promise<{
  specs: ToolSpecListResponse["tools"];
  plan: AgentPlanResponse;
}> {
  const specsResponse = await fetchToolSpecs();
  const specs = specsResponse.tools;

  const response = await fetch(`${agentPyUrl}/plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      mode: "code-mode",
      toolSpecs: specs
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate plan: ${response.status}`);
  }

  const plan = (await response.json()) as AgentPlanResponse;

  return { specs, plan };
}

export async function executePlan(
  prompt: string,
  selectedTools: string[],
  generatedCode: string
): Promise<SandboxExecuteResponse> {
  const response = await fetch(`${sandboxRunnerUrl}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      selectedTools,
      generatedCode,
      toolBaseUrls
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to execute plan: ${response.status}`);
  }

  return response.json();
}

export async function runEndToEnd(prompt: string): Promise<EndToEndRunResult> {
  const { specs, plan } = await generatePlan(prompt);

  const execution = await executePlan(
    prompt,
    plan.plan.selectedTools,
    plan.artifacts.generatedCode
  );

  return {
    specs,
    plan,
    execution
  };
}