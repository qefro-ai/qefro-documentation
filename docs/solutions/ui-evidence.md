---
id: solutions-ui-evidence
title: UI evidence matrix
sidebar_label: UI evidence
---

# UI evidence matrix

[Marketplace handbook](./handbook.md) · [Attribute reference](./ui-reference.md)

This matrix was written after reading the wire schema, publish validator, workspace overlay, asset validator, and portal renderer, before revising the UI guides. References are workspace-relative `path:line` locations, not deployed-version guarantees. **Tests listed here were read, not executed.** No browser or UI server was run.

## Evidence ladder

| Surface | Declaration / validation | Actual consumer | Finding / support boundary |
| --- | --- | --- | --- |
| Theme | `qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs:120`; `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:91` | `ai-customer-support-portal/src/pages/solutions/ui/ThemeEngine.ts:53` | Package colors are strings, not publish-time hex-validated. CSS token emission is not proof every token controls every widget. Background images require a safe absolute HTTP(S) URL at rendering. |
| Navigation | `qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs:165`; `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:268` | `ai-customer-support-portal/src/pages/solutions/ui/LayoutEngine.tsx:26` | Navigation must resolve a declared page even when it names an entity. Entity hints select generic CRUD; they do not authorize it. |
| Pages / layouts | `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:123`; `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:308` | `ai-customer-support-portal/src/pages/solutions/ui/LayoutEngine.tsx:20` | Host page takes precedence over entity page, then widgets. Presets resolve before persistence. Desktop spans are clamped; phone/tablet use two columns. |
| Widgets | `qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs:12`; `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:189` | `ai-customer-support-portal/src/pages/solutions/ui/WidgetRegistry.tsx:1929` | All 13 registry kinds have a web dispatch branch. This does not establish native-mobile parity or support for arbitrary options. |
| Sources | `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:219` | `ai-customer-support-portal/src/pages/solutions/ui/DataSources.ts:71` | `entity` is accepted despite the DTO comment mentioning only runtime/connector. Queries are capability-gated, polled every 10 seconds, and runtime metrics/executions/workflows use special endpoints. |
| Form fields | `qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs:422`; `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:367` | `ai-customer-support-portal/src/pages/solutions/ui/WidgetRegistry.tsx:1396`; `ai-customer-support-portal/src/pages/solutions/ui/WidgetRegistry.tsx:1720` | Validator traverses flat fields, sections and tabs; web widget parses only flat `options.fields`. Rich typed fields are not automatically rendered. |
| Form actions | `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:556` | `ai-customer-support-portal/src/pages/solutions/ui/WidgetRegistry.tsx:1729`; `ai-customer-support-portal/src/pages/solutions/ui/WidgetRegistry.tsx:1783` | Publish accepts trigger, emit, action/action_id. Widget submits only emit and trigger; an action-only form can report success without executing the named action. Emit occurs before workflow trigger, not atomically. |
| Entity presentation | `qefro-plugin-platform/services/solution-service/src/solution/ui_overlay.rs:265` | `ai-customer-support-portal/src/pages/solutions/ui/presentation.ts:100` | `entity.ui` is presentation metadata, not permissions. Missing/stale hints fall back; explicit `activity: false` suppresses the activity surface. |
| Workspace overlay | `qefro-plugin-platform/services/solution-service/src/solution/ui_overlay.rs:34` | Same module, applying onto the effective bundle | Not package YAML. Wrong version/non-object is ignored; invalid leaves are skipped. Overlay cannot create entities, schemas, or grants. Empty widget array intentionally clears page placements. |
| Assets | `qefro-plugin-platform/services/solution-service/src/solution/assets.rs:75`; `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:615` | Theme image consumer above; asset transport traced in the assets guide | Branding-reference and upload-path validators are different. Executable extension rejection here is scoped to `ui/`. Byte limits depend on asset kind. |

## Read test evidence

| Test source | Assertions inspected |
| --- | --- |
| `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:729` | Valid UI parse; theme navigation promotion; absent/null UI; widget/capability/icon/host/source errors. |
| `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:847` | Grid column rejection and capability intersection. |
| `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:915` | Preset resolution; missing preset; inline layouts; derived/legacy route collisions. |
| `qefro-plugin-platform/services/solution-service/src/solution/ui.rs:1020` | Form acceptance; unsupported field type; select choices; undeclared trigger; missing action; forbidden source; malformed event. |
| `qefro-plugin-platform/services/solution-service/src/solution/ui_overlay.rs:1011` | No overlay; branding/nav/page/entity changes; stale references; span clamp; columns/filter/sort; declared default view; required-field protection; authority/action protection; malformed versions. |
| `qefro-plugin-platform/services/solution-service/src/solution/ui_overlay.rs:1390` | Hero/metric merge and stale field filtering. |
| `qefro-plugin-platform/services/solution-service/src/solution/assets.rs:185` | Kind classification, traversal rejection, executable UI rejection, size limit and checksum. |

## Coverage discipline

The reference and machine inventory distinguish **consumed**, **partial**, **validated-only**, **transport-only**, **ignored**, and **unknown**. Freeform JSON is never called supported merely because Serde accepts it. Unknown keys, response data keys, host protocol fields and workspace-only overlay fields are marked separately from authorable package YAML. Source-level behavior is evidence; deployment, permission grants, backend availability, and native app behavior require separate verification.
