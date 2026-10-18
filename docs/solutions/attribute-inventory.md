---
title: "Attribute inventory"
description: "Every metadata attribute a Marketplace App package may declare, with its real type, default, allowed vocabulary, validation gate and the component that actually consumes it."
sidebar_label: "Attribute inventory"
---

# Attribute inventory

This is the complete per-attribute reference for a metadata-only Marketplace
App package. Every row was read out of the struct that parses it, the check
that validates it, and the component that consumes it — with the file and line
where that lives.

If a key is not listed here, the platform does not know it. It will still
package, publish and install, and it will do nothing.

## How to read the tables

Each attribute carries a **gate chain** — the links in the pipeline that
actually touch the value. A gate letter you don't see is a gate that never
happens for that key.

| Gate | Meaning | Owner |
| --- | --- | --- |
| **P** | **Parsed** — the key is a declared field on a serde struct, so it survives deserialization | `solution-service/src/solution/*.rs`, `crates/qefro-plugin-proto/src/ui.rs` |
| **V** | **Validated** — publish enforces a rule on the value | `solution/validator.rs::parse_and_validate`, `solution/manifest.rs::validate_structure`, `solution/ui.rs`, per-section `validate()` |
| **N** | **Normalized** — the value is carried into one of the four downstream channels (see below) | `solution/installer.rs::plan_install`, `api/chat_context.rs`, `service/installer.rs` (UI bundle), `service/publisher.rs` (raw document) |
| **C** | **Consumed** — a component reads it and branches on it | ACS `crates/api/src/flow_engine/*`, `goals/*`, `entity_import/*`, `agent/*`, portal `src/pages/solutions/ui/*` |
| **O** | **Observable** — the effect is visible to the tenant (rendered, persisted, refused, emitted) | portal UI, storage rows, Business Events, WhatsApp/widget replies |

The **N** gate is annotated with the carrier, because the four carriers behave
completely differently and this is the single most common source of
"my YAML is right but nothing happens":

| Carrier | Reachable from | Drops unknown keys? |
| --- | --- | --- |
| `N:plan` | Install plan → workspace state, channels, connector bindings, entity registry | **Yes** — built from typed structs |
| `N:ctx` | `GET /v1/tenant/chat-context` → the Agent/FlowRunner turn | **No** — reads raw stored `components` |
| `N:bundle` | `GET /v1/tenant/solutions/:name/ui` → portal renderer | **Yes** — re-serializes typed structs |
| `N:raw` | The stored version document `{manifest, components}` | No — verbatim, but read by nothing unless a consumer asks for it |

Status labels are the ones defined on the
[handbook landing page](/docs/solutions/handbook): **Supported**, **Partial**,
**Metadata only**, **Legacy**, **Unsupported**, **Unverified**.

:::note The version document is raw
`service/publisher.rs` persists `document = { manifest: <verbatim YAML/JSON>,
components: <typed> }`. That is why a key that the typed struct ignores can
still reach the runtime through `N:ctx` — and why a key that reaches the
runtime through `N:ctx` can still be absent from the portal through
`N:bundle`. Two attributes with the same spelling can have different support
depending on which carrier the consumer reads.
:::

## 1. `manifest.yaml` root attributes

Parsed by `SolutionPackageManifest` in
`qefro-plugin-platform/services/solution-service/src/solution/manifest.rs:18`.
Structure validated by `validate_structure`
`qefro-plugin-platform/services/solution-service/src/solution/manifest.rs:655`;
cross-file consistency by `parse_and_validate`
`qefro-plugin-platform/services/solution-service/src/solution/validator.rs:56`.

| Key | Type | Required | Default / allowed values | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | kebab-case: first char `a-z`, rest `a-z 0-9 -` | P V N:plan N:ctx C O | Supported | Error `solution id must be kebab-case: {id}`. Becomes the install `solution_name`, the tool prefix and the default endpoint host. |
| `name` | string | yes | non-empty | P V N:raw C O | Supported | Error `name is empty`. Display name in catalog/listing; the portal chrome title comes from `ui.name`, not this. |
| `version` | string | yes | must parse with `semver::Version::parse` | P V N:plan C O | Supported | Error `version is not valid semver: {v}`. **Gotcha:** unquoted `version: 0.1` is a YAML float, so `qefro solution build` dies earlier with `manifest.version missing`. Quote it. |
| `description` | string | no | — | P V N:raw | Unverified | Carried in the raw manifest; no consumer traced in solution-service, runtime-service or ACS. |
| `category` | string | no | free text, no closed list | P V N:raw | Unverified | Surfaced through the registry-shaped struct that has no callers. |
| `tags` | list[string] | no | `[]` | P V N:raw | Unverified | Same as `category`. |
| `channels` | list[string] | no | `[]` — **no closed vocabulary** | P V N:plan O | Partial | Enables channels at install (`service/installer.rs:860`, `channels_enabled`). Duplicates rejected (`duplicate channels …`), but a typo'd channel name is accepted and enables nothing. |
| `connectors` | list[id \| `{name, version}`] | no | `[]` | P V N:plan C O | Supported | Empty is valid. Each name checked against reserved platform namespaces; empty name rejected (`connectors[{i}] has an empty name`). `version` is a semver requirement resolved against the shared pool at install. |
| `flows` | list[id \| `{id, file}`] | no | `[]` | P V N:plan N:ctx C O | Supported | Exact two-way set match against `workflows/`: `manifest references workflow definition '{x}' which is missing from the package` / `workflow definition '{y}' is not referenced by the manifest`. |
| `prompts` | list[id \| `{id, file}`] | no | `[]` | P V N:plan C O | Supported | Exact set match against the `prompts` component. |
| `permissions` | list[string] | no | `[]` — format `resource.action`, exactly two segments | P V N:plan C O | Supported | Error `invalid manifest: invalid permission '{p}': expected resource.action` (the server wraps the second half in literal backticks; there is no `section:` prefix because this check builds `InvalidManifest` directly). Resource segment allows lowercase ASCII, underscore and hyphen; action segment allows lowercase ASCII, underscore and `*`. **There is no closed permission vocabulary** — the format is the contract, and the granting side checks the string. |
| `capabilities` | list[string] | no | `[]` — closed set (`UI_HOST_CAPABILITIES ∪ UI_PLANE_CAPABILITIES`) | P V N:bundle C O | Supported | Error `unknown capability '{c}'` from section `manifest.yaml`. This is the source of truth; `ui/capabilities.yaml` applies only when this list is empty. |
| `hosting` | enum | no | `runtime` (default) \| `external`; `managed` refused | P V N:plan C O | Supported | Drives `execution: runtime\|sdk` on every flow and whether `entities/` is mandatory. `managed` → `hosting: managed is not supported. Marketplace Apps use hosting: runtime. SDK connections to external systems use hosting: external.` |
| `implementation_kind` | string | no | legacy alias | P V N:raw | **Legacy** | Mapped by `ApplicationHosting::parse_loose`: `workflow`/`worker`/`qefro`/`managed` → refused variant; `metadata`/`qefro_runtime`/`""` → runtime; anything unrecognised silently → runtime. |
| `endpoint` | string | no | defaults to `https://{id}.internal/qefro` | P V N:plan | Partial | Meaningful only for `hosting: external`. A runtime app declaring an HTTP endpoint is refused; `runtime://…`/`runtime` is the accepted exception. |
| `triggers` | list[AppTrigger] | no | `[]` | P V N:ctx C O | Supported | ADR-003 conversation triggers; the platform treats them as data and hands them to the turn router. |
| `conversation_slots` | list[ConversationSlot] | no | `[]` | P V N:ctx C O | Supported | ADR-006 slot harvesting. Domain field names live here, never in runtime code. |
| `runtime_adapters` | list[string] | no | `[]` | P V N:ctx C O | Supported | Opt-in turn adapters (e.g. `legacy_commerce`). Runtime must not infer an adapter from tool names. |
| `collections` | list[CollectionHint] | no | `[]` | P V N:raw | **Metadata only** | Informational code-allocation defaults for apps. `to_registry_manifest()` is the only reader and has **no callers**. |
| `tools` | list[AppToolRef] | no | `[]` | P V N:ctx C O | Supported | Advertised SDK/app tools; `chat: true` publishes them as `sol_{solution}_{tool}` choices. |
| `settings` | list[key \| SettingSpec] | no | `[]` | P V N:raw | Partial | Checked against `settings/business.yaml` as **manifest keys ⊆ schema keys** (extra schema entries are fine). Sub-attributes are parsed but the typed path that reads them (`to_registry_manifest`) has no callers — the schema file drives behaviour. |
| `onboarding` | list[id \| `{id, file}`] | no | `[]` | P V N:plan C O | Supported | Exact set match; seeds `onboarding_initial` as `{status: pending, required}` per step. |
| `ui` | UiManifestRef | no | absent = no UI | P V N:bundle C O | Supported | Must pair with a `ui` component, and `ui.name` must match or publish fails: `manifest declares a ui section but the package ships no ui component` / `manifest ui.name '{a}' does not match ui section name '{b}'`. |
| `entities` | list[id \| `{id, file}`] | no | `[]` | P V N:plan N:ctx C O | Supported | Exact set match against `entities/`; mandatory for `hosting: runtime`. |
| `connections` | list[id \| `{id, file}`] | no | `[]` | P V N:raw C O | Supported | Exact set match against the `connections` component. No URLs or credentials may appear. |
| `http_tools` | list[id \| `{id, file}`] | no | `[]` | P V N:ctx C O | Supported | Exact set match; each tool's host must come from a declared connection. |
| `events` | list[string] | no | `[]` — dot-namespaced, segments `a-z 0-9 _ -` | P V N:plan N:ctx C O | Supported | Error `'e' must be namespaced (e.g. reservation.created)`. Exact set match against the `events` component (a component entry may be a string or `{name: …}`). |
| `automation_templates` | list[ManifestAutomationTemplate] | no | `[]` | P V N:ctx C O | Partial | **The only manifest block with `deny_unknown_fields`** — a typo here really does fail publish. Presets, not a second engine: instantiated as existing `CrmAutomation` rows. |
| `followup_sequences` | list[any] | no | `[]` | P V N:ctx C O | Supported | Opaque values forwarded verbatim to the Goal engine. |
| `agent` | AgentManifestBlock | no | absent | P V N:ctx C O | Partial | Capability declaration only, never RBAC. Effective Agent access = metadata × role × channel × workspace RBAC × identity × policy. |
| `actions` | list[ActionDefinition] | no | `[]` | P V N:ctx C O | **Partial** | Validated hard at publish, executed by ACS `flow_engine/action_runtime.rs`. Key names differ between the two sides — see §2.6. |

