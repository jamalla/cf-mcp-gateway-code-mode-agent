// Shared helpers for the "issue form -> Pull Request" workflows.
"use strict";

/**
 * Parse a GitHub issue-form body ("### Label\n\nvalue") into { key: value }
 * using a { "Label": "key" } map. "_No response_" becomes "".
 */
function parseIssueForm(body, fields) {
  const out = {};
  const sections = String(body || "").replace(/\r\n/g, "\n").split(/^###\s+/m).slice(1);
  for (const section of sections) {
    const nl = section.indexOf("\n");
    const label = (nl === -1 ? section : section.slice(0, nl)).trim();
    let value = nl === -1 ? "" : section.slice(nl + 1).trim();
    if (value === "_No response_") value = "";
    const key = fields[label];
    if (key) out[key] = value;
  }
  return out;
}

/** Strip a surrounding ```lang fence (issue forms with `render:` add one). */
function stripCodeFence(value) {
  const m = String(value || "").trim().match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  return m ? m[1] : String(value || "").trim();
}

function hasLabelOrPrefix(issue, label, prefix) {
  const labels = (issue.labels || []).map((l) => (typeof l === "string" ? l : l.name));
  return labels.includes(label) || String(issue.title || "").startsWith(prefix);
}

async function fileExists(github, owner, repo, path, ref) {
  try {
    await github.rest.repos.getContent({ owner, repo, path, ref });
    return true;
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }
}

function markdownTable(rows) {
  const cell = (v) => String(v).replace(/\|/g, "\\|").replace(/\n/g, " ");
  return ["| Field | Value |", "|---|---|", ...rows.map(([k, v]) => `| ${cell(k)} | ${cell(v)} |`)].join("\n");
}

/**
 * Create (or reuse) a branch off `base`, commit one file to it and open (or
 * reuse) a PR. Returns the PR object.
 */
async function openSingleFilePr({ github, core, owner, repo, base, branch, path, content, commitMessage, title, body, label }) {
  const { data: baseRef } = await github.rest.git.getRef({ owner, repo, ref: `heads/${base}` });
  try {
    await github.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseRef.object.sha });
  } catch (err) {
    if (err.status !== 422) throw err; // branch already exists (workflow re-run)
  }

  let sha;
  try {
    const { data } = await github.rest.repos.getContent({ owner, repo, path, ref: branch });
    sha = data.sha;
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  await github.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    sha,
    message: commitMessage,
    content: Buffer.from(content).toString("base64")
  });

  const { data: existing } = await github.rest.pulls.list({ owner, repo, head: `${owner}:${branch}`, state: "open" });
  if (existing[0]) return existing[0];

  const { data: pr } = await github.rest.pulls.create({ owner, repo, head: branch, base, title, body });
  if (label) {
    try {
      await github.rest.issues.addLabels({ owner, repo, issue_number: pr.number, labels: [label] });
    } catch (err) {
      core.warning(`Could not label PR: ${err.message}`);
    }
  }
  return pr;
}

module.exports = { parseIssueForm, stripCodeFence, hasLabelOrPrefix, fileExists, markdownTable, openSingleFilePr };
