---
title: "Example: real-estate-runtime"
description: "Metadata Marketplace App for properties, leads, and viewings — same runtime model as Restaurant Pro, different domain."
sidebar_label: "real-estate-runtime"
---

# Example: real-estate-runtime

`real-estate-runtime` is the second canonical **metadata Marketplace App**.
App id: **`real-estate-runtime`**. `hosting: runtime`. No SDK process.

It exists to prove the model is **not restaurant-specific**. Different
primitives (property / lead / viewing), same installer, FlowRunner,
RuntimeAdapter, events, and managed storage.

Package path:
`qefro-plugin-platform/docs/examples/real-estate-runtime/`.

## Package layout

```text
real-estate-runtime/
├── manifest.yaml
├── entities/
│   ├── property.yaml
│   ├── lead.yaml
│   └── viewing.yaml
├── workflows/
│   └── create-viewing.yaml
└── ui/
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

Same tree as [`restaurant-pro-runtime`](/docs/solutions/examples/restaurant-pro-runtime).
Only the YAML nouns change.

## Manifest (excerpt)

```yaml
id: real-estate-runtime
name: Real Estate
version: 0.1.0
hosting: runtime
description: Property listings, leads, and viewings as a metadata Marketplace App
category: real-estate
entities:
  - property
  - lead
  - viewing
flows:
  - create-viewing
events:
  - viewing.created
```

## Entities

| Entity | Role |
| --- | --- |
| `property` | Listing (`title`, `address`, `price`, `status`) |
| `lead` | Prospective buyer (`name`, `phone`, `email`, `person_id`) |
| `viewing` | Scheduled visit (`property_title`, `lead_name`, `date`, `person_id`) |

`lead.person_id` and `viewing.person_id` bind to the platform Person CRM
(`ref_entity: person`). Do not invent a real-estate-local contacts store.

## Business Flow

`workflows/create-viewing.yaml` — same step types as Restaurant Pro:

```yaml
id: create-viewing
steps:
  - id: ask_property
    type: ask
    field: property_title
  - id: ask_lead
    type: ask
    field: lead_name
  - id: ask_date
    type: ask
    field: date
  - id: create
    type: tool
    tool: entity.viewing.create
    execution: runtime
  - id: confirm
    type: message
  - id: done
    type: complete
```

Chat “Schedule a viewing tomorrow” starts this flow on FlowRunner.
The tool is `entity.viewing.create` (Runtime capability).

## UI

| Page | Notes |
| --- | --- |
| Today | Intro + property status + viewings |
| Properties / Listing | Entity table and detail |
| Leads | Entity table |
| Viewings | Form (`trigger: create-viewing`) + table |
| Contacts | `host: contacts` |
| Automations | `host: automations` |

Sources:

```yaml
- id: properties
  type: entity
  target: property
- id: leads
  type: entity
  target: lead
- id: viewings
  type: entity
  target: viewing
```

## Related topics

- [restaurant-pro-runtime](/docs/solutions/examples/restaurant-pro-runtime)
- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
- [Build your first app](/docs/solutions/build-your-first-app)