## 2. Nested manifest blocks

### 2.1 `triggers[]` (`AppTrigger`)

Defined at `qefro-plugin-platform/services/solution-service/src/solution/manifest.rs:400`.

| Key | Type | Required | Default / allowed | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | — | P V N:ctx C O | Supported | Duplicate or empty ids rejected by the trigger block in `validator.rs`. |
| `workflow` | string | yes | must be a declared flow id | P V N:ctx C O | Supported | `trigger '{id}' references workflow '{w}' which is not declared in the manifest`. |
| `input_variable` | string | no | `{workflow-with-underscores}_input` | P V N:ctx C O | Supported | e.g. `create-task` → `create_task_input`. |
| `match.intents` | list[string] | no | `[]` | P V N:ctx C O | Supported | Free-form intent labels matched by the turn router. |
| `match.confirmation.reply_signals` | list[string] | no | `[]` | P V N:ctx C O | Supported | Substrings that read as a confirmation in agent replies. |
| `match.confirmation.slot_schema` | string | no | — | P V N:raw | **Metadata only** | Declared on the struct, forwarded nowhere: `chat_context` maps the other three confirmation fields but not this one, and it appears in no consumer in ACS or the portal. Do not build on it. |
| `match.confirmation.required_slots` | list[string] | no | `[]` | P V N:ctx C O | Supported | Trigger fires only when these extracted slots are non-empty. |
| `match.confirmation.forbidden_slots` | list[string] | no | `[]` | P V N:ctx C O | Supported | Presence of any of these steers away from the trigger. |
| `identity.widget` | string | no | — | P V N:ctx C O | Supported | Identity resolution rule for widget conversations. |
| `identity.whatsapp` | string | no | — | P V N:ctx C O | Supported | Same for WhatsApp. |
| `confirmation_message` | string | no | — | P V N:ctx C O | Supported | The message the platform sends to confirm before firing. |

### 2.2 `conversation_slots[]` (`ConversationSlot`)

Defined at `qefro-plugin-platform/services/solution-service/src/solution/manifest.rs:460`. This is where
your domain vocabulary lives — the runtime extractor is generic and reads these
declarations, nothing else.

| Key | Type | Required | Default / allowed | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | — | P V N:ctx C O | Supported | The canonical slot key the runtime persists. |
| `labels` | list[string] | no | `[]` | P V N:ctx C O | Supported | Matched against `Label: value` lines in a customer message. |
| `kind` | string | no | normalizer selector (date / time / integer / phone / …) | P V N:ctx C O | Supported | Selects the generic normalizer; unknown kinds fall back to raw text. |
| `aliases` | list[string] | no | `[]` | P V N:ctx C O | Supported | Persisted so later phrasings resolve to the same id. |
| `chip_prefix` | string | no | — | P V N:ctx C O | Supported | Chips arrive as `{chip_prefix}:{value}`. |
| `chip_value` | enum | no | `remainder` (default) \| `last_segment` | P V N:ctx C O | Supported | `remainder` = everything after the first colon; `last_segment` = last colon-separated piece. |
| `chip_label_slot` | string | no | — | P V N:ctx C O | Supported | Slot that supplies the label text for the chip. |
| `choices` | list[string] | no | `[]` | P V N:ctx C O | Supported | Closed option set rendered as reply chips. |
| `quantity_suffixes` | list[string] | no | `[]` | P V N:ctx C O | Supported | Units recognised after a numeric quantity. |
| `identity` | enum | no | `person_name` \| `email` \| `phone` | P V N:ctx C O | Supported | Marks the slot as an identity hint for customer matching. |

### 2.3 `tools[]` (`AppToolRef`)

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | — | P V N:ctx C O | Supported | Advertised tool name. |
| `input_schema` | string | no | absent | P V N:ctx | Partial | A pointer, not an inline schema; no consumer traced for the dereferenced value. |
| `chat` | bool | no | `false` | P V N:ctx C O | Supported | When true the tool is published to channel chat as `sol_{solution}_{tool}`. |
| `description` | string | no | absent | P V N:ctx C O | Supported | The text the model sees — this is your only lever on selection quality. |
| `parameters` | object (JSON Schema) | no | absent | P V N:ctx C O | Supported | Optional structured parameter schema for LLM tool calling. |
| `reply_signals` | list[string] | no | `[]` | P V N:ctx C O | Supported | If a reply contains one of these (case-insensitive) the platform treats the tool as answered. |

### 2.4 `agent` block

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | bool | no | `false` | P V N:ctx C O | Supported | Enables the app's Agent surface. |
| `roles.customer.capabilities` | list[string] | no | `[]` | P V N:ctx C O | Supported | Closed set — `KNOWN_AGENT_CAPABILITIES` (see §13). Error `agent.roles.customer: unknown capability '{c}'`. |
| `roles.business.capabilities` | list[string] | no | `[]` | P V N:ctx C O | Supported | Same vocabulary; same error with `business`. |
| `roles.*.tools` | list[string] | no | `[]` | P V N:ctx C O | Supported | Each must exist in `tools` or `http_tools`, else publish refuses. |
| `roles.*.flows` | list[string] | no | `[]` | P V N:ctx C O | Supported | Each must exist in `flows`. |

:::warning Capabilities that look like grants are refused
Any capability containing `.` or `:` fails publish with
`agent.roles.{role}: '{cap}' looks like a permission grant; agent metadata
declares capabilities only, never RBAC`. `enabled: true` with empty
capabilities is accepted and fails closed at runtime.
:::

