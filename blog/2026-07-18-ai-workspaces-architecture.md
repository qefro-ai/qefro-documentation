---
slug: ai-workspaces-architecture
title: How AI Workspaces isolate knowledge and actions
description: Why AI Workspaces are the isolation unit for knowledge, Business Tools, and conversations inside a Qefro organization — and how that differs from a single chatbot index.
authors: [abu]
tags: [architecture, ai]
---

An **AI Workspace** is the primary isolation unit inside a Qefro organization: knowledge, instructions, Business Tools, and conversations stay scoped to that workspace.

<!-- truncate -->

## The failure mode we designed against

When Support FAQs, HR policy, and IT runbooks share one retrieval index, two things happen:

1. **Wrong answers** — the model cites the nearest-sounding passage, not the right audience’s policy.
2. **Wrong blast radius** — a public widget can surface internal content, or an internal tool can become callable from a customer channel.

Workspaces make isolation the default. Channels (website widget, WhatsApp, Internal Portal) bind to workspaces you choose — they do not invent a shared mega-index.

## Layered model

```text
Organization (tenant)
  └── AI Workspace (Support | HR | IT | …)
        ├── Knowledge (hybrid RAG)
        ├── Instructions
        ├── Business Tools → Business Actions
        └── Conversations
```

- **Tenant** isolates customers from each other.
- **Workspace** isolates teams and audiences inside a tenant.

See [Multi-tenant AI Architecture](/docs/concepts/multi-tenant-ai-architecture) and [What is an AI Workspace?](/docs/concepts/what-is-an-ai-workspace).

## Customer vs employee binding

| Audience | Typical workspace | Channel |
| --- | --- | --- |
| External customers | Customer Support | Website widget, WhatsApp |
| Employees | HR / IT / Ops | Internal Portal + RBAC |

Do not share one workspace across both audiences unless the corpus is intentionally identical and tools are safe for both. Details: [Customer AI vs Employee AI](/docs/concepts/customer-ai-vs-employee-ai).

## Practical checklist

1. Create one workspace per audience or team.
2. Ingest only documents that audience is allowed to see.
3. Attach Business Tools last — and only tools that belong in that scope.
4. Bind the widget `data-workspace-id` (or portal grants) deliberately.
5. Cross-test: ask Support questions against an HR workspace to prove isolation.

Platform reference: [AI Workspaces](/docs/platform/ai-workspaces). Security reference: [Tenant Isolation](/docs/security/tenant-isolation).
