---
title: "Support matrix"
description: "Every Marketplace App feature, attribute and file type with its real implementation status — Supported, Partial, Metadata only, Legacy, Unsupported, Unverified — and where the enforcement sits."
sidebar_label: "Support matrix"
---

# Support matrix

One table to answer "can I rely on this?". Every row is derived from the
handbook's evidence chain, not from a schema or an example. Where the
producer contract and the consumer contract differ, the row says so.

Legend: **[handbook → Support status legend](/docs/solutions/handbook#support-status-legend)**

- **Supported** — parsed, validated, consumed, observable.
- **Partial** — one of those links diverges; plan around the divergence.
- **Metadata only** — packaged and persisted, but nothing reads it.
- **Legacy** — still accepted, but the runtime no longer acts on it.
- **Unsupported** — refused at publish or produced by a dead code path.
- **Unverified** — traced but not executed end-to-end on a running system.

## Manifest top-level

| Feature | Status | Enforcement point | Notes |
| --- | --- | --- | --- |
| `id`, `version`, `name`, `description` | Supported | `manifest.rs:17-109` + `publisher.rs` | kebab/snake for `id`; semver enforced for `version`. |
| `hosting: runtime` | Supported | `validator.rs:237-300`; ZIP gate `zip_assemble.rs:25-46` | Marketplace packages must be `runtime`. |
| `hosting: external` with tools | Supported | `validator.rs:237-300` | Requires a `/qefro` endpoint. |
| `hosting: managed` | **Unsupported** | `validator.rs:237-300` | Publish refuses with `hosting: managed is not supported…`. |
| `endpoint` on `hosting: runtime` | **Unsupported** | same | Refused: `hosting: runtime must not declare an external /qefro endpoint`. |
| `channels: []` (declaration) | Supported | portal reads via `packageChannelIds` at `MarketplaceSetup.tsx:141` | Only declaration is observable. |
| `channels` **config** blob | **Partial** | stored `solution_channels` | No runtime reader; the portal derives from the manifest list. |
| `connectors[]` | Supported | manifest set-match + `installer.rs:72-81` | `customer-hub` filtered out (internal). |
| `flows[]` | Supported | `validator.rs:142-147` set-match | Must set-match `workflows/*.yaml`. |
| `prompts[]` | Supported | `validator.rs:149-155` set-match | |
| `settings[]` | **Partial** | synthesis path differs CLI vs ZIP | CLI synthesizes from `manifest.settings[]`; ZIP does not. See [Settings reference](/docs/solutions/settings-reference). |
| `permissions[]` | **Enforced** for UI + connector grant; **Metadata only** for staff RBAC | Grammar at `manifest.rs:914-935`; read at `installer.rs:147-152` and `:246-268` → `negotiate_capabilities` | Gates the UI capability bundle and the SDK connector binding. It is **not** the same table as portal staff RBAC (`crates/db/src/app_rbac.rs`). |
| `capabilities[]` | Supported | `manifest.rs` + UI set-match | Legacy `ui/capabilities.yaml` only used when manifest declares none. |
| `triggers[]` | Supported | `validator.rs:237-300`, chat-context export `chat_context.rs:227-251` | |
| `conversation_slots[]` | Supported | `manifest.rs` + `chat_context.rs` | Consumed for ask-step slot binding. |
| `runtime_adapters[]` | Supported | `chat_context.rs:340-350` | Lowercased, deduped. |
| `collections[]` | Supported | entity spec cross-check | Must resolve to a declared entity. |
| `tools[]` | Supported | `manifest.rs:504-520`; `chat_context.rs:252-275` | `chat: true` required to advertise. |
| `onboarding[]` | Supported | set-match + connector cross-gate | ZIP: `components.json` only. |
| `ui` | Supported | `validator.rs:104-130` pairing | Manifest and package must agree. |
| `entities[]` | Supported | `validator.rs:237-300` hosting gate | `hosting: runtime requires at least one entity in entities/`. |
| `connections[]` | Supported | `validator.rs:188-197` | Secret-scan enforced. |
| `http_tools[]` | Supported | `validator.rs:199-220` | |
| `events[]` | Supported | `validator.rs` + `chat_context.rs` | Accepts a string or `{name: …}`. |
| `automation_templates[]` | **Legacy** | `manifest.rs` with `deny_unknown_fields` | Parsed, stored, no runtime reader. |
| `followup_sequences[]` | Supported | `chat_context.rs:360-363` | Falls back to manifest value. |
| `agent` | Supported (as metadata) | `manifest.rs:1130-1193`; `agent/metadata.rs` | **Never** grants RBAC. |
| `actions[]` | **Partial** | `manifest.rs:749-763`; `action_runtime.rs` | Executor-only keys (`permission`, `target.kind`, `target_status`, `emit_event`) are dropped on re-serialization. |

## Workflow file (`workflows/*.yaml`)

| Attribute | Status | Notes |
| --- | --- | --- |
| `id` | Supported | kebab/snake enforced via `validate_package_id`. |
| `name`, `description` | Supported | Exposed on `SolutionWorkflowDto` (see `qefro-plugin-platform` `db25f25`). |
| Step `type: ask` | Supported | FlowRunner; slot binding via `conversation_slots`. |
| Step `type: tool` | Supported | `RuntimeAdapter::execute` on entity/tool capability. |
| Step `type: condition` | Supported | FlowRunner. |
| Step `type: challenge` | Supported | FlowRunner. |
| Step `type: upload` | Supported | Media handling in `__media_fields`. |
| Step `type: delay` | Supported | FlowRunner. |
| Step `type: approval` | Supported | FlowRunner; out-of-band delivery. |
| Step `type: message` | Supported | Message text + media. |
| Step `type: tag` | Supported | |
| Step `type: assign` | Supported | |
| Step `type: activity` | Supported | |
| Step `type: complete` | Supported | |
| Step `type: branch` | Supported | |
| Step `type: notify` | Supported | |
| Step `type: handoff` | Supported | |
| Any other `type` | **Unsupported** | Closed list in `solution/workflows.rs:15`. |
| Step `tool: storage/…` | **Unsupported (blocked)** | CLI `reject_forbidden_storage_targets` refuses; ADR-003. **Note: `solution build` does not call the guard; `app_dev` does.** |

## Entity file (`entities/*.yaml`)

| Attribute | Status | Notes |
| --- | --- | --- |
| `fields[].type` — one of `string`, `integer`, `float`, `boolean`, `date`, `datetime`, `email`, `phone`, `url`, `uuid`, `enum`, `json`, `person`, `image`, `media`, `relation` (16, `KNOWN_FIELD_TYPES`) | Supported | `entities.rs:14-17`. |
| `state_machine` | Supported | Reads consumed by `action_runtime.rs` `state_transition` arm. |
| `fields[].enum_values` | Supported | Enforced at entity level. |
| `fields[].relation.entity`, `.via` | Supported | Cross-entity gate. |
| Any field named `workspace_id`, `tenant_id`, `installation_id`, `organization_id` | **Unsupported** | `forbidden_authority_fields: entities.rs:20`. |
| `relations` expand with non-UUID FKs | **Partial** | Silently skipped by `expand_relations`. |

## Settings (`settings/business.yaml`)

| Attribute | Status | Notes |
| --- | --- | --- |
| `type`, `required`, `default`, `description` | Supported | The four real spec attributes; parsed at `settings.rs:283-287`. |
| `setting_type` alias | Supported | Read only when `type` absent. |
| `title` | **Unsupported** | Portal-only field; nothing on the package path can set it. |
| `options` | **Unsupported** | Portal renders `<select>` if present; schema never produces it. |
| `category` | **Unsupported** | Portal falls back to key-name heuristics. |
| `secret` (bool) | **Metadata only** | `parse_spec` never reads it. Portal recomputes from the key name (`api_key`, `token`, `secret`, `_key`). |
| Keys prefixed `_*` | **Metadata only** | Reserved host keys. |
| `navigation_layout`, `flow_enabled*` | Supported | Exempt from the unknown-key rule. |

Full reference: [Settings reference](/docs/solutions/settings-reference).

## Auxiliary components

| Component | Status | Notes |
| --- | --- | --- |
| `prompts/*.yaml` — `id`, `system`, `variables` | Supported | The only three that reach the runtime. |
| `prompts` — `description`, `model`, `temperature` | **Metadata only** | Validated at publish; column list proves they are **not persisted**. `temperature` out of range still fails publish. |
| `onboarding/*.yaml` | Supported | ZIP requires `components.json`. |
| `policies` | **Metadata only** | Catalog display only. |
| `migrations` | **Metadata only** | `InstallPlan.migrations` has no consumer. |
| `channels` declaration | Supported | Portal list. |
| `channels` config | **Partial** | Stored; no reader. |
| `connections/*.yaml` | Supported | OAuth profile built at execution. |
| `tools/*.yaml` (HTTP tools) | Supported | GET advertised as chat tool; every method executes. |
| `manifest.triggers[]` | Supported | |
| `manifest.actions[]` | **Partial** | Executor-only keys dropped. |
| `manifest.actions[]` `execution.type: workflow` | **Unsupported (stub)** | Executor only checks `workflow_id` and returns a synthesized `{status: "triggered"}`. Nothing is dispatched. |
| `manifest.agent` | Supported (metadata) | Prompt bias only. |

## Runtime capability boundary

| Boundary | Status | Enforcement |
| --- | --- | --- |
| Metadata-only, no arbitrary code | Supported | Step-type closed vocabulary + `reject_forbidden_storage_targets` on the `app_dev` path. |
| `RuntimeAdapter` as sole mutation boundary | Supported | Every write in `action_runtime.rs` and `flow_engine/*` routes through it. |
| Platform-authoritative tenancy fields | Supported | `forbidden_authority_fields` refuse at entity level. |
| Agent metadata never grants RBAC | Supported | `validate_agent_manifest` error `agent metadata declares capabilities only, never RBAC`. |
| LLM tool selection is gated by policy | Supported | `agent/policy.rs` `evaluate_action` + `classify_tool_name_action`. |
| Reply-signal auto-invoke is read-only | Supported | `business_tools_chat.rs:2827-2864`. |

See [Runtime capabilities](/docs/solutions/runtime-capabilities) for
enforcement-point detail.

## Publishing and installation lifecycle

| Stage | Status | Notes |
| --- | --- | --- |
| `qefro app validate` (local) | Supported | Runs `parse_and_validate`. Executed locally in this handbook's verification. |
| `qefro solution build` (local) | Supported | Emits the package. **Does not** call `reject_forbidden_storage_targets`. |
| `qefro solution publish` (writes to catalog) | **Unverified in this handbook** | Shared-state; not executed here. |
| `POST /v1/tenant/solutions/install` | **Unverified** | Not executed. |
| `GET /v1/tenant/chat-context` | **Unverified** | Not executed. |
| FlowRunner end-to-end chat | **Unverified** | Not executed. |

## Package-format edge cases

| Case | Status | Notes |
| --- | --- | --- |
| `deny_unknown_fields` on manifest / entity / workflow / UI | **None** | No struct uses it. A misspelled key is silently dropped from the typed struct. |
| `deny_unknown_fields` on `automation_templates` | Yes | `manifest.rs` — the only deny site. |
| Empty components arrays are inserted | **No** | Both assemblers skip them. |
| Unknown file inside package root | **Ignored** | Nothing walks the tree beyond the folders the assemblers read. |
| Duplicate IDs across files | **Refused** | `reject_duplicates` in `manifest.rs` and per-section validate. |
| Missing file for declared manifest entry | **Refused** | `require_set_match` — see [Attribute inventory §1](/docs/solutions/attribute-inventory). |
| Extra file not declared in manifest | **Refused** | Same gate, other direction. |

## Known pre-existing repo issues

Two failures are unrelated to this handbook and are recorded here so they are
not attributed to it:

1. `qefro-marketplace-apps/tools/validate_apps.py` → `FAILED (failures=1)` —
   restaurant-pro version pinned to `1.9.8` in the test but `1.9.13` in the
   manifest.
2. `qefro-documentation/docs/examples/restaurant-pro-runtime/manifest.yaml`
   declares entity `offer` with no matching `entities/offer.yaml`. Would fail
   `require_set_match` if the folder were published as-is; it is documentation
   only.

Both were present before this handbook was written.

## Related pages

- [Handbook](/docs/solutions/handbook)
- [Attribute inventory](/docs/solutions/attribute-inventory)
- [Auxiliary components reference](/docs/solutions/auxiliary-reference)
- [Settings reference](/docs/solutions/settings-reference)
- [Package structure](/docs/solutions/package-structure)
- [Source traceability](/docs/solutions/traceability)
