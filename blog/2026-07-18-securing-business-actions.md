---
slug: securing-business-actions
title: Securing Business Actions in production
description: Least privilege, encrypted secrets, identity forwarding, SSRF controls, and execution logs for AI assistants that call your APIs.
authors: [abu]
tags: [security, engineering]
---

**Business Actions** let Customer AI and Employee AI call your REST APIs during a conversation. Treat every action like production API traffic — not like a demo plugin.

<!-- truncate -->

## What a Business Action is

| Term | Meaning |
| --- | --- |
| **Business Tool** | Connector definition: URL, method, auth, schema |
| **Business Action** | One runtime invocation of that tool |

Concept page: [What are Business Actions?](/docs/concepts/business-actions). Broader threat model: [AI Agent Security](/docs/concepts/ai-agent-security).

## Controls that matter in order

1. **Workspace scope** — tools live inside a workspace; do not attach privileged write tools to a public Customer AI workspace without a hard reason.
2. **Least privilege** — start with read-only `GET` tools. Add writes only after logging and authz are proven.
3. **Encrypted secrets** — store credentials in the Admin Console; never in browser JS or prompts. See [Secrets](/docs/security/secrets).
4. **SSRF-aware egress** — tool URLs must not become a path to cloud metadata or internal networks.
5. **Identity forwarding** — for customer-facing tools, use widget [`identify()`](/docs/platform/identity-forwarding) so *your* API authorizes the end user, not only Qefro’s service credential.
6. **Execution logs** — review unexpected calls as incidents. See [Audit logs](/docs/security/audit-logs).

## Prompt injection is a blast-radius problem

No platform can honestly claim “prompt injection solved.” Design for containment:

- Hostile text may appear in user messages *and* uploaded documents.
- Validate tool arguments on your API, not only in the model prompt.
- Prefer idempotent writes; require human approval for irreversible money movement.

## Implementation path

Follow the guide [Secure Business Actions](/docs/guides/secure-business-actions), then:

1. [Connect REST APIs](/docs/guides/connect-rest-apis) or [Import OpenAPI](/docs/guides/import-openapi).
2. Test the tool in the console before enabling chat invocation.
3. Monitor `GET /api/v1/tools/:id/logs` (or the console equivalent) during pilot traffic.

When in doubt, ship knowledge-only assistants first. Actions can wait until retrieval quality and isolation are solid.
