---
title: "Quickstart"
description: "Scaffold, build, sign, publish and install your first SDK application — restaurant-pro — in under an hour."
sidebar_label: "Quickstart"
---

# Quickstart

This guide walks the full loop with the canonical
[`restaurant-pro`](/docs/solutions/examples/restaurant-pro) solution:
scaffold the **SDK app** + optional UI/workflows, build and sign, publish,
install into a tenant, and open the rendered UI in the portal.

## Prerequisites

- A Qefro organization with admin access to the portal (`app.qefro.com`).
- The `qefro` CLI on your `PATH` (create-app / build require a `src/` tree).
- A signing key for publishing: either `QEFRO_SIGNING_KEY_HEX` (32 bytes
  of hex) or a keys file containing `REGISTRY_PRIVATE_KEY` pointed to by
  `QEFRO_KEYS_FILE`.
- Platform **managed storage** deployed (`storage-service` + Mongo
  `managed_apps`) and a place to run your `/qefro` process (managed image
  or external URL). See [Managed apps](/docs/solutions/managed-apps) and
  [Managed storage](/docs/solutions/managed-storage).

:::note
Publishing is an admin action. Tenants can always *install* published
solutions; only publishers with registry credentials can *publish*.
:::

## Step 1 — Scaffold the package

Prefer the CLI (ensures `src/` + Dockerfile):

```bash
qefro create-app restaurant-pro
cd restaurant-pro
```

Or mirror the reference layout:

```text
restaurant-pro/
├── manifest.yaml
├── src/                 # required SDK app
├── package.json
├── Dockerfile
├── assets/
├── workflows/
├── prompts/
└── ui/
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

## Step 2 — Write the manifest

```yaml
id: restaurant-pro
name: Restaurant Pro
version: 1.7.0
hosting: managed
endpoint: http://restaurant-pro:8080
description: Reservations, takeaway, menu, kitchen ops, orders and payments for restaurants
category: hospitality
tags:
  - restaurant
  - reservations
  - sdk
connectors: []
channels:
  - widget
  - whatsapp
flows:
  - reservation
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
  - storage.update
  - storage.delete
settings: []
ui:
  name: Restaurant Pro
  logo: assets/logo.svg
  icon: assets/icon.svg
```

Every field is documented in [Manifest](/docs/solutions/manifest).

## Step 3 — Implement the SDK app

Business logic lives in `src/` — tools call `ctx.storage`, never Mongo:

```js title="src/index.js (excerpt)"
import { Qefro } from '@qefro-ai/backend';

const app = new Qefro({
  signingSecret: process.env.QEFRO_SIGNING_SECRET,
  endpointPath: '/qefro',
});

app.tool(
  { name: 'restaurant.createReservation', /* … */ },
  async (ctx) => {
    /* validate then */
    return ctx.storage.insert('reservations', { /* … */ });
  },
);

app.tool(
  { name: 'restaurant.listReservations', /* … */ },
  async (ctx) => ctx.storage.find('reservations', { limit: 50 }),
);

await app.listen({ port: Number(process.env.PORT || 8080) });
```

## Step 4 — Define the UI (optional)

```yaml title="ui/sources.yaml"
- id: runtime_metrics
  type: runtime
  target: metrics
- id: orders
  type: connector
  target: restaurant-pro/restaurant.listOrders
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
      - { key: status, header: Status }
      - { key: total, header: Total }
```

Wire navigation, pages, layouts, and theme as in
[Themes](/docs/solutions/themes), [Sources](/docs/solutions/sources).

## Step 5 — Add a workflow (optional)

Orchestrate only — call the **app** tool:

```yaml title="workflows/reservation.yaml (excerpt)"
id: reservation
name: Table reservation
trigger:
  type: conversation
steps:
  - id: collect_details
    type: ask
    prompt: reservation-assistant
    variable: reservation_input
  - id: create_reservation
    type: tool
    tool: restaurant-pro/restaurant.createReservation
    params:
      guest_name: "{{ variables.reservation_input.guest_name }}"
      covers: "{{ variables.reservation_input.covers }}"
      date: "{{ variables.reservation_input.date }}"
      time: "{{ variables.reservation_input.time }}"
  - id: done
    type: complete
```

:::danger Do not use `storage/insert` in workflows
Persist only inside the SDK via `ctx.storage`. See
[Managed storage](/docs/solutions/managed-storage).
:::

Details: [Workflows](/docs/solutions/workflows).

## Step 6 — Build and sign

```bash
qefro solution build .
```

The build requires `src/`, assembles the package, checksums, and signs
`id|version|checksum`. See [Validation](/docs/solutions/validation) and
[Packaging](/docs/solutions/packaging).

```text
built restaurant-pro@1.7.0
  checksum:  9f2c…
  signature: 71ab…
  package:   ./dist/package.json
```

## Step 7 — Publish

```bash
qefro solution publish
```

See [Publishing](/docs/solutions/publishing).

## Step 8 — Install into a tenant

```bash
qefro solution install restaurant-pro
```

or install from the portal marketplace wizard. The installer negotiates
capabilities, registers workflows, stores the UI bundle, and creates an
**installation binding** to your `/qefro` endpoint. See
[Installation](/docs/solutions/installation).

## Step 9 — Open the UI

```text
/app/solutions/ui/restaurant-pro/dashboard
```

or `https://restaurant-pro.portal.qefro.com/`. Tables are fed by
`restaurant-pro/restaurant.list*` sources (gated on `runtime.query`).

## What's next

- Full package walkthrough: [restaurant-pro example](/docs/solutions/examples/restaurant-pro)
- Developer guide: [Managed apps](/docs/solutions/managed-apps)
- Document plane: [Managed storage](/docs/solutions/managed-storage)
- [Validation](/docs/solutions/validation) · [Security](/docs/solutions/security) ·
  [Troubleshooting](/docs/solutions/troubleshooting)
