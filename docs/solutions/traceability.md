---
title: "Source traceability"
description: "Every handbook claim pinned to a repository commit, source file, line range and verification command — so any assertion can be re-checked against the same tree."
sidebar_label: "Source traceability"
---

# Source traceability

The handbook's claims are only as trustworthy as the code state they were
traced against. This page pins that state, lists the commands that were
actually executed, and records the honest gap between "read from code" and
"observed on a running system".

## Repository pins

Every path in these pages resolves against these commits on **2026-10-18**.
Line numbers shift; the pins do not.

| Repository | Commit (short) | Latest subject |
| --- | --- | --- |
| `qefro-plugin-platform` | `db25f25` | `feat(storage): storage grants, admin/internal endpoints, and grant isolation tests` |
| `ai-customer-support` | `eee46e7` | `fix(api): scope flow_enabled disablement to customer channels (WhatsApp, Instagram, Widget)` |
| `ai-customer-support-portal` | `9c46e91` | `feat(portal): clarify channel flow controls and add customer channel status badges` |
| `ai-customer-support-widget` | `89dbcfe` | `release(widget): v1.2.12 render forms, summaries, and server action errors` |
| `qefro-marketplace-apps` | `c22dab0` | `feat(payments): declare generic payment policies and update test validators` |
| `qefro-documentation` | `a37210d` | `docs(solutions): handbook, entity and manifest evidence, attribute inventory` |

`cd` into any of them and run `git log -1 --format='%H %s'` to confirm you
are on the same tree. If the SHA differs, re-verify any line-number citation
before trusting it.

## Files that own the contract

Read these first when in doubt — they are the source of truth the handbook
summarises.

### `qefro-plugin-platform/services/solution-service`

| Path | Owns |
| --- | --- |
| [`src/solution/mod.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/mod.rs) | Public re-exports of the component types. |
| [`src/solution/manifest.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs) | `SolutionPackageManifest`, `AppToolRef`, `AppTrigger`, `ActionDefinition`, `AgentManifestBlock`, `KNOWN_AGENT_CAPABILITIES`, `validate_package_id` at `:896-911`, `validate_agent_manifest` at `:1130-1193`. |
| [`src/solution/validator.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/validator.rs) | `parse_and_validate` (`:56-87`); all set-match gates; hosting refusals; trigger validation (`:237-300`); entity/HTTP-tool cross-checks. |
| [`src/solution/workflows.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/workflows.rs) | Step-type closed vocabulary at `:15`. |
| [`src/solution/entities.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/entities.rs) | Field types `:14`; `forbidden_authority_fields` `:20`. |
| [`src/solution/settings.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/settings.rs) | `SettingsSchema::from_value`, `validate_values`, `merge_defaults`; alias handling at `:283-287`. |
| [`src/solution/prompts.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/prompts.rs) | Prompt struct + validate. |
| [`src/solution/onboarding.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/onboarding.rs) | Step struct, `KNOWN_ACTIONS` at `:21-26` (declared, not enforced). |
| [`src/solution/policies.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/policies.rs) | `PolicyDefinition`, `rules` non-empty check. |
| [`src/solution/migrations.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/migrations.rs) | `validate_migration_name` + `validate_migration_names`. `applied_migrations` / `pending_migrations` are unused in production. |
| [`src/solution/http_tools.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/http_tools.rs) | `connection_id`, `http_tool_id`, `ALLOWED_AUTH_TYPES` at `:175`, `is_readonly_chat_method` at `:305-311`, `chat_tool_description`, `chat_tool_parameters`. |
| [`src/solution/installer.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/installer.rs) | `InstallPlan` struct at `:26-56`; `plan_install` at `:64-147`. |
| [`src/solution/zip_assemble.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/zip_assemble.rs) | ZIP assembler: `hosting: runtime` gate at `:25-46`; components assembly at `:138-174`. |
| [`src/repo/components.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/repo/components.rs) | `insert_all` — the column list per component proves what is actually persisted. `list_policies` at `:284`. |
| [`src/service/publisher.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/service/publisher.rs) | Version document at `:137-141`; catalog DTO assembly at `:301`. |
| [`src/service/installer.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/service/installer.rs) | `apply_plan`; `merge_install_settings`; `prune_undeclared_settings`. |
| [`src/api/mod.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/mod.rs) | Route table `:66-122`. |
| [`src/api/chat_context.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/chat_context.rs) | `ChatContextResponse` `:40-97`; trigger export `:227-251`; connector tools `:252-275`; HTTP tools `:296-322`; connections `:323-330`; agent `:346-350`; actions `:365-379`; conversational prompts `:465-507`; `conversational_prompt_ids` `:553-580`. |
| [`src/api/tenant.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/tenant.rs) | `get_onboarding` `:307-357`; `complete_onboarding_step` (path params only). |

### `qefro-plugin-platform/services/qefro-cli`

| Path | Owns |
| --- | --- |
| [`src/main.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs) | `load_package` `:271-346`; `reject_forbidden_storage_targets` `:349-397`; `load_prompts` `:447-478`; `load_entities` `:480-505`; `load_named_yaml` `:514-539`; `load_onboarding` `:544-572`; `app_dev` `:~743-786`; `solution build` `:295-330`. |

