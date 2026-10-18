---
title: "Entity handbook evidence"
description: "Source matrix for the implementation-verified Marketplace entity, booking, tax and execution reference."
sidebar_label: "Entity evidence"
---

# Entity handbook evidence

[Marketplace handbook](./handbook.md) · [Entity schema](./entity-schema.md) · [Runtime execution](./runtime-execution.md) · [Booking](./concurrency-and-booking.md) · [Tax](./tax-engine.md)

This matrix is built before updating the reference pages. Evidence is from local source inspection, **not a live-test PASS**. Paths are relative to the multi-repository workspace. Line references identify the inspected checkout; they are not permanent release guarantees. Tests listed below were read, not executed.

## Owning source matrix

| Area | Owning source and verified lines | Finding / evidence status |
| --- | --- | --- |
| Typed entity contract | `qefro-plugin-platform/services/solution-service/src/solution/entities.rs:14`, `:27`, `:77`, `:128`, `:149`, `:174`, `:202`, `:216`, `:233`, `:260`, `:269`, `:281`, `:294` | Entire schema and tests inspected. `id` is required by deserialization; `name` is optional. `computed`, `views`, `ui`, and field defaults contain opaque JSON. |
| Typed validation | `qefro-plugin-platform/services/solution-service/src/solution/entities.rs:320` | Nonempty fields, closed field types, reserved authority names, enum/person/relation/unique checks, availability/state/tax validation. No general field-name snake_case requirement. |
| Package cross-validation | `qefro-plugin-platform/services/solution-service/src/solution/validator.rs:56`, `:177`, `:319`, `:344` | Entire source inspected. Manifest entity set and known entity tool targets checked; no relation-target existence walk. |
| Install plan | `qefro-plugin-platform/services/solution-service/src/solution/installer.rs:64`, `:140` | Entire source inspected. Plan serializes typed entities without renaming state-machine keys. This is not yet proof of what ACS receives. |
| Chat-context producer | `qefro-plugin-platform/services/solution-service/src/api/chat_context.rs:190`, `:276`, `:396` | Entire source inspected. Active primary workspace install; entities cloned from stored raw `components.entities`, not from install-plan entities. Settings defaults overlaid by stored values. |
| ACS dispatch and ownership | `ai-customer-support/crates/api/src/flow_engine/runtime_adapter.rs:42`, `:85`, `:153`, `:195`, `:615`, `:1136`, `:2812` | `execute` wraps `execute_storage` with post-success audit/compute/events. Explicit `scope: customer` determines Person ownership. Portal bypass is channel-specific. Remaining storage branch and persistence chain being traced. |
| Runtime field validation | `ai-customer-support/crates/api/src/flow_engine/entity_validate.rs:14`, `:73`, `:82`, `:263` | Entire source inspected. Required-create/coercion differs from schema; optional empty values skip checks. Email/URL/datetime/UUID are not format-checked here. Runtime-only conditional and constraint keys exist. |
| State-machine interpreter | `ai-customer-support/crates/api/src/flow_engine/entity_validate.rs:386`, `:403` | Reads `initial_state`, `final`, `roles`, `emit_event`, `action`, nested `status_field`; typed schema uses `initial`, `terminal`, `permission`, `event`. Initializer renaming not assumed; raw persistence chain must decide reachability. |
| Defaults and computed whitelist | `ai-customer-support/crates/api/src/flow_engine/entity_compute.rs:60`, `:295`, `:558`, `:585` | Entire source/tests inspected. Seven ops, ordered evaluation, 500 relation rows, depth 2. Defaults fill missing/null/blank strings but not empty arrays. No first-enum default. |
| Integrity helper dialect | `ai-customer-support/crates/api/src/flow_engine/entity_integrity.rs:37`, `:55`, `:196`, `:274`, `:407`, `:480`, `:554` | Entire source/tests inspected. Runtime-only delete/concurrency/relation_caps/inherit_from keys. Hard delete default; `VERSION_CONFLICT`; optional Hub Person parsing. |
| Hooks, locks and aggregate | `ai-customer-support/crates/api/src/flow_engine/entity_runtime.rs:40`, `:175`, `:690`, `:952`, `:1015`, `:1553`, `:1581`, `:1705` | Entire source/tests inspected. Session advisory locks separate from storage transaction; optional pool. Generic helper reads swallow failures. Aggregate explicitly propagates errors and probes beyond 1000 scoped rows. |
| Tax entity adapter | `ai-customer-support/crates/api/src/flow_engine/entity_tax.rs:20`, `:47`, `:180`, `:248` | Entire source/tests inspected. Different input names from typed tax contract; fixed taxable_amount/taxes/tax_evidence outputs. Buyer absent. Calculation errors logged, not rejected. |
| Tax domain engine | `ai-customer-support/crates/domain/src/tax.rs:73`, `:122`, `:282`, `:314`, `:399`, `:530` | Entire source/tests inspected. Four hardcoded automatic rules, manual mode, inclusive default, two decimals. Rounding mode recorded but not used to select arithmetic. |

## Inspected test evidence (not executed)

| Source | Tests / scope |
| --- | --- |
| `qefro-plugin-platform/services/solution-service/src/solution/entities.rs:774` | Field types/unique/person/scope; availability validation and roundtrip at `:973`–`:1268`; opaque create/UI passthrough at `:1271`. |
| `qefro-plugin-platform/services/solution-service/src/solution/validator.rs:870`, `:1029`, `:1431` | Entity capability target checks, runtime package parsing, typed state/tax validation. Does not exercise ACS interpretation. |
| `ai-customer-support/crates/api/src/flow_engine/entity_validate.rs:1017`, `:1206`, `:1260`, `:1291` | Required/coercion; raw-JSON constraints/conditional fields; raw-JSON state-machine tests use ACS dialect, not a published-package roundtrip. |
| `ai-customer-support/crates/api/src/flow_engine/entity_compute.rs:743`, `:848`, `:997`, `:1049` | Rollups, empty-child preservation/zeroing, defaults, bounded arithmetic. |
| `ai-customer-support/crates/api/src/flow_engine/entity_integrity.rs:703`, `:740`, `:833`, `:951`, `:1001`, `:1052` | Pure policy/version/restore/cap/Person helpers, not actual database racing writes. |
| `ai-customer-support/crates/api/src/flow_engine/entity_runtime.rs:1909`, `:1932`, `:1968`, `:2001`, `:2065` | Local HTTP mock aggregate paging/errors/scope plus pure lock-key tests. `unique_lock_release_and_drop_without_pool` at `:2259` calls storage without a local mock; not a safe blanket-suite recommendation. |
| `ai-customer-support/crates/api/src/flow_engine/entity_tax.rs:285`, `:321`, `:349` | Adapter unit fixtures for manual, inclusive, child tax. |
| `ai-customer-support/crates/domain/src/tax.rs:866`, `:912`, `:957` | Domain-only India intra/interstate and manual arithmetic. No automatic-rule completeness or compliance certification. |

## Research boundaries

UI rendering, workflow matching/lifecycle, manifest settings schema and HTTP tooling are owned by related handbook pages. This research documents only necessary execution seams. Raw JSON keys are not promoted to supported package contract merely because an ACS helper can read them. Persistence, canonical storage writes, availability and import/export evidence will be added before their reference claims.
