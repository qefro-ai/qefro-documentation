---
title: "Managed apps"
description: "Developer guide for building managed solutions — storage-backed apps with declarative UI, brand settings, staff forms, and subdomain hosting."
sidebar_label: "Managed apps"
---

# Managed apps

A **managed app** (managed solution) is a complete business application
shipped as a declarative package: YAML workflows, prompts, UI definitions,
and optional settings — **no application code**. Qefro validates, signs,
installs, executes workflows, persists documents, and renders the staff UI
inside the portal (and on a solution subdomain).

Use this page as the developer entry point. Detailed references live under
[Solution Development](/docs/solutions/overview).

## Managed app vs connector-backed solution

| | Managed app | Connector-backed |
| --- | --- | --- |
| App state | [Managed storage](/docs/solutions/managed-storage) (`storage/*`) | External SoR via connectors |
| `connectors:` | Often `[]` | Declared + pool versions |
| Isolation | Tenant + workspace + installation | Plus external account scoping |
| Reference | [`restaurant-pro`](/docs/solutions/examples/restaurant-pro) | POS / Shopify / PMS examples |

You can mix both: store solution-owned drafts in storage and sync to an
external system through a connector when needed.

## Architecture

```text
Channels (widget / WhatsApp) ─┐
Staff UI (portal / subdomain) ─┼─→ runtime / SdkCore
Install settings (brand, …) ───┘         │
                                         ▼
                              storage/*  → storage-service → MongoDB `managed_apps`
                              workflow.trigger → runtime-service
```

- **Package** — data only (manifest, workflows, prompts, `ui/`, assets).
- **Install** — per workspace; settings and UI brand overlay are per install.
- **Runtime** — executes flows; never embeds package JS.
- **Portal** — renders the UI bundle with a closed widget catalogue.

## Package checklist

```text
my-app/
├── manifest.yaml          # id, version, connectors:[], flows, settings, ui
├── workflows/*.yaml       # conversation + staff (webhook) flows
├── prompts/*.yaml         # assistants (optional)
├── assets/                # logo.svg, icon.svg
└── ui/
    ├── theme.yaml         # package default brand tokens
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml       # table | form | map | …
    └── sources.yaml       # storage/find | runtime
```

Minimum capabilities for a storage-backed staff app:

```yaml title="manifest.yaml (excerpt)"
connectors: []
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
ui:
  name: My App
  logo: assets/logo.svg
  icon: assets/icon.svg
```

See [Manifest](/docs/solutions/manifest), [Packaging](/docs/solutions/packaging),
and [Publishing](/docs/solutions/publishing).

## Managed storage

Logical collection names in YAML become physical Mongo collections
`{solution_slug}__{logical}` (for example `restaurant_pro__reservations`).

**Workflow insert**

```yaml
- id: create
  type: tool
  tool: storage/insert
  params:
    collection: reservations
    document:
      customer_name: "{{ variables.guest_name }}"
      status: confirmed
```

**UI source**

```yaml title="ui/sources.yaml"
- id: reservations
  type: connector
  target: storage/find
  params:
    collection: reservations
    limit: 50
```

(`type: connector` + `storage/*` target is the declared source shape; the
host routes these through managed storage, gated on `storage.read`.)

Documents returned to the UI have:

- `_id` / `id` as plain strings (not `{$oid:…}`)
- dates as ISO-8601 strings (not `{$date:…}`)

Full reference: [Managed storage](/docs/solutions/managed-storage).

## Declarative UI patterns

### Pages and navigation

Declare pages in `ui/pages.yaml`, wire them in `ui/navigation.yaml`, and
place widgets with spans. See [Pages](/docs/solutions/pages),
[Navigation](/docs/solutions/navigation), [Layouts](/docs/solutions/layouts).

### Staff CRUD (form → workflow)

1. Add a `form` widget with `action.trigger: staff-*-create`.
2. Add a webhook workflow that calls `storage/insert` or `storage/update`.
3. List data with a `table` widget bound to a `storage/find` source.
4. Clicking a table row stores selection for `prefill_from_selection` forms.

