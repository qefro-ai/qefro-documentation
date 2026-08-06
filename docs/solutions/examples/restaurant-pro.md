---
title: "Example: restaurant-pro"
description: "The restaurant-pro reference solution on managed storage (1.3.0) — package layout, storage collections, UI sources, and publish/install."
sidebar_label: "restaurant-pro"
---

# Example: restaurant-pro

`restaurant-pro` is the canonical reference **managed solution**:
reservations, takeaway, menu, kitchen ops, orders and payments. From
**1.3.0** application state lives on platform [managed
storage](/docs/solutions/managed-storage) (`storage/*` → MongoDB
`managed_apps`). There is no `restaurant-pos` connector dependency.

```text
widget / WhatsApp / staff UI
  → runtime → SdkCore → storage/* → storage-service → MongoDB
```

## Package layout

```text
restaurant-pro/
├── manifest.yaml
├── assets/
│   ├── logo.svg
│   └── icon.svg
├── workflows/          # conversation + staff flows (storage tools)
├── prompts/            # assistant prompts
├── ui/
│   ├── theme.yaml
│   ├── navigation.yaml
│   ├── pages.yaml
│   ├── layouts.yaml
│   ├── widgets.yaml
│   └── sources.yaml    # storage/find sources
└── README.md
```

No `connectors/` directory is required when `connectors: []`.

## Collections

| Logical | Purpose |
| --- | --- |
| `reservations` | guest name, phone, covers, time, status |
| `tables` | table number, capacity, status |
| `orders` | order number, items, status (`channel: takeaway` for takeaway) |
| `menu_items` | name, price, category, available |
| `payments` | amount, method, order_id, status |

Physical Mongo collections: `restaurant_pro__{logical}` (for example
`restaurant_pro__reservations`).

## manifest.yaml

```yaml title="manifest.yaml"
id: restaurant-pro
name: Restaurant Pro
version: 1.3.0
description: Reservations, takeaway, menu, kitchen ops, orders and payments for restaurants
category: hospitality
tags:
  - restaurant
  - reservations
  - takeaway
  - menu
  - storage
connectors: []
channels:
  - widget
  - whatsapp
flows:
  - reservation
  - reservation-lookup
  - reservation-update
  - reservation-cancel
  - reservation-reminder
  - menu
  - takeaway
  - pay-bill
  - staff-reservation-create
  - staff-reservation-update
  - staff-reservation-cancel
  - staff-takeaway-create
  - staff-payment-create
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
settings:
  - key: business_name
    type: string
    required: false
    default: "our restaurant"
  - key: reservation_lead_time
    type: number
    required: false
    default: 120
ui:
  name: Restaurant Pro
  logo: assets/logo.svg
  icon: assets/icon.svg
```

## Workflow example — book a table

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

Staff flows (`staff-reservation-create`, …) use the same tools so
WhatsApp and the portal write to one document plane.

## ui/sources.yaml

```yaml title="ui/sources.yaml"
- id: runtime_metrics
  type: runtime
  target: metrics
- id: orders
  type: connector
  target: storage/find
  params:
    collection: orders
    limit: 25
- id: reservations
  type: connector
  target: storage/find
  params:
    collection: reservations
    limit: 50
- id: takeaway
  type: connector
  target: storage/find
  params:
    collection: orders
    filter:
      channel: takeaway
    limit: 50
- id: menu
  type: connector
  target: storage/find
  params:
    collection: menu_items
    limit: 100
- id: tables
  type: connector
  target: storage/find
  params:
    collection: tables
    limit: 50
- id: kitchen
  type: connector
  target: storage/find
  params:
    collection: orders
    filter:
      status: preparing
    limit: 50
- id: payments
  type: connector
  target: storage/find
  params:
    collection: payments
    limit: 100
```

UI fetches are gated on **`storage.read`**. See [Sources](/docs/solutions/sources).

## ui/navigation.yaml

```yaml title="ui/navigation.yaml"
- id: dashboard
  page: dashboard
  title: Dashboard
  icon: home
- id: reservations
  page: reservations
  title: Reservations
  icon: calendar
- id: tables
  page: tables
  title: Tables
  icon: users
- id: kitchen
  page: kitchen
  title: Kitchen
  icon: chef-hat
- id: orders
  page: orders
  title: Orders
  icon: receipt
- id: payments
  page: payments
  title: Payments
  icon: credit-card
- id: reports
  page: reports
  title: Reports
  icon: report
```

Portal route pattern: `/app/solutions/ui/restaurant-pro/{page}`.

In the tenant portal, installed packages appear under **Managed
solution**. External SDK / connector tools live under **External tools**.

## Migration (1.2.x → 1.3.0)

1. Deploy `storage-service` + Mongo (`managed_apps`) if not already running.
2. Publish `restaurant-pro@1.3.0` and upgrade the tenant install.
3. Ensure the install grants `storage.read|write|update|delete`.
4. Smoke: create a reservation via WhatsApp → it appears on the staff
   Reservations table.
5. Old mock POS in-memory rows are **not** migrated — treat as a demo wipe.

## Build, publish, install

```bash
cd restaurant-pro
qefro solution build .
qefro solution publish
qefro solution install restaurant-pro
# upgrade existing installs to 1.3.0 via the installer upgrade API
```

## Isolation smoke checks

- Tenant A inserts a reservation → Tenant B `storage/find` → empty
- Installation A insert → Installation B find → not found
- Client-supplied `tenant_id` on insert is stripped / ignored

## Related topics

- [Managed storage](/docs/solutions/managed-storage)
- [Sources](/docs/solutions/sources)
- [Capabilities](/docs/solutions/capabilities)
- [Workflows](/docs/solutions/workflows)
- [Quickstart](/docs/solutions/quickstart)
