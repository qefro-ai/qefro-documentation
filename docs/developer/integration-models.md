---
title: "Integration models"
description: "Metadata Marketplace Apps vs External SDK Connection — when to use each."
sidebar_label: "Integration models"
---

# Integration models

Qefro has **two** developer stories. They are not the same application
contract with different hosting.

|                | Marketplace App       | External Integration          |
| -------------- | --------------------- | ----------------------------- |
| Definition     | Metadata              | SDK                           |
| Runtime        | Qefro Runtime         | External server               |
| Business logic | Qefro Runtime         | Customer system               |
| Storage        | Qefro managed storage | External system               |
| Tools          | Runtime capabilities  | SDK capabilities              |
| Events         | Runtime events        | SDK events                    |
| Flow           | Qefro FlowRunner      | Qefro FlowRunner + SDKAdapter |

Full page: [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

## Model A — Marketplace App (default)

```text
Developer
        │
        ▼
Metadata package (manifest · entities · workflows · ui)
        │
        ▼
Publish → Marketplace → Install
        │
        ▼
Qefro Runtime (UI, storage, FlowRunner, CRM, Automation)
```

| Aspect | Behavior |
| --- | --- |
| What you write | YAML metadata (`hosting: runtime`) |
| Runtime owner | Qefro |
| `/qefro` process | None |
| Marketplace | Required for catalog distribution |
| Typical data | Managed storage via entity tools |
| CLI | `qefro app init\|validate\|package\|install` |

**Choose when:** shipping Restaurant, Clinic, Real Estate, Booking, or CRM
as a Marketplace product. You do not need a backend.

Tutorial: [managed-marketplace-app.md](./managed-marketplace-app.md).  
Examples: `restaurant-pro-runtime`, `real-estate-runtime`, `shopify-runtime`.

## Model B — External SDK Connection

```text
Customer Infrastructure (ERP / POS / CRM)
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
Qefro Runtime / FlowRunner + SDKAdapter
```

| Aspect | Behavior |
| --- | --- |
| Runtime owner | Developer / customer |
| Registration | Org **SDK Connection** (`webhook_url`, signing secret) |
| Marketplace | Not required |
| Typical data | External ERP/CRM/DB (app-owned) |
| `ctx.storage` | Only when invoke includes install/solution scope |

**Choose when:** existing systems of record, on-prem, customer-controlled
ops, ERP adapters (Focus, Yaaz, ABM).

Tutorial: [external-sdk-connection.md](./external-sdk-connection.md).

## SDK-hosted Marketplace packages

Removed. `hosting: managed` is not supported. Marketplace Apps are
metadata. External systems use an SDK Connection
(`qefro create-app … --hosting external` + `qefro register`).

## Decision tree

```text
Are you connecting an existing ERP / POS / CRM?
YES → External SDK Connection
NO  → Metadata Marketplace App (hosting: runtime)
```

Full walkthrough: [application-integration-guide.md](./application-integration-guide.md).
