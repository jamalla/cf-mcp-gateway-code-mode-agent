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

export type MockTaskPlan = {
  userGoal: string;
  steps: string[];
  requiredTools: string[];
  executionMode: "code-mode";
};