### 2.5 `automation_templates[]`

The strictest block in the manifest — `#[serde(deny_unknown_fields)]` on both
the template and its trigger
(`qefro-plugin-platform/services/solution-service/src/solution/manifest.rs:113`).
Structural rules live in `validate_automation_templates_structure`
(`qefro-plugin-platform/services/solution-service/src/solution/manifest.rs:983`).

| Key | Type | Required | Allowed | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | non-empty, unique | P V N:ctx C O | Supported | `automation_templates[{i}].id is required`, `duplicate automation_templates id '{id}'`. |
| `name` | string | yes | non-empty | P V N:ctx C O | Supported | `automation_templates '{id}': name is required`. |
| `description` | string | no | — | P V N:ctx C O | Supported | |
| `trigger.event` | string | yes | must be declared in `manifest.events` | P V N:ctx C O | Supported | `automation_templates '{id}': event '{e}' is not declared in events`. |
| `actions[]` | list[object] | yes | ≥ 1 entry | P V N:ctx C O | Partial | `at least one action is required`. Each `type` must be one of the twelve CRM Automation types (§13): `unknown action type '{t}'`. `send_webhook` may only declare `payload_mapping` — `url`, `headers`, `secret`, `connection_id`, `authorization` are refused. Any of the 30 forbidden keys anywhere inside the action refuses publish. |

### 2.6 `actions[]` (`ActionDefinition`)

| Key | Type | Required | Allowed | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | kebab-or-snake package id | P V N:ctx C O | Supported | Duplicate ids refused. |
| `name` | string | yes | non-empty | P V N:ctx C O | Supported | |
| `description` | string | no | — | P V N:ctx C O | Supported | |
| `target.entity` | string | no | must be a declared entity | P V N:ctx C O | Supported | `action '{id}' targets undeclared entity '{e}'`. |
| `target.record_bound` | bool | no | `false` | P V N:ctx | **Partial** | Validated, but the ACS executor reads `target.kind` (`action_runtime.rs:145`) — this declaration does not gate the executor. |
| `required_permission` | string | no | `resource.action` | P V N:ctx | **Partial** | Format-checked at publish; the executor's RBAC gate reads `action.permission` (`action_runtime.rs:112`). Do not rely on `required_permission` as an enforced permission. |
| `parameters[].name` | string | yes | — | P V N:ctx C O | Supported | |
| `parameters[].type` | string | yes | entity field type vocabulary | P V N:ctx C O | Supported | |
| `parameters[].required` | bool | no | `false` | P V N:ctx C O | Supported | |
| `parameters[].description` | string | no | — | P V N:ctx C O | Supported | |
| `parameters[].default` | any | no | absent | P V N:ctx C O | Supported | |
| `execution.type` | enum | yes | `state_transition` \| `mutation` \| `workflow` \| `tool` (default at the executor: `mutation`) | P V N:ctx C O | Supported | Publish error `action '{id}' has unsupported execution type '{t}' (state_transition \| mutation \| workflow \| tool)`. All four arms exist in `flow_engine/action_runtime.rs:165–244`; anything else dies at runtime with `Unsupported action execution type '{t}'`. |
| `execution.target_state` | string | no | must be a transition destination | P V N:ctx | **Partial** | Validated hard at publish (`action '{id}' target state '{s}' is not a transition destination in entity '{e}' state machine`), but **the executor reads `execution.target_status`** (falling back to a `status` parameter). `target_state` has no reader in ACS. Declare `target_status` for the behaviour, keep the state machine for the gate. |
| `execution.workflow_id` | string | no | declared flow | P V N:ctx C — | **Unsupported (stub)** | Publish requires it to name a declared flow (`action '{id}' references undeclared workflow '{w}'`). At runtime the `"workflow"` arm in `flow_engine/action_runtime.rs:226-242` only checks that `workflow_id` is present and returns a **synthesized** `{action_id, workflow_id, execution_id: Uuid::new_v4(), status: "triggered"}`. It does **not** enqueue or dispatch the flow. Nothing the tenant can observe changes. Use `mutation` or `tool` instead. |
| `execution.tool_id` | string | no | declared tool | P V N:ctx C O | Supported | |
| `execution.mutation_op` | string | no | `update` | P V N:ctx C O | Supported | The executor builds capability `entity.{target.entity}.{mutation_op}` and calls `RuntimeAdapter::execute_storage` — this is the authoritative mutation boundary, not a side door. |
| `execution.payload_template` | object | no | absent | P V N:ctx | **Metadata only** | No reader for actions in ACS (`payload_template` appears only in `webhook_hmac.rs`, unrelated). Mutation and tool arms pass `parameters`, not a template. |
| `events` | list[string] | no | `[]` | P V N:ctx | **Partial** | The executor emits from the single string `action.emit_event` (`action_runtime.rs:271`); the `events` list is not read per-action. Declare `emit_event` inside the action object if you need the emission. |

:::warning The action vocabulary splits in two
Publish speaks `required_permission`, `target.record_bound`,
`execution.target_state`, `events[]`. The ACS executor reads `permission`,
`target.kind`, `execution.target_status`, `emit_event`. Nothing reconciles the
two, and both spellings package. For behaviour, the executor's spelling wins;
for the publish gate, the canonical spelling is checked. `payload` arrives from
`parameters` (with `id` / `record_id` selecting the record).
:::

### 2.7 `collections[]` and the entity-spec refs

`CollectionHint{name, allocate_code{prefix, start=1001}}` —
**Metadata only**, as recorded in §1. `EntityRef`, `OnboardingRef`,
`WorkflowRef`, `PromptRef` and `ConnectorRef` are all `#[serde(untagged)]`
either a bare string or a mapping, so `{id: x, fil: y}` (typo) parses as
`{id: x}` and the file is then reported missing.

## 3. `entities/*.yaml` root attributes

Parsed by `EntityDefinition`
`qefro-plugin-platform/services/solution-service/src/solution/entities.rs:77`;
validated by `EntityDefinition::validate`
`qefro-plugin-platform/services/solution-service/src/solution/entities.rs:332`.
No `deny_unknown_fields` — a typo'd root key is dropped from the typed struct,
survives in `N:ctx`, and is read only if an ACS reader happens to look for it.

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | — | P V N:plan N:ctx C O | Supported | `entity id must be kebab-case`. The entity dialect addresses it as `entity.{id}.{op}` and `entity_{id}_{op}`. |
| `name` | string | no | absent | P V N:plan C O | Supported | Human label; hosts render it, never infer it from `id`. |
| `description` | string | no | absent | P V N:plan | Unverified | |
| `collection` | string | no | falls back to `id` | P V N:plan C O | Supported | `collection_name()` ignores an empty string and uses `id`. Logical collection in managed storage. |
| `scope` | string | no | absent | P V N:plan C O | Supported | `customer` requires **exactly one** `type: person` field with `ref_entity: person`; three distinct errors cover missing, multiple and wrong-ref. |
| `fields` | list[EntityField] | yes | — | P V N:plan C O | Supported | `entity '{id}' must declare at least one field`. |
| `allocate_code` | `{prefix, start, field}` | no | absent, `start=1001` | P V N:plan C O | Supported | Sequential human code (`R-1001`). `field` names the unique string field to fill; omitted, hosts/CSV infer the first unique string field. |
| `title_field` | string | no | absent | P V N:plan C O | Supported | Consumed by the portal (`title_field` in `CustomerRecords.tsx`, `useCustomerActions.ts`). Hosts must not guess. |
| `display_field` | string | no | absent | P V N:plan N:ctx C O | Supported | Read by the portal record search and by ACS `entity_validate.rs`. |
| `computed` | list[object] | no | `[]` | P V N:ctx C O | Supported | Deterministic computed-field specs; ACS `flow_engine/entity_compute.rs` evaluates them. Opaque passthrough for hosts (`N:plan` re-serializes as generic values). |
| `views` | list[object] | no | `[]` | P V N:plan C O | Supported | Declared list views (table/tile/kanban/calendar) for generic CRUD. |
| `ui` | object | no | absent | P V N:plan C O | Supported | Presentation hints only; a workspace overlay may rewrite `ui`, the schema stays put. |
| `status_field` | string | no | absent (behaviour defaults to `status`) | P V N:plan C O | Supported | Must name a declared field: `entity '{id}' status_field '{f}' is not a declared field`. |
| `status_events` | map[status → event] | no | `{}` | P V N:plan N:ctx C O | Supported | Each value must contain a dot and must not encode `workspace_id`/`tenant_id`. Emits the Business Event when the compared field changes (`entity_runtime.rs`, `runtime_adapter.rs`). |
| `availability` | AvailabilityDeclaration | no | absent | P V N:plan C O | Supported | §5. |
| `state_machine` | StateMachineDefinition | no | absent | P V N:plan C O | Supported | §6. Server-enforced. |
| `tax` | EntityTaxConfig | no | absent | P V N:plan C O | Supported | §6. |

