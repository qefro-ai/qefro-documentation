---
title: "Example: restaurant-pro"
description: "The restaurant-pro reference SDK app (1.10.7) — takeaway preorder bridge, marketing, org caps, /qefro tools, and staff UI."
sidebar_label: "restaurant-pro"
---

# Example: restaurant-pro

`restaurant-pro` is the canonical **installable SDK application** for hospitality
([ADR-003](/docs/solutions/managed-apps)): takeaway preorder (including day-ahead),
menu, kitchen demand, orders, payments, and a light CRM. It does **not** take
dine-in table reservations. Current package version: **1.10.7**.

:::tip Scaffold vs reference
`warehouse-pro` is the **CLI scaffold id** (`qefro create-app warehouse-pro`).
`restaurant-pro` is the **reference vertical** proving the same surface in
production. Start with [Build your first app](/docs/solutions/build-your-first-app)
unless you are studying this package.
:::

```text
widget / WhatsApp / staff UI
  → runtime → tool invoker → restaurant-pro /qefro
  → restaurant.* → ctx.storage.* → storage-service → MongoDB
  → ctx.customer (Customer Hub) · app.marketing · app.organization
```

`connectors: []` — no POS pool dependency. The app **is** the connector
for its own domain (`hosting: managed`, `endpoint: http://restaurant-pro:8080`).

## What’s in 1.10.x

| Area | Behavior |
| --- | --- |
| Preorder bridge | Static takeaway form + `booking_form_url`; WhatsApp digits from **workspace channel** (`?n=`) |
| Time slots | Configurable `service_start` / `service_end` / `slot_interval_minutes` for pickup times |
| Marketing | Audiences, Prebook takeaway CTA attribution (`campaign_id` / `offer_id`) |
| Organization | Opaque workflow capabilities for Internal Inbox |
| Next-day takeaway (1.10.5) | Prebook pickup for tomorrow; kitchen cook list by dish quantity |
| WhatsApp placeOrder (1.10.6) | Confirming a takeaway prebook creates a real ORD-#### |
| Takeaway-only (1.10.7) | Table reservations removed; guests and staff only preorder takeaway |

## Package layout

```text
restaurant-pro/
├── manifest.yaml
├── src/                 # required SDK app (@qefro-ai/backend)
├── package.json
├── Dockerfile
├── assets/
├── booking/             # static WhatsApp takeaway-form bridge
├── onboarding/
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
| `orders` | order number, items, total, status (`channel: takeaway`, `pickup_date`) |
| `menu_items` | name, price, category, available |
| `payments` | amount, method, order_id, status |
| `customers` | name, phone, email, vip, visits, notes |
| `offers` | title, message, audience, status |

Physical Mongo collections: `restaurant_pro__{logical}`.

## Staff UI

| Page | What you can do |
| --- | --- |
| Menu | Add / update dishes (forms → staff workflows → app tools) |
| Takeaway | Next-day cook list + staff prebook form |
| Kitchen | Demand table + ticket stages |
| Customers | List / VIP filter, upsert, queue offer |
| Orders | Readable dates, order number, totals |
| Offers | Platform campaign send + sent/failed counts |

Portal: `/app/solutions/ui/restaurant-pro/{page}`  
Subdomain: `https://restaurant-pro.portal.qefro.com/…`

## Brand & preorder settings

Installation settings overlay `ui/theme.yaml` and preorder behavior:

| Key | Type |
| --- | --- |
| `business_name` | string |
| `booking_form_url` | url (takeaway form; `/booking` redirects to `preorder.html`) |
| `service_start` / `service_end` | string (HH:MM) |
| `slot_interval_minutes` | number |
| `logo_url` | url |
| `background_image_url` | url |
| `primary_color` / `secondary_color` / `accent_color` / `background_color` | color |
| `seed_demo` | boolean (optional onboarding seed) |

Configure under **Installed solutions → Configure**. WhatsApp business digits
come from the **workspace channel**, not install settings.

## Workflow example — takeaway prebook

```yaml title="workflows/takeaway.yaml (excerpt)"
- id: create_takeaway
  type: tool
  tool: restaurant-pro/restaurant.placeOrder
  params:
    channel: takeaway
    guest_name: "{{ variables.takeaway_input.guest_name }}"
    phone: "{{ variables.takeaway_input.phone }}"
    items: "{{ variables.takeaway_input.items }}"
    pickup_date: "{{ variables.takeaway_input.pickup_date }}"
    pickup_time: "{{ variables.takeaway_input.pickup_time }}"
```

Staff flows (`staff-takeaway-create`, `staff-menu-create`, …) call the
same app tools so chat and the portal share one document plane.

:::danger Do not use
`tool: storage/insert` (or any `storage/*`) from workflows — deprecated.
:::

## ui/sources.yaml (excerpt)

```yaml title="ui/sources.yaml"
- id: takeaway
  type: connector
  target: restaurant-pro/restaurant.listOrders
  params:
    filter:
      channel: takeaway
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
cd restaurant-pro   # or platform docs/examples/restaurant-pro
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
#   { "target_version": "1.10.7" }  (+ workspace_id)
```

Source of truth in the platform repo: `docs/examples/restaurant-pro/`.

## Related topics

- [Build your first app](/docs/solutions/build-your-first-app) — primary third-party path
- [Managed apps](/docs/solutions/managed-apps)
- [Marketing](/docs/solutions/marketing)
- [Organization workflows](/docs/solutions/organization-workflows)
- [Customer Hub](/docs/solutions/customer-hub)
- [Managed storage](/docs/solutions/managed-storage)
