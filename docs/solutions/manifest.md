---
title: "Manifest"
description: "Complete reference for manifest.yaml — identity, connector dependencies, channels, workflows, permissions, settings and the UI section."
sidebar_label: "Manifest"
---

# Manifest

`manifest.yaml` is the root of every solution package. It declares
identity, dependencies, permissions and branding. The registry validates
the manifest before anything else — most publish failures are manifest
failures.

## Complete example

The canonical `restaurant-pro` manifest:

```yaml title="manifest.yaml"
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
  - storage
  - sdk
connectors: []
channels:
  - widget
  - whatsapp
flows:
  - reservation
  - reservation-reminder
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

## Field reference

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique solution id. **kebab-case**: lowercase letters, digits, `-`; must start with a letter. |
| `name` | string | Yes | Human-readable display name. |
| `version` | string | Yes | Semver version of this package. Immutable once published. |
| `hosting` | string | Yes* | `managed` or `external` — how the SDK `/qefro` process is reached (*required for ADR-003 apps). |
| `endpoint` | string | Yes* | Base URL of the SDK process (platform calls `{endpoint}/qefro`). |
| `description` | string | No | One-line summary shown in the marketplace. |
| `category` | string | No | Marketplace grouping, e.g. `hospitality`, `healthcare`, `retail`. |
| `tags` | string[] | No | Search keywords. |
| `connectors` | list | No | Connector dependencies — plain names or `name` + semver `version` constraint. |
| `channels` | string[] | No | Channels the solution participates in (`widget`, `whatsapp`, `api`). |
| `flows` | string[] | No | Workflow ids shipped under `workflows/`. Each id must resolve to a definition file. |
| `permissions` | string[] | No | Plane permissions (`workflow.execute`, `storage.read` / `write` / `update` / `delete`, `customer.read`, …). |
| `capabilities` | string[] | No | Host UI capabilities requested by the UI; negotiated at install. See [Capabilities](/docs/solutions/capabilities). |
| `settings` | list | No | Tenant-configurable settings; plain keys or full definitions. |
| `ui` | object | No | UI branding block: `name`, `logo`, `icon`. |

### Validation rules

- `id` must be kebab-case (`restaurant-pro`); `Restaurant_Pro` is rejected.
- `name` and `version` must be non-empty.
- Every connector dependency must name a connector resolvable in the
  registry at install time.
- Every `flows` entry must match a definition in `workflows/` — missing
  files fail the build, not publish.

## Connector dependencies

Two forms are accepted:

```yaml
connectors:
  - restaurant-pos                     # any published version
  - name: restaurant-pos               # semver constraint
    version: ">=1.0.0"
```

Constraints are resolved against the registry during installation. If no
published version satisfies a constraint, installation fails cleanly —
nothing is activated. See [Connectors](/docs/solutions/connectors).

:::tip
Apps that own their documents set `connectors: []`, ship `src/` +
`hosting`/`endpoint`, and use [managed storage](/docs/solutions/managed-storage)
from inside the SDK (`ctx.storage`). Do **not** declare a connector named
`storage` (or other reserved SDK namespaces) — publish rejects those names.
:::

## Permissions

`permissions` declare what the installation may do on the plane. They gate
UI capability negotiation at install time:

| Permission | Enables capability |
| --- | --- |
| `workflow.execute` | `workflow.trigger` — UI can trigger this solution's workflows |
| `customer.read` | `customer.query` — UI can query customer-hub data |
| `runtime.read` | `runtime.query` — UI can read runtime metrics/executions/workflows |
| `storage.read` | `storage.read` — SDK may find/get documents via `ctx.storage` |
| `storage.write` | `storage.write` — SDK may insert documents |
| `storage.update` | `storage.update` — SDK may patch documents |
| `storage.delete` | `storage.delete` — SDK may soft-delete documents |

`restaurant-pro@1.7.0` declares `workflow.execute` plus the full
`storage.*` set so the SDK app can persist; UI/workflows call
`restaurant-pro/restaurant.*` tools. Reference:
[Capabilities](/docs/solutions/capabilities).

## Settings

Settings are tenant-configurable values collected at install time. Two
forms:

```yaml
settings:
  - default_covers                  # plain key → optional string setting
  - key: reservation_lead_time      # full definition
    type: number
    required: true
    default: 30
    description: Minutes before arrival when reminders are sent
```

Full-definition fields: `key`, `type` (`string`, `number`, `boolean`),
`required`, `default`, `description`.

:::caution
Settings are merged on upgrade; keys are never removed automatically. Keep
keys stable across versions and never repurpose a key's meaning.
:::

## The `ui` section

```yaml
ui:
  name: Restaurant Pro        # display name used in portal chrome
  logo: assets/logo.svg       # package-relative image reference
  icon: assets/icon.svg       # package-relative image reference
```

The `ui:` block is the entry point for the declarative UI. The full UI —
theme, navigation, pages, layouts, widgets and sources — lives under `ui/`
and is assembled into the tenant bundle at install time. Image references
must point at files under `assets/` with an allowed extension
([Assets](/docs/solutions/assets)).

## Versioning guidance

- **Patch** (`1.0.x`) — copy fixes, theme tweaks, widget option changes.
- **Minor** (`1.x.0`) — new pages/widgets/workflows, new optional settings.
- **Major** (`x.0.0`) — removed capabilities, renamed workflows, changed
  setting semantics.

Versions are immutable: fixing a mistake means publishing the next
version, see [Publishing](/docs/solutions/publishing).

## Related topics

- [Managed storage](/docs/solutions/managed-storage)
- [Validation](/docs/solutions/validation) — every check applied to the manifest
- [Packaging](/docs/solutions/packaging) — how the manifest enters the signed package
- [restaurant-pro example](/docs/solutions/examples/restaurant-pro)