### 3.1 Runtime-only entity keys (not on `EntityDefinition`)

These are read by ACS off the raw entity document and have **no typed field in
solution-service**. They pass publish because nothing in the typed path looks
at them, and they work because `N:ctx` ships the raw document. They are
invisible to `N:bundle` — the portal gets the typed round-trip, so a key in
this table does **not** reach the generic CRUD renderer.

| Key | Reader | Gates | Status | Notes |
| --- | --- | --- | --- | --- |
| `delete.mode` / `delete_policy` | `flow_engine/entity_integrity.rs` | P(raw) N:ctx C O | Supported | Default `hard`. |
| `concurrency: optimistic` / `optimistic: true` | `entity_integrity.rs` | P(raw) N:ctx C O | Supported | Optimistic version check on update. |
| `relation_caps[{field, relation, parent_field}]` | `entity_integrity.rs` | P(raw) N:ctx C O | Supported | Per-relation capacity rules outside the availability block. |
| field-level `inherit_from` (`type: person`) | `entity_integrity.rs` | P(raw) N:ctx C O | Supported | Inherits person attributes onto the record. |
| `date_events[{field, event, when_status[], status_field}]` | `entity_integrity.rs`→`entity_dates.rs` | P(raw) N:ctx C O | Supported | Emit an event when a date field changes. |
| `on_events[{event\|on, target\|entity, match_field, match_from=id, where\|filter, set, limit}]` | `flow_engine/entity_effects.rs` | P(raw) N:ctx C O | Supported | Related-record updates. Authority keys in `set` are skipped, `limit` is clamped to `MAX_RELATED_UPDATES`, and only non-empty string keys/values are accepted. |
| field `import_synonyms: [..]` | `crates/api/src/entity_import/{mod,mapping,validate}.rs` | P(raw) N:ctx C O | Supported | CSV header aliases, e.g. `{"name": "total_amount", "type": "float", "import_synonyms": ["due amount", "invoice total"]}`. |
| field `required_when` (and `visible_when` shape) | `flow_engine/entity_validate.rs:51` | P(raw) N:ctx C O | **Partial** | `required_when` **is** enforced at write time (`Field '{name}' is required by conditional rule`). `visible_when` has no reader anywhere — inert. Neither is rendered by the portal, because `N:bundle` drops them. |

## 4. `entities/*.yaml` field attributes

Parsed by `EntityField`
`qefro-plugin-platform/services/solution-service/src/solution/entities.rs:28`.

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | string | yes | — | P V N:plan C O | Supported | Empty name and duplicates refused. |
| `type` | enum | yes | — | P V N:plan C O | Supported | Closed set of 16 (§13). Error `entity '{id}' field '{f}' has unknown type '{t}' (use Qefro field types)`. |
| `required` | bool | no | `false` | P V N:plan C O | Supported | Enforced by `entity_validate.rs` (`Required field '{name}' is missing`). |
| `description` | string | no | absent | P V N:plan | Unverified | |
| `enum_values` | list[string] | cond. | `[]` | P V N:plan C O | Supported | Mandatory when `type: enum` (`is enum but declares no enum_values`). Rendered as a select; validated on write. |
| `ref_entity` | string | cond. | absent | P V N:plan C O | Supported | Mandatory for `relation`; for `person` it must resolve to the platform Person model or publish refuses. |
| `multiple` | bool | no | absent | P V N:plan C O | Supported | Multi-value field (media, relation). |
| `max_items` | integer | no | absent | P V N:plan C O | Supported | Cap on `multiple`; read by `UiBoundary.tsx` and `EntityCrud.tsx`. |
| `unique` | bool | no | `false` | P V N:plan C O | Supported | Importers use it for existing-record detection; absence means *always create*. Refused on `person relation image media json`. Requires a UUID value to participate in relation expand. |
| `default` | any | no | absent | P V N:plan C O | Supported | `current_date` is a reserved token (workspace-local), not a formula language. |
| `default_from_setting` | string | no | absent | P V N:plan C O | Supported | Install setting used as the create default; `entity_compute.rs` resolves it. |
| `computed` | bool | no | `false` | P V N:plan C O | Supported | Server-computed: hosts render readonly and never calculate. |
| `readonly` | bool | no | `false` | P V N:plan C O | Supported | |
| `placeholder` | string | no | absent | P V N:plan C O | Supported | `FieldControl.tsx`, `EntityCrud.tsx`. |
| `help` | string | no | absent | P V N:plan C O | Supported | `FieldControl.tsx`, `UiBoundary.tsx`. |
| `section` | string | no | absent | P V N:plan C O | Supported | Groups the field in the generated form. |
| `label` | string | no | absent | P V N:plan C O | Supported | |
| `format` | string | no | absent (e.g. `currency`) | P V N:plan C O | Supported | Display hint only — **never inferred from the field name**. |

:::danger Reserved authority names
A field named `workspace_id`, `tenant_id`, `installation_id` or
`organization_id` (case-insensitive) fails publish:
`entity '{id}' field '{f}' is reserved for trusted runtime context (metadata
cannot specify workspace/tenant authority)`. The same four names plus
`person_id`/`customer_id`/`code` are rejected inside automation templates, and
`input_map` cannot bind them either.
:::

## 5. `availability` block

Structural capability only. Operating values — timezone, duration, working
hours, closed days, date window, blocking statuses — belong in workspace
installed-app settings, which overlay this block at runtime.

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `availability.booking.datetime_field` | string | yes | — | P V N:plan C O | Supported | Must exist and be `type: datetime`; two distinct errors otherwise. |
| `availability.booking.duration_minutes` | int | no | absent (settings supply it) | P V N:plan C O | Supported | Must be positive when present. |
| `availability.capacity.mode` | enum | no | `exclusive` | P V N:plan C O | **Partial** | `exclusive` \| `limited` \| `unlimited`. `Limited` is documented in-code as *"Metadata accepted; enforcement deferred"* — do not rely on an N-per-slot cap. |
| `availability.capacity.resource.entity` | string | no | absent | P V N:plan | Unverified | Grouping entity reference. |
| `availability.capacity.resource.field` | string | yes (if block present) | — | P V N:plan C O | Supported | Must be a declared field; `capacity` sub-key defaults to `1` and must be positive. |
| `availability.capacity.maximum` | int | no | absent | P V N:plan C O | Supported | Positive. `limited` mode requires `maximum` **or** `resource`. |
| `availability.timezone` | string | no | absent (prefer settings) | P V N:plan C O | Supported | Must look IANA-ish (contains `/`) — a weak check, not a validation against the tz database. |
| `availability.working_hours.start_time` / `.end_time` | string | cond. | — | P V N:plan C O | Supported | Exact `HH:MM`, `start < end`. |
| `availability.closed_days` | list[string] | no | `[]` | P V N:plan C O | Supported | Lowercase weekday names only (§13). |
| `availability.blocking_statuses` | list[string] | no | `[]` | P V N:plan C O | Supported | Must be members of the status field's `enum_values` when the field is an enum. |
| `availability.date_window_days` | int | no | absent | P V N:plan C O | Supported | Positive. |

