"use client";

import { useState } from "react";
import { runEndToEnd } from "@/lib/api";
import type { EndToEndRunResult } from "@/lib/types";

const defaultPrompt =
  "Find smartphones, convert prices to MYR, and rank the best shortlist.";

export function RunConsole() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EndToEndRunResult | null>(null);

  const handleRun = async () => {
    try {
      setLoading(true);
      setError("");
      const output = await runEndToEnd(prompt);
      setResult(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-4">
      <h2 className="mb-3 text-lg font-semibold">End-to-End Run Console</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[120px] w-full rounded-xl border p-3"
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleRun}
          disabled={loading}
          className="rounded-xl border px-4 py-2"
        >
          {loading ? "Running..." : "Run full flow"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Selected Tools</h3>
            <div className="text-sm">{result.plan.plan.selectedTools.join(", ")}</div>
          </section>

          <section className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Plan Steps</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {result.plan.plan.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Execution Trace</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {result.execution.trace.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Generated TypeScript</h3>
            <pre className="max-h-[400px] overflow-auto rounded-xl bg-black p-4 text-xs text-green-300">
              {result.plan.artifacts.generatedCode}
            </pre>
          </section>

          <section className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Final Result</h3>
            <pre className="max-h-[500px] overflow-auto rounded-xl bg-black p-4 text-xs text-green-300">
              {JSON.stringify(result.execution.finalResult, null, 2)}
            </pre>
          </section>
        </div>
      ) : null}
    </div>
  );
}
