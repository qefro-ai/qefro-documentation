---
title: "Marketplace App developer handbook"
description: "Implementation-verified reference for building metadata-only Qefro Marketplace Apps — every attribute, file, validation gate and runtime consumer, traced to source."
sidebar_label: "Handbook"
---

# Marketplace App developer handbook

This handbook is the engineering reference for building **metadata-only
Qefro Marketplace Apps**. It documents what the running implementation
actually accepts, validates, compiles and executes — not what a schema file
or an example happens to mention.

Every claim on these pages was traced through this chain:

```text
YAML in your package
  → serde deserialization            (what the parser accepts)
  → solution-service validator       (what publish rejects)
  → install plan / chat context      (what the runtime is handed)
  → ACS FlowRunner + RuntimeAdapter  (what actually executes)
  → observable behaviour             (what the tenant sees)
```

A feature is documented as supported **only** when the last two links were
found in code. A key that is parsed but never read is documented as such.

## How to use this handbook

| You want to… | Read |
| --- | --- |
| Know which files may exist and which are actually packaged | [Package structure](/docs/solutions/package-structure) |
| Look up one YAML attribute and its real status | [Attribute inventory](/docs/solutions/attribute-inventory) |
| Understand what the platform guarantees vs what metadata can say | [Runtime capabilities and boundaries](/docs/solutions/runtime-capabilities) |
| Get permissions, capability negotiation and data scope right | [Permissions and scope](/docs/solutions/permissions-and-scope) |
| Wire tenant-configurable values | [Settings reference](/docs/solutions/settings-reference) |
| Use prompts, onboarding, policies, migrations, channels, connections, HTTP tools, triggers, actions, `agent` | [Auxiliary components reference](/docs/solutions/auxiliary-reference) |
| Build one app end to end with real command output | [Project Desk worked example](/docs/solutions/examples/project-desk-runtime) |
| Debug an error you actually saw | [Troubleshooting](/docs/solutions/troubleshooting) |
| Check whether a feature is supported, partial, legacy or unverified | [Support matrix](/docs/solutions/support-matrix) |
| Re-verify any claim yourself | [Source traceability](/docs/solutions/traceability) |

## Support status legend

| Label | Meaning |
| --- | --- |
| **Supported** | Parsed, validated, and consumed by the runtime with an observable effect. Safe to depend on. |
| **Partial** | Accepted and consumed, but the producer contract and the consumer contract differ in some way you must plan around (different key names, narrower semantics, one path only). |
| **Metadata only** | Accepted, validated and persisted, but no runtime consumer performs the implied enforcement. Rendering or bookkeeping only. |
| **Legacy** | Still parses and still packages, and may appear in published apps, but the runtime no longer acts on it — or actively fails on it. |
| **Unsupported** | Rejected by the validator, or produced by a path the platform does not serve. |
| **Unverified** | Found in code but the full chain to observable behaviour was not traced. Do not build on it; treat as absent. |

## The evidence ladder

The inventory classifies every attribute against five distinct gates. An
attribute can stop at any of them, and the failure looks completely different
to you depending on where it stopped.

| Gate | Owner | What passing means | What failing means |
| --- | --- | --- | --- |
| **1. Parsed** | `serde_yaml` / `serde_json` in `solution-service` | The key survives deserialization into the package model | The whole section fails to load; publish is refused with a serde message |
| **2. Validated** | `solution/validator.rs` + per-section `validate()` | Publish accepts the value | `INVALID_*` error at `POST /v1/solutions/publish`; the version never enters the catalog |
| **3. Normalized** | CLI `load_package` / `zip_assemble` / installer plan | The value is carried into the artifact and the install plan | The key exists in your file but never reaches the runtime |
| **4. Consumed** | ACS `flow_engine/*`, `runtime_adapter.rs`, portal renderer | A component actually reads it | Nothing acts on it, no matter what it says |
| **5. Observable** | UI, storage rows, events, WhatsApp/widget replies | You can see the effect in a workspace | Silent no-op — the most expensive kind of bug |

:::warning Unknown keys do not fail
No package struct uses `deny_unknown_fields` for manifest, entity, workflow
or UI definitions. A misspelled key is dropped from the typed struct and
publish still succeeds. Some raw documents are persisted verbatim, so a
typo can also survive into the runtime and be read by nothing. **A package
that builds is not a package that is correct** — see
[Validation](/docs/solutions/validation).
:::

## Non-negotiable platform rules

These are properties of the implementation, not style preferences. A package
that fights them will not work, and the platform will not change for it.

1. **Marketplace Apps are metadata.** `hosting: runtime` means no server of
   yours runs, no code ships, and no destination URL or credential appears in
   YAML. `hosting: managed` is refused at publish.
2. **The runtime is the only executor.** Qefro Runtime compiles your
   `workflows/` into the same `BusinessFlow` / FlowRunner used by every other
   flow. There is no second workflow engine and no per-app process.
3. **`RuntimeAdapter` is the only mutation boundary.** Entity writes go
   through `entity.<id>.<op>` capabilities. Storage, tenancy, version and
   identity fields are platform-authoritative and cannot be overridden from
   metadata or from LLM-chosen tool input.
4. **Deterministic validation decides validity** — the compiler, the
   validator and the runtime. The LLM selects among advertised capabilities;
   it never defines them, and documentation never overrides them.
5. **Publishing is a shared-state action.** Local `qefro app validate` and
   `qefro solution build` are safe. `qefro solution publish` writes to the
   catalog.

## Verification statement

Everything labelled verified in this handbook was checked against the working
tree on 2026-10-18 (`qefro-plugin-platform` + `ai-customer-support` +
`qefro-marketplace-apps`) by reading the code paths above and by running the
local CLI. The commands that were actually executed are recorded in
[Source traceability](/docs/solutions/traceability) with their real output.

Not executed, and therefore marked **Unverified/PENDING** wherever it appears:

- publishing or installing these examples into any workspace (shared state)
- a live conversation through FlowRunner against a running ACS instance
- production end-to-end behavior of `manifest.actions` execution, whose
  runtime vocabulary differs from the published schema

## Related topics

- [Solution Development overview](/docs/solutions/overview)
- [Architecture](/docs/solutions/architecture)
- [Runtime vs SDK](/docs/solutions/runtime-vs-sdk)
- [Quickstart](/docs/solutions/quickstart)
