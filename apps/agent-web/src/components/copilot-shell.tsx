"use client";

import { CopilotChat } from "@copilotkit/react-ui";

export function CopilotShell() {
  return (
    <div className="rounded-2xl border p-4">
      <h2 className="mb-3 text-lg font-semibold">Copilot UI Shell</h2>
      <div className="h-[500px] overflow-hidden rounded-xl border">
        <CopilotChat
          instructions="You are a UI-level assistant for an MCP gateway and code-mode demo. Explain the available tools and the execution flow clearly."
          labels={{
            title: "Code Mode Agent UI",
            initial:
              "This chat is the UI shell. Use the run console to execute the real end-to-end flow."
          }}
        />
      </div>
    </div>
  );
}