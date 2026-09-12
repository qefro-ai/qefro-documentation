---
title: "Flow Parameters"
description: "How flow steps receive data — input_map syntax, constants, $literal and $constants prefixes, dotted key nesting, variable sources, and the trust boundary between user input and trusted metadata."
sidebar_label: "Flow Parameters"
---

# Flow Parameters

Every `tool` step in a Business Flow receives its parameters from a
combination of sources: collected user input, flow constants, literal
values, and runtime-injected context. Understanding where each value
comes from — and which sources are trusted — is essential for building
correct and secure Marketplace Apps.

## Parameter sources

| Source | Example | Authority | Description |
| --- | --- | --- | --- |
| User input | `date`, `property_title` | Conversational | Collected via `ask` steps from the user's messages. The LLM extracts values from natural language. |
| Flow variable | `practitioner_name` | Flow state | A value stored in the flow's variable context — may come from a previous tool step's output or an `ask` step. |
| `input_map` | `filter.status: $literal:open` | Mapping | Maps flow variables to tool parameter names. Supports dotted keys for nested objects. |
| Constant | `status: scheduled` | Trusted metadata | Declared in the flow's `constants` block. Immutable per flow definition. |
| Runtime context | `workspace_id`, `person_id` | Trusted runtime | Injected automatically by the runtime. Cannot be overridden by user input or LLM. |
| Customer identity | `person_id` | Trusted identity | The authenticated Customer Hub Person. Injected from the session's verified identity. |

## input_map

The `input_map` block on a `tool` step maps tool parameter names to
values from the flow's variable context.

### Basic mapping

```yaml
- id: run
  type: tool
  tool: entity.viewing.create
  execution: runtime
  input_map:
    property_title: property_title    # flow var → tool param
    date: date
    time: time
    notes: notes
```

Each key is a **tool parameter name**. Each value is a **reference** to
a flow variable. The runtime reads the variable and passes it to the
tool.

### Dotted key nesting

Keys with dots create nested JSON objects. This is essential for entity
list operations that accept filter objects.

```yaml
input_map:
  filter.property_type: property_type    # → { "filter": { "property_type": "apartment" } }
  filter.city: city                      # → { "filter": { "city": "Madurai" } }
  limit: $literal:20
```

Produces:

```json
{
  "filter": {
    "property_type": "apartment",
    "city": "Madurai"
  },
  "limit": 20
}
```

### $literal: prefix

Hard-codes a value regardless of flow variables.

```yaml
input_map:
  filter.status: $literal:open       # always "open"
  limit: $literal:20                 # always 20
  status: $literal:cancelled         # always "cancelled"
```

Use `$literal:` for values that should never change between flow
executions — fixed filters, default limits, forced status values.

### $constants. prefix

References a value from the flow-level `constants` block.

```yaml
# Flow-level constants
constants:
  default_status: scheduled
  max_results: 50

# Tool step input_map
input_map:
  status: $constants.default_status    # → "scheduled"
  limit: $constants.max_results        # → 50
```

If a `$constants.` reference does not match any declared constant, the
parameter is **omitted** (not passed as null or empty).

### No input_map

When a `tool` step has no `input_map`, the entire flow variable context
is passed through as the tool's parameters. This is rarely used in
practice — explicit `input_map` is preferred for clarity and security.

## constants

The `constants` block declares trusted values that are part of the flow
definition. They are immutable metadata — the same for every execution
of this flow version.

```yaml
id: create-viewing
name: Request viewing
constants:
  default_status: scheduled
  auto_confirm: true
steps:
  - id: run
    type: tool
    tool: entity.viewing.create
    execution: runtime
    input_map:
      property_title: property_title
      date: date
      status: $constants.default_status
```

### Why constants matter

Constants are **trusted metadata**. Unlike user input (which the LLM
extracts from natural language), constants are:

1. Declared in the signed, published flow definition
2. Identical for every execution of this flow version
3. Cannot be overridden by user messages or LLM-generated parameters
4. Verified by checksum at install time

Use constants for values that should be the same every time the flow
runs: default statuses, fixed limits, feature flags.

### Step-level constants

Individual steps can also declare constants that override flow-level
values for that step only:

```yaml
- id: run
  type: tool
  tool: entity.property.list
  execution: runtime
  constants:
    expand: traveler,travel_package    # trusted relation expansion
  input_map:
    filter.status: $literal:active
```

## Variable resolution order

When the runtime resolves a value reference (e.g., `property_title` in
an `input_map`), it searches the flow's variable context. Variables are
seeded from multiple sources in priority order:

```
1. Current flow state (active execution's collected variables)
       ↓
2. Conversation memory (values from earlier in this conversation)
       ↓
3. Customer profile (person_id, phone, email from Customer Hub)
       ↓
4. Knowledge base (documents, FAQs — for RAG-powered flows)
       ↓
5. Ask the user (only when no other source has a value)
```

### Collected vs inferred

The runtime tracks which variables were **explicitly collected** from
the user (via `ask` steps) versus **inferred** from memory or context.
This distinction matters for `ask` step auto-skip:

- If a variable was explicitly collected with a usable value, the
  `ask` step is skipped.
