---
title: "Quickstart"
description: "Scaffold, build, sign, publish and install your first solution package — restaurant-pro — in under an hour."
sidebar_label: "Quickstart"
---

# Quickstart

This guide walks the full loop with the canonical
[`restaurant-pro`](/docs/solutions/examples/restaurant-pro) solution:
scaffold the package, build and sign it, publish to the registry, install
into a tenant, and open the rendered UI in the portal.

## Prerequisites

- A Qefro organization with admin access to the portal (`app.qefro.com`).
- The `qefro` CLI on your `PATH`.
- A signing key for publishing: either `QEFRO_SIGNING_KEY_HEX` (32 bytes
  of hex) or a keys file containing `REGISTRY_PRIVATE_KEY` pointed to by
  `QEFRO_KEYS_FILE`.
- At least one published connector for the POS integration
  (`restaurant-pos >= 1.0.0`) — see [Connectors](/docs/solutions/connectors).

:::note
Publishing is an admin action. Tenants can always *install* published
solutions; only publishers with registry credentials can *publish*.
:::

## Step 1 — Scaffold the package

Create the standard layout:

```bash
mkdir -p restaurant-pro/{assets,workflows,connectors,ui}
cd restaurant-pro
```

```text
restaurant-pro/
├── manifest.yaml
├── assets/
├── workflows/
├── connectors/
├── ui/
│   ├── theme.yaml
│   ├── navigation.yaml
│   ├── pages.yaml
│   ├── layouts.yaml
│   ├── widgets.yaml
│   └── sources.yaml
└── README.md
```

## Step 2 — Write the manifest

`manifest.yaml` declares identity, dependencies and permissions:

```yaml
id: restaurant-pro
name: Restaurant Pro
version: 1.0.0
description: Reservations, kitchen ops, orders and payments for restaurants
category: hospitality
tags:
  - restaurant
  - pos
  - reservations
connectors:
  - name: restaurant-pos
    version: ">=1.0.0"
channels:
  - widget
  - whatsapp
flows:
  - reservation-reminder
permissions:
  - workflow.execute
capabilities:
  - theme.get
  - user.get
  - tenant.get
  - runtime.query
  - connector.invoke
  - workflow.trigger
settings: []
ui:
  name: Restaurant Pro
  logo: assets/logo.svg
  icon: assets/icon.svg
```

Every field is documented in [Manifest](/docs/solutions/manifest).

## Step 3 — Define the UI

The minimum viable UI for `restaurant-pro`:

```yaml title="ui/navigation.yaml"
- id: dashboard
  page: dashboard
  title: Dashboard
  icon: home
- id: orders
  page: orders
  title: Orders
  icon: receipt
```

```yaml title="ui/sources.yaml"
- id: runtime_metrics
  type: runtime
  target: metrics
- id: orders
  type: connector
  target: orders.list
  params:
    limit: 25
```

```yaml title="ui/widgets.yaml"
- id: active_orders
  type: metric
  title: Active orders
  source: runtime_metrics
  options:
    value_path: executions.active
    label: currently running workflows
- id: order_table
  type: table
  title: Orders
  source: orders
  options:
    rows_path: items
    limit: 25
    columns:
      - { key: id, header: Order }
      - { key: table, header: Table }
      - { key: status, header: Status }
      - { key: total, header: Total }
```

```yaml title="ui/pages.yaml"
- id: dashboard
  title: Dashboard
  layout: dashboard-grid
  widgets:
    - { widget: active_orders, span: 3 }
    - { widget: order_table, span: 9 }
```

```yaml title="ui/layouts.yaml"
- id: dashboard-grid
  type: grid
  columns: 12
```

```yaml title="ui/theme.yaml"
primary: "#ea580c"
secondary: "#1c1917"
accent: "#f59e0b"
background: "#fffbf5"
surface: "#ffffff"
text: "#1c1917"
radius: 14px
```

Reference pages: [Themes](/docs/solutions/themes),
[Navigation](/docs/solutions/navigation), [Pages](/docs/solutions/pages),
[Layouts](/docs/solutions/layouts), [Widgets](/docs/solutions/widgets/metric),
[Sources](/docs/solutions/sources).

## Step 4 — Add a workflow

`workflows/reservation-reminder.yaml` — executed by the runtime, never by
the package:

```yaml
id: reservation-reminder
name: Reservation reminder
trigger:
  event: reservation.confirmed
steps:
  - type: tool
    tool: restaurant-pos/reservations.create
    params:
      guest: "{{ event.payload.guest_name }}"
      covers: "{{ event.payload.covers }}"
  - type: tool
    tool: restaurant-pos/notify
    params:
      message: "Your table is confirmed — see you soon!"
  - type: delay
    duration: 2h
  - type: tool
    tool: restaurant-pos/notify
    params:
      message: "Reminder: your table is ready in 2 hours."
  - type: complete
```

Details: [Workflows](/docs/solutions/workflows).

## Step 5 — Build and sign

```bash
qefro solution build .
```

The build:

1. Assembles `manifest.yaml`, `ui/`, `workflows/` and `connectors/` into a
   single canonical JSON document (sorted keys, compact separators).
2. Computes the SHA-256 checksum of the canonical form.
3. Signs `id|version|checksum` with Ed25519.
4. Writes `dist/package.json`.

```text
built restaurant-pro@1.0.0
  checksum:  9f2c…
  signature: 71ab…
  package:   ./dist/package.json
```

If validation fails here, fix it before publishing — the registry applies
the same checks. See [Validation](/docs/solutions/validation) and
[Packaging](/docs/solutions/packaging).

## Step 6 — Publish

```bash
qefro solution publish
```

The CLI posts the signed package to the registry's publish endpoint. The
registry verifies the signature and stores the version. See
[Publishing](/docs/solutions/publishing).

## Step 7 — Install into a tenant

```bash
qefro solution install restaurant-pro
```

or install from the portal's **Solutions → Marketplace** wizard, which
shows the requested vs granted capability set before activation. The
installer resolves `restaurant-pos >= 1.0.0`, negotiates capabilities,
registers the workflow with the runtime and stores the UI bundle. See
[Installation](/docs/solutions/installation).

## Step 8 — Open the UI

In the portal, open **Solutions → Restaurant Pro**, or navigate directly:

```text
/app/solutions/ui/restaurant-pro/dashboard
```

You should see the branded dashboard: the `active_orders` metric fed by the
runtime and the `order_table` fed by the POS connector through the bridge.

## What's next

- Full package walkthrough: [restaurant-pro example](/docs/solutions/examples/restaurant-pro)
- Understand every publish-time check: [Validation](/docs/solutions/validation)
- Lock down the model: [Security](/docs/solutions/security)
- When something breaks: [Troubleshooting](/docs/solutions/troubleshooting)
