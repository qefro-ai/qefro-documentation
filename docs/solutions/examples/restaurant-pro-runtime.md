---
title: "Example: restaurant-pro-runtime"
description: "Metadata Marketplace App for table reservations and menu — hosting: runtime, no SDK process."
sidebar_label: "restaurant-pro-runtime"
---

# Example: restaurant-pro-runtime

`restaurant-pro-runtime` is the canonical **metadata Marketplace App** for
hospitality. App id: **`restaurant-pro-runtime`**. `hosting: runtime`.
There is no SDK process and no `/qefro` server.

Qefro Runtime owns entities, staff UI, FlowRunner execution, managed
storage, Person CRM, and Automations.

Package path:
[`qefro-marketplace-apps/apps/restaurant-pro-runtime`](https://github.com/qefro-ai/qefro-marketplace-apps/tree/main/apps/restaurant-pro-runtime).

There is no SDK takeaway package. Restaurant Pro is this metadata app.

## What it proves

A developer can ship Restaurant Pro as metadata only:

```text
manifest + entities + workflows + ui
  → qefro app validate / package / install
  → Qefro Runtime (UI, storage, FlowRunner, CRM, Automation)
```

Chat “Book a table tomorrow for 4” starts **create-reservation** on the
shared FlowRunner (`RuntimeAdapter`). Contacts stay on the existing
Person model — never a restaurant-local CRM.

## Package layout

```text
restaurant-pro-runtime/
├── manifest.yaml
├── entities/
│   ├── table.yaml
│   ├── reservation.yaml
│   └── menu_item.yaml
├── workflows/
│   └── create-reservation.yaml
└── ui/
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

No `src/`, no `package.json` application, no `Dockerfile`.

## Manifest (excerpt)

```yaml
id: restaurant-pro-runtime
name: Restaurant Pro
version: 0.1.0
hosting: runtime
description: Table reservations and menu as a metadata Marketplace App executed by Qefro Runtime
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
```

There is no `endpoint`. Runtime hosting must not declare an external
`/qefro` URL.

## Entities

Domain data is YAML. Qefro-managed storage persists documents. Packages
never get a database connection.

| Entity | Role |
| --- | --- |
| `table` | Floor-plan table (`label`, `seats`, `status`) |
| `reservation` | Booking (`guest_name`, `covers`, `date`, `time`, `person_id`) |
| `menu_item` | Dish (`name`, `price`, `category`, `available`) |

`reservation.person_id` is type `person` — it binds to the platform Person
CRM, not a restaurant-owned contacts table.

## Business Flow

`workflows/create-reservation.yaml` compiles into the **same**
BusinessFlow / FlowRunner as every other Qefro flow:

```yaml
id: create-reservation
name: Create reservation
trigger:
  type: conversation
steps:
  - id: ask_covers
    type: ask
    field: covers
    message: How many guests?
  - id: ask_date
    type: ask
    field: date
    message: Which date should we book?
  - id: ask_name
    type: ask
    field: guest_name
    message: What name should the reservation be under?
  - id: create
    type: tool
    tool: entity.reservation.create
    execution: runtime
    input_map:
      guest_name: guest_name
      covers: covers
      date: date
      time: time
      table_id: table_id
  - id: confirm
    type: message
    message: Reservation booked for {{covers}} guests on {{date}}.
  - id: done
    type: complete
```

The tool is a **Runtime capability** (`entity.reservation.create`), not an
SDK tool. Steps follow the shared model: **ask → tool → complete**
(condition / approval / challenge are available on the same engine).

## UI

Runtime renders dashboards, tables, forms, detail pages, navigation, and
widgets from YAML. Sources use `type: entity`:

```yaml
- id: reservations
  type: entity
  target: reservation
```

| Page | What it is |
| --- | --- |
| Today | Intro + reservations table |
| Reservations | Form + table (`action.trigger: create-reservation`) |
| Tables / Menu | Entity tables |
| Contacts | `host: contacts` — platform Person CRM |
| Automations | `host: automations` — CRM Automation |

Example automation: `reservation.created` → CRM Automation → Send WhatsApp.

## Try the loop

```bash
qefro app init restaurant-pro --name "Restaurant Pro"
# or study the reference tree:
#   qefro-marketplace-apps/apps/restaurant-pro-runtime

qefro app validate restaurant-pro-runtime
qefro app package restaurant-pro-runtime
qefro app install restaurant-pro-runtime
```

Full walkthrough: [Build your first app](/docs/solutions/build-your-first-app).

The second vertical —
[`real-estate-runtime`](/docs/solutions/examples/real-estate-runtime) —
uses the same installer, FlowRunner, RuntimeAdapter, events, and storage
with different entities (property / lead / viewing).

## Related topics

- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
- [Manifest](/docs/solutions/manifest)
- [Workflows](/docs/solutions/workflows)
- [Events](/docs/solutions/events)
- [SDK restaurant-pro (historical)](/docs/solutions/examples/restaurant-pro)
