---
title: "Entity Schema"
description: "Complete reference for entity YAML — field types, relations, person identity, image fields, enum fields, status events, code allocation, and customer scoping."
sidebar_label: "Entity Schema"
---

# Entity Schema

Entities are the data model of a Marketplace App. Each entity YAML file
under `entities/` declares a named type with typed fields, optional
status-event mappings, and human-readable code allocation. The runtime
interprets this metadata to provide storage, validation, UI rendering,
and flow integration — no custom code required.

## File structure

```yaml title="entities/property.yaml"
id: property                          # optional — defaults to filename
name: Property                        # display name
description: Listable property        # one-line summary
allocate_code:                        # optional auto-code allocation
  prefix: P-
  start: 1001
fields:
  - name: title
    type: string
    required: true
  - name: price
    type: float
  - name: status
    type: enum
    enum_values: [draft, listed, sold]
status_events:                        # optional status → event map
  listed: property.status_changed
  sold: property.status_changed
```

| Top-level key | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | No | Entity id; defaults to the filename without `.yaml`. Must match the id used in `manifest.yaml` → `entities:` and in flow `tool` references. |
| `name` | string | Yes | Human-readable display name for portal and UI. |
| `description` | string | No | One-line summary shown in tool-tips and entity pickers. |
| `scope` | string | No | `customer` scopes records to the authenticated Person — see [Customer scoping](#customer-scoping). |
| `allocate_code` | object | No | Auto-generates human-readable codes — see [Code allocation](#code-allocation). |
| `fields` | list | Yes | Ordered field definitions — see [Field types](#field-types). |
| `status_events` | map | No | Maps status values to business event names — see [Status events](#status-events). |

## Field types

Every field has a `type` that controls validation, storage, UI rendering,
and flow behavior.

### string

Free-form text. Stored as-is. Rendered as a single-line text input.

```yaml
- name: title
  type: string
  required: true
```

### integer

Whole number. Stored as JSON integer. Rendered as a numeric input.

```yaml
- name: bedrooms
  type: integer
```

### float

Decimal number. Stored as JSON number. Rendered as a numeric input.

```yaml
- name: price
  type: float
```

### date

Calendar date (no time). Stored as ISO 8601 date string (`2026-09-15`).
Rendered as a date picker.

```yaml
- name: date
  type: date
  required: true
```

### datetime

Date and time. Stored as ISO 8601 datetime string. Rendered as a
date-time picker.

```yaml
- name: scheduled_at
  type: datetime
```

### enum

Constrained set of values. The runtime validates input against
`enum_values` and renders a dropdown or button group.

```yaml
- name: status
  type: enum
  enum_values:
    - draft
    - listed
    - under_offer
    - sold
    - withdrawn
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `enum_values` | string[] | Yes | Allowed values. First value is the default for new records. |

### image

URL reference to an uploaded image. The runtime handles media upload via
the solution UI and stores the URL. In flows, image fields are detected
for channel delivery (WhatsApp, widget) — see [Image delivery in flows](#image-delivery-in-flows).

```yaml
- name: image_url
  type: image
  description: Primary property photo
```

### person

Link to a Customer Hub Person. This is the identity field that enables
customer scoping — see [Person fields and identity](#person-fields-and-identity).

```yaml
- name: person_id
  type: person
  description: Existing Qefro Person identity (Customer Hub)
  ref_entity: person
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `ref_entity` | string | Yes | Must be `person`. Links to the Customer Hub Person table. |

### relation

Cross-entity reference. Stores a reference to another entity record by
code or UUID. The runtime can expand relations into full objects for
trusted queries — see [Relation fields](#relation-fields).

```yaml
- name: travel_package
  type: relation
  required: true
  description: Travel package reference
  ref_entity: travel_package
```

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `ref_entity` | string | Yes | Target entity id. Must match an entity declared in the same app. |

### email

Email address. Validated as email format. Rendered as an email input.

```yaml
- name: email
  type: email
```

### phone

Phone number. Stored as-is. Rendered as a tel: link in UI.

```yaml
- name: phone
  type: phone
```

### url

URL reference. Stored as-is. Rendered as a clickable link.

```yaml
- name: document_url
  type: url
```

### Field property reference

| Property | Type | Applies to | Description |
| --- | --- | --- | --- |
| `name` | string | All | Field identifier. snake_case. Used in flow `input_map` and UI bindings. |
| `type` | string | All | Field type — see types above. |
| `required` | boolean | All | If `true`, the runtime rejects records missing this field. |
| `description` | string | All | Display text for UI labels and tool-tips. |
| `enum_values` | string[] | `enum` | Allowed values. |
| `ref_entity` | string | `person`, `relation` | Target entity for the reference. |

## Person fields and identity

The `person` field type links a record to a Customer Hub Person — the
authenticated individual interacting through WhatsApp, widget, or API.

### Who vs what

A critical distinction in Qefro:

- **WHO** = Customer Hub Person (`person_id`) — the authenticated
  individual. The runtime injects this automatically from the
  conversation's verified identity.
- **WHAT** = Business entity (Lead, Booking, Reservation) — the
  business record created during a flow.

```yaml
# viewing.yaml — the business entity
scope: customer
fields:
  - name: property_title
    type: string
  - name: person_id           # WHO — injected by runtime
    type: person
    ref_entity: person
```

The runtime **never** trusts `person_id`, `customer_id`, `email`, or
`phone` values supplied by the LLM or user input. Identity comes from
the authenticated session only.

### Automatic identity injection

When a flow creates a customer-scoped record, the runtime injects
`person_id` from the authenticated context. The flow does not need to
collect or pass this value — it is added automatically by the
RuntimeAdapter.

```yaml
# Flow input_map does NOT include person_id
input_map:
  property_title: property_title
  date: date
  time: time
# person_id is injected by runtime from auth context
```

## Relation fields

Relations link one entity to another within the same app. The runtime
resolves references by code (human-readable id like `P-1001`) or UUID.

### Defining a relation

```yaml
# booking.yaml
fields:
  - name: traveler
    type: relation
    required: true
    ref_entity: traveler       # target entity
  - name: travel_package
    type: relation
    required: true
    ref_entity: travel_package
  - name: assigned_agent
    type: relation
    ref_entity: agent
```

### How references work

1. **Create**: Pass the target entity's `code` (e.g., `TVL-1001`) or
   UUID. The runtime resolves to the canonical UUID reference.
2. **Read**: The stored value is the target record's UUID.
3. **Expand**: Trusted flow constants can request relation expansion,
   which returns the full target object alongside the reference.

### Trust boundary

Relation expansion is **trusted metadata** — configured in the flow's
`constants` block, not in user input. The runtime strips any `expand`
directive from LLM-generated parameters and only honors expansions
declared in the flow's trusted constants.

```yaml
# Trusted expansion in flow constants
constants:
  expand: traveler,travel_package
```

See [Runtime Execution](/docs/solutions/runtime-execution) for details
on the trust boundary.

## Image delivery in flows

Fields with `type: image` are detected by the runtime for channel
delivery. When a flow's `message` step follows a `tool` step that
returned records with image fields, the runtime extracts the image URLs
and delivers them via the appropriate channel:

- **WhatsApp**: Sends the image as a media message
- **Widget**: Renders the image inline in the chat

The runtime determines which fields are images from the entity metadata
— flows do not need to handle media explicitly.

```yaml
# property entity
fields:
  - name: image_url
    type: image    # runtime detects this for media delivery

# flow message step
- id: show_results
  type: message
  message: |
    Here are matching properties:
    {{items_text}}
  # Images from property.image_url are delivered automatically
```

## Status events

Entities can map status transitions to business events. When a record's
status field changes, the runtime emits the corresponding event.

```yaml
status_events:
  listed: property.status_changed
  under_offer: property.status_changed
  sold: property.status_changed
  withdrawn: property.status_changed
```

| Status value | Event emitted |
| --- | --- |
| `listed` | `property.status_changed` |
| `under_offer` | `property.status_changed` |
| `sold` | `property.status_changed` |

The runtime also emits standard mutation events:

| Operation | Event |
| --- | --- |
| Create | `{entity}.created` |
| Update | `{entity}.updated` |
| Update with status change | `{entity}.updated` + status event |
| Delete | `{entity}.cancelled` |

All events must be declared in `manifest.yaml` → `events:`.

## Code allocation

Human-readable codes are auto-generated for entities that declare
`allocate_code`. Codes appear in the UI and are used as references in
flows and relations.

```yaml
allocate_code:
  prefix: P-        # code prefix
  start: 1001       # first number
```

| Entity | Prefix | Example code |
| --- | --- | --- |
| Property | `P-` | `P-1001` |
| Viewing | `VW-` | `VW-1001` |
| Appointment | `AP-` | `AP-1001` |
| Booking | `BK-` | `BK-1001` |
| Reservation | `R-` | `R-1001` |

Codes are immutable once allocated. The runtime increments the counter
for each new record.

## Customer scoping

Entities with `scope: customer` are automatically scoped to the
authenticated Person. The runtime enforces this at the storage layer:

- **List**: Only returns records where `person_id` matches the caller
- **Create**: Automatically injects `person_id` from auth context
- **Get/Update/Delete**: Verifies the record belongs to the caller

```yaml
id: viewing
scope: customer        # enables person-scoping
fields:
  - name: person_id
    type: person
    ref_entity: person
  # ... other fields
```

Rules:

1. Customer-scoped entities **must** declare a `person` field.
2. The runtime identifies the person field via entity metadata — it
   does not hardcode `person_id` as a field name.
3. Portal users (staff) bypass person-scoping — they can access all
   records in their workspace.
4. WhatsApp and widget users are always person-scoped.

## Complete example

```yaml title="entities/viewing.yaml"
id: viewing
scope: customer
name: Viewing
description: Property viewing appointment bound to Person
allocate_code:
  prefix: VW-
  start: 1001
fields:
  - name: property_title
    type: string
    required: true
  - name: lead_name
    type: string
    description: Display name (auto-filled from Person.name if available)
  - name: agent_name
    type: string
  - name: scheduled_at
    type: datetime
  - name: date
    type: date
    required: true
  - name: time
    type: string
  - name: status
    type: enum
    enum_values:
      - scheduled
      - confirmed
      - completed
      - cancelled
      - no_show
  - name: notes
    type: string
  - name: person_id
    type: person
    description: Existing Qefro Person identity (Customer Hub)
    ref_entity: person
status_events:
  confirmed: viewing.updated
  completed: viewing.updated
  cancelled: viewing.cancelled
  no_show: viewing.updated
```

## Related topics

- [Manifest](/docs/solutions/manifest) — declaring entities in the app manifest
- [Workflows](/docs/solutions/workflows) — using entities in flows
- [Flow Parameters](/docs/solutions/flow-parameters) — mapping flow variables to entity fields
- [Runtime Execution](/docs/solutions/runtime-execution) — how the runtime processes entity operations
- [Customer Hub](/docs/developer/customer-hub) — Person identity API
- [Security](/docs/solutions/security) — tenant isolation and trust boundaries
