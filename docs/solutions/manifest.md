---
title: "Manifest"
description: "Complete reference for manifest.yaml — identity, hosting (runtime | managed | external), entities, workflows, events, permissions, settings and the UI section."
sidebar_label: "Manifest"
---

# Manifest

`manifest.yaml` is the root of every solution package. It declares
identity, hosting, entities, dependencies, permissions and branding. The
registry validates the manifest before anything else — most publish
failures are manifest failures.

## Complete example (default — `hosting: runtime`)

The canonical `restaurant-pro-runtime` manifest:

```yaml title="manifest.yaml"
id: restaurant-pro-runtime
name: Restaurant Pro
version: 0.1.0
hosting: runtime
description: Table reservations and menu as a metadata Marketplace App executed by Qefro Runtime
category: hospitality
tags:
  - restaurant
  - reservations
  - runtime
channels:
  - widget
  - whatsapp
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
capabilities:
  - theme.get
  - user.get
  - tenant.get
  - runtime.query
  - workflow.trigger
  - storage.read
  - storage.write
triggers:
  - id: book_table
    workflow: create-reservation
    input_variable: reservation_input
    match:
      intents:
        - book a table
        - reserve a table
ui:
  name: Restaurant Pro
```

SDK Connections (`hosting: external`) add `endpoint` and `src/` — they
are not Marketplace Apps. See [Runtime vs SDK](/docs/solutions/runtime-vs-sdk).

## Field reference

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique solution id. **kebab-case**: lowercase letters, digits, `-`; must start with a letter. |
| `name` | string | Yes | Human-readable display name. |
| `version` | string | Yes | Semver version of this package. Immutable once published. |
| `hosting` | string | Yes | `runtime` (Marketplace App) or `external` (SDK Connection). `managed` is rejected. |
| `endpoint` | string | No* | SDK process URL. **Forbidden** for `hosting: runtime` (except the sentinel `runtime://`). Required for `external`. |
| `description` | string | No | One-line summary shown in the marketplace. |
| `category` | string | No | Marketplace grouping, e.g. `hospitality`, `healthcare`, `real-estate`. |
| `tags` | string[] | No | Search keywords. |
| `entities` | list | Yes* | Entity ids shipped under `entities/` (*required for `hosting: runtime`). |
| `connectors` | list | No | Connector dependencies — plain names or `name` + semver `version` constraint. |
| `channels` | string[] | No | Channels the solution participates in (`widget`, `whatsapp`, `api`). |
| `flows` | string[] | No | Workflow ids shipped under `workflows/`. Each id must resolve to a definition file. |
| `events` | string[] | No | Business event names the app emits (manifest list — there is no `events/` directory). |
| `permissions` | string[] | No | Plane permissions (`workflow.execute`, `storage.read` / `write` / `update` / `delete`, `customer.read`, …). |
| `capabilities` | string[] | No | Host UI capabilities requested by the UI; negotiated at install. See [Capabilities](/docs/solutions/capabilities). |
| `settings` | list | No | Tenant-configurable settings; plain keys or full definitions. |
| `triggers` | list | No | Intent → workflow map for chat. |
| `conversation_slots` | list | No | Slot harvest for Runtime (ADR-006). |
| `ui` | object | No | UI branding block: `name`, `logo`, `icon`. |

### Validation rules

- `id` must be kebab-case (`restaurant-pro-runtime`); `Restaurant_Pro` is rejected.
- `name` and `version` must be non-empty.
- `hosting: runtime` requires at least one file under `entities/` and must
  not declare an external `/qefro` endpoint.
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
Metadata Marketplace Apps (`hosting: runtime`) set `entities:` and omit
`endpoint`. SDK-hosted apps set `connectors: []` (when self-contained),
ship `src/` + `hosting`/`endpoint`, and use [managed storage](/docs/solutions/managed-storage)
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

`restaurant-pro-runtime` declares `workflow.execute` plus `storage.*` so
Runtime entity tools can persist; UI sources use `type: entity`.
SDK-hosted `restaurant-pro` instead calls `restaurant-pro/restaurant.*`
tools. Reference: [Capabilities](/docs/solutions/capabilities).

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

## Conversation slots (ADR-006)

Apps declare the fields Runtime should harvest from WhatsApp/widget chat.
Runtime never hardcodes those names.

```yaml
conversation_slots:
  - id: guest_name
    labels: [guest name, guest, name]
    kind: person_name          # string | integer | date | time | phone | email | document_id | person_name | choice
    identity: person_name      # optional: person_name | email | phone
    aliases: [customer_name]
  - id: check_in
    labels: [check in, check-in]
    kind: date
  - id: room_type
    labels: [room type, room]
    kind: choice
    chip_prefix: room          # chip id `room:deluxe`
    chip_value: remainder      # remainder | last_segment
    choices:
      deluxe: [deluxe, deluxe room]
```

Chip taps use `{chip_prefix}:{value}` (already the protocol for time/table
buttons). Typed labels map through `choices`. Confirmation (`yes`) is a
generic Runtime primitive; *when* to confirm is the app’s
`match.confirmation.reply_signals` / `required_slots`. Runtime may understand
protocol keys (`conversation_slots`, `required_slots`, `forbidden_slots`,
`reply_signals`, `confirmation`, `identity_challenge`, `chip_prefix`,
`chip_value`). Slot `id` values (`guest_name`, `order_id`, `visit_type`, …)
are opaque app vocabulary — never special-cased, even if common.

Capability / tool output should return a generic result:

```json
{ "status": "confirmed", "reference": { "type": "opaque", "value": "R-12345" } }
```

Runtime displays or stores `reference.value` without interpreting prefixes
like `R-`.

Packages that omit `conversation_slots` still work: Runtime infers slots
from trigger `required_slots` and chat-tool parameter names (labels = id
with underscores turned into spaces). Extra labels (`Name:` → `guest_name`)
need an explicit declaration.

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
- [restaurant-pro-runtime example](/docs/solutions/examples/restaurant-pro-runtime)
- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