```yaml title="ui/widgets.yaml (excerpt)"
- id: menu_create_form
  type: form
  title: Add menu item
  options:
    fields:
      - { name: name, label: Dish name, type: text, required: true }
      - { name: price, label: Price, type: number, required: true }
    submit_label: Add to menu
    action:
      trigger: staff-menu-create
```

Form field types: `text`, `number`, `date`, `time`, `select`. Selects with
options `true` / `false` are submitted as booleans.

Table columns may use a fallback key:

```yaml
- { key: order_number, header: Order, fallback: id }
```

Widget catalogue: [Forms](/docs/solutions/widgets/form),
[Tables](/docs/solutions/widgets/table), and siblings under Widgets.

### Floor plan (map widget)

Use `type: map` with `kind: floor` and `x` / `y` (0–100) on table documents:

```yaml
- id: tables_map
  type: map
  title: Floor plan
  source: tables
  options:
    kind: floor
    label_field: name
    x_field: x
    y_field: y
```

### CRM lite

Pattern used by `restaurant-pro`:

| Piece | Approach |
| --- | --- |
| Collection | `customers` (`name`, `phone`, `email`, `vip`, `visit_count`, …) |
| List / VIP | Two sources — all customers vs `filter: { vip: true }` |
| Upsert | Staff form → `staff-customer-upsert` (find by phone → update or insert) |
| Offers | Form → `staff-offer-notify` → insert `offers` + emit `offer.queued` |
| Auto-capture | Reservation / takeaway flows also `storage/insert` into `customers` |

## Brand customization (per install)

Package `ui/theme.yaml` sets **defaults**. Tenants override brand via
**installation settings** (Install wizard or Installed → Configure).

| Setting key | Type | Effect |
| --- | --- | --- |
| `business_name` | string | UI header + prompt variables |
| `logo_url` | url | HTTPS logo (overrides package asset) |
| `background_image_url` | url | Full-bleed shell background |
| `primary_color` | color | `--sui-primary` |
| `secondary_color` | color | `--sui-secondary` |
| `accent_color` | color | `--sui-accent` |
| `background_color` | color | `--sui-bg` |

Declare them under `settings:` in the manifest (`type: string | number |
boolean | color | url`). At UI bundle load, the platform overlays non-empty
values onto the theme / name / logo.

Also request `theme.get` and ship `ui/theme.yaml` — see
[Themes](/docs/solutions/themes).

### Workspace scoping

Installs and settings are **workspace-scoped**. The portal subdomain and
UI host pass `workspace_id` when loading the UI bundle so brand and data
match the workspace install (not a legacy tenant-level row).

## Hosting surfaces

| Surface | URL shape |
| --- | --- |
| In-portal UI | `https://app.qefro.com/app/solutions/ui/{name}/…` |
| Solution subdomain | `https://{slug}.portal.qefro.com/…` (e.g. `restaurant-pro`) |

Same JWT session as the portal. Same engines (theme, nav, widgets, data).

## Build, publish, install

```bash
qefro solution build .
qefro solution publish
qefro solution install my-app
# upgrade existing workspace install:
# POST /api/v1/installations/my-app/upgrade
#   { "target_version": "1.5.0" }  (+ workspace_id as needed)
```

Platform prerequisites for storage-backed apps: `storage-service` + Mongo
database `managed_apps`. See [Managed storage](/docs/solutions/managed-storage)
and [Deployment](/docs/solutions/installation).

## Reference: restaurant-pro

[`restaurant-pro`](/docs/solutions/examples/restaurant-pro) (**1.5.0+**)
demonstrates the full managed-app stack:

- Managed storage collections (reservations, menu, tables, orders,
  customers, offers, …)
- Staff forms for menu, floor tables, customers, offers
- Brand settings (name, logo URL, colors, background image)
- Widget + WhatsApp conversation flows with storage persistence

## Related docs

- [Overview](/docs/solutions/overview) — principles and platform rules
- [Quickstart](/docs/solutions/quickstart) — scaffold to first install
- [Managed storage](/docs/solutions/managed-storage) — ADR-002 document plane
- [Workflows](/docs/solutions/workflows) — ask / tool / notify / branch
- [Capabilities](/docs/solutions/capabilities) — negotiation and grants
- [Troubleshooting](/docs/solutions/troubleshooting) — common publish/runtime failures
