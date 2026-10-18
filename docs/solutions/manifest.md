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
| `events` | string[] | No | Declared Business Event names (manifest list — there is no `events/` directory). See the note below: this is a **declaration**, not a switch that turns emission on. |
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

## Events

`events:` is a **declaration list**, and the runtime does not read it when it
decides what to emit. Three concrete consumers were verified:

| Consumer | What it does with `manifest.events` |
| --- | --- |
| Publish validation | Names are checked for duplicates and grammar; each `.`-separated part must be non-empty and only `a-z A-Z 0-9 _ -`. Errors: `events: '{name}' must be namespaced (e.g. reservation.created)`, `events: invalid event name '{name}'`. |
| Publish validation | `require_set_match("events", …)` compares the manifest list against the `events` component of the package — both directions. Rendered as `events: manifest references event declaration '{name}' which is missing from the package` and `events: event declaration '{name}' is not referenced by the manifest`. |
| `automation_templates` | `manifest.yaml: automation_templates '{id}': event '{event}' is not declared in events` — a template's `trigger.event` **must** appear in `events:`. |
| Chat context | `solution-service/src/api/chat_context.rs:279` copies `manifest.events` into the per-installation descriptor, so the agent can see which events the app advertises. |

Entity mutation events are **not** gated on this list. For every `hosting:
runtime` entity, the runtime emits `{entity}.created`, `{entity}.updated` and
`{entity}.cancelled` on successful mutations regardless of what `events:`
declares — see [Entity schema → Status events](/docs/solutions/entity-schema#status-events).
Declaring `reservation.created` therefore documents and advertises the event;
it does not enable it, and omitting it does not silence it.

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
Marketplace Apps (`hosting: runtime`) define their domain models under `entities:`
and omit `endpoint`. There is no `src/` directory, and no custom application
server is run. Tools targeting declared entities (`entity.<id>.*`) execute
natively in Qefro Runtime against managed storage.
:::

## Permissions

`permissions` declare what the installation may do on the plane. They gate
UI capability negotiation at install time:

| Permission | Effect |
| --- | --- |
| `workflow.execute` | Enables the `workflow.trigger` UI capability |
| `customer.read` | Enables the `customer.query` UI capability |
| `storage.read` / `storage.write` / `storage.update` / `storage.delete` | Each requires the **identical** string on both sides (ADR-002) |
| `marketing.read` / `marketing.write` | Exact-string match (ADR-004) |
| `organization.read` / `organization.write` / `organization.task.execute` | Exact-string match (ADR-005) |
| any other capability | Granted only when a permission with that exact name is declared |

`theme.get`, `user.get`, `tenant.get` and `runtime.query` are **always**
granted to an installed UI — they are not permission-driven, so declaring
`runtime.read` is not what unlocks `runtime.query`. `connector.invoke` is
granted when the package declares at least one connector, regardless of the
permission strings.

`storage.read` / `write` / `update` / `delete` gate the Runtime storage
capability names during negotiation. They do not implement a staff RBAC
check: `app_rbac_authz.rs` resolves staff roles from a separate source, so a
permission string in the manifest is metadata for the RBAC path.

Canonical packages (such as `restaurant-pro-runtime`) declare `workflow.execute`
plus `storage.*` so Runtime entity tools can persist records; UI sources use
`type: entity`. Reference: [Capabilities](/docs/solutions/capabilities) and
[Permissions and scope](/docs/solutions/permissions-and-scope).

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

Full-definition fields: `key`, `type` (`string`, `number`, `boolean`,
`color`, `url`; `setting_type` is accepted as an alias, default `string`),
`required`, `default`, `description`. The declared `default` must match the
declared type or publish fails.

:::caution Upgrades prune undeclared keys
Two different functions act on stored settings:
`merge_install_settings` is a read-modify-write overlay — keys present in the
request overwrite, keys absent are preserved, and an explicit JSON `null`
**deletes** a key. `prune_undeclared_settings` runs on upgrade and drops any
key the target package no longer declares, except host keys (a leading `_`,
`navigation_layout`, `flow_enabled`, `flow_enabled.*`).
Keep keys stable across versions and never repurpose a key's meaning.
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
    identity: person_name      # person_name | email | phone
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

`kind` is parsed by `conversation_protocol.rs:54-66`, which is
case-insensitive and also accepts the aliases `number`/`int` (integer), `id`
(document_id) and `name` (person_name). **Any unrecognised value falls back to
`string` silently** — there is no publish error for a misspelled kind.
`chip_value` accepts `last_segment` or `last`; everything else, including a
typo, resolves to `remainder`.
Publish performs no checks on `conversation_slots` at all — no duplicate
`id` test, no `kind` whitelist, no `identity` whitelist — because the section
is deserialized straight from `manifest.yaml` (`manifest.rs:62-63`). A
misspelled key is dropped by serde, not reported.

Chip taps use `{chip_prefix}:{value}` (already the protocol for time/table
buttons). Typed labels map through `choices`. Confirmation (`yes`) is a
generic Runtime primitive; *when* to confirm is the app’s
`match.confirmation.reply_signals` / `required_slots`. Runtime may understand
protocol keys (`conversation_slots`, `required_slots`, `forbidden_slots`,
`reply_signals`, `confirmation`, `identity_challenge`, `chip_prefix`,
`chip_value`). `ConversationSlot` additionally accepts `chip_label_slot` and
`quantity_suffixes` — see [Attribute inventory](/docs/solutions/attribute-inventory)
for the full set and each field's reader.
Slot `id` values (`guest_name`, `order_id`, `visit_type`, …)
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

## Triggers

Triggers map user intents to workflows. When a user sends a message
that matches a trigger's intent utterances, the runtime starts the
associated workflow.

```yaml
triggers:
  - id: request_viewing
    workflow: request-viewing
    input_variable: viewing_input
    match:
      intents:
        - schedule a viewing
        - book a viewing
        - arrange a viewing
        - view the property
      confirmation:
        reply_signals:
          - viewing
          - scheduled
          - booked
        required_slots:
          - property_title
          - date
    confirmation_message: Viewing scheduled for {{property_title}} on {{date}}.
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Trigger identifier. Unique within the app; empty is rejected. |
| `workflow` | string | Yes | Workflow id to start. Must match an entry in `flows:`. |
| `input_variable` | string | No | Variable name for the trigger's input context. Defaults to `{workflow with - → _}_input` (`manifest.rs:416`). |
| `match` | object | No | Matching configuration (`#[serde(default)] Option`). |
| `match.intents` | string[] | No | Example utterances. The runtime lowercases them and looks for them as **substrings** of the conversation. |
| `match.confirmation` | object | No | Confirmation behaviour used by the same matcher. |
| `match.confirmation.reply_signals` | string[] | No | Substrings sought in the latest reply plus the last four assistant turns. |
| `match.confirmation.slot_schema` | string | No | Present in `TriggerMatch`; no runtime reader was found in this pass — **unverified**. |
| `match.confirmation.required_slots` | string[] | No | Slots that must all be present for the trigger to be at full score. Missing ones cost −3 points; they do not disqualify. |
| `match.confirmation.forbidden_slots` | string[] | No | If any of these slots is present, the trigger is skipped outright. |
| `identity` | object | No | `identity.widget` / `identity.whatsapp`, read per channel at `solutions_plane.rs:516-522`. Only the exact value `otp_contact` branches; any other string is carried but has no effect (**partially supported**). |
| `confirmation_message` | string | No | Template message sent after successful completion. Supports `{{ variable }}` interpolation. |

Publish enforces only the structural contract
(`solution/validator.rs:237-262`): `manifest.yaml: triggers[].id must be
non-empty`, `manifest.yaml: duplicate trigger id '{id}'`, and
`manifest.yaml: trigger '{id}' references workflow '{workflow}' not declared
in flows`. All three are HTTP 400 `invalid_manifest`. Nothing checks that
`intents` is non-empty — a trigger with no `match` block publishes and simply
never fires.

### How matching works

Verified against `ai-customer-support/crates/api/src/routes/solutions_plane.rs:930-1019`
(`match_trigger`). There is **no embedding, no vector search and no cosine
threshold**. The matcher is literal, case-folded substring containment:

1. Build three corpora from the conversation: the whole history lowercased
   (`hist`), the last six user turns (`recent_user`), and the last four
   assistant turns appended to the incoming message (`signal_corpus`).
2. Skip triggers whose workflow starts with `staff-`, contains `reminder`, or
   starts with `list-`, `get-`, `lookup-`, `browse-`, `check-`. These never
   auto-fire from chat.
3. `signal_hit` = any `reply_signals` entry is a substring of
   `signal_corpus` → **+10**.
4. `intent_hit` = any `intents` entry is a substring of `recent_user` **or**
   `hist` → **+5**.
5. Gate: if there are no signals configured, an `intent_hit` is mandatory; if
   signals are configured but neither hit fires, the trigger is skipped.
6. `forbidden_slots` present → skip. `required_slots` incomplete → −3.
7. Highest score wins (ties keep the earlier trigger). Score must be > 0.

Practical consequences for utterance design: intents must appear as written
("book a table" matches "I want to **book a table** please", not "reserve a
table"), and they match anywhere in the six-turn user window — so an overly
generic intent such as `table` will keep firing. Prefer distinctive multi-word
phrases over single words.

### Complete example (Real Estate Pro)

```yaml
triggers:
  - id: request_viewing
    workflow: request-viewing
    match:
      intents:
        - schedule a viewing
        - book a viewing
        - arrange a viewing
      confirmation:
        reply_signals: [viewing, scheduled, booked]
        required_slots: [property_title, date]
    confirmation_message: Viewing scheduled for {{property_title}} on {{date}}.

  - id: cancel_viewing
    workflow: cancel-viewing
    match:
      intents:
        - cancel my viewing
        - cancel the viewing
      confirmation:
        reply_signals: [cancelled]
        required_slots: [id]
    confirmation_message: Viewing {{id}} cancelled.

  - id: search_properties
    workflow: search-properties
    match:
      intents:
        - search properties
        - show listings
        - browse properties
      confirmation:
        reply_signals: [properties, listings]
        required_slots: [property_type, city]
    confirmation_message: Here are matching properties.
```

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
