"use client";

import { useEffect, useState } from "react";
import { fetchSingleSpec, fetchToolSpecs } from "@/lib/api";
import type { ToolSpecListItem } from "@/lib/types";

export function SpecBrowser() {
  const [tools, setTools] = useState<ToolSpecListItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [selectedSpec, setSelectedSpec] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await fetchToolSpecs();
        setTools(data.tools);

        if (data.tools.length > 0) {
          const first = data.tools[0].key;
          setSelectedTool(first);

          const spec = await fetchSingleSpec(first);
          setSelectedSpec(JSON.stringify(spec, null, 2));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const handleSelect = async (toolKey: string) => {
    try {
      setSelectedTool(toolKey);
      setError("");
      const spec = await fetchSingleSpec(toolKey);
      setSelectedSpec(JSON.stringify(spec, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-stone-300 bg-white p-5">Loading specs...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-400 bg-white p-5 text-red-700">{error}</div>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
      <div className="rounded-3xl border border-stone-300 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Gateway Specs</h2>
        <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => handleSelect(tool.key)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                selectedTool === tool.key
                  ? "border-stone-900 bg-stone-100"
                  : "border-stone-200 bg-stone-50 hover:bg-stone-100"
              }`}
            >
              <div className="font-medium text-stone-900">{tool.name}</div>
              <div className="text-sm text-stone-600">{tool.description}</div>
              <div className="mt-1 text-xs text-stone-500">
                {tool.key} · v{tool.version}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-stone-300 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Selected OpenAPI Spec</h2>
        <pre className="h-[520px] overflow-auto rounded-2xl bg-stone-950 p-4 text-xs leading-5 text-emerald-300 lg:h-[620px]">
          {selectedSpec}
        </pre>
      </div>
    </div>
  );
}