- If a variable was inferred from memory but not explicitly confirmed,
  the `ask` step may still prompt for confirmation depending on the
  flow's design.

## Template interpolation

`message` steps support `{{ variable }}` interpolation from the flow's
variable context.

```yaml
- id: confirm
  type: message
  message: Appointment booked for {{patient_name}} with {{practitioner_name}} on {{date}} at {{time}}.
```

Templates support dotted paths:

```yaml
message: "Order {{order.code}} status: {{order.status}}"
```

Special template variables:

| Variable | Description |
| --- | --- |
| `{{items_text}}` | Formatted list of records from a previous `tool` step's output |
| `{{variable}}` | Any flow variable by name |
| `{{entity.field}}` | Dotted path into an entity object |

## Trust boundary

The most important concept in flow parameters is the **trust boundary**
between untrusted user input and trusted metadata.

### Untrusted (user/LLM input)

Values collected via `ask` steps or extracted from user messages by the
LLM are **untrusted**. They represent what the user said, not what the
system knows to be true.

```yaml
# These come from user input — they are untrusted
input_map:
  property_title: property_title    # user said this
  date: date                        # user said this
  amount: amount                    # user said this
```

### Trusted (runtime-injected)

The runtime injects values from authenticated, verified sources. These
**cannot** be overridden by user input or LLM-generated parameters.

| Trusted value | Source | Injected by |
| --- | --- | --- |
| `tenant_id` | Authenticated session | Runtime |
| `workspace_id` | Installation context | Runtime |
| `installation_id` | Solution installation | Runtime |
| `person_id` | Customer Hub identity | Runtime |
| Flow `constants` | Signed flow definition | Runtime |

### Authority stripping

The runtime **strips** authority-bearing fields from caller-supplied
parameters before executing any entity operation. Even if the LLM
generates a `person_id` or `workspace_id` value, it is discarded.
Identity comes from the authenticated context only.

Fields stripped from user/LLM input:

- `workspace_id`
- `tenant_id`
- `installation_id`
- `organization_id`
- `customer_id`
- `person_id`
- `context`

### Relation expansion trust

Relation expansion (`expand`) is trusted metadata. The runtime only
honors `expand` directives declared in the flow's `constants` block.
Any `expand` parameter from user/LLM input is stripped before the
storage operation executes.

```yaml
# CORRECT — expansion is trusted metadata
- id: run
  type: tool
  tool: entity.booking.get
  execution: runtime
  constants:
    expand: traveler,travel_package    # trusted
  input_map:
    id: id                             # from user input

# WRONG — expansion from user input (stripped by runtime)
input_map:
  id: id
  expand: traveler,travel_package      # this would be stripped
```

## Complete example

This example from Clinic Pro demonstrates all parameter sources:

```yaml
id: book-appointment
name: Book appointment
description: Customer/staff book an appointment via EntityService
surfaces:
  - customer
trigger:
  type: conversation

steps:
  # 1. Collect patient name (user input)
  - id: ask_patient_name
    type: ask
    field: patient_name
    message: Who is the appointment for? Reply with the patient name.

  # 2. List practitioners (tool step with $literal)
  - id: list_practitioners
    type: tool
    tool: entity.practitioner.list
    execution: runtime
    output: practitioners             # store result for next step
    input_map:
      limit: $literal:20              # trusted literal

  # 3. Choose doctor (ask with dynamic choices from tool output)
  - id: ask_doctor
    type: ask
    field: practitioner_name
    message: Which doctor would you like?
    choices_from: practitioners       # dynamic choices from tool output
    title_field: name
    value_field: name
    chip_prefix: doctor

  # 4. List available slots (tool step with filter)
  - id: list_slots
    type: tool
    tool: entity.appointment_slot.list
    execution: runtime
    output: slots
    input_map:
      filter.status: $literal:open              # trusted literal
      filter.practitioner_name: practitioner_name  # from flow variable
      limit: $literal:20

  # 5. Choose time slot
  - id: ask_slot
    type: ask
    field: time
    message: Pick an open slot for that doctor.
    choices_from: slots
    title_field: start_at
    value_field: start_at
    chip_prefix: time

  # 6. Collect reason (user input)
  - id: ask_reason
    type: ask
    field: reason
    message: Reason for the visit?

  # 7. Create appointment (all user input + auto-injected person_id)
  - id: run
    type: tool
    tool: entity.appointment.create
    execution: runtime
    input_map:
      patient_name: patient_name       # from ask step
      practitioner_name: practitioner_name  # from choices
      date: date                       # from conversation memory
      time: time                       # from ask step
      reason: reason                   # from ask step
      notes: notes                     # from conversation memory
    # person_id is auto-injected by runtime (scope: customer)

  # 8. Confirm (template interpolation)
  - id: confirm
    type: message
    message: Appointment booked for {{patient_name}} with {{practitioner_name}} on {{date}} at {{time}}.

  # 9. Complete
  - id: done
    type: complete
```

## Related topics

- [Workflows](/docs/solutions/workflows) — complete step type reference
- [Entity Schema](/docs/solutions/entity-schema) — entity field types and operations
- [Runtime Execution](/docs/solutions/runtime-execution) — how the runtime processes steps
- [Security](/docs/solutions/security) — trust boundaries and tenant isolation