## 6. `state_machine`, `tax`, `allocate_code`

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `state_machine.initial` | string | yes | — | P V N:plan C O | Supported | Must be a member of the state set. |
| `state_machine.states[].name` | string | no | derived if omitted | P V N:plan C O | Supported | When `states` is empty the set is derived from `initial` + every `from`/`to`. |
| `state_machine.states[].label` / `.color` / `.terminal` | string / string / bool | no | absent / absent / `false` | P V N:plan C O | Supported | `terminal` is declarative; the enforcement that matters is the transition graph. |
| `state_machine.transitions` | list | yes | — | P V N:plan C O | Supported | `state_machine must declare transitions`; `from` may be `*`; unknown `from`/`to` refused. |
| `state_machine.transitions[].name` / `.permission` / `.event` | string | no | absent | P V N:plan C O | Partial | Consumed by the transition gate and `goals/evaluator.rs`; `permission` here is **not** workspace RBAC. |
| `tax.enabled` | bool | no | `false` | P V N:plan C O | Supported | `entity_tax.rs` computes on write. |
| `tax.tax_category_field`, `.taxable_amount_field`, `.tax_amount_field`, `.total_amount_field`, `.taxes_field` | string | no | absent | P V N:plan C O | Supported | Each must name a declared field: `entity '{id}' tax config references undeclared field '{f}' for {key}`. |
| `allocate_code.prefix` | string | yes | — | P V N:plan C O | Supported | |
| `allocate_code.start` | int | no | `1001` | P V N:plan C O | Supported | |
| `allocate_code.field` | string | no | inferred | P V N:plan C O | Supported | Never a per-solution hardcoded name. |

## 7. `workflows/*.yaml` attributes

Parsed by `FlowDefinition` / `FlowStep`
`qefro-plugin-platform/services/solution-service/src/solution/workflows.rs:96`;
both use `#[serde(flatten)] extra`, so unknown keys are **preserved** and
re-emitted into the compiled flow. That is how a runtime-only step option
works at all — and how a typo survives into the artifact unread.

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes | — | P V N:plan N:ctx C O | Supported | Must equal the manifest entry; kebab-or-snake. |
| `name` | string | yes | — | P V N:plan C O | Supported | |
| `description` | string | no | absent | P V N:plan N:ctx C O | Supported | Part of what the router sees. |
| `surfaces` | list[string] | no | `[]` | P V N:plan C O | Supported | Surfaces the flow may run on; `flow_allowed_on_surface` filters the catalog. |
| `trigger.type` | enum | no | inferred | P V N:plan C O | Supported | `conversation` \| `event` \| `schedule` \| `webhook`; `effective_type()` infers from `event`/`cron` when absent. |
| `trigger.event` | string | no | absent | P V N:plan C O | Supported | Business Event name. |
| `trigger.channel` | string | no | absent | P V N:plan C O | Supported | |
| `trigger.cron` | string | no | absent | P V N:plan | **Partial** | Dropped by `compile_business_flow` — a scheduled Marketplace-App flow does not become a scheduler job through this key. Do not build a second scheduler; use the existing Goal engine. |
| `steps` | list[FlowStep] | yes | — | P V N:plan C O | Supported | `flow must contain a complete step` when empty. |
| `constants` | map[scalar] | no | `{}` | P V N:plan N:ctx C O | Supported | Injected into the compiled flow. `constant '{k}' must be a scalar literal`. |
| `execution`, `registered_by` | string | — | injected | — | Compiler-added | `plan_install` stamps `execution: runtime\|sdk` and `registered_by: solution-service`. Do not declare them. |

### 7.1 Step attributes (`FlowStep`)

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | no | auto `step_N` | P V N:plan C O | Supported | `normalize()` assigns it; you never need to write it. |
| `type` | enum | yes | — | P V N:plan C O | Supported | 15 known types (§13); **no closed-set publish check on the step type itself**. |
| `prompt` | string | cond. | absent | P V N:plan C O | Supported | An `ask` step must reference a declared prompt. |
| `tool` | string | cond. | absent | P V N:plan N:ctx C O | Supported | Compiled to `config.tool_ref`. Entity targets are capability claims: `flow '{f}' step '{s}' targets entity '{t}' which is not in this package …`. |
| `connector` | string | no | absent | P V N:plan | **Legacy** | Dropped by `compile_business_flow`. Use `tool`. |
| `next` | string \| list | no | absent | P V N:plan C O | Supported | Successor wiring. |
| unknown keys | any | — | preserved | P N:ctx C O | Partial | Reach the runtime inside `config` and are read by the matching step executor. |

`input_map` may not bind an identity authority key —
`input_map cannot bind identity authority '{path}'`.

## 8. Step types and their executors

`KNOWN_STEP_TYPES` (solution-service, `qefro-plugin-platform/services/solution-service/src/solution/workflows.rs:15`)
vs the set the FlowRunner actually dispatches.

| Type | Packaged | Executed by | Status | Notes |
| --- | --- | --- | --- | --- |
| `ask` | yes | `flow_engine/steps.rs` | Supported | Collects a slot, then waits. |
| `tool` | yes | `steps.rs` → `runtime_adapter.rs` | Supported | The only authoritative mutation path. |
| `condition` | yes | `steps.rs` | Supported | |
| `challenge` | yes | `steps.rs` | Supported | |
| `upload` | yes | `steps.rs` | Supported | |
| `delay` | yes | `steps.rs` | Supported | |
| `approval` | yes | `steps.rs` | Supported | Out-of-band message delivery. |
| `message` | yes | `steps.rs` | Supported | Media via `__media_fields`. |
| `tag` | yes | `steps.rs` | Supported | |
| `assign` | yes | `steps.rs` | Supported | |
| `activity` | yes | `steps.rs` | Supported | |
| `complete` | yes | `steps.rs` | Supported | |
| `branch` | yes | — | **Legacy** | In the packaged vocabulary "for legacy solution YAML"; not a FlowRunner dispatch. Packages fine, does nothing as a branch. |
| `notify` | yes | — | **Legacy** | Same. Use `message` or `approval`. |
| `handoff` | yes | — | **Legacy** | Same. Use the platform human-handoff path. |

`runtime-service` keeps its own older list (`ask tool condition branch notify
handoff delay complete`)
`qefro-plugin-platform/services/runtime-service/src/domain.rs:10`.
Metadata Marketplace Apps compile in solution-service, so the 15-entry list is
the one that matters for you; the mismatch is why `branch` packages cleanly and
then does nothing.

## 9. `ui/` attributes

Parsed by `UiSection`
`qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs:299`;
validated by `parse_ui_section` → `validate_ui_section`
`qefro-plugin-platform/services/solution-service/src/solution/ui.rs:54`.

