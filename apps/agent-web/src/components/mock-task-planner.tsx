"use client";

import { useMemo, useState } from "react";
import type { MockTaskPlan } from "@/lib/types";

export function MockTaskPlanner() {
  const [prompt, setPrompt] = useState(
    "Find smartphones under a reasonable budget, convert prices to MYR, and rank the best shortlist."
  );

  const plan = useMemo<MockTaskPlan>(() => {
    return {
      userGoal: prompt,
      executionMode: "code-mode",
      requiredTools: ["products", "fx", "cart-intel"],
      steps: [
        "Fetch available tool specs from the MCP Gateway.",
        "Generate task-specific code for direct tool invocation.",
        "Call product catalog tool to retrieve candidate products.",
        "Call FX tool to retrieve latest exchange rates.",
        "Call cart intelligence tool to normalize and rank the shortlist.",
        "Return the composed result to the UI."
      ]
    };
  }, [prompt]);

  return (
    <div className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-stone-900">Mock Task Planner</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[120px] w-full rounded-2xl border border-stone-300 bg-stone-50 p-3 text-stone-900 outline-none focus:border-stone-900"
      />

      <div className="mt-4 rounded-2xl bg-stone-100 p-4">
        <div className="mb-2 font-medium text-stone-900">Execution Mode</div>
        <div className="mb-4 text-sm text-stone-700">{plan.executionMode}</div>

        <div className="mb-2 font-medium text-stone-900">Required Tools</div>
        <div className="mb-4 text-sm text-stone-700">{plan.requiredTools.join(", ")}</div>

        <div className="mb-2 font-medium text-stone-900">Planned Steps</div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
          {plan.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}