### `qefro-plugin-platform/crates/qefro-plugin-proto`

| Path | Owns |
| --- | --- |
| [`src/solution.rs`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/solution.rs) | `PublishPackageComponents` `:15-49`; `SolutionSettingDefDto` `:150-161`; `SolutionOnboardingStepDto` `:164-174`; `TenantSolutionStateDto` `:296-306`. |
| [`src/ui.rs`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs) | Widget kinds `:12`, form field types `:33`, host capabilities `:40`, plane capabilities `:67`, host pages `:98`. |

### `ai-customer-support/crates/api`

| Path | Owns |
| --- | --- |
| [`src/flow_engine/action_runtime.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/action_runtime.rs) | Executor. `action.permission` read at `:112`; execution-type default `mutation` at `:132-135`; `target.kind` default `record` at `:143-147`; `state_transition` arm at `:165`; `mutation` arm at `:205`; `workflow` arm (stub) at `:226-242`; `tool` arm at `:244`; unsupported-type error at `:264-266`; `emit_event` read at `:271`. |
| [`src/flow_engine/http_executor.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/http_executor.rs) | `HttpToolSpec` at `:184-224`; encoding enum at `:240-249`; pagination runtime defaults at `:1094-1101`. |
| [`src/flow_engine/http_oauth.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/http_oauth.rs) | `HttpConnectionProfile::from_connection_value` at `:88-268`. |
| [`src/agent/metadata.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/metadata.rs) | `AgentManifestMetadata` at `:18-120`; `flags_from_capability_names`; test `metadata_does_not_imply_rbac_grants`. |
| [`src/agent/policy.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/policy.rs) | `classify_tool_name_action`, `evaluate_action`, `ActionPolicyConfig::from_env`. |
| [`src/agent/runtime.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/runtime.rs) | `core.allows_tool_def(&t.tool)` gate at `:126`; chat tools unconditionally pushed at `:332-338`; row-preference filter at `:745-748`; policy gate + egress at `:757-794`. |
| [`src/business_tools_chat.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/business_tools_chat.rs) | `enrich_choices_from_reply` `:2827-2864` — reply-signal auto-invoke restricted to read-only tools. |
| [`src/routes/solutions_plane.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/solutions_plane.rs) | `SolutionChatTool` parsing `:2318-2368`; onboarding proxy `complete_onboarding_step` `:3428-3451` behind `require_admin`. |
| [`src/router.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/router.rs) | `POST /api/v1/installations/:name/onboarding/:step_id/complete` at `:1344-1347`. |

### `ai-customer-support-portal`

| Path | Owns |
| --- | --- |
| [`src/pages/solutions/ui/marketplaceSetup.ts`](file:///Users/abu/qefro/ai-customer-support-portal/src/pages/solutions/ui/marketplaceSetup.ts) | `packageChannelIds` (used), `packageOnboardingSteps` (declared, no importer), `isWebsiteChannel`. |
| [`src/pages/solutions/MarketplaceSetup.tsx`](file:///Users/abu/qefro/ai-customer-support-portal/src/pages/solutions/MarketplaceSetup.tsx) | Channel list derived from `manifest.channels`; `declaredChannels` at `:141`. |
| [`src/pages/solutions/ui/availabilitySettings.ts`](file:///Users/abu/qefro/ai-customer-support-portal/src/pages/solutions/ui/availabilitySettings.ts) | Portal grouping falls back to key-name heuristics at `:138-153`. |
| [`src/api/client.ts`](file:///Users/abu/qefro/ai-customer-support-portal/src/api/client.ts) | `title`/`options`/`category` render paths at `:1844-1858`. |

## Verification commands actually executed

Everything below was run on this working tree on **2026-10-18**. The result
shown is the output captured, not a paraphrase.

### Package format and validator

```bash
cargo test -p solution-service --lib
```

Result recorded in [Handbook verification statement](/docs/solutions/handbook#verification-statement)
and updated at the end of this session — see the "Command log" section below.

### Local CLI validation

```bash
cd qefro-plugin-platform && cargo run -p qefro-cli -- app validate <app-dir>
cd qefro-plugin-platform && cargo run -p qefro-cli -- solution build <app-dir>
```

Both commands were exercised against the example apps in
`qefro-marketplace-apps/`. Their outputs are captured in the Project Desk
worked example (see [Examples](/docs/solutions/examples/project-desk-runtime)).

### Docs toolchain

```bash
cd qefro-documentation && npm run lint:md
cd qefro-documentation && npm run check:links
cd qefro-documentation && npm run build
```

Executed as part of this session; results in the "Command log" below.

## Verification commands **not** executed

The following were deliberately not run because they touch shared state. Any
handbook claim that depends on them is labelled **Unverified / PENDING**.

- `qefro solution publish` — writes to the production catalog.
- `POST /v1/tenant/solutions/install` — mutates tenant state.
- `GET /v1/tenant/chat-context` against a live ACS — requires a workspace
  with the app installed.
- Any live FlowRunner conversation end-to-end.
- Any production deployment (portal, api, widget, backend).

Do not read the absence of a runtime claim as "no such code path exists" —
this handbook traced the code path. It just did not execute it.

## Command log

Appended as each command was actually executed on this tree.

```text
$ git -C qefro-plugin-platform rev-parse --short HEAD
db25f25

$ git -C ai-customer-support rev-parse --short HEAD
eee46e7

$ git -C ai-customer-support-portal rev-parse --short HEAD
9c46e91

$ git -C ai-customer-support-widget rev-parse --short HEAD
89dbcfe

$ git -C qefro-marketplace-apps rev-parse --short HEAD
c22dab0

$ git -C qefro-documentation rev-parse --short HEAD
a37210d

$ npm run lint:md            # in qefro-documentation
Linting: 248 file(s)
Summary: 0 error(s)

$ npm run build              # in qefro-documentation
[SUCCESS] Generated static files in "build".
exit 0

$ npm run check:links        # against the build produced by the command above
Checked 263 HTML files — no broken internal hrefs found.

$ cargo test -p solution-service --lib
test result: FAILED. 258 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
    solution::validator::tests::restaurant_pro_runtime_example_on_disk_validates
panicked at services/solution-service/src/solution/validator.rs:1142:37:
missing restaurant-pro-runtime/workflows/create-takeaway-order.yaml:
No such file or directory (os error 2)

$ target/debug/qefro solution build <handbook-minimal>
built handbook-minimal@0.1.0
  checksum:  4a8db96808583d6ae8a8251623c4296c3882e110822ec96434b0a90d5dfaf39d

$ target/debug/qefro solution build <handbook-project-desk>
built project-desk@0.1.0
  checksum:  bfe04730a2633fd29d17c6d09c1ef26abb07bc7cd7aa553bd08926d71e1871af
```

`qefro app validate` was run on the same two directories and produced the
same checksums as `solution build` above.

The single `cargo test` failure is **pre-existing and unrelated to the
handbook**: `qefro-plugin-platform` had a clean working tree when it was
captured, so the failure is on committed HEAD. That example ships 13
workflow files, and `validator.rs:1142` opens a fourteenth,
`workflows/create-takeaway-order.yaml`, which does not exist in the
repository. Every handbook claim was traced by reading code; no runtime
service, portal page, or publish request was executed, so nothing here is
runtime evidence. See
[Verification commands not executed](/docs/solutions/traceability#verification-commands-not-executed).

## Re-verifying a claim

Every handbook citation follows this format:

```text
path/in/repo.rs:START-END
```

To confirm a citation on a different commit:

```bash
# From the repository root, e.g. qefro-plugin-platform
git log --oneline -- services/solution-service/src/solution/manifest.rs
```

If the file changed after `db25f25`, re-read the function by name rather than
line range — grep for the symbol:

```bash
rg -n 'fn validate_agent_manifest' services/solution-service/src/solution/manifest.rs
```

For runtime boundaries in `ai-customer-support`:

```bash
rg -n 'fn evaluate_action' crates/api/src/agent/policy.rs
rg -n 'execution_type.as_str()' crates/api/src/flow_engine/action_runtime.rs
```

## Known divergences between the two assemblers

The CLI (`load_package`) and the ZIP (`assemble_from_extracted`) do **not**
implement the same rules. Any package that relies on the divergence is
fragile. Every divergence the handbook found:

| Behaviour | CLI (`load_package`) | ZIP (`assemble_from_extracted`) |
| --- | --- | --- |
| Reads `onboarding/` folder | Yes | No — `components.json` only |
| Reads `policies/` folder | No | No — `components.json` only |
| Reads `channels/` folder | No | No — `components.json` only |
| Reads `migrations/` folder | No | No — `components.json` only |
| Synthesizes `settings` from `manifest.settings[]` | Yes | No |
| Auto-discovers `connections/*.yaml` when manifest silent | Only via `load_named_yaml` | Yes — `load_named_list` globs `dir/*.yaml` |
| Auto-discovers `tools/*.yaml` when manifest silent | Only via `load_named_yaml` | Yes — `load_named_list` globs `dir/*.yaml` |
| Auto-discovers `prompts/*.yaml` | Reads `prompts/prompts.json` legacy + warns | Globs `dir/*.yaml` |
| Calls `reject_forbidden_storage_targets` | **Only** on `app_dev` path (`main.rs:~743-786`); **not** on `solution build` (`main.rs:295-330`) | Not on ZIP path |
| `actions` component | Never populated | Hard-coded `Vec::new()` at `zip_assemble.rs:138-174` |

## Where a claim comes from a comment, not code

The handbook flags convention-only boundaries explicitly:

- `solution/migrations.rs:1-5` docstring says "the install pipeline tracks
  applied migrations in the tenant settings blob (`_applied_migrations`)".
  No code writes or reads that key. **Convention, not enforced.**
- `solution/onboarding.rs:32` docstring says custom actions are "flagged by
  the validator". The validator does not flag them. **Convention, not
  enforced.**
- `solution/policies.rs:1-4` docstring says "evaluated by the runtime". Only
  the catalog reader exists. **Convention, not enforced.**
- `solution/installer.rs:5-8` docstring says "Workflows are registered as
  metadata for the runtime; nothing executes them". This one is **accurate** —
  the ACS FlowRunner is the only executor.

## Related pages

- [Handbook](/docs/solutions/handbook)
- [Support matrix](/docs/solutions/support-matrix)
- [Attribute inventory](/docs/solutions/attribute-inventory)
- [Auxiliary components reference](/docs/solutions/auxiliary-reference)
