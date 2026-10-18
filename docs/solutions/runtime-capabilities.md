---
title: "Runtime capabilities and boundaries"
description: "The seven hard lines the running code enforces between what metadata may say and what a Marketplace App may do — extension deny-lists, closed step vocabularies, the RuntimeAdapter boundary, and every verbatim error string that fires when a package crosses one."
sidebar_label: "Runtime capabilities"
---

# Runtime capabilities and boundaries

The Qefro platform does not run arbitrary code. It runs a small, closed set
of interpreters over declarative inputs, and every capability a Marketplace
App can reach is behind one of those interpreters. This page documents each
boundary, where in the code it is enforced, what the exact error string says,
and — honestly — which boundaries are **enforced by code** versus asserted by
a **docstring or convention**.

Every claim here was traced to a source line on
[qefro-plugin-platform `db25f25` / ai-customer-support `eee46e7`](file:///Users/abu/qefro/qefro-documentation/docs/solutions/traceability.md#repository-pins).

## The seven boundaries

| # | Boundary | Enforcement |
| --- | --- | --- |
| 1 | Metadata vs executable code | Enforced — three independent publish-time deny paths + a closed step vocabulary. |
| 2 | Validation vs execution | Enforced by construction — validator and installer are synchronous, non-async, no side-effect. |
| 3 | UI render vs authoritative operations | Enforced — publish vocabulary **and** install-time capability grant **and** a runtime 403 that reads the grant from the server. |
| 4 | FlowRunner vs business capabilities | Enforced — single dispatch `match`, single adapter egress. |
| 5 | RuntimeAdapter vs persistence | Enforced — four stacked rejections inside `execute_storage` + `FORBIDDEN_AUTHORITY_KEYS` stripping. |
| 6 | Structural metadata vs workspace settings | Enforced — split tables, CHECK constraint, and typed merge/prune pipeline. |
| 7 | Agent decisions vs deterministic enforcement | Enforced — `evaluate_action` gates every tool call with a fail-closed default. |

## 1 · Metadata vs executable code

A Marketplace package must contain no executable artifact and no code-shaped
step. Three independent code paths enforce this.

### 1a · ZIP content — extension deny-list + allow-list

[`solution/zip_security.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/zip_security.rs)
`reject_forbidden_path` is called from `extract_package_zip` at `:32`, so
every entry is screened before anything is parsed.

```text
hidden path not allowed in package ZIP: {path}                          (:194)
backend/container artifact not allowed in metadata package: {path}      (:216)
executable/source extension not allowed in metadata package: {path}     (:228)
file type not allowed in metadata package: {path}                       (:243)
extensionless file not allowed in metadata package: {path}              (:248)
```

- `FORBIDDEN_NAMES` (`:200-213`) — `dockerfile, cargo.toml, package.json,
  go.mod, makefile, procfile, docker-compose.*` (case-folded to the stored
  lowercase filename).
- `FORBIDDEN_EXT` (`:220-224`) — `js … wasm so dylib dll exe … py rb php jar
  class o a rs go c cc cpp h hpp`.
- `ALLOWED_EXT` (`:236-239`) — positive list `yaml yml json md txt csv png
  jpg jpeg webp svg gif ico woff woff2 ttf otf`.

Anything that matches deny, does not match allow, has no extension, or is
hidden (leading `.`) is refused before the validator sees it.

### 1b · UI folder — stricter than `zip_security`

[`solution/ui.rs:634`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/ui.rs#L634)
`reject_executable_extension` covers every file under `ui/` and blocks `html`
and `htm` in addition to the ZIP deny-list. Called from `ui.rs:622` and from
[`solution/assets.rs:102`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/assets.rs#L102).

```text
executable content is not allowed in solution UIs: '{path}'             (ui.rs:639)
```

### 1c · Step-type vocabulary

[`solution/workflows.rs:15-31`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/workflows.rs#L15-L31)
declares `KNOWN_STEP_TYPES`:

```text
ask, tool, condition, challenge, upload, delay, approval, message, tag,
assign, activity, complete, branch, notify, handoff
```

`FlowDefinition::validate` at `:180-185` rejects anything else; both
`from_yaml` (`:119`) and `from_value` (`:127`) call `normalize()` then
`validate()`, so no parse path skips it.

```text
{scope}: unknown step type '{}' in step '{}'                             (workflows.rs:182)
```

There is no `exec`, `script`, `run`, `handler`, or `http_request` step.

### 1d · ADR-003 storage guard (CLI)

[`qefro-cli/src/main.rs:349-397`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs#L349-L397)
`reject_forbidden_storage_targets` scans workflow steps for a tool string
beginning with `storage/`, `storage.`, or exactly `storage`, and rejects any
UI source target that resolves to platform storage.

```text
workflow '{id}': step targets forbidden platform storage '{tool}'
  (ADR-003: call app tools; persist via ctx.storage in the SDK app)      (main.rs:368-369)
ui source '{sid}': targets forbidden platform storage '{target}'
  (ADR-003: call app tools; persist via ctx.storage in the SDK app)      (main.rs:388-389)
```

Shared predicate:
[`solution/errors.rs:20-25`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/errors.rs#L20-L25)
`is_forbidden_storage_target`.

:::warning `app_dev` runs the guard. `solution build` does not.
[`main.rs:~743-786`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs)
`app_dev` calls `reject_forbidden_storage_targets`.
[`main.rs:295-330`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs#L295-L330)
`solution build` does not. A CLI-built package can contain forbidden storage
targets and still assemble; the ZIP assembler and ACS never see the same
guard.
:::

:::warning `workflows.rs` checks more than the CLI
solution-service's own step check (`workflows.rs:191-195`) inspects both
`step.tool` and `step.connector`. The CLI inspects only `step.tool`
(`main.rs:362` — `continue` on non-`tool` steps). So a step pairing
`connector: storage` with `tool: insert` is refused by solution-service at
publish but **not** by the CLI at build.
:::

### 1e · No interpreter, no subprocess, no Wasm

A case-insensitive search across `qefro-plugin-platform` for
`Command::new | process::spawn | std::process | eval( | js_run | wasm | wasmi
| wasmer | extprocess | plugin_loader | dlopen | libloading` returns only:
`Cargo.lock` transitive `wasm-bindgen` entries, two `std::process::exit`
calls in the CLI and one example, and the deny-list literals above. There is
no user-supplied HTTP handler type — HTTP tools are declarative method/URL
records executed by ACS's own client.

**Boundary status: enforced.** Three independent code paths at publish, and
no execution substrate exists in the platform crate graph to violate it.

## 2 · Validation vs execution

`solution-service` validates and plans. It does not run flows. That is
enforced by construction.

**Enforcement point**

- [`solution/validator.rs:56-59`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/validator.rs#L56-L59)
  `parse_and_validate` is a synchronous function returning a
  `ValidatedPackage` — a pure data record (`:28-47`). It imports no HTTP
  client, no database pool, no scheduler.
- [`solution/installer.rs:64`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/installer.rs#L64)
  `plan_install(pkg, provided_settings) → InstallPlan` is likewise pure. The
  only "action" it performs is annotating workflow JSON:
  `installer.rs:88-99` inserts `execution: "runtime"|"sdk"` and
  `registered_by: "solution-service"`.
- The install plan is applied by `service/installer.rs::apply_plan` — which
  writes to `tenant_solution_state` and mirrors rows; still no step runs.
- Chat context exposes a **read-only** metadata projection at
  [`api/chat_context.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/chat_context.rs)
  via `GET /v1/tenant/chat-context`. Module docstring `:1-9`: "returns
  solution system prompts … plus the conversation-triggered workflows a chat
  UI can surface as quick-action chips"; "Only workflows whose trigger is
  `conversation` qualify."
- Execution lives in ACS:
  [`ai-customer-support/crates/api/src/flow_engine/executor.rs:68`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/executor.rs#L68)
  `pub struct FlowRunner<'a>`. Module docstring `:1-6`: "the flow
  step-runner: drives an execution through its steps, persisting to Postgres
  (source of truth) and refreshing the Redis cache after every transition."

**Verbatim messages** (validator):

```text
manifest ui.name '{a}' does not match ui section name '{b}'              (validator.rs:111-113)
manifest declares a ui section but the package ships no ui component     (validator.rs:120)
package ships a ui component but the manifest declares no ui section     (validator.rs:126)
```

**Runtime** error at flow execution:

```text
Unknown step type '{other}'.                                              (steps.rs:447)
```

**Honest caveat.** The claim "Workflows are registered as metadata for the
runtime; nothing executes them" at
[`installer.rs:7`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/installer.rs#L7)
is a **docstring**, not enforced by any type or test. The boundary is real
because no `execute` path is imported or reachable from `solution-service`
today — not because the compiler forbids it.

**Boundary status: enforced by construction; docstring asserts what the
crate graph currently keeps true.**

## 3 · UI metadata render vs authoritative operations

The widget vocabulary is closed at publish; the grant set is negotiated at
install; every data call re-checks the grant at runtime. Three gates, not
one.

### 3a · Publish — closed vocabularies

[`crates/qefro-plugin-proto/src/ui.rs`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs)
defines the four lists. Note the constant names — they are `UI_*`, not the
short forms some older docs use:

| Constant | Line | Contents |
| --- | --- | --- |
| `UI_WIDGET_KINDS` | `:12-29` | `metric, table, chart, kanban, calendar, status, map, timeline, activity, markdown, form, booking_link, cart_checkout` |
| `UI_FORM_FIELD_TYPES` | `:33-36` | 11 field types (closed set) |
| `UI_HOST_CAPABILITIES` | `:40-64` | `theme.get, user.get, tenant.get, workflow.trigger, connector.invoke, runtime.query, customer.query, storage.read, storage.write, storage.update, storage.delete, marketing.read, marketing.write, organization.read, organization.write, organization.task.execute, payments, payments.create_order, payments.verify, payments.refund` |
| `UI_PLANE_CAPABILITIES` | `:67-84` | Runtime-plane side of the same split |
| `UI_HOST_PAGES` | `:98` | `contacts, automations, roles` |
| `UI_EVENT_TYPES` | `:88-94` | Event shape vocabulary |
| Membership predicates | `:100-114` | The checks the validator calls |

Publish gates in
[`solution/ui.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/ui.rs)
reject anything outside these:

```text
unknown capability '{cap}'                                                (ui.rs:108)
navigation_layout must be topbar|sidebar, got '{layout}'                  (ui.rs:118)
widget '{id}' has unsupported type '{kind}'                               (ui.rs:203)
widget '{id}' references undeclared source '{source}'                     (ui.rs:211)
source '{id}' requires a target                                           (ui.rs:233)
source '{id}' targets forbidden platform storage '{target}' (ADR-003 …)   (ui.rs:242-243)
form widget '{id}' field '{name}' has unsupported type '{field_type}'     (ui.rs:461)
```

### 3b · Install — capability grant negotiation

[`solution/ui.rs:660`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/ui.rs#L660)
`negotiate_capabilities(requested, version_permissions, has_connectors)`.
Called from `service/installer.rs:268` during install. **This — not the
package — decides the granted set.** A widget may declare `payments.create_order`;
if the negotiated grant excludes it, the runtime will refuse the call.

### 3c · Runtime — every UI data call re-reads the server-side grant

Runtime UI routes live in **ACS**, not in solution-service. Registered at
[`crates/api/src/routes/router.rs:1392-1431`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/router.rs#L1392-L1431):

- `/api/v1/installations/:name/ui`
- `/api/v1/runtime/ui/events`
- `/api/v1/runtime/ui/data`
- `/api/v1/runtime/ui/entity`
- `/api/v1/runtime/ui/entity/audit`
- `/api/v1/runtime/ui/entity/delete`
- `/api/v1/runtime/ui/entity/import`
- `/api/v1/runtime/ui/media`
- `/api/v1/runtime/ui/media/:id`

Handlers live in
[`crates/api/src/routes/solutions_plane.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/solutions_plane.rs)
as `runtime_ui_*` functions (`installation_ui_bundle` at `:3817`,
`runtime_ui_events` at `:3939`, `runtime_ui_data` at `:3964`,
`runtime_ui_entity` at `:4277`, `runtime_ui_entity_audit` at `:4489`,
`runtime_ui_entity_delete` at `:4561`, `runtime_ui_entity_import` at `:4645`,
`runtime_ui_media_upload` at `:5476`).

The core check at
[`solutions_plane.rs:3969-4009`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/solutions_plane.rs#L3969-L4009)
does three things:

1. Requires `require_member`, plus `solution`, `source_id`, `workspace_id` in
   the body, plus `require_workspace_access`.
2. Re-fetches the **server-side** bundle from solution-service
   (`GET /v1/tenant/solutions/{solution}/ui`) and reads `capabilities` from
   it. The client cannot assert its own grant.
3. Resolves `source_id` against the bundle, so an arbitrary target cannot be
   named.

Only then
([`solutions_plane.rs:4070-4081`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/solutions_plane.rs#L4070-L4081))
does it compose `format!("entity.{target}.{read_op}")` and call
`RuntimeAdapter::execute`.

**Verbatim messages** (runtime):

```text
solution is required                                                      (solutions_plane.rs:3974)
source_id is required                                                     (solutions_plane.rs:3978)
workspace_id is required                                                  (solutions_plane.rs:3988)
unknown data source '{source_id}'                                         (solutions_plane.rs:4019)
```

HTTP 403 with stable code
([`solutions_plane.rs:4033-4037`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/solutions_plane.rs#L4033-L4037)):

```json
{ "code": "CAPABILITY_NOT_GRANTED",
  "message": "runtime.query was not granted at install time" }
```

:::warning Widgets are not read-only
`storage.write`, `storage.update`, `storage.delete`, `payments.create_order`,
`payments.verify`, `payments.refund` are all in `UI_HOST_CAPABILITIES`. The
boundary is not "widgets can only read". It is: **every widget call resolves
a server-side grant, and writes are gated by that grant plus
`require_entity_permission` inside the adapter** (see boundary 5).
:::

**Boundary status: enforced at three stages, with the runtime check reading
the grant from the server, never from the caller.**

## 4 · FlowRunner vs business capabilities

FlowRunner drives state transitions. Actual work happens through one egress:
`ExecutionAdapter::execute`.

### 4a · Single dispatch

[`crates/api/src/flow_engine/steps.rs:129`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/steps.rs#L129)
is the **only** `match step.step_type.as_str()` for step execution:

```text
:130 ask   :365 upload   :370 approval   :375 challenge   :380 condition
:398 delay :419 tool → run_tool_step     :420 message
:421 tag   :422 activity  :423 assign    :424 complete
:446-448 fallback — fails closed
```

### 4b · Single adapter egress

`run_tool_step` (`steps.rs:777`) resolves `tool_ref`/`tool` (`:784-789`),
parses the backend via `super::adapter::ExecutionBackend::parse` (`:796`),
and hands off to `super::adapter::invoke_capability` (`:819`). `AdapterOutcome`
is matched at `:835 / :913 / :920`. Nothing else calls an entity operation.

`flow_engine/adapter.rs:1-12` module docstring states the design:
`BusinessFlow → FlowRunner → ExecutionAdapter.execute(capability, context,
parameters)` with `RuntimeAdapter` (Marketplace metadata apps) and
`SDKAdapter` (external ERP/POS/CRM) as the two arms, and "FlowRunner must not
care which adapter handled the step." `ExecutionBackend::parse` at `:28-38`
routes `execution ∈ { "runtime", "metadata", "http" }` to `Runtime`; anything
else falls through to `Sdk` (`:33-36`).

A ripgrep of `steps.rs` for `RuntimeAdapter::|execute_storage|execute_capability|dispatch\(`
returns **no matches** — the only reach is via `adapter::invoke_capability`.

### 4c · Loop bound

[`executor.rs:23`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/executor.rs#L23)
`const MAX_STEPS_PER_TURN: usize = 50;` — a mis-authored flow cannot spin
the loop unbounded.

**Verbatim messages:**

```text
Unknown step type '{other}'.                                              (steps.rs:447)
Runtime capability '{capability}' is not a declared entity operation
  (entity.{name}.{create|list|get|update|delete|restore|availability|aggregate}).
                                                                          (runtime_adapter.rs:2933-2936)
```

**Honest caveat:** "FlowRunner must not care which adapter handled the step"
is a **convention**, not a type. `ExecutionBackend` is merely passed in; a
future caller could branch on it.

**Boundary status: enforced** by the `match` + fail-closed fallback and by
the single `invoke_capability` egress.

## 5 · RuntimeAdapter vs persistence

Every authoritative mutation reaches Postgres through one function.

### 5a · The gate

[`crates/api/src/flow_engine/runtime_adapter.rs:2919`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/runtime_adapter.rs#L2919)

```rust
pub async fn execute_storage(
    pool: Option<&sqlx::PgPool>,
    auth_ctx: &domain::ToolAuthContext,
    tenant_id, workspace_id, installation_id,
    solution: Option<&str>,
    capability: &str,
    parameters: Value,
    trusted_expand: Option<&Value>,
) -> Result<AdapterOutcome, CoreError>
```

Doc `:2918`: "Entity CRUD through authorized storage. Identity from `auth_ctx`
only."

Inside it, four sequential gates:

| Line | Gate | Failure |
| --- | --- | --- |
| `:2931` | Capability must parse as a declared entity op | `AdapterOutcome::Failed { … "is not a declared entity operation" }` |
| `:2939-2943` | Workspace required | `"Runtime entity operations require a workspace."` |
| `:2968-2972` | Installation required | `"No active installation found for workspace."` |
| `:2975-2991` | `require_entity_permission(pool, auth_ctx, tenant_id, workspace_id, installation_id, &op.entity, op.op)` | RBAC denial surfaces as `AdapterOutcome::Failed`; mapped to HTTP 403 by `solutions_plane.rs:4088-4094` |
| `:2995-3013` | Entity must exist in installed metadata | `"Entity '{e}' is not declared in the installed solution."` |

### 5b · Authority keys stripped before decisions

[`runtime_adapter.rs:24-34`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/runtime_adapter.rs#L24-L34)

```rust
const FORBIDDEN_AUTHORITY_KEYS: &[&str] = &[
    "workspace_id", "tenant_id", "installation_id", "organization_id",
    "customer_id", "person_id", "deleted_at", "version", "expected_version",
];
```

`strip_authority_overrides` at `:85`. Module docstring `:8-12`: identity "is
never taken from metadata or caller parameters as authority … LLM/agent input
is stripped and is not authoritative."

### 5c · Every production call site goes through this function

`execute_storage` is reached at:

- `runtime_adapter.rs:1167` (internal)
- `flow_engine/action_runtime.rs:191` (state_transition arm)
- `flow_engine/action_runtime.rs:212` (mutation arm)
- `tool_executor/mod.rs:1799` inside `execute_runtime_tool` (`:1786`)

All other matches (~25) are `#[cfg(test)]`.

**Verbatim messages:**

```text
Runtime capability '{capability}' is not a declared entity operation (…).  (:2933)
Runtime entity operations require a workspace.                              (:2941)
No active installation found for workspace.                                 (:2970)
Entity '{e}' is not declared in the installed solution.                     (:3008)
Missing tenant id for runtime tool                                          (tool_executor/mod.rs:1798)
```

**No direct DB write from tools.** `http_executor.rs` contains no SQL — a
ripgrep for `sqlx::query | INSERT | UPDATE | DELETE` matched only HTTP verb
strings. `tool_executor/storage.rs` is imported at `runtime_adapter.rs:15`
and its write primitives are confined beneath the adapter.

`AdapterOutcome::media_fields` (see
[`flow_engine/adapter.rs:46-47`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/adapter.rs#L46-L47)):
"Populated only by `execute_storage()` from trusted entity definitions —
never from LLM or user-supplied parameters."

**Honest caveat:** `execute_storage` is `pub`, so a new in-crate caller
*could* bypass it and write via `pool` directly. The property "no direct DB
writes from tools" holds **by current call-graph inspection** and
`FORBIDDEN_AUTHORITY_KEYS` — not by a type-system wall.

**Boundary status: enforced** — four stacked rejections plus authority-key
stripping.

## 6 · Structural metadata vs workspace settings

The split is real at the schema level and enforced at install time.

### 6a · Two tables, one foreign key apart

**Structural** — `qefro-plugin-platform/migrations/solution/001_init.sql:85-95`

```sql
CREATE TABLE solution_settings (
  id,
  solution_version_id UUID NOT NULL REFERENCES solution_versions(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN
    ('string','boolean','number','json','color','url')),
  required BOOLEAN,
  "default" JSONB,
  description TEXT,
  created_at,
  UNIQUE (solution_version_id, key)
);
```

Extended by `004_setting_types_color_url.sql:2-6` if needed. The DB-level
CHECK constraint prevents a non-vocabulary type from being stored **even if
the validator were bypassed**.

Written once at publish:
[`repo/components.rs:57`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/repo/components.rs#L57)
`INSERT INTO solution_settings`.

**Per-tenant** — `001_init.sql:167-176`

```sql
CREATE TABLE tenant_solution_settings (
  id, tenant_id, organization_id, solution_name,
  key TEXT NOT NULL, value JSONB NOT NULL, updated_at,
  UNIQUE (tenant_id, solution_name, key)
);
```

`003_workspace_scoping.sql:8` adds `workspace_id`; `:32-41` replaces the
legacy constraint with two partial unique indexes
(`uq_tenant_solution_settings_legacy`, `uq_tenant_solution_settings_workspace`).
Written via `repo/tenant.rs:507 DELETE` / `:522 INSERT`; read `:549`.

### 6b · Merge / prune pipeline in `solution/settings.rs`

| Function | Line | Purpose |
| --- | --- | --- |
| `SettingsSchema::validate_values` | `:140` | Type-check tenant values against schema |
| `SettingsSchema::merge_defaults` | `:189` | Fill in declared defaults |
| `merge_install_settings` | `:226` | Read-modify-write: JSON `null` deletes a key, unmentioned keys preserved |
| `prune_undeclared_settings` | `:245` | Drops keys the target version no longer declares |
| `is_host_setting_key` | `:217-222` | Escape hatch — `_` prefix, `navigation_layout`, `flow_enabled`, `flow_enabled.*` |

Call sites: `solution/installer.rs:68-69`
(`schema.validate_values(provided_settings)?` then `merge_defaults`),
`service/installer.rs:811-816`
(list → `unflatten_settings` → `prune_undeclared_settings` → `plan_install`).

Comment at `service/installer.rs:799-801`: "Settings the target version no
longer declares are pruned (F-UPG-1) so the stored set always validates
against the version being activated."

**Verbatim messages** (`solution/settings.rs`):

```text
required setting '{key}' is missing                                         (:158)
setting '{key}' must be of type {}                                          (:165)
unknown setting '{key}' is not declared by the solution                     (:180)
setting '{key}': unknown type '{type_name}'                                 (:265 / :291)
setting '{key}': expected a type shorthand or mapping                       (:279)
expected a mapping of setting keys                                          (:111)
```

:::warning `is_host_setting_key` widens the tenant-writable surface
Any key beginning with `_` is accepted and preserved without ever being
declared (`settings.rs:175-176`). That means the "package-declared only"
principle has a documented exception for host keys — a developer should not
abuse `_foo` as a private setting slot without realising nothing declares
it.
:::

**Boundary status: enforced** — schema CHECK constraint + typed merge/prune.
The `_`-prefix exception is a **convention** and the widening is real.

## 7 · Agent decisions vs deterministic enforcement

The LLM chooses; the platform decides.

### 7a · Classification (`agent/policy.rs`)

- [`:97-106`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/policy.rs#L97-L106)
  `classify_tool_name_action(name) → ActionClass` — name heuristic →
  `capabilities::is_read_only_tool_name` → **default `ActionClass::Write`**
  (fail closed).
- `:109-118` `classify_tool_action(tool)` — same shape using
  `is_confidently_read_only`.
- `:122-154` `classify_name_class` substring map:
  `refund | charge | payment | checkout | capture | invoice_pay` → Financial,
  `delete | purge | destroy | hard_delete | wipe` → Destructive,
  `send_ | email | sms | whatsapp | notify | campaign | broadcast` →
  ExternalCommunication. `:156-158` uses `contains`.
- `:166-177` `evaluate_action(class, cfg)`:

  ```text
  if class.is_read()          → Allow
  if cfg.staging_enabled      → Stage
  if cfg.allow_writes && class == Write → Allow
  else                       → Deny
  ```

  `ActionPolicyConfig::from_env` at `:76`; env truthiness at `:85-93`.
- `:216-221` `evaluate_execution_safety(tool)` and `:226-231`
  `evaluate_tool_name_execution_safety(name)` return
  `ExecutionSafety::{Allow, RequireConfirmation}` (enum `:202-209`). Doc
  `:212-215`: "every user-facing execution path that is not the Agent staging
  path must call this before executing a tool. Router confidence alone must
  never be treated as 'safe to execute.'"
- `:238-242` `force_confirmation` clones a row with
  `preconditions.require_confirmation = true`.

### 7b · Solution-tools egress gate (`agent/runtime.rs:745-794`)

```text
:757-758  classify + from_env
:759-769  goal-owned turns relax via decide_goal_tool_action (policy.rs:188-193)
          otherwise evaluate_action
:770-771  only Allow proceeds
:772-773  strip_authority_overrides(&call.arguments) BEFORE any invoke
:774-799  dispatch to invoke_runtime_http_chat_tool or
          invoke_installed_app_tool_ctx
:816-841  every non-Allow verdict is blocked
```

Row-preference at `:745-748`: a marketplace name backed by a Tool row is
owned by the advertised-row path, never by this egress.

**Verbatim messages:**

```text
staging is not available for installed-app tools                          (runtime.rs:819)
denied by agent action policy                                             (runtime.rs:821)
solution tool {}/{}: action_class={} {}                                   (runtime.rs:825) — AgentEvent::Error
{"status":"blocked","reason":"action_policy","message":"action_class={} {}"} (runtime.rs:832-840)
solution tool {}/{}: {}                                                   (runtime.rs:808)
This action requires an active conversation for confirmation. Please start a conversation first.
                                                                          (business_tools_chat.rs:1803)
```

### 7c · Reply-signal auto-invoke is read-only

[`business_tools_chat.rs:2827`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/business_tools_chat.rs#L2827)
`enrich_choices_from_reply`:

```text
:2839  is_simple_greeting → early return
:2842-2844  reply_matches_signals
:2848-2850  if !classify_tool_name_action(&tool.tool).is_read() { return None }
:2859  invoke_installed_app_tool_with_channels
```

Docstring at `:2845-2847`: "Reply-signal auto-invoke is an unattended path:
only read-only tools may fire from assistant text. Mutating tools must go
through an explicit LLM tool call with the policy gate / confirmation flow."

### 7d · Confirmation suspension

[`business_tools_chat.rs:1791-1819`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/business_tools_chat.rs#L1791-L1819)
strips authority overrides, then
`evaluate_tool_name_execution_safety(...) == RequireConfirmation`
→ `suspend_solution_tool_confirmation(conv_id, tenant_id, solution, tool,
workspace_id, &base_args, 900)` — a durable 900-second confirmation the user
resolves with `/confirm`.

Other enforced call sites: `fast_router/mod.rs:608`,
`routes/crm_business.rs:570`, `business_tools_chat.rs:1970`.

**Honest caveat.** Classification is a **name heuristic over substrings**,
and its safety rests entirely on the fail-closed default `ActionClass::Write`.
Tests `policy.rs:475-477` assert that `""` and `"do_something_opaque"` both
classify as `Write`. The residual risk is a write whose name contains no
write needle **and** matches `is_read_only_tool_name` — nothing verifies
against the tool's HTTP method on the name-only path
(`policy.rs:226-231`). The row-backed path (`:216-221`) does read the
definition. Also note `decide_goal_tool_action` (`:188-193`) **deliberately
permits ordinary Write** on goal-owned turns; the gate is class-selective,
not uniformly blocking.

**Boundary status: enforced**, with the documented caveats above.

## What a package author can rely on

| If you write… | It is guaranteed to… |
| --- | --- |
| Any file ending in `.rs`, `.js`, `.py`, `.wasm`, `.so`, `.dll`, `.exe` inside the ZIP | Refuse publish with `executable/source extension not allowed in metadata package: {path}` |
| A workflow step with `type: exec` | Refuse publish with `unknown step type` |
| A widget with `capabilities: [database.read]` | Refuse publish with `unknown capability 'database.read'` |
| A UI `source` with `target: storage/insert` | Refuse publish with `source '{id}' targets forbidden platform storage …` |
| A tool that names `entity.ghost.create` | Fail at runtime with `Entity 'ghost' is not declared in the installed solution.` |
| An LLM-chosen tool whose name does not classify as read-only | Block at runtime with `{"status":"blocked","reason":"action_policy", …}` |
| A `workspace_id` field on any entity | Refuse publish (forbidden-authority-fields) |
| A `workspace_id` inside tool parameters | Silently strip before execution (never honoured) |

## Related pages

- [Handbook](/docs/solutions/handbook)
- [Attribute inventory](/docs/solutions/attribute-inventory)
- [Auxiliary components reference](/docs/solutions/auxiliary-reference)
- [Permissions and scope](/docs/solutions/permissions-and-scope)
- [Runtime execution](/docs/solutions/runtime-execution)
- [Support matrix](/docs/solutions/support-matrix)
- [Source traceability](/docs/solutions/traceability)
