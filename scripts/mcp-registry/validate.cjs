// Shared validation for MCP registry entries.
// Used by the issue -> PR workflow and by the gateway build step.
"use strict";

const ID_RE = /^[a-z][a-z0-9-]{2,47}$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const TRANSPORTS = ["streamable-http", "sse"];
const AUTH_TYPES = ["none", "bearer", "api-key", "oauth2"];
// Built-in tool keys served by the gateway; registry IDs must not shadow them.
const RESERVED_IDS = ["products", "fx", "cart-intel", "health", "specs", "servers"];

function isHttpsUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    // Reject obvious local/private targets.
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.startsWith("[")
    ) {
      return false;
    }
    return !u.username && !u.password;
  } catch {
    return false;
  }
}

/**
 * Validate a registry entry. Returns an array of human-readable error strings
 * (empty when valid).
 */
function validateEntry(entry) {
  const errors = [];
  const str = (v) => typeof v === "string" && v.trim().length > 0;

  if (!str(entry.id) || !ID_RE.test(entry.id)) {
    errors.push("`Server ID` must be 3–48 chars: lowercase letters, digits, hyphens, starting with a letter.");
  } else if (RESERVED_IDS.includes(entry.id)) {
    errors.push(`\`Server ID\` "${entry.id}" is reserved.`);
  }
  if (!str(entry.name) || entry.name.length > 80) errors.push("`Display name` is required (max 80 chars).");
  if (!str(entry.description) || entry.description.length > 500) {
    errors.push("`Description` is required (max 500 chars).");
  }
  if (!str(entry.version) || !SEMVER_RE.test(entry.version)) errors.push("`Version` must be semver, e.g. 1.0.0.");
  if (!isHttpsUrl(entry.endpoint)) errors.push("`MCP endpoint URL` must be a public https:// URL.");
  if (!TRANSPORTS.includes(entry.transport)) errors.push(`\`Transport\` must be one of: ${TRANSPORTS.join(", ")}.`);
  if (entry.openapiUrl != null && !isHttpsUrl(entry.openapiUrl)) {
    errors.push("`OpenAPI spec URL` must be a public https:// URL when provided.");
  }
  if (!entry.auth || !AUTH_TYPES.includes(entry.auth.type)) {
    errors.push(`\`Authentication\` must be one of: ${AUTH_TYPES.join(", ")}.`);
  }
  if (entry.docsUrl != null && !isHttpsUrl(entry.docsUrl)) {
    errors.push("`Documentation URL` must be a public https:// URL when provided.");
  }
  if (!entry.owner || !str(entry.owner.contact) || entry.owner.contact.length > 200) {
    errors.push("`Maintainer contact` is required (max 200 chars).");
  }
  if (!Array.isArray(entry.tags) || entry.tags.length > 10 || entry.tags.some((t) => !/^[a-z0-9-]{1,32}$/.test(t))) {
    errors.push("`Tags` must be up to 10 comma-separated words (lowercase letters, digits, hyphens).");
  }
  return errors;
}

module.exports = { validateEntry, isHttpsUrl, ID_RE, RESERVED_IDS };
