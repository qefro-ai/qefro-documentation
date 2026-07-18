---
slug: customer-ai-vs-employee-ai
title: Customer AI vs Employee AI — same platform, different boundaries
description: How Qefro runs external Customer AI (widget, WhatsApp) and internal Employee AI (Internal Portal) from one Admin Console without mixing knowledge or tools.
authors: [abu]
tags: [product, platform]
---

**Customer AI** and **Employee AI** share Qefro’s workspace technology — but they differ in audience, channels, identity, and what knowledge is safe to expose.

<!-- truncate -->

## Side-by-side

| Dimension | Customer AI | Employee AI |
| --- | --- | --- |
| Audience | Visitors, shoppers, ticket askers | Organization members |
| Channels | Website widget, WhatsApp | Internal Portal |
| Auth | Widget token; optional `identify()` | Session JWT + Teams / RBAC |
| Knowledge | Customer-safe FAQs and policies | Internal runbooks and HR/IT |
| Risk if mixed | Internal docs leak publicly | Unnecessary customer tools on staff chat |

Full concept page: [Customer AI vs Employee AI](/docs/concepts/customer-ai-vs-employee-ai).

## Configure once, deploy twice

In the Admin Console you:

1. Create separate workspaces for Support vs HR/IT.
2. Ingest the right corpus into each.
3. Bind the widget / WhatsApp to Support.
4. Grant portal Members access to internal workspaces via Teams.

That is the “configure once, deploy everywhere” model without forcing a single shared index.

## Where to go next

- Customer path: [Customer AI](/docs/platform/customer-ai) → [Website Widget](/docs/platform/website-widget) → [WhatsApp](/docs/platform/whatsapp)
- Employee path: [Employee AI](/docs/platform/employee-ai) → [Internal Portal](/docs/platform/internal-portal) → [RBAC](/docs/platform/rbac)
- Guides: [Build AI Customer Support](/docs/guides/build-ai-customer-support), [Create Employee AI](/docs/guides/create-employee-ai)
