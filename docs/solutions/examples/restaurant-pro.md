---
title: "Example: restaurant-pro"
description: "The restaurant-pro reference SDK app (1.7.0) — /qefro tools, managed storage via ctx.storage, brand settings, and staff UI."
sidebar_label: "restaurant-pro"
---

# Example: restaurant-pro

`restaurant-pro` is the canonical **installable SDK application**
([ADR-003](/docs/solutions/managed-apps)): reservations, takeaway, menu,
kitchen, floor plan, orders, payments, and a light CRM. From **1.7.0**
the package ships a required `src/` process; workflows and UI call
`restaurant-pro/restaurant.*` tools only.

```text
widget / WhatsApp / staff UI
  → runtime → tool invoker → restaurant-pro /qefro
  → restaurant.* → ctx.storage.* → storage-service → MongoDB
```

`connectors: []` — no POS pool dependency. The app **is** the connector
for its own domain (`hosting: managed`, `endpoint: http://restaurant-pro:8080`).

## Package layout

```text
restaurant-pro/
├── manifest.yaml
├── src/                 # required SDK app (@qefro-ai/backend)
├── package.json
├── Dockerfile
├── assets/
├── workflows/           # optional — tool: restaurant-pro/restaurant.*
├── prompts/
└── ui/                  # optional — sources → restaurant-pro/restaurant.list*
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

## Collections (via `ctx.storage`)

| Logical | Purpose |
| --- | --- |
| `reservations` | guest, phone, covers, time, status |
| `tables` | name, capacity, floor `x`/`y`, status |
| `orders` | order number, items, total, status (`channel: takeaway`) |
| `menu_items` | name, price, category, available |
| `payments` | amount, method, order_id, status |
| `customers` | name, phone, email, vip, visits, notes |
| `offers` | title, message, audience, status |

Physical Mongo collections: `restaurant_pro__{logical}`.

## Staff UI

| Page | What you can do |
| --- | --- |
| Menu | Add / update dishes (forms → staff workflows → app tools) |
| Tables | Floor plan + add/update tables |
| Customers | List / VIP filter, upsert, queue offer |
| Orders | Readable dates, order number, totals |

Portal: `/app/solutions/ui/restaurant-pro/{page}`  
Subdomain: `https://restaurant-pro.portal.qefro.com/…`

## Brand settings

Installation settings overlay `ui/theme.yaml`:

| Key | Type |
| --- | --- |
| `business_name` | string |
| `logo_url` | url |
| `background_image_url` | url |
| `primary_color` / `secondary_color` / `accent_color` / `background_color` | color |
| `reservation_lead_time` | number |

Configure under **Installed solutions → Configure**.

## Workflow example — book a table

```yaml title="workflows/reservation.yaml (excerpt)"
- id: create_reservation
  type: tool
  tool: restaurant-pro/restaurant.createReservation
  params:
    guest_name: "{{ variables.reservation_input.guest_name }}"
    phone: "{{ variables.reservation_input.phone }}"
    email: "{{ variables.reservation_input.email }}"
    covers: "{{ variables.reservation_input.covers }}"
    date: "{{ variables.reservation_input.date }}"
    time: "{{ variables.reservation_input.time }}"
    channel: "{{ variables.channel }}"
```

Staff flows (`staff-reservation-create`, `staff-menu-create`, …) call the
same app tools so chat and the portal share one document plane.

:::danger Do not use
`tool: storage/insert` (or any `storage/*`) from workflows — deprecated.
:::

## ui/sources.yaml (excerpt)

```yaml title="ui/sources.yaml"
- id: reservations
  type: connector
  target: restaurant-pro/restaurant.listReservations
  params:
    limit: 50
    sort:
      created_at: -1
- id: customers_vip
  type: connector
  target: restaurant-pro/restaurant.listCustomers
  params:
    filter:
      vip: true
    limit: 100
```

Own-app sources are gated on **`runtime.query`**. Do not target
`storage/find`.

## Local SDK app

```bash
cd restaurant-pro
npm install
export QEFRO_SIGNING_SECRET=dev-secret
export QEFRO_STORAGE_URL=http://localhost:8108   # optional if runtime injects platform.storage
npm run dev
```

## Build, publish, install

```bash
qefro solution build .    # requires src/
qefro solution publish
qefro solution install restaurant-pro
# upgrade: POST /installations/restaurant-pro/upgrade
#   { "target_version": "1.7.0" }  (+ workspace_id)
```

## Related topics

- [Managed apps](/docs/solutions/managed-apps) — developer guide
- [Managed storage](/docs/solutions/managed-storage)
- [Sources](/docs/solutions/sources)
- [Themes](/docs/solutions/themes)
- [Workflows](/docs/solutions/workflows)
- [Quickstart](/docs/solutions/quickstart)
