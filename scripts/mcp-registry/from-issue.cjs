// Turns a "Register Custom MCP Server" issue into a Pull Request that adds
// registry/<server-id>.json. Invoked from .github/workflows/mcp-registration.yml
// via actions/github-script. The issue body is untrusted input: it is only ever
// parsed as data, never interpolated into a shell.
"use strict";

const { validateEntry } = require("./validate.cjs");
const gh = require("./github.cjs");

const LABEL = "mcp-registration";
const TITLE_PREFIX = "[MCP Registration]";

// Issue-form labels -> field keys (must match .github/ISSUE_TEMPLATE/register-mcp-server.yml)
const FIELDS = {
  "Server ID": "server_id",
  "Display name": "name",
  Description: "description",
  Version: "version",
  "MCP endpoint URL": "endpoint",
  Transport: "transport",
  "OpenAPI spec URL (optional)": "openapi_url",
  Authentication: "auth_type",
  "Documentation / homepage URL (optional)": "docs_url",
  "Maintainer contact": "contact",
  "Tags (optional)": "tags",
  Confirmation: "terms"
};

function parseIssueForm(body) {
  return gh.parseIssueForm(body, FIELDS);
}

function isRegistrationIssue(issue) {
  return gh.hasLabelOrPrefix(issue, LABEL, TITLE_PREFIX);
}

/** Build a registry entry object from parsed form fields. */
function buildEntry(form, issue) {
  const blankToNull = (v) => (v && v.trim() ? v.trim() : null);
  const tags = (form.tags || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return {
    id: (form.server_id || "").trim().toLowerCase(),
    name: (form.name || "").trim(),
    description: (form.description || "").trim(),
    version: (form.version || "").trim(),
    endpoint: (form.endpoint || "").trim(),
    transport: (form.transport || "").trim(),
    openapiUrl: blankToNull(form.openapi_url),
    auth: { type: (form.auth_type || "").trim() },
    docsUrl: blankToNull(form.docs_url),
    owner: {
      github: issue.user && issue.user.login,
      contact: (form.contact || "").trim()
    },
    tags,
    status: "active",
    submittedAt: new Date().toISOString(),
    sourceIssue: issue.number
  };
}

function termsAccepted(form) {
  const checked = (String(form.terms || "").match(/- \[[xX]\]/g) || []).length;
  return checked >= 2;
}

async function run({ github, context, core }) {
  const issue = context.payload.issue;
  const { owner, repo } = context.repo;

  if (!issue || !isRegistrationIssue(issue)) {
    core.info("Not an MCP registration issue; skipping.");
    return;
  }

  const comment = (body) => github.rest.issues.createComment({ owner, repo, issue_number: issue.number, body });
  const close = (state_reason) =>
    github.rest.issues.update({ owner, repo, issue_number: issue.number, state: "closed", state_reason });

  const form = parseIssueForm(issue.body);
  const entry = buildEntry(form, issue);
  const errors = validateEntry(entry);
  if (!termsAccepted(form)) errors.push("Both confirmation boxes must be ticked.");

  const { data: repoInfo } = await github.rest.repos.get({ owner, repo });
  const base = repoInfo.default_branch;
  const path = `registry/${entry.id}.json`;

  if (errors.length === 0 && (await gh.fileExists(github, owner, repo, path, base))) {
    errors.push(`A server with ID \`${entry.id}\` is already registered. Choose a different ID.`);
  }

  if (errors.length > 0) {
    await comment(
      [
        "❌ **Registration could not be processed.** Please fix the following and open a new issue:",
        "",
        ...errors.map((e) => `- ${e}`)
      ].join("\n")
    );
    await close("not_planned");
    core.setFailed(`Validation failed: ${errors.join(" | ")}`);
    return;
  }

  const table = gh.markdownTable([
    ["ID", "`" + entry.id + "`"],
    ["Name", entry.name],
    ["Version", entry.version],
    ["Endpoint", entry.endpoint],
    ["Transport", entry.transport],
    ["OpenAPI", entry.openapiUrl || "—"],
    ["Auth", entry.auth.type],
    ["Docs", entry.docsUrl || "—"],
    ["Submitted by", `@${entry.owner.github}`],
    ["Contact", entry.owner.contact],
    ["Tags", entry.tags.join(", ") || "—"]
  ]);

  const pr = await gh.openSingleFilePr({
    github,
    core,
    owner,
    repo,
    base,
    branch: `mcp-registry/${entry.id}-issue-${issue.number}`,
    path,
    content: JSON.stringify(entry, null, 2) + "\n",
    commitMessage: `registry: add MCP server "${entry.id}" (closes #${issue.number})`,
    title: `Register MCP server: ${entry.name} (${entry.id})`,
    body: [
      `Automated registration request from #${issue.number}.`,
      "",
      table,
      "",
      "### Description",
      entry.description,
      "",
      "---",
      "**Admin:** ✅ **Merge** to accept (the gateway redeploys automatically) · ❌ **Close** without merging to reject."
    ].join("\n"),
    label: LABEL
  });

  await comment(
    `✅ Thanks @${entry.owner.github}! Your request has been converted to ${pr.html_url}.\n\n` +
      "An admin will review it. **Merged** = accepted and live on the gateway; **closed** = rejected. " +
      "Follow the PR for updates."
  );
  await close("completed");
  core.info(`Opened ${pr.html_url}`);
}

module.exports = run;
module.exports.parseIssueForm = parseIssueForm;
module.exports.buildEntry = buildEntry;
module.exports.termsAccepted = termsAccepted;
module.exports.isRegistrationIssue = isRegistrationIssue;
