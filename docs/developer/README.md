---
title: "Application Integration Manual"
description: "Developer index for building Qefro applications with the Backend SDK — external connections and managed marketplace apps."
sidebar_label: "Integration manual"
---

# Application Integration Manual

A **Qefro application** is a backend that implements the signed `/qefro` protocol and exposes business capabilities as SDK tools.

There are two deployment models. The application contract is the same; ownership and platform plumbing differ.

| Model | One-line summary |
| --- | --- |
| **External SDK Connection** | Bring your application/backend to Qefro. |
| **Managed Marketplace App** | Let Qefro host and distribute your application. |

## Start here

1. [Building Applications for Qefro](./application-integration-guide.md) — primary manual
2. [Integration models](./integration-models.md) — choose External vs Managed
3. [Getting started](./getting-started.md) — first `/qefro` process

## Tutorials

| Tutorial | Model | Reference implementation |
| --- | --- | --- |
| [External SDK Connection](./external-sdk-connection.md) | External | `abm-demo`, `mock-order-status-sdk` |
| [Managed Marketplace App](./managed-marketplace-app.md) | Managed | `restaurant-pro`, `clinic-pro`, `finance-pro` |
| [Migration: External → Managed](./migration-external-to-managed.md) | Both | Same SDK app, different plumbing |

## Protocol & SDK

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
| Managed storage (`ctx.storage`) | [storage.md](./storage.md) |
| Customer Hub (`ctx.customer`) | [customer-hub.md](./customer-hub.md) |
| Organization | [organization.md](./organization.md) |
| Marketing | [marketing.md](./marketing.md) |
| Workflows | [workflows.md](./workflows.md) |

## Ship & operate

| Topic | Doc |
| --- | --- |
| Deployment | [deployment/external-and-managed.md](./deployment/external-and-managed.md) |
| Marketplace publishing | [marketplace-publishing.md](./marketplace-publishing.md) |
| Testing | [testing.md](./testing.md) |
| Security | [security.md](./security.md) |
| Troubleshooting | [troubleshooting.md](./troubleshooting.md) |

> **Note:** Application deploy guidance lives at [`deployment/external-and-managed.md`](./deployment/external-and-managed.md) because `docs/developer/deployment/` already hosts the general deployment overview.

## Related docs (existing hubs)

- [Solution Development](/docs/solutions/overview) — managed packaging, UI, marketplace
- [Register SDK Business Tools](/docs/guides/register-sdk-business-tools) — Org Portal sync walkthrough
- [JavaScript SDK](/docs/developer/sdk/javascript) — language-specific API notes

**Verified against:** `@qefro-ai/backend` **1.7.0**, protocol version **1**, ACS `sdk_connections`, connector-manager `/v1/invoke`, solution-service install/publish.
