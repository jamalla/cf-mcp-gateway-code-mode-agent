"use client";

import { useMemo, useState } from "react";
import { CopilotChat } from "@copilotkit/react-ui";

export function CopilotShell() {
  const [prompt, setPrompt] = useState(
    "Which tools are available, and how would this UI execute a price-comparison task in code mode?"
  );

  const mockReply = useMemo(() => {
    return [
      "Available tools: products for catalog retrieval, fx for currency conversion, and cart-intel for shortlist ranking.",
      "Planned execution path: read specs from the gateway, generate task-specific code, call the tools directly, then compose the answer for the UI.",
      `Current mock user prompt: ${prompt}`
    ].join("\n\n");
  }, [prompt]);

  return (
    <div className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-stone-900">Copilot UI Shell</h2>

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="mb-4 w-full rounded-2xl border border-stone-300 bg-stone-50 p-3 text-sm text-stone-900 outline-none focus:border-stone-900"
      />

      <div className="h-[420px] overflow-hidden rounded-2xl border border-stone-200">
        <CopilotChat
          instructions={
            "You are a code-mode demo assistant. Explain which specs are available and how the system would execute the task."
          }
          labels={{
            title: "Code Mode Agent",
            initial: "Ask about products, exchange rates, or shortlist analysis."
          }}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-stone-400 bg-stone-50 p-4">
        <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
          Mock Assistant Response
        </div>
        <p className="whitespace-pre-wrap text-sm text-stone-700">{mockReply}</p>
      </div>
    </div>
  );
}