---
title: "Managed storage"
description: "Platform document storage for managed solutions — sdk.storage tools, capabilities, collection naming, and isolation (ADR-002)."
sidebar_label: "Managed storage"
---

# Managed storage

Managed solutions need durable application state (reservations, orders,
drafts, …) without direct database access. **Managed storage** is the
platform document plane: workflows and UI sources call `storage/*` tools;
the platform writes to MongoDB on your behalf.

Solutions never receive a Mongo connection string and never call storage
HTTP APIs. Every op is scoped by tenant, workspace, and installation.

## Mental model

```text
Widget / WhatsApp / staff form
  → SdkCore → Capability Layer → Tool Invoker (PlatformStorage)
  → storage-service  /v1/internal/storage/*
  → MongoDB database `managed_apps`
```

| Layer | Role |
| --- | --- |
| Solution package | Declares `storage.*` permissions/capabilities; uses logical collection names |
| SdkCore / Tool Invoker | Routes `storage/*` to the platform backend (not the connector pool) |
| storage-service | Enforces isolation, injects metadata, soft-deletes, audits |
| MongoDB `managed_apps` | Single shared DB; physical collections `{solution_slug}__{logical}` |

Control-plane data (packages, installs, secrets) stays in Postgres. App
documents for solutions live in Mongo via storage-service.

## When to use storage vs connectors

| Need | Use |
| --- | --- |
| Solution-owned app state (reservations, menus, drafts) | **Managed storage** (`storage/*`) |
| External system of record (Shopify, Stripe, PMS, POS) | **Connector** (`connectors:` + bridge) |
| Tenant runtime metrics / executions | **Runtime** sources (`type: runtime`) |

`restaurant-pro@1.3.0` is the reference: `connectors: []` and all app
state goes through storage.

## Capabilities and permissions

Request both planes in the manifest:

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
  # … theme.get, user.get, tenant.get, runtime.query
```

| Capability | Typical use |
| --- | --- |
| `storage.read` | UI sources (`storage/find`, `storage/get`); workflow reads |
| `storage.write` | `storage/insert` |
| `storage.update` | `storage/update` |
| `storage.delete` | Soft-delete via `storage/delete` |

Portal UI sources that target `storage/*` are gated on **`storage.read`**
(not `connector.invoke`).

## Collection naming

| Form | Example |
| --- | --- |
| Logical (what you write in YAML) | `reservations` |
| Qualified | `restaurant-pro.reservations` |
| Physical (Mongo) | `restaurant_pro__reservations` |

Use the **logical** name in tools and sources. The platform derives the
physical name (`kebab-case` → `snake_case`, then `__`).

There is **one** shared Mongo database (`managed_apps`) — no per-tenant
or per-solution databases. Isolation is enforced by injected filters on
every op.

## Reserved document fields

Platform injects and owns these fields. Client-supplied values for them
are stripped or ignored:

`_id`, `tenant_id`, `workspace_id`, `installation_id`, `solution_id`,
`schema_version`, `created_at`, `updated_at`, `created_by`, `updated_by`,
`deleted_at`, `deleted_by`.

`delete` is **soft-delete**. Hard purge and restore are admin-only
operations on storage-service.

## Workflow tools

```yaml title="workflows/reservation.yaml (excerpt)"
- id: create_reservation
  type: tool
  tool: storage/insert
  params:
    collection: reservations
    document:
      customer_name: "{{ variables.reservation_input.guest_name }}"
      phone_number: "{{ variables.reservation_input.phone }}"
      guest_count: "{{ variables.reservation_input.covers }}"
      reservation_time: "{{ variables.reservation_input.date }} {{ variables.reservation_input.time }}"
      status: confirmed
```

| Tool | Capability | Body highlights |
| --- | --- | --- |
| `storage/insert` | `storage.write` | `collection`, `document` |
| `storage/find` | `storage.read` | `collection`, optional `filter`, `limit`, `sort` |
| `storage/get` | `storage.read` | `collection`, `id` |
| `storage/update` | `storage.update` | `collection`, `id`, `patch` |
| `storage/delete` | `storage.delete` | `collection`, `id` (soft) |

## UI sources

Sources still use `type: connector` in YAML for historical reasons, but
the **target** is a platform tool and the gate is `storage.read`:

```yaml title="ui/sources.yaml (excerpt)"
- id: reservations
  type: connector
  target: storage/find
  params:
    collection: reservations
    limit: 50
```

See [Sources](/docs/solutions/sources).

## Reserved SDK namespaces

These roots are platform-owned. Solutions **must not** declare connectors
named `storage`, `vector`, `object`, `cache`, `queue`, `secret`, or
`state`. Manifest validation rejects them.

| Namespace | Status |
| --- | --- |
| `storage.*` | Implemented (this page) |
| `vector.*`, `object.*`, `cache.*`, `queue.*`, `secret.*`, `state.*` | Reserved — fail closed if invoked |

## What is deferred

v1 enforces isolation, indexes, metadata, soft delete, and audit.
**Not** in v1: storage quotas, retention/archival policies, or automatic
migration of legacy connector mock data.

## Related topics

- [restaurant-pro example](/docs/solutions/examples/restaurant-pro) — full package on storage
- [Sources](/docs/solutions/sources) — `storage/find` sources
- [Capabilities](/docs/solutions/capabilities) — `storage.*` grants
- [Connectors](/docs/solutions/connectors) — external systems (orthogonal)
- [Architecture](/docs/solutions/architecture) — where storage sits in the pipeline
