export type ToolSpecListItem = {
  key: string;
  name: string;
  version: string;
  description: string;
  specUrl: string;
};

export type ToolSpecListResponse = {
  ok: boolean;
  count: number;
  tools: ToolSpecListItem[];
};

export type AgentPlanResponse = {
  ok: boolean;
  agent: string;
  model: string;
  mode: string;
  input: {
    prompt: string;
    toolSpecCount: number;
  };
  plan: {
    selectedTools: string[];
    steps: string[];
  };
  artifacts: {
    language: string;
    generatedCode: string;
  };
};

export type SandboxExecuteResponse = {
  ok: boolean;
  executionMode: string;
  selectedTools: string[];
  trace: string[];
  artifacts: {
    generatedCode: string;
  };
  toolResults: Record<string, unknown>;
  finalResult: unknown;
};

export type EndToEndRunResult = {
  specs: ToolSpecListItem[];
  plan: AgentPlanResponse;
  execution: SandboxExecuteResponse;
};