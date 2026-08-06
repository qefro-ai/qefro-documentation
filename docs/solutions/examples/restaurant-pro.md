---
title: "Example: restaurant-pro"
description: "The restaurant-pro reference managed app (1.5.0) — storage collections, brand settings, menu/floor/CRM staff UI, and publish/install."
sidebar_label: "restaurant-pro"
---

# Example: restaurant-pro

`restaurant-pro` is the canonical **managed app**: reservations, takeaway,
menu, kitchen, floor plan, orders, payments, and a light CRM (customers +
offers). From **1.3.0** application state lives on platform
[managed storage](/docs/solutions/managed-storage). From **1.5.0** the
package also ships menu/table CRUD, customers/VIP offers, and per-install
[brand settings](/docs/solutions/managed-apps#brand-customization-per-install).

```text
widget / WhatsApp / staff UI
  → runtime → SdkCore → storage/* → storage-service → MongoDB
```

`connectors: []` — no POS connector dependency.

## Package layout

```text
restaurant-pro/
├── manifest.yaml
├── assets/
│   ├── logo.svg
│   └── icon.svg
├── workflows/          # conversation + staff flows (storage tools)
├── prompts/
└── ui/
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

## Collections

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

## Staff UI (1.5.0)

| Page | What you can do |
| --- | --- |
| Menu | Add / update dishes (forms → `staff-menu-*`) |
| Tables | Floor plan canvas + add/update tables (`x`/`y` 0–100) |
| Customers | List all / VIP filter, upsert customer, queue offer |
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
  tool: storage/insert
  params:
    collection: reservations
    document:
      customer_name: "{{ variables.reservation_input.guest_name }}"
      phone_number: "{{ variables.reservation_input.phone }}"
      guest_count: "{{ variables.reservation_input.covers }}"
      reservation_time: "{{ variables.reservation_input.date }} {{ variables.reservation_input.time }}"
      status: confirmed
- id: upsert_customer
  type: tool
  tool: storage/insert
  params:
    collection: customers
    document:
      name: "{{ variables.reservation_input.guest_name }}"
      phone: "{{ variables.reservation_input.phone }}"
      vip: false
      visit_count: 1
```

Staff flows (`staff-reservation-create`, `staff-menu-create`, …) use the
same storage tools so chat and the portal share one document plane.

## ui/sources.yaml (excerpt)

```yaml title="ui/sources.yaml"
- id: reservations
  type: connector
  target: storage/find
  params:
    collection: reservations
    limit: 50
- id: customers_vip
  type: connector
  target: storage/find
  params:
    collection: customers
    filter:
      vip: true
    limit: 100
```

UI fetches are gated on **`storage.read`**.

## Build, publish, install

```bash
cd restaurant-pro
qefro solution build .
qefro solution publish
qefro solution install restaurant-pro
# upgrade: POST /installations/restaurant-pro/upgrade
#   { "target_version": "1.5.0" }
```

## Related topics

- [Managed apps](/docs/solutions/managed-apps) — developer guide
- [Managed storage](/docs/solutions/managed-storage)
- [Themes](/docs/solutions/themes) — package + install brand overlay
- [Workflows](/docs/solutions/workflows)
- [Quickstart](/docs/solutions/quickstart)
