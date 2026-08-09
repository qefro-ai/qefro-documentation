---
title: "Integration models"
description: "External SDK Connection vs Managed Marketplace App — when to use each."
sidebar_label: "Integration models"
---

# Integration models

Qefro supports two ways to run the **same** SDK application contract.

## Model A — External SDK Connection

```text
Customer Infrastructure
        │
        ▼
SDK Application
        │
      /qefro
        │
        ▼
Qefro Connector Manager / ACS
        │
        ▼
Qefro Runtime / AI / Workflows
```

| Aspect | Behavior |
| --- | --- |
| Runtime owner | Developer / customer |
| Registration | Org **SDK Connection** (`webhook_url`, signing secret) |
| Marketplace | Not required |
| Installation binding | No |
| Typical data | External ERP/CRM/DB (app-owned) |
| `ctx.storage` | Only when invoke includes install/solution scope |

**Choose when:** existing systems of record, on-prem, customer-controlled ops, ERP adapters (e.g. ABM).

Tutorial: [external-sdk-connection.md](./external-sdk-connection.md).

## Model B — Managed Marketplace App

```text
Qefro Marketplace
        │
        ▼
Solution Package
        │
        ▼
Solution Installation
        │
        ▼
Qefro Managed Runtime
        │
      /qefro
        │
        ▼
Connector Manager
        │
        ▼
Qefro Runtime
```

| Aspect | Behavior |
| --- | --- |
| Runtime owner | Qefro |
| Registration | Publish solution → install into workspace |
| Marketplace | Required for catalog distribution |
| Installation binding | Yes (`/v1/tenant/solutions/{solution}/connector`) |
| Typical data | Managed storage via `ctx.storage` |
| Packaging | `manifest.yaml` + `Dockerfile` + `src/` |

**Choose when:** Qefro-native SaaS apps for many tenants (Restaurant Pro, Clinic Pro).

Tutorial: [managed-marketplace-app.md](./managed-marketplace-app.md).

## Shared vs different

**Shared:** `/qefro` protocol, HMAC scheme, tool definitions, SDK APIs, Customer Hub / Marketing / Organization *contracts*.

**Different:** who runs the process, how the endpoint is registered, upgrades, secrets placement, whether install scope exists for managed storage.

CLI also supports `qefro create-app … --hosting managed|external` — `external` hosting is for packaging an app that still points at a developer-operated endpoint (`qefro register --endpoint URL`). Confirm current hosting behavior in your platform version before relying on hybrid modes.

## Decision tree

```text
Do you need to run the application yourself?
YES → External SDK Connection
NO  → Want Qefro to host/manage? YES → Managed Marketplace App
```

Full comparison table: [application-integration-guide.md](./application-integration-guide.md#critical-distinction).
