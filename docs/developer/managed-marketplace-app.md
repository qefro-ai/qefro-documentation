---
title: "Managed Marketplace App"
description: "Tutorial: package a metadata Marketplace App (Restaurant Pro Runtime), validate, publish, and install into Qefro Runtime."
sidebar_label: "Managed Marketplace App"
---

# Managed Marketplace App

## Goal

Build a Qefro Marketplace App as **metadata**, publish it, install it into
a workspace, and let **Qefro Runtime** execute UI, entities, storage,
Business Flows, events, CRM, and Automation.

You do **not** write a `/qefro` server for this path.

Reference packages:

| Package | App id | Notes |
| --- | --- | --- |
| `restaurant-pro-runtime` | `restaurant-pro-runtime` | Reservations + menu, `hosting: runtime` |
| `real-estate-runtime` | `real-estate-runtime` | Properties / leads / viewings — same model |
| `shopify-runtime` | `shopify-runtime` | Products / customers / orders via generic Runtime HTTP |

Collection: [qefro-marketplace-apps](https://github.com/qefro-ai/qefro-marketplace-apps).
HTTP surfaces, Hub email OTP, ownership: [HTTP tools](/docs/solutions/http-tools).

:::info SDK is a different story
To connect Focus ERP, Yaaz, or another customer system, use
[External SDK Connection](./external-sdk-connection.md). That is not a
Marketplace App.
:::

## Prerequisites

- `qefro` CLI (`QEFRO_SOLUTION_URL`, tenant headers, publisher credentials)
- Platform admin id listed in solution-service `QEFRO_PLATFORM_ADMIN_IDS` to **publish**

Node.js and Docker are **not** required for `hosting: runtime`.

## Architecture

```text
Developer
      ↓
App metadata (manifest · entities · workflows · ui)
      ↓
qefro app validate / package / publish
      ↓
Marketplace / catalog
      ↓
workspace installation
      ↓
Qefro Runtime
      ├── UI (dashboards, tables, forms, widgets)
      ├── Entities + managed storage
      ├── FlowRunner (Business Flows)
      ├── Business Events
      └── CRM + Automation hosts
```

Comparison: [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

## Create

```bash
qefro app init restaurant-pro --name "Restaurant Pro"
cd restaurant-pro
```

Typical package layout (from the CLI and `restaurant-pro-runtime`):

```text
restaurant-pro/
├── manifest.yaml
├── entities/
│   └── …              # required for hosting: runtime
├── workflows/
└── ui/
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

The polished reference lives at
[`apps/restaurant-pro-runtime`](https://github.com/qefro-ai/qefro-marketplace-apps/tree/main/apps/restaurant-pro-runtime)
(app id `restaurant-pro-runtime`).

## Manifest (actual fields)

From `restaurant-pro-runtime`. Only document fields that exist there:

| Field | Example | Role |
| --- | --- | --- |
| `id` | `restaurant-pro-runtime` | Solution id |
| `name` | `Restaurant Pro` | Display name |
| `version` | `0.1.0` | Package version |
| `hosting` | `runtime` | Qefro Runtime executes metadata |
| `description` | … | Catalog copy |
| `category` / `tags` | hospitality / … | Discovery |
| `channels` | `widget`, `whatsapp` | Channel support |
| `entities` | `table`, `reservation`, `menu_item` | Domain schemas under `entities/` |
| `flows` | `create-reservation` | Workflow ids |
| `events` | `reservation.created` | Business events |
| `permissions` | `storage.read`, `workflow.execute`, … | Install permissions |
| `capabilities` | `runtime.query`, `storage.write`, … | Declared platform capabilities |
| `triggers` | intent → workflow | Channel trigger map |
| `conversation_slots` | `covers`, `date`, … | Chat slot harvest (ADR-006) |
| `ui` | name, logo, icon | Staff UI branding |

`hosting: runtime` must **not** declare an external `/qefro` `endpoint`.

## Entities

```yaml title="entities/reservation.yaml (excerpt)"
id: reservation
name: Reservation
allocate_code:
  prefix: R-
  start: 1001
fields:
  - name: guest_name
    type: string
    required: true
  - name: covers
    type: integer
    required: true
  - name: date
    type: date
    required: true
  - name: person_id
    type: person
    ref_entity: person
```

Storage is Qefro-managed. There is no direct database access. `person`
fields bind to the platform Person CRM.

Workflow tools call Runtime capabilities:

```yaml
- id: create
  type: tool
  tool: entity.reservation.create
  execution: runtime
```

## UI

Runtime renders navigation, dashboards, tables, forms, and host pages:

```yaml
# ui/pages.yaml (excerpt)
- id: contacts
  title: Contacts
  host: contacts
- id: automations
  title: Automations
  host: automations
```

```yaml
# ui/sources.yaml
- id: reservations
  type: entity
  target: reservation
```

## Configure permissions

```yaml
permissions:
  - workflow.execute
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
```

## Validate, package, install

```bash
qefro app validate .
qefro app package .
# platform admin:
qefro publish .
# tenant:
qefro app install restaurant-pro-runtime --version 0.1.0
```

CLI env (from `qefro-cli`):

- `QEFRO_SOLUTION_URL` (default `http://127.0.0.1:8105`)
- `QEFRO_TENANT_ID`, `QEFRO_ORGANIZATION_ID`
- `QEFRO_PUBLISHER_ID` (must be a platform admin)
- `QEFRO_SIGNING_KEY_HEX` or `QEFRO_KEYS_FILE`
- `QEFRO_INTERNAL_BEARER` when service auth is enforced

Tenants **install**; they cannot publish.

## Runtime execution

```text
Solution Installation
       ↓
solution-service (metadata install, no /qefro binding)
       ↓
Qefro Runtime
       ├── entity tools (entity.reservation.create, …)
       ├── FlowRunner (ask → tool → complete)
       ├── managed storage
       └── portal UI + Contacts + Automations
```

On install the platform:

1. Accepts the published package
2. Validates / signs the registry artifact
3. Records the tenant install (`hosting: runtime`)
4. Registers workflows with FlowRunner
5. Persists the UI bundle
6. Serves entity data from managed storage

## Business events and automation

| Concept | Role | Example |
| --- | --- | --- |
| **Tool** | Runtime capability | `entity.reservation.create` |
| **Event** | Fact on the bus | `reservation.created` |
| **Flow** | Metadata → FlowRunner | `create-reservation` |
| **Automation** | CRM Automation host | `reservation.created` → Send WhatsApp |

See [Events](/docs/solutions/events).

## Test

```text
validate → package → publish → install → open UI → run create-reservation
```

Walk the reference:
[restaurant-pro-runtime](/docs/solutions/examples/restaurant-pro-runtime).

## Production considerations

- Keep entity field names stable across versions
- Treat `person` refs as platform CRM, not app-local contacts
- Never call other solutions’ tools directly — use Organization workflows
  or CRM Automation

## Troubleshoot

| Symptom | Check |
| --- | --- |
| Validate fails | `entities/` present? `hosting: runtime`? No `endpoint`? |
| Install fails | Manifest validation; permissions |
| Empty tables | Entity source `type: entity` / `target` matches entity id |
| Flow never starts | `triggers` + `conversation_slots`; workflow id in `flows:` |

More: [troubleshooting.md](./troubleshooting.md), [marketplace-publishing.md](./marketplace-publishing.md).
