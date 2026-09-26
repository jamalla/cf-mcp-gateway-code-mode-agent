// Turns an "Add Tool OpenAPI Spec" issue into a Pull Request that adds
// apps/mcp-gateway/src/specs/<tool-key>.openapi.json. Invoked from
// .github/workflows/tool-spec-request.yml via actions/github-script.
// The issue body is untrusted and is only ever parsed as data.
"use strict";

const gh = require("./github.cjs");
const { isHttpsUrl, ID_RE } = require("./validate.cjs");

const LABEL = "tool-spec-request";
const TITLE_PREFIX = "[Tool Spec]";
const SPECS_DIR = "apps/mcp-gateway/src/specs";
const RESERVED_KEYS = ["health", "specs", "servers"];
const METHODS = ["get", "post", "put", "patch", "delete"];
const MAX_SPEC_BYTES = 60_000;

const FIELDS = {
  "Tool key": "tool_key",
  "Tool name": "tool_name",
  Description: "description",
  Version: "version",
  "Tool base URL": "server_url",
  "Operations (used for mock spec)": "operations",
  "OpenAPI spec (JSON, optional)": "openapi_json",
  Confirmation: "terms"
};

function camel(words) {
  return words
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

/** Parse "GET /path/{id} - summary" lines. Returns { operations, errors }. */
function parseOperations(text) {
  const operations = [];
  const errors = [];
  for (const raw of String(text || "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z]+)\s+(\/[A-Za-z0-9_\-./{}]*)\s*(?:-\s*(.+))?$/);
    if (!m || !METHODS.includes(m[1].toLowerCase())) {
      errors.push(`Operation line not understood: \`${line.slice(0, 80)}\` (expected \`METHOD /path - summary\`).`);
      continue;
    }
    operations.push({ method: m[1].toLowerCase(), path: m[2], summary: (m[3] || "").trim() });
  }
  return { operations, errors };
}

/** Build a mock OpenAPI 3.1 document in the same shape as the built-in specs. */
function buildMockSpec(form, operations) {
  const ops = operations.length ? operations : [{ method: "get", path: "/", summary: "Service info" }];
  const paths = {};
  for (const op of ops) {
    const pathParams = [...op.path.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((m) => m[1]);
    const words = op.path.replace(/[{}]/g, "").split(/[\/\-_.]/);
    const operation = {
      summary: op.summary || `${op.method.toUpperCase()} ${op.path}`,
      operationId: camel([op.method, ...words]) || op.method,
      responses: {
        "200": {
          description: "Successful response (mock)",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { ok: { type: "boolean" }, data: { type: "object" } },
                required: ["ok"]
              }
            }
          }
        }
      }
    };
    if (pathParams.length) {
      operation.parameters = pathParams.map((name) => ({ name, in: "path", required: true, schema: { type: "string" } }));
    }
    if (["post", "put", "patch"].includes(op.method)) {
      operation.requestBody = {
        required: true,
        content: { "application/json": { schema: { type: "object", additionalProperties: true } } }
      };
    }
    paths[op.path] = { ...(paths[op.path] || {}), [op.method]: operation };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: form.tool_name,
      version: form.version,
      description: form.description,
      "x-generated": "mock spec generated from issue form"
    },
    servers: [{ url: form.server_url }],
    paths
  };
}

/** Validate an OpenAPI document (pasted or generated). */
function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) return ["Spec must be a JSON object."];
  if (typeof spec.openapi !== "string" || !spec.openapi.startsWith("3.")) errors.push("`openapi` must be a 3.x version string.");
  if (!spec.info || typeof spec.info.title !== "string" || typeof spec.info.version !== "string") {
    errors.push("`info.title` and `info.version` are required.");
  }
  if (!Array.isArray(spec.servers) || !spec.servers[0] || !isHttpsUrl(spec.servers[0].url)) {
    errors.push("`servers[0].url` must be a public https:// URL.");
  }
  if (!spec.paths || typeof spec.paths !== "object" || Object.keys(spec.paths).length === 0) {
    errors.push("`paths` must contain at least one path.");
  }
  return errors;
}

