---
title: "Managed storage"
description: "Platform document storage for installable apps — ctx.storage / sdk.storage from the SDK process only (ADR-002), isolation, and collection naming."
sidebar_label: "Managed storage"
---

# Managed storage

Installable apps need durable application state (reservations, orders,
drafts, …) without direct database access. **Managed storage** is the
platform document plane ([ADR-002](https://github.com/qefro-ai/qefro-plugin-platform/blob/main/docs/adr-002-managed-storage.md)).

**Who may call it:** only the install’s **SDK application** via
`ctx.storage` / `sdk.storage.*` (injected on `/qefro` `tool.invoke`).

**Who must not:** workflows, UI sources, or any YAML that targets
`storage/insert`, `storage/find`, etc. That path is **deprecated** and
forbidden under [ADR-003](/docs/solutions/managed-apps) — business logic
belongs in the app process.

Solutions never receive a Mongo connection string and never invent
storage-service URLs. Every op is scoped by tenant, workspace, and
installation.

## Mental model

```text
Widget / WhatsApp / staff form
  → runtime → tool invoker → installation /qefro
  → app tool (e.g. restaurant.createReservation)
  → ctx.storage.insert|find|…
  → storage-service  /v1/internal/storage/*
  → MongoDB database `managed_apps`
```

| Layer | Role |
| --- | --- |
| SDK app (`src/`) | Domain tools; only caller of `ctx.storage` |
| Workflows / UI | Call `{solution}/{tool}` — never `storage/*` |
| storage-service | Isolation, metadata, soft-delete, audit |
| MongoDB `managed_apps` | Physical collections `{solution_slug}__{logical}` |

Control-plane data (packages, installs, secrets) stays in Postgres.

## When to use storage vs connectors

| Need | Use |
| --- | --- |
| Solution-owned app state | **Managed storage** from inside the SDK |
| External system of record (Shopify, Stripe, PMS, POS) | **Pool connector** (`connectors:` + bridge) |
| Tenant runtime metrics / executions | **Runtime** sources (`type: runtime`) |

`restaurant-pro@1.7.0` is the reference: `connectors: []`, self-hosted
`/qefro`, all app state through `ctx.storage`.

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
