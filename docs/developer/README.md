---
title: "Application Integration Manual"
description: "Developer index: metadata Marketplace Apps (default) vs Qefro SDK for connecting external ERP / POS / CRM systems."
sidebar_label: "Integration manual"
---

# Application Integration Manual

Two different stories:

| Path | One-line summary |
| --- | --- |
| **Marketplace App** | Metadata package executed by **Qefro Runtime**. No backend required. |
| **External SDK Connection** | Connect an existing ERP / POS / CRM with the **Qefro SDK** over `/qefro`. |

```text
Developer → Create App Metadata → Validate → Package → Publish
  → Install into Workspace → Qefro Runtime

External ERP / POS / CRM → Qefro SDK → /qefro → Qefro Runtime
```

Do **not** start from “write a `/qefro` server to publish a Marketplace
App.” That is the external-integration path.

Full comparison: [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

## Start here

1. [Build your first app](/docs/solutions/build-your-first-app) — metadata Marketplace App
2. [Runtime vs SDK](/docs/solutions/runtime-vs-sdk) — which path you are on
3. [Building Applications for Qefro](./application-integration-guide.md) — both paths in one manual
4. [Integration models](./integration-models.md)

## Tutorials

| Tutorial | Path | Reference implementation |
| --- | --- | --- |
| [Managed Marketplace App](./managed-marketplace-app.md) | Metadata → Runtime | `restaurant-pro-runtime`, `real-estate-runtime` |
| [External SDK Connection](./external-sdk-connection.md) | SDK → `/qefro` | `abm-demo`, `mock-order-status-sdk` (Focus / Yaaz / ABM style) |
| [Migration: External → Managed](./migration-external-to-managed.md) | SDK packaging | Same SDK app, different plumbing |

## Protocol & SDK (external systems)

| Topic | Doc |
| --- | --- |
| SDK application development | [sdk-application-development.md](./sdk-application-development.md) |
| `/qefro` protocol | [qefro-protocol.md](./qefro-protocol.md) |
| Tools | [tools.md](./tools.md) |
| Authentication (HMAC) | [authentication.md](./authentication.md) |
| Tenancy & workspaces | [tenancy-and-workspaces.md](./tenancy-and-workspaces.md) |

## Platform capabilities

| Capability | Doc |
| --- | --- |
| Managed storage | [storage.md](./storage.md) · [solutions/managed-storage](/docs/solutions/managed-storage) |
| Customer Hub (`ctx.customer`) | [customer-hub.md](./customer-hub.md) |
| Organization | [organization.md](./organization.md) |
| Marketing | [marketing.md](./marketing.md) |
| Workflows / FlowRunner | [workflows.md](./workflows.md) · [solutions/workflows](/docs/solutions/workflows) |

## Ship & operate

| Topic | Doc |
| --- | --- |
| Deployment (SDK processes) | [deployment/external-and-managed.md](./deployment/external-and-managed.md) |
| Marketplace publishing | [marketplace-publishing.md](./marketplace-publishing.md) |
| Testing | [testing.md](./testing.md) |
| Security | [security.md](./security.md) |
| Troubleshooting | [troubleshooting.md](./troubleshooting.md) |

## Related docs (existing hubs)

- [Solution Development](/docs/solutions/overview) — metadata packaging, UI, marketplace
- [Register SDK Business Tools](/docs/guides/register-sdk-business-tools) — Org Portal sync walkthrough
- [JavaScript SDK](/docs/developer/sdk/javascript) — language-specific API notes

**Verified against:** Marketplace `hosting: runtime` packages
(`restaurant-pro-runtime`), `@qefro-ai/backend` **1.7.0** for the SDK
path, protocol version **1**.
