import { CopilotShell } from "@/components/copilot-shell";
import { MockTaskPlanner } from "@/components/mock-task-planner";
import { SpecBrowser } from "@/components/spec-browser";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2e8_0%,#f4f4f0_45%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1400px] space-y-6 lg:space-y-8">
        <header className="rounded-3xl border border-stone-300 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h1 className="text-3xl font-bold text-stone-950">
            MCP Gateway + Code Mode Agent Demo
          </h1>
          <p className="mt-2 max-w-3xl text-stone-600">
            Inspect tool specs, simulate task planning, and prepare the UI shell
            for the future Python agent runtime.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px] 2xl:grid-cols-[minmax(0,1.55fr)_420px]">
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
