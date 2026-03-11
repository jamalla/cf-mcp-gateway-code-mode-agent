import { CopilotShell } from "@/components/copilot-shell";
import { MockTaskPlanner } from "@/components/mock-task-planner";
import { RunConsole } from "@/components/run-console";
import { SpecBrowser } from "@/components/spec-browser";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border p-6">
          <h1 className="text-3xl font-bold">MCP Gateway + Code Mode Agent Demo</h1>
          <p className="mt-2 text-gray-600">
            Inspect specs, generate a plan, execute through the sandbox runner,
            and review the final output.
          </p>
        </header>

        <RunConsole />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SpecBrowser />
          <div className="space-y-6">
            <MockTaskPlanner />
            <CopilotShell />
          </div>
        </div>
      </div>
    </main>
  );
}
