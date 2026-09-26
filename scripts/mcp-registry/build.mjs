#!/usr/bin/env node
// Collects registry/*.json, validates each entry, and writes a single bundle
// the mcp-gateway Worker imports at build time:
//   apps/mcp-gateway/src/generated/registry.json
// It also bundles every apps/mcp-gateway/src/specs/*.openapi.json into
//   apps/mcp-gateway/src/generated/specs.json
// so a spec added by a "tool spec request" PR is served without code changes.
// Fails (exit 1) on any invalid entry so a bad merge can't be deployed.
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { validateEntry } = require("./validate.cjs");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const registryDir = path.join(root, "registry");
const outFile = path.join(root, "apps/mcp-gateway/src/generated/registry.json");
const specsDir = path.join(root, "apps/mcp-gateway/src/specs");
const specsOutFile = path.join(root, "apps/mcp-gateway/src/generated/specs.json");

const files = (await readdir(registryDir).catch(() => []))
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .sort();

const servers = [];
const problems = [];

for (const file of files) {
  let entry;
  try {
    entry = JSON.parse(await readFile(path.join(registryDir, file), "utf8"));
  } catch (err) {
    problems.push(`${file}: invalid JSON (${err.message})`);
    continue;
  }
  const errors = validateEntry(entry);
  if (entry.id && `${entry.id}.json` !== file) errors.push(`file name must be "${entry.id}.json"`);
  if (errors.length) {
    problems.push(`${file}: ${errors.join("; ")}`);
    continue;
  }
  if (entry.status === "disabled") continue;
  servers.push(entry);
}

// ---- tool specs ----
const specFiles = (await readdir(specsDir).catch(() => [])).filter((f) => f.endsWith(".openapi.json")).sort();
const specs = [];
for (const file of specFiles) {
  const key = file.replace(/\.openapi\.json$/, "");
  let spec;
  try {
    spec = JSON.parse(await readFile(path.join(specsDir, file), "utf8"));
  } catch (err) {
    problems.push(`specs/${file}: invalid JSON (${err.message})`);
    continue;
  }
  if (!spec?.info?.title || !spec?.info?.version || !spec?.paths) {
    problems.push(`specs/${file}: missing info.title, info.version or paths`);
    continue;
  }
  specs.push({
    key,
    name: spec.info["x-tool-name"] ?? spec.info.title,
    version: spec.info.version,
    description: spec.info.description ?? "",
    spec
  });
}

if (problems.length) {
  console.error("MCP registry validation failed:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(servers, null, 2) + "\n");
await writeFile(specsOutFile, JSON.stringify(specs) + "\n");
console.log(`Tool specs: bundled ${specs.length} spec(s) -> ${path.relative(root, specsOutFile)}`);
console.log(`MCP registry: bundled ${servers.length} server(s) -> ${path.relative(root, outFile)}`);
