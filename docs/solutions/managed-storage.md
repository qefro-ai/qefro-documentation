---
title: "Managed storage"
description: "Platform document storage for Marketplace App entities and SDK-hosted apps — isolation and collection naming (ADR-002)."
sidebar_label: "Managed storage"
---

# Managed storage

Installable apps need durable application state (reservations, listings,
orders, …) without direct database access. **Managed storage** is the
platform document plane ([ADR-002](https://github.com/qefro-ai/qefro-plugin-platform/blob/main/docs/adr-002-managed-storage.md)).

**Marketplace Apps (`hosting: runtime`):** Qefro Runtime persists declared
entities through entity tools (`entity.reservation.create`). Packages
never receive a Mongo connection string.

**SDK-hosted apps:** only the install’s **SDK application** may call
`ctx.storage` / `sdk.storage.*` (injected on `/qefro` `tool.invoke`).
Workflows and UI must not target `storage/insert` / `storage/find`.

Solutions never invent storage-service URLs. Every op is scoped by tenant,
workspace, and installation.

## Mental model

```text
Marketplace App:
  entity.reservation.create (Runtime)
    → storage-service  /v1/internal/storage/*
    → MongoDB database `managed_apps`

SDK-hosted app:
  Widget / WhatsApp / staff form
    → runtime → /qefro → app tool → ctx.storage.*
    → storage-service  /v1/internal/storage/*
    → MongoDB database `managed_apps`
```

| Layer | Role |
| --- | --- |
| Runtime entity tools | Default Marketplace App persistence |
| SDK app (`src/`) | SDK-hosted path; only `/qefro` caller of `ctx.storage` |
| Workflows / UI | Never `storage/*` directly |
| storage-service | Isolation, metadata, soft-delete, audit |
| MongoDB `managed_apps` | Physical collections `{solution_slug}__{logical}` |

Control-plane data (packages, installs, secrets) stays in Postgres.

## When to use storage vs connectors

| Need | Use |
| --- | --- |
| Marketplace App entity state | **Managed storage** via Runtime entity tools |
| SDK-hosted app state | **Managed storage** from inside the SDK (`ctx.storage`) |
| External system of record (Shopify, Stripe, PMS, POS, ERP) | **Pool connector** or [SDK `/qefro`](/docs/solutions/runtime-vs-sdk) |
| Tenant runtime metrics / executions | **Runtime** sources (`type: runtime`) |

`restaurant-pro-runtime` is the metadata reference: entities in YAML,
Runtime tools, no `/qefro`. `restaurant-pro` (SDK takeaway) still uses
`ctx.storage` from `src/`.

## Capabilities and permissions

Request both planes in the manifest so the **SDK** may use storage:

```yaml title="manifest.yaml (excerpt)"
permissions:
  - workflow.execute
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
capabilities:
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
  - workflow.trigger
  - runtime.query
  # … theme.get, user.get, tenant.get
```

| Capability | Who uses it |
| --- | --- |
| `storage.*` | SDK handlers via `ctx.storage` (platform enforces on storage-service) |
| `runtime.query` | UI sources targeting this install’s own tools (`{solution}/…`) |
| `connector.invoke` | UI/workflow calls to **declared pool** connectors only |

UI sources must **not** target `storage/*`. Prefer app list tools gated on
`runtime.query`. See [Sources](/docs/solutions/sources).

## Collection naming

| Form | Example |
| --- | --- |
| Logical (what you pass to `ctx.storage`) | `reservations` |
| Qualified | `restaurant-pro.reservations` |
| Physical (Mongo) | `restaurant_pro__reservations` |

Use the **logical** name in the SDK. The platform derives the physical
name (`kebab-case` → `snake_case`, then `__`).

There is **one** shared Mongo database (`managed_apps`). Isolation is
enforced by injected filters on every op (`tenant_id`, `workspace_id`,
`installation_id`, `solution_id`).

## Reserved document fields

Platform injects and owns these fields. Client-supplied values for them
are stripped or ignored:

`_id`, `tenant_id`, `workspace_id`, `installation_id`, `solution_id`,
`schema_version`, `created_at`, `updated_at`, `created_by`, `updated_by`,
`deleted_at`, `deleted_by`.

`delete` is **soft-delete**. Hard purge and restore are admin-only.

## SDK API (canonical)

Inside a tool handler:

```js
await ctx.storage.insert('reservations', { customer_name, guest_count, status: 'confirmed' });
await ctx.storage.find('reservations', { filter: { status: 'confirmed' }, limit: 50 });
await ctx.storage.get('reservations', id);
await ctx.storage.update('reservations', id, { status: 'cancelled' });
await ctx.storage.delete('reservations', id);
```

| Op | Capability | Notes |
| --- | --- | --- |
| `insert` | `storage.write` | Optional readable `code` allocation via platform helpers |
| `find` | `storage.read` | Optional `filter`, `limit`, `sort` |
| `get` | `storage.read` | By id |
| `update` | `storage.update` | Patch by id |
| `delete` | `storage.delete` | Soft |

Internal HTTP shapes used by the platform (not by packages) are documented
in the plugin platform [storage API](https://github.com/qefro-ai/qefro-plugin-platform/blob/main/docs/storage-api.md).

## Deprecated: direct `storage/*` from YAML

```yaml
# FORBIDDEN — do not ship this
- type: tool
  tool: storage/insert
  params: { collection: reservations, document: { … } }
```

```yaml
# FORBIDDEN — do not ship this
- id: reservations
  type: connector
  target: storage/find
```

Replace with app tools, e.g. `restaurant-pro/restaurant.createReservation`
and `restaurant-pro/restaurant.listReservations`.

## Reserved SDK namespaces

These roots are platform-owned. Solutions **must not** declare connectors
named `storage`, `vector`, `object`, `cache`, `queue`, `secret`, or
`state`. Manifest validation rejects them.

| Namespace | Status |
| --- | --- |
| `storage.*` | Implemented (this page) — SDK-only |
| `vector.*`, `object.*`, `cache.*`, `queue.*`, `secret.*`, `state.*` | Reserved — fail closed if invoked |

## What is deferred

v1 enforces isolation, indexes, metadata, soft delete, and audit.
**Not** in v1: storage quotas, retention/archival policies, or automatic
migration of legacy connector mock data.

## Related topics

- [Managed apps](/docs/solutions/managed-apps) — ADR-003 packaging
- [restaurant-pro example](/docs/solutions/examples/restaurant-pro)
- [Sources](/docs/solutions/sources) — UI → `{solution}/{tool}`
- [Capabilities](/docs/solutions/capabilities)
- [Connectors](/docs/solutions/connectors) — external systems (orthogonal)
- [Architecture](/docs/solutions/architecture)
