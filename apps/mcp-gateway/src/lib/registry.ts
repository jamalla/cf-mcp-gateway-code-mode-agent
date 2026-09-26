export type RegisteredServer = {
  id: string;
  name: string;
  description: string;
  version: string;
  endpoint: string;
  transport: "streamable-http" | "sse";
  openapiUrl: string | null;
  auth: { type: "none" | "bearer" | "api-key" | "oauth2" };
  docsUrl: string | null;
  owner: { github: string; contact: string };
  tags: string[];
  status: "active" | "disabled";
  submittedAt: string;
  sourceIssue: number;
};