| File / key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `ui.name` | string | yes | — | P V N:bundle C O | Supported | Must equal `manifest.ui.name`. Error `ui.name is required`. |
| `ui.logo`, `ui.icon` | string | no | absent | P V N:bundle C O | Supported | Package-relative image path; `png jpg jpeg svg webp` only, no `/`-leading or `..`, no executable extension. |
| `ui.navigation_layout` | enum | no | `topbar` | P V N:bundle C O | Supported | `topbar` \| `sidebar` (case-insensitive). Lifted out of `theme` if found there (`promote_navigation_layout`). |
| `ui.theme.primary secondary accent background surface text` | string | no | absent | P V N:bundle C O | Supported | Applied scoped to the solution container by `ThemeEngine.ts`. |
| `ui.theme.background_image` | string (URL) | no | absent | P V N:bundle C O | Supported | Tenant brand override. |
| `ui.theme.font_family`, `.font_size_base` | string / uint | no | absent | P V N:bundle C O | Supported | |
| `ui.theme.radius` | string (CSS) | no | absent | P V N:bundle C O | Supported | |
| `ui.theme.spacing.{xs,sm,md,lg,xl}` | string (CSS) | no | absent | P V N:bundle C O | Supported | |
| `ui.navigation[].id` | string | yes | — | P V N:bundle C O | Supported | Duplicate refused; also becomes the route id. |
| `ui.navigation[].title` | string | yes | — | P V N:bundle C O | Supported | |
| `ui.navigation[].icon` | string | no | absent | P V N:bundle C O | Supported | 20-icon closed set; `navigation '{id}' uses icon '{i}' outside the host icon set`. |
| `ui.navigation[].page` | string | no | defaults to `id` | P V N:bundle C O | Supported | `navigation '{id}' points at undeclared page '{p}'`. |
| `ui.navigation[].entity` | string | no | absent | P V N:bundle C O | Supported | Renders generic entity CRUD instead of widgets. |
| `ui.navigation[].group` | string | no | absent | P V N:bundle C O | Supported | Sidebar grouping. |
| `ui.navigation[].hidden_by_default` | bool | no | `false` | P V N:bundle C O | Supported | Workspace override can re-enable (`uiCustomization.ts`, `SolutionChrome.tsx`). |
| `ui.pages[].id`, `.title` | string | yes | — | P V N:bundle C O | Supported | `pages require non-empty id and title`; duplicate ids refused. |
| `ui.pages[].layout` | preset id \| inline | no | absent | P V N:bundle C O | Supported | Presets are **resolved to inline before persistence** — the bundle never contains a preset id. Undeclared preset refused. |
| `ui.pages[].widgets[].widget` | string | yes | — | P V N:bundle C O | Supported | `page '{p}' references undeclared widget '{w}'`. |
| `ui.pages[].widgets[].span` | int | no | full width | P V N:bundle C O | Supported | 1–12 enforced (`widget span must be 1-12`); the portal additionally clamps. |
| `ui.layouts[].id` + `type`, `columns` | string; grid; 1–12 | yes | — | P V N:bundle C O | Supported | `unsupported layout type '{t}'`, `grid columns must be 1-12`. |
| `ui.pages[].host` | enum | no | absent | P V N:bundle C O | Supported | `contacts` \| `automations` \| `roles` — the platform screen renders, not your widgets. |
| `ui.pages[].entity` | string | no | absent | P V N:bundle C O | Supported | Generic EntityList/Detail/Form for a declared entity. |
| `ui.widgets[].id` | string | yes | — | P V N:bundle C O | Supported | Duplicate refused. |
| `ui.widgets[].type` | enum | yes | — | P V N:bundle C O | Supported | 13 closed kinds (§13). `widget '{id}' has unsupported type '{t}'`. |
| `ui.widgets[].title` | string | no | absent | P V N:bundle C O | Supported | |
| `ui.widgets[].source` | string | cond. | absent | P V N:bundle C O | Supported | Must name a declared source; a `form` widget **must not** declare one. |
| `ui.widgets[].options` | object | no | absent | P V N:bundle C O | Supported | Kind-specific and closed per kind — see §10 for `form`. |
| `ui.sources[].id` | string | yes | — | P V N:bundle C O | Supported | |
| `ui.sources[].type` | enum | yes | — | P V N:bundle C O | Supported | `runtime` \| `connector` \| `entity`. |
| `ui.sources[].target` | string | yes | — | P V N:bundle C O | Supported | Runtime: `metrics executions workflows`. Connector: must contain `/` (`{connector}/{operation}`). `storage/*` platform targets are refused (ADR-003). |
| `ui.sources[].params` | object | no | absent | P V N:bundle C O | Supported | Forwarded declaratively with the query (`DataSources.ts`). |
| `ui.capabilities[]` | enum | no | `[]` | P V N:raw | **Legacy** | Only used when `manifest.capabilities` is empty; the vocabulary check runs on this list at parse time. |
| `ui/routes.yaml` | — | no | — | P N:bundle | **Legacy** | Only parsed for old packages; surviving entries are the ones whose id does not collide with a navigation entry. Routes are derived from navigation. |

## 10. `form` widget options and field attributes

Validated by `validate_form_widgets`
`qefro-plugin-platform/services/solution-service/src/solution/ui.rs:400`;
rendered by `parseFormFields` in the portal
`ai-customer-support-portal/src/pages/solutions/ui/WidgetRegistry.tsx:1396`.

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `options.fields[]` | list | yes* | — | P V N:bundle C O | Supported | `*` or supplied through `options.sections[].fields` / `options.tabs[].sections[].fields` — the **validator** walks all three, the **renderer** currently reads `options.fields` only. |
| `options.sections[].fields` | list | no | — | P V N:bundle C(✗) | **Partial** | Validated, not rendered by `parseFormFields(o.fields)`. Prefer flat `fields`. |
| `options.tabs[].fields` | list | no | — | P V N:bundle C(✗) | **Partial** | Same asymmetry. |
| `options.action.trigger` | string | one-of | — | P V N:bundle C O | Supported | Must be a workflow declared in the manifest. |
| `options.action.emit` | string | one-of | — | P V N:bundle C O | Supported | Valid dot.case event name. |
| `options.action.action` / `.action_id` | string | one-of | — | P V N:bundle C O | Partial | Alias-accepted; dispatch is the `actions` vocabulary caveat of §2.6. |
| `field.name` | string | yes | — | P V N:bundle C O | Supported | |
| `field.type` | enum | no | `text` | P V N:bundle C O | Supported | 12 closed types (§13). |
| `field.label` | string | no | = `name` | P V N:bundle C O | Supported | |
| `field.required` | bool | no | `false` | P V N:bundle C O | Supported | Must be a JSON boolean, not a string. |
| `field.options[]` | list[string] | cond. | absent | P V N:bundle C O | Supported | `select` requires `options` **or** `options_source`; static options must all be strings. |
| `field.options_source` | string | cond. | absent | P V N:bundle C O | Supported | Must resolve to a declared `ui.sources` id. |
| `field.options_rows_path`, `.value_key`, `.label_key` | string | no | absent | P N:bundle C O | **Partial** | Read by the renderer but **not declared on `UiFormFieldDef`** — they survive only because the widget `options` blob is an opaque `Value`. |
| `field.enum_values[]` | list[string] | no | absent | P V N:bundle C O | Supported | Accepted alias path for select choices. |
| `field.ref_entity` | string | cond. | absent | P V N:bundle C O | Supported | What the renderer actually opens a record picker with. |
| `field.relation` (`UiRelationSelector`) | object | cond. | absent | P V N:bundle C(✗) | **Partial** | The validator requires `relation` **or** `ref_entity` on a `relation` field, but the renderer only reads `ref_entity`. `relation.target_entity`, `.display_field`, `.search_fields`, `.filter` are validated-shape data with no portal reader; `search_fields` has **no** reader anywhere. Use `ref_entity`. |
| `field.visible_when` | `{field, operator, value}` | no | absent | P V N:bundle | **Metadata only** | Shape checked (`condition requires 'field' and 'operator'`), never rendered — no `visibleWhen`/`visible_when` in the portal or ACS. |
| `field.required_when` | same | no | absent | P V N:bundle / N:ctx C O | **Partial** | Not rendered in the portal form; the *entity field* version is enforced at write time by `entity_validate.rs:51`. |
| `field.placeholder`, `.help`, `.default_value` | string/string/any | no | absent | P V N:bundle C(✗) | **Partial** | On the typed form field; the widget renderer ignores all three. On **entity** fields, `placeholder` and `help` *are* rendered by `FieldControl.tsx` — different surface, same spelling. |
| `field.validation.{min,max,pattern,message}` | number/string | no | absent | P V N:bundle | **Metadata only** | Client-side form validation is not driven from this key; server-side constraints come from the entity schema. |

Operator vocabulary for both condition keys: `eq neq in not_in contains empty
not_empty` — documented on `UiFieldCondition`; the publish gate only requires
that `field` and `operator` are present.

## 11. `settings/business.yaml` attributes

Parsed by `SettingsSchema::from_value`
`qefro-plugin-platform/services/solution-service/src/solution/settings.rs:101`.
Root is either `{settings: {…}}` or a bare mapping; a scalar value is shorthand
for a type (`business_name: string`).

