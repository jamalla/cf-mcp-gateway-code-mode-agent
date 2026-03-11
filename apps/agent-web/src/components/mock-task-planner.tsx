export function MockTaskPlanner() {
  return (
    <div className="rounded-2xl border p-4">
      <h2 className="mb-3 text-lg font-semibold">Execution Contract</h2>

      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>Fetch tool specs from the MCP Gateway.</li>
        <li>Send prompt + specs to the Python agent.</li>
        <li>Receive selected tools and generated TypeScript code.</li>
        <li>Send the generated artifact to the sandbox runner.</li>
        <li>Sandbox runner executes the flow against remote tools.</li>
        <li>Return the composed result to the UI.</li>
      </ol>
    </div>
  );
}