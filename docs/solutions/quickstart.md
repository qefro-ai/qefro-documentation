---
title: "Quickstart"
description: "Scaffold, validate, package, publish and install a metadata Marketplace App — restaurant-pro-runtime — in under an hour."
sidebar_label: "Quickstart"
---

# Quickstart

:::tip Prefer the full walkthrough
For the unassisted path (`app init` → validate → package → install), use
**[Build your first app](/docs/solutions/build-your-first-app)**. This page
is a shorter loop for people who already have publish credentials.
:::

Scaffold a metadata Marketplace App. Qefro Runtime executes it — no SDK
server.

| Example | Domain |
|---------|--------|
| [`restaurant-pro-runtime`](/docs/solutions/examples/restaurant-pro-runtime) | Reservations / menu (**canonical**) |
| [`real-estate-runtime`](/docs/solutions/examples/real-estate-runtime) | Properties / leads / viewings |

## Prerequisites

- A Qefro organization with admin access to the portal (`app.qefro.com`).
- The `qefro` CLI on your `PATH`.
- A signing key for publishing: either `QEFRO_SIGNING_KEY_HEX` (32 bytes
  of hex) or a keys file containing `REGISTRY_PRIVATE_KEY` pointed to by
  `QEFRO_KEYS_FILE`.

:::danger Platform admin only
Publishing is restricted to **platform admins** (`QEFRO_PLATFORM_ADMIN_IDS`).
Tenant and workspace admins can *install* published solutions; they cannot
*publish* or *yank* catalog versions. See [Publishing](/docs/solutions/publishing).
:::

## Step 1 — Scaffold the package

```bash
qefro app init restaurant-pro --name "Restaurant Pro"
cd restaurant-pro
```

Generated layout:

```text
restaurant-pro/
├── manifest.yaml
├── entities/
├── workflows/
└── ui/
    ├── navigation.yaml
    ├── pages.yaml
    ├── widgets.yaml
    └── sources.yaml
```

Or study the polished vertical:
`qefro-plugin-platform/docs/examples/restaurant-pro-runtime/`
(app id `restaurant-pro-runtime`).

## Step 2 — Write the manifest

```yaml
id: restaurant-pro-runtime
name: Restaurant Pro
version: 0.1.0
hosting: runtime
description: Table reservations and menu as a metadata Marketplace App
category: hospitality
entities:
  - table
  - reservation
  - menu_item
flows:
  - create-reservation
events:
  - reservation.created
  - reservation.cancelled
permissions:
  - workflow.execute
  - storage.read
  - storage.write
  - storage.update
  - storage.delete
capabilities:
  - theme.get
  - user.get
  - tenant.get
  - runtime.query
  - workflow.trigger
  - storage.read
  - storage.write
ui:
  name: Restaurant Pro
```

Do **not** set `endpoint`. Every field is documented in
[Manifest](/docs/solutions/manifest).

## Step 3 — Declare entities

```yaml title="entities/reservation.yaml (excerpt)"
id: reservation
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
```

Storage is Qefro-managed. See [Managed storage](/docs/solutions/managed-storage).

## Step 4 — Define the UI

```yaml title="ui/sources.yaml"
- id: reservations
  type: entity
  target: reservation
```

```yaml title="ui/widgets.yaml (excerpt)"
- id: reservations_table
  type: table
  title: Reservations
  source: reservations
  options:
    rows_path: items
    columns:
      - { key: guest_name, header: Guest }
      - { key: covers, header: Covers }
      - { key: date, header: Date }
```

Wire navigation, pages, layouts, and theme as in
[Themes](/docs/solutions/themes), [Sources](/docs/solutions/sources).

## Step 5 — Add a workflow

Same FlowRunner as every Business Flow:

```yaml title="workflows/create-reservation.yaml (excerpt)"
id: create-reservation
name: Create reservation
trigger:
  type: conversation
steps:
  - id: ask_covers
    type: ask
    field: covers
    message: How many guests?
  - id: create
    type: tool
    tool: entity.reservation.create
    execution: runtime
  - id: done
    type: complete
```

Details: [Workflows](/docs/solutions/workflows).

## Step 6 — Validate, package, publish, install

```bash
qefro app validate .
qefro app package .
qefro publish .
qefro app install restaurant-pro-runtime
```

See [Validation](/docs/solutions/validation),
[Packaging](/docs/solutions/packaging),
[Publishing](/docs/solutions/publishing),
[Installation](/docs/solutions/installation).

## Step 7 — Open the UI

```text
/app/solutions/ui/restaurant-pro-runtime/dashboard
```

Tables are fed by `type: entity` sources. Chat “book a table” starts
`create-reservation`.

## What's next

- [restaurant-pro-runtime example](/docs/solutions/examples/restaurant-pro-runtime)
- [real-estate-runtime](/docs/solutions/examples/real-estate-runtime)
- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
- [Validation](/docs/solutions/validation) · [Security](/docs/solutions/security) ·
  [Troubleshooting](/docs/solutions/troubleshooting)