| Key | Type | Required | Default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `<setting_key>` | mapping or scalar shorthand | yes | — | P V N:plan C O | Supported | `expected a mapping of setting keys` when the root isn't a map. |
| `<setting_key>.type` | enum | no | `string` | P V N:plan C O | Supported | Canonical `string color url boolean number json`; accepted aliases `bool`, `integer float`, `object array`. Error `setting '{k}': unknown type '{t}'`. |
| `<setting_key>.required` | bool | no | `false` | P V N:plan C O | Supported | `required setting '{k}' is missing`. |
| `<setting_key>.default` | matching type | no | absent | P V N:plan C O | Supported | Checked at parse (`default does not match type {t}`) and merged at install by `merge_defaults`. |
| `<setting_key>.description` | string | no | absent | P — N:plan O | Supported | Stored in `solution_settings.description` and rendered as helper text under the field. No runtime behaviour. |
| `<setting_key>.setting_type` | enum | no | — | P V N:plan C O | Supported | Alias for `type`, read only when `type` is absent (`solution/settings.rs:283-287`). Kept for registry-shaped payloads. |
| `<setting_key>.title` | string | no | — | — | **Unsupported** | Portal-only field (`ai-customer-support-portal/src/api/client.ts:1844-1858`); the backend DTO never emits it (`crates/qefro-plugin-proto/src/solution.rs:150-161`), and no package path can set it. Label falls back to the humanized key. |
| `<setting_key>.options` | list | no | — | — | **Unsupported** | The portal renders a `<select>` when `def.options` is present; nothing in the schema parser, the DTO or the catalog produces it. There is no enum/select setting type. |
| `<setting_key>.category` | string | no | — | — | **Unsupported** | Portal grouping falls back to key-name heuristics (`ai-customer-support-portal/src/pages/solutions/ui/availabilitySettings.ts:138-153`). |
| `<setting_key>.secret` | bool | no | `false` | P N:raw | **Metadata only** | `parse_spec` never reads it, so a `settings/business.yaml` entry cannot set it. In `manifest.settings[]` it is parsed into `SettingRef` (`solution/manifest.rs:306`) and survives only in the raw version document. |
| `manifest.settings[].secret` | bool | no | `false` | P N:raw | **Metadata only** | Same as above: the settings list the portal receives **recomputes** it from the key name — `api_key`, `token`, `secret` substrings or a `_key` suffix (`service/publisher.rs:415-418`). Name your secrets; don't declare them. |

Value rules applied to tenant-supplied settings: `string` must be a JSON
string; `color` accepts `#RGB`/`#RRGGBB`/`#RRGGBBAA` or empty; `url` accepts
`http(s)://` ≤ 2048 chars, or empty, and refuses a value containing `"`, `'`,
`{`, `}`, `;` or a backslash; `boolean` and
`number` require the matching JSON type; `json` accepts anything. Undeclared
keys are refused (`unknown setting '{k}' is not declared by the solution`) and
host-owned keys — anything starting with `_`, plus `navigation_layout` and
`flow_enabled*` — never come from the package. `merge_install_settings` treats
an explicit `null` as a delete; `prune_undeclared_settings` drops keys the
version no longer declares.

## 12. Auxiliary components

| Component | Producer | Gates | Status | Notes |
| --- | --- | --- | --- | --- |
| `prompts/*.yaml` | CLI `load_prompts` / zip assemble | P V N:plan C O | Supported | `temperature` must be `0..2`; variable names must be `snake_case`. `undeclared_variables()` exists but is called only by its own test — an unbound variable is **not** a publish error. |
| `onboarding/*.yaml` | CLI `load_onboarding` (dir); ZIP `components.json` only | P V N:plan C O | Supported | `required` defaults **true**. `KNOWN_ACTIONS` = `connector.connect`, `upload`, `configure`, `channel.enable` (`solution/onboarding.rs:13-26`) — the constant is **not enforced by the validator**; any non-empty string is accepted. The only enforcement is per-action: `connector.connect` requires `connector`, `channel.enable` requires `channel`. Steps referencing an undeclared connector are refused by the manifest↔connector set-match gate. |
| `policies` component | `components.json` overrides only — the CLI never reads a `policies/` directory | P V N:raw | **Metadata only** | `rules` must be non-null and non-empty. Stored in `solution_policies` (`repo/components.rs:87-100`) and read only by `ComponentRepo::list_policies` (`publisher.rs:301` → `SolutionPolicyDto`) for catalog display. **No runtime reader** — no policy engine evaluates the parsed definition. |
| `channels` component | `components.json` overrides | P V N:raw | Partial | The CLI never reads a `channels/` directory. A channel config for an undeclared channel is refused (`config for undeclared channel '{c}'`). |
| `migrations` component | `components.json` overrides only — the CLI never reads a `migrations/` directory | P V N:plan | **Metadata only** | Names must be `NNN_snake_case(.sql)`, strictly increasing, no duplicates (`solution/migrations.rs:10-62`). `plan_install` copies them into `InstallPlan.migrations` (`installer.rs:135`), but nothing downstream consumes that field: `applied_migrations` / `pending_migrations` have no production caller, and no `_applied_migrations` writer exists in the service layer. The `migrations` array is metadata; the install pipeline does not track or run it. |
| `connections/*.yaml` | CLI / zip | P V N:raw C O | Supported | Named HTTP connections, no secrets, no destination URLs. |
| `tools/*.yaml` (HTTP tools) | CLI / zip | P V N:ctx C O | Supported | Host must come from a declared connection; every tool↔connection pair is checked at publish. |
| `events` component | CLI / zip | P V N:plan N:ctx C O | Supported | String or `{name: …}` entries. |
| `actions` component | CLI: no directory read, only `manifest.actions`; ZIP: **hard-coded `Vec::new()`** (`zip_assemble.rs:138-174`) | P V N:ctx C O | Partial | `chat_context.rs:365-379` tries three sources: (1) `version_row.manifest["components"]["actions"]` — always empty, both assemblers leave `PublishPackageComponents.actions` as `vec![]`; (2) `version_row.manifest["actions"]` — also empty, the stored document is `{manifest, components}` with no top-level `actions`; (3) `serde_json::to_value(&desc.manifest.actions)` — **the only live path**, and it re-serializes through `ActionDefinition`, so publish-side unknown keys are dropped before the executor ever sees them. Consequence: any executor-only attribute not on `ActionDefinition` (e.g. `emit_event`, `target.kind`, `execution.target_status`, `permission`) **cannot be shipped from a Marketplace package**. The executor's readable vocabulary is narrower than the publish gate's; see §2.6. |
| `agent` | manifest only | P V N:ctx C O | Partial | Never grants RBAC. |

## 13. Closed vocabularies

The complete set of value lists the platform actually compares against.
Everything not in this section is a format rule or free text.

