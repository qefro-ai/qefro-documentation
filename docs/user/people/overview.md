---
title: "People (Customer Hub)"
description: "Operate Customer Hub from the portal — People nav, shared identity across channels, and how apps use ctx.customer."
sidebar_label: "People"
---

import { RelatedTopics } from '@site/src/components';

# People (Customer Hub)

In the Admin Console / Internal Portal, **People** is the operator-facing name
for **Customer Hub** — the shared identity plane for guests, patients, clients,
and other contacts your assistants and apps talk to.

Route in the product: `/app/customers` (nav label: **People**).

## What operators see

- Unified people records tied to channel identities (e.g. WhatsApp phone)
- Context that apps and assistants can enrich without each owning a CRM
- Timeline / notes when apps append via the Hub APIs

Customer Hub does **not** replace your vertical data (reservations, appointments).
Apps keep domain documents in managed storage; Hub holds **shared** identity.

## How apps use it

Installable SDK apps call `ctx.customer` (resolve / enrich) from `/qefro` tools.
See the builder guide: [Customer Hub](/docs/solutions/customer-hub).

```text
WhatsApp / widget
  → runtime
  → installed app /qefro
  → ctx.customer.resolve({ phone })
  → ctx.storage.*   # domain docs
```

## Related operate tasks

| Task | Where |
| --- | --- |
| Install an app that uses Hub | [Marketplace](/docs/solutions/marketplace) · [Installation](/docs/solutions/installation) |
| Configure workspace channels | [Channels](/docs/user/channels/overview) |
| Invite staff / RBAC | [Administration](/docs/user/administration/overview) |

## Related topics

<RelatedTopics
  topics={[
    {label: 'Customer Hub (builders)', to: '/docs/solutions/customer-hub'},
    {label: 'Marketplace', to: '/docs/solutions/marketplace'},
    {label: 'Getting started', to: '/docs/user/getting-started'},
    {label: 'Workspaces', to: '/docs/user/workspaces/overview'},
  ]}
/>
