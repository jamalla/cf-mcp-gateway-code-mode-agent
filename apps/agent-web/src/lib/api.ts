import type { ToolSpecListResponse } from "./types";

const gatewayUrl =
  process.env.NEXT_PUBLIC_MCP_GATEWAY_URL ?? "http://127.0.0.1:8787";

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