```yaml
# Verbatim from source. Regenerate by reading these constants; do not hand-copy.
field_types:            # solution-service/src/solution/entities.rs:14
  - [string, integer, float, boolean, date, datetime, email, phone, url, uuid,
     enum, json, person, image, media, relation]
forbidden_authority_fields:   # entities.rs:20
  - [workspace_id, tenant_id, installation_id, organization_id]
step_types:             # solution-service/src/solution/workflows.rs:15
  - [ask, tool, condition, challenge, upload, delay, approval, message, tag,
     assign, activity, complete, branch, notify, handoff]
step_types_runtime_service:   # runtime-service/src/domain.rs:10 (older list, not the app path)
  - [ask, tool, condition, branch, notify, handoff, delay, complete]
trigger_types:          # inferred by FlowTrigger::effective_type
  - [conversation, event, schedule, webhook]
widget_kinds:           # qefro-plugin-proto/src/ui.rs:12
  - [metric, table, chart, kanban, calendar, status, map, timeline, activity,
     markdown, form, booking_link, cart_checkout]
form_field_types:       # qefro-plugin-proto/src/ui.rs:33
  - [text, textarea, number, date, time, select, image, media, currency,
     relation, checkbox]
host_capabilities:      # qefro-plugin-proto/src/ui.rs:40
  - [theme.get, user.get, tenant.get, workflow.trigger, connector.invoke,
     runtime.query, customer.query, storage.read, storage.write,
     storage.update, storage.delete, marketing.read, marketing.write,
     organization.read, organization.write, organization.task.execute,
     payments, payments.create_order, payments.verify, payments.refund]
plane_capabilities:     # qefro-plugin-proto/src/ui.rs:67
  - [runtime.read, workflow.execute, customer.read, storage.read, storage.write,
     storage.update, storage.delete, marketing.read, marketing.write,
     organization.read, organization.write, organization.task.execute, payments]
ui_host_pages:          # qefro-plugin-proto/src/ui.rs:98
  - [contacts, automations, roles]
ui_event_types:         # qefro-plugin-proto/src/ui.rs:88
  - [ui.loaded, ui.closed, ui.action, ui.error, ui.navigate]
ui_host_calls:          # qefro-plugin-proto/src/ui.rs (UI_HOST_CALLS)
  - [ui.register, ui.navigate, ui.emit, ui.subscribe, ui.capabilities]
allowed_icons:          # solution-service/src/solution/ui.rs:18
  - [home, calendar, chef-hat, receipt, users, user, file-text, bar-chart,
     settings, package, clipboard, credit-card, activity, list, clock, map,
     stethoscope, wallet, report, workflow]
forbidden_ui_extensions:  # solution/ui.rs:43 — anywhere under ui/
  - [js, mjs, cjs, ts, tsx, jsx, html, htm, sh, py, wasm, exe, dll, so, jar, php]
allowed_asset_extensions:  # solution/ui.rs:624
  - [png, jpg, jpeg, svg, webp]
navigation_layouts:     # solution/ui.rs:115
  - [topbar, sidebar]
layout_types:           # solution/ui.rs:309
  - [grid]
source_types:           # solution/ui.rs:222
  - [runtime, connector, entity]
runtime_source_targets: # documented runtime query names
  - [metrics, executions, workflows]
capacity_modes:         # entities.rs:185 (limited = enforcement deferred)
  - [exclusive, limited, unlimited]
weekdays:               # entities.rs:310 (VALID_WEEKDAYS)
  - [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
action_execution_types: # manifest.rs:752
  - [state_transition, mutation, workflow, tool]
agent_capabilities:     # manifest.rs:162 (domain labels are aliases, no vertical branches)
  - [knowledge, orders, analytics, customer_insights, inventory, crm, customers,
     reservations, bookings, promotions, pricing, refunds, properties, listings,
     leads, viewings, enquiries]
automation_action_types: # manifest.rs:937 (CRM Automation)
  - [send_whatsapp, send_email, add_tag, remove_tag, change_contact_status,
     assign_user, create_followup, create_task, notify_team, delay,
     delegate_to_agent, send_webhook]
automation_forbidden_keys: # manifest.rs:952 — 30 keys, refuse publish inside templates
  - [url, base_url, host, hostname, headers, authorization, secret, password,
     token, api_key, apikey, access_token, signing_secret, destination_url,
     endpoint, tenant_id, workspace_id, installation_id, organization_id,
     person_id, customer_id, code, script, javascript, cel, expr, expression,
     connection_id, connection]
onboarding_action_types:  # solution/onboarding.rs KNOWN_ACTIONS — declared, not enforced
  - [connector.connect, connector.upload, connector.configure, channel.enable]
form_condition_operators: # UiFieldCondition — publish only checks presence
  - [eq, neq, in, not_in, contains, empty, not_empty]
setting_types_canonical:  # solution/settings.rs:19
  - [string, color, url, boolean, number, json]
setting_types_aliases:
  boolean: [bool]
  number: [integer, float]
  json: [object, array]
host_setting_keys:        # settings the package may never declare
  - ["_ prefix*", navigation_layout, flow_enabled, "flow_enabled.*"]
```

## 14. Keys the platform packages and then ignores

The honest list. Each of these is accepted by every gate it faces and then
read by nobody — or by a path that is never called. Fixing the doc is not
fixing the product; if you need one of these, ask before depending on it.

| Key / path | Why it is inert |
| --- | --- |
| `manifest.collections[]` | Only read by `SolutionPackageManifest::to_registry_manifest()` (`manifest.rs:806`), which has **zero callers** in the workspace. |
| `manifest.settings[].type/required/default/description/secret` | Same dead converter. `settings/business.yaml` is the live contract. |
| `triggers[].match.confirmation.slot_schema` | Parsed, never forwarded by `chat_context`, never read. |
| `actions[].execution.target_state` | Publish validates it against the entity state machine; the executor reads `execution.target_status`. |
| `actions[].execution.payload_template` | No action reader in ACS; the mutation and tool arms send `parameters`. |
| `actions[].events` | The per-action emission path reads `emit_event`, not this list. |
| `actions[].required_permission`, `target.record_bound` | Format/persistence only; the executor gates on `permission` and `target.kind`. |
| `tools[].input_schema` | Parsed, not exported by the chat-context DTO (only `parameters` reaches the model). |
| `policies/*.yaml` contents | Parsed and stored; no policy engine consumes them. |
| `migrations/` **directory** | Neither assembler reads it; only `components.json` overrides supply `migrations`. |
| `channels/` **directory** | Same — `channels` is a components override, not a scanned path. |
| `ui/pages.yaml` `visible_when`, `validation`, `placeholder`, `help`, `default_value` | Validated shape, no reader in the widget renderer. |
| `relation.target_entity`, `relation.search_fields`, `relation.filter` | The renderer opens pickers from `ref_entity`; `search_fields` has no reader anywhere. |
| `step.type: branch / notify / handoff` | Packaged vocabulary, not a FlowRunner dispatch (§8). |
| `step.connector` | Explicitly dropped by `compile_business_flow`. |
| `trigger.cron` | Dropped by `compile_business_flow`. |
| `flows[].ui`-side legacy `ui/routes.yaml` | Derived routes win on id collision. |
| Unknown keys, anywhere | No struct in this path sets `deny_unknown_fields` except `automation_templates` and its trigger. |

## 15. Re-deriving this inventory

The handbook must not become a second competing definition of the metadata
contract, so this page is a *view* over the code, and every row names where to
look:

1. **Structs** — `services/solution-service/src/solution/{manifest,entities,workflows,settings,onboarding,prompts,policies,migrations}.rs`
   and `crates/qefro-plugin-proto/src/{ui,solution}.rs`. Field names, `#[serde(rename)]`,
   `#[serde(default…)]`, `skip_serializing_if` and `deny_unknown_fields` are the truth.
2. **Gates** — `solution/validator.rs::parse_and_validate` (order of checks),
   `manifest.rs::validate_structure`, `entities.rs::EntityDefinition::validate`,
   `ui.rs::{validate_ui_section, validate_form_widgets}`.
3. **Carriers** — `solution/installer.rs::plan_install`,
   `api/chat_context.rs`, `service/installer.rs` (UI bundle),
   `service/publisher.rs` (stored document).
4. **Consumers** — ACS `crates/api/src/flow_engine/*`, `entity_import/*`,
   `goals/*`, `agent/*`; portal `src/pages/solutions/ui/*`.

A `qefro app validate --strict` that calls `parse_and_validate` in-process
would let this table be machine-checked against the real validator instead of a
mirrored approximation. That flag does not exist yet, and adding it is a code
change — recorded as a proposal in
[Validation](/docs/solutions/validation), not implemented here.

## Related topics

- [Package structure](/docs/solutions/package-structure) — which files carry these attributes
- [Manifest reference](/docs/solutions/manifest) — narrative guide to the same fields
- [Entity Schema](/docs/solutions/entity-schema) · [Workflows](/docs/solutions/workflows) · [Settings](/docs/solutions/settings-reference)
- [Runtime capabilities and boundaries](/docs/solutions/runtime-capabilities)
- [Support matrix](/docs/solutions/support-matrix) — the same statuses grouped by feature
- [Source traceability](/docs/solutions/traceability) — file/line index and executed commands