/** Turn form fields into { key, spec, mock, errors }. */
function buildSpecFromForm(form) {
  const f = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, String(v || "").trim()]));
  const key = f.tool_key.toLowerCase();
  const errors = [];

  if (!ID_RE.test(key)) errors.push("`Tool key` must be 3–48 chars: lowercase letters, digits, hyphens, starting with a letter.");
  else if (RESERVED_KEYS.includes(key)) errors.push(`\`Tool key\` "${key}" is reserved.`);
  if (!f.tool_name || f.tool_name.length > 80) errors.push("`Tool name` is required (max 80 chars).");
  if (!f.description || f.description.length > 500) errors.push("`Description` is required (max 500 chars).");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(f.version)) errors.push("`Version` must be semver, e.g. 1.0.0.");
  if (!isHttpsUrl(f.server_url)) errors.push("`Tool base URL` must be a public https:// URL.");
  if (!/- \[[xX]\]/.test(f.terms)) errors.push("The confirmation box must be ticked.");

  let spec = null;
  let mock = false;
  const pasted = gh.stripCodeFence(f.openapi_json);
  if (pasted) {
    if (pasted.length > MAX_SPEC_BYTES) errors.push(`Pasted spec is too large (max ${MAX_SPEC_BYTES} bytes).`);
    else {
      try {
        spec = JSON.parse(pasted);
      } catch (err) {
        errors.push(`Pasted spec is not valid JSON: ${err.message}`);
      }
    }
    // Keep the gateway listing consistent with the form.
    if (spec && spec.info && typeof spec.info === "object") {
      spec.info.title = f.tool_name || spec.info.title;
      spec.info.version = f.version || spec.info.version;
      spec.info.description = spec.info.description || f.description;
    }
  } else {
    const parsed = parseOperations(f.operations);
    errors.push(...parsed.errors);
    spec = buildMockSpec(f, parsed.operations);
    mock = true;
  }
  if (spec) errors.push(...validateSpec(spec));

  return { key, spec, mock, errors, form: f };
}

async function run({ github, context, core }) {
  const issue = context.payload.issue;
  const { owner, repo } = context.repo;

  if (!issue || !gh.hasLabelOrPrefix(issue, LABEL, TITLE_PREFIX)) {
    core.info("Not a tool spec request; skipping.");
    return;
  }

  const comment = (body) => github.rest.issues.createComment({ owner, repo, issue_number: issue.number, body });
  const close = (state_reason) =>
    github.rest.issues.update({ owner, repo, issue_number: issue.number, state: "closed", state_reason });

  const { key, spec, mock, errors, form } = buildSpecFromForm(gh.parseIssueForm(issue.body, FIELDS));
  const { data: repoInfo } = await github.rest.repos.get({ owner, repo });
  const base = repoInfo.default_branch;
  const path = `${SPECS_DIR}/${key}.openapi.json`;

  if (errors.length === 0 && (await gh.fileExists(github, owner, repo, path, base))) {
    errors.push(`A spec for tool key \`${key}\` already exists. Choose a different key.`);
  }

  if (errors.length > 0) {
    await comment(
      ["❌ **Tool spec request could not be processed.** Please fix the following and open a new issue:", "", ...errors.map((e) => `- ${e}`)].join("\n")
    );
    await close("not_planned");
    core.setFailed(`Validation failed: ${errors.join(" | ")}`);
    return;
  }

  const operations = Object.entries(spec.paths).flatMap(([p, item]) =>
    Object.keys(item || {})
      .filter((m) => METHODS.includes(m))
      .map((m) => `\`${m.toUpperCase()} ${p}\``)
  );

  const pr = await gh.openSingleFilePr({
    github,
    core,
    owner,
    repo,
    base,
    branch: `tool-spec/${key}-issue-${issue.number}`,
    path,
    content: JSON.stringify(spec, null, 2) + "\n",
    commitMessage: `specs: add ${key} tool OpenAPI spec (closes #${issue.number})`,
    title: `Add tool spec: ${form.tool_name} (${key})`,
    body: [
      `Automated tool spec request from #${issue.number} by @${issue.user.login}.`,
      "",
      gh.markdownTable([
        ["Key", "`" + key + "`"],
        ["Name", form.tool_name],
        ["Version", form.version],
        ["Base URL", form.server_url],
        ["Spec source", mock ? "🧪 Generated mock spec" : "Pasted by submitter"],
        ["Operations", operations.join(", ")]
      ]),
      "",
      "### Description",
      form.description,
      "",
      "---",
      `**Admin:** ✅ **Merge** to publish at \`/specs/${key}\` (gateway redeploys automatically) · ❌ **Close** without merging to reject.`
    ].join("\n"),
    label: LABEL
  });

  await comment(
    `✅ Thanks @${issue.user.login}! Your ${mock ? "mock " : ""}spec for \`${key}\` is in ${pr.html_url}.\n\n` +
      "An admin will review it. **Merged** = published on the gateway; **closed** = rejected."
  );
  await close("completed");
  core.info(`Opened ${pr.html_url}`);
}

module.exports = run;
Object.assign(module.exports, { FIELDS, parseOperations, buildMockSpec, validateSpec, buildSpecFromForm });
