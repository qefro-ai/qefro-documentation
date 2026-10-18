---
title: "Permissions and scope"
description: "Every permission string, capability token, and workspace filter the running code honours — and the ones it ignores — traced from manifest declaration through install-time grant to runtime enforcement."
sidebar_label: "Permissions and scope"
---

# Permissions and scope

There are four overlapping access models in a Qefro Marketplace App. None of
them is the general-purpose "permission system" they all sound like. Getting
this right on paper matters, because a mistake is silent: a misnamed field is
dropped, an undeclared capability fails closed at 403, and a `permissions[]`
entry that reads like RBAC does nothing for the staff user who expects it.

| Model | Vocabulary | Where enforced | Who it gates |
| --- | --- | --- | --- |
| **Manifest permissions** | `resource.action` strings | Publish + install (`negotiate_capabilities`) | The UI bundle's capability grant and the SDK connector binding — **not staff RBAC**. |
| **UI capability grant** | `UI_HOST_CAPABILITIES` ∪ `UI_PLANE_CAPABILITIES` | Publish (vocabulary) + install (intersection) + runtime (403 `CAPABILITY_NOT_GRANTED`) | Widget → platform calls at `/api/v1/runtime/ui/*`. |
| **Action-level RBAC** | `resource.action` strings looked up in `app_rbac` | Runtime (`require_action_permission`), only when the key is literally `"permission"` | Portal staff/API users running an app action. |
| **Workspace / tenant scope** | `tenant_id`, `workspace_id`, `installation_id` | SQL filters on every `TenantRepo` call + `strip_authority_overrides` before tool execution | Every read/write path in the app. |

This page documents each model against the code, and calls out the traps.

## 1 · `manifest.permissions[]`

### Declaration

[`qefro-plugin-platform/services/solution-service/src/solution/manifest.rs:40-42`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L40-L42)

```rust
/// Permissions requested against the Customer Hub / platform APIs.
#[serde(default)]
pub permissions: Vec<String>,
```

### Grammar

Enforced at publish by `validate_permission`
([`manifest.rs:914-935`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L914-L935))
— exactly two dot-parts; `resource` is `[a-z_-]+`, `action` is `[a-z_*]+`:

```text
invalid permission '{permission}': expected `resource.action`
```

Anything else — `customer`, `customer.read.write`, `Customer.Read` — fails
publish. Call site at `manifest.rs:701-703`.

### Where it lands

```rust
for permission in &pkg.manifest.permissions {
    sqlx::query(r#"
        INSERT INTO solution_permissions (solution_version_id, permission)
        VALUES ($1, $2)
        "#,
```

Source: [`repo/components.rs:73-85`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/repo/components.rs#L73-L85).

Table created at
`qefro-plugin-platform/migrations/solution/001_init.sql:99-107`.

### Where it is read — and where it is not

**Read at install, twice:**

1. **SDK connector binding.**
   [`service/installer.rs:147-152`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/service/installer.rs#L147-L152)
   calls `ComponentRepo::list_permissions(...)`, and the resulting `caps`
   array is written into the auto-registered `/qefro` binding at
   `installer.rs:163`.
2. **UI capability negotiation.**
   [`service/installer.rs:246-268`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/service/installer.rs#L246-L268)
   feeds `permissions` into `negotiate_capabilities(&section.capabilities,
   &permissions, has_connectors)`.

**Not read by ACS staff RBAC.** Portal staff RBAC lives in a separate table:
`ai-customer-support/crates/db/src/app_rbac.rs` — the string `solution_permissions`
does not appear anywhere in the ACS crate graph.

:::info This is not "metadata only"
`permissions[]` is real, and gates the UI capability bundle and connector
bindings. What it is not, is a way to grant a staff user access to the
Customer Hub. Older drafts of this handbook called it "metadata only"; that
was wrong and this page corrects it.
:::

## 2 · UI capability grant

### 2a · Publish — the vocabulary

[`crates/qefro-plugin-proto/src/ui.rs`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs)
declares the two closed lists.

`UI_HOST_CAPABILITIES` (`:40-64`):

```text
theme.get  user.get  tenant.get  workflow.trigger  connector.invoke
runtime.query  customer.query
storage.read  storage.write  storage.update  storage.delete
marketing.read  marketing.write
organization.read  organization.write  organization.task.execute
payments  payments.create_order  payments.verify  payments.refund
```

`UI_PLANE_CAPABILITIES` (`:67-84`):

```text
runtime.read  workflow.execute  customer.read
storage.read  storage.write  storage.update  storage.delete
marketing.read  marketing.write
organization.read  organization.write  organization.task.execute
payments
```

The membership check is a **union**, not two separate gates
([`ui.rs:108-110`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs#L108-L110)):

```rust
pub fn is_known_capability(cap: &str) -> bool {
    UI_HOST_CAPABILITIES.contains(&cap) || UI_PLANE_CAPABILITIES.contains(&cap)
}
```

Call sites:
- `solution-service/src/solution/manifest.rs:704-711` — `manifest.capabilities[]`.
- `solution-service/src/solution/ui.rs:103-111` — `ui.capabilities[]`.

Both refuse with the same string:

```text
ui: unknown capability '{cap}'
```

**Trap.** A plane-only token (`workflow.execute`) declared inside
`ui.capabilities` passes publish. The distinction between host and plane is
enforced only later, at negotiation.

### 2b · Install — the negotiation

[`solution-service/src/solution/ui.rs:660-690`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/ui.rs#L660-L690)
`negotiate_capabilities(requested, version_permissions, has_connectors)`
— per-capability rules:

| Capability | Granted when |
| --- | --- |
| `theme.get`, `user.get`, `tenant.get`, `runtime.query` | Always |
| `workflow.trigger` | `permissions` contains `workflow.execute` |
| `customer.query` | `permissions` contains `customer.read` |
| `connector.invoke` | Package declares at least one connector |
| `storage.read` / `.write` / `.update` / `.delete` | Exact-string match in `permissions` (ADR-002) |
| `marketing.read` / `.write` | Exact-string match |
| `organization.read` / `.write` / `.task.execute` | Exact-string match |
| `payments*` | Exact-string match |
| Plane-only pass-through (`runtime.read`, etc.) | Exact-string match |

Called from `service/installer.rs:268`. The negotiated list is what the
UI bundle persists, and what the runtime reads back. **The package cannot
assert its own grant.**

### 2c · Runtime — the 403

The four branches inside
[`ai-customer-support/crates/api/src/routes/solutions_plane.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/solutions_plane.rs)
`runtime_ui_data` (route `POST /api/v1/runtime/ui/data`, handler at `:3964`):

- `:4032-4037` — if neither `runtime.query` nor `storage.read` is in the
  server-side granted list, the response is HTTP 403:

  ```json
  {
    "code": "CAPABILITY_NOT_GRANTED",
    "message": "runtime.query was not granted at install time"
  }
  ```

- `:4102-4105`, `:4138-4141`, `:4181-4184` — same code for the other
  branches (`runtime.query`, `storage.read`, `connector.invoke`).

`require_member` + `require_workspace_access` guard the request itself
(`:3969-3989`). The bundle is re-fetched from solution-service at
`:3992-4009` — the client cannot claim a capability it does not hold.

:::warning `UI_HOST_CALLS` has no runtime reader
[`crates/qefro-plugin-proto/src/ui.rs:377-383`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/ui.rs#L377-L383)
declares `ui.register, ui.navigate, ui.emit, ui.subscribe, ui.capabilities`,
and the docstring at `:370-374` promises "re-checked on every invocation". A
grep confirms **no Rust reader** — only the definition and the docstring. The
enforcement is client-side in the portal
(`ai-customer-support-portal/src/hooks/useSolutionUi.ts:88-90`
`bundleHasCapability`). Non-data `ui.*` calls are unguarded server-side.
:::

## 3 · Action-level RBAC (`action.permission`)

### The gate

[`ai-customer-support/crates/api/src/flow_engine/action_runtime.rs:111-125`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/action_runtime.rs#L111-L125)

```rust
// 2. Permission check
if let Some(perm) = action_def.get("permission").and_then(Value::as_str) {
    if !perm.trim().is_empty() {
        crate::app_rbac_authz::require_action_permission(
            state.postgres.pool(),
            auth_ctx,
            tenant_id,
            workspace_id,
            installation_id.unwrap_or(Uuid::nil()),
            perm.trim(),
        )
        .await
        .map_err(|e| e.to_string())?;
    }
}
```

**Field name read: literally `"permission"`.** Not `required_permission`.

`grep -o '"permission"'` across both repos returns exactly one hit: this
line. The manifest type
([`manifest.rs:582`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L582))
and the proto DTO
([`solution.rs:331`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/solution.rs#L331))
both call it `required_permission`. Neither has a `#[serde(rename)]`.

### The consequence

An action declared as the documented schema tells you to:

```yaml
- id: cancel-order
  required_permission: orders.write      # publish-side name
  ...
```

is serialized by `chat_context.rs:365-379` into `{"required_permission":
"orders.write"}` — and the executor at `action_runtime.rs:112` never reads
that key. The `if let Some(perm)` returns `None`, the whole permission check
is **skipped**, and the action executes for any authenticated caller.

The gate only fires when the stored manifest JSON carries a bare
`permission:` key — which no typed manifest path can currently produce.

### What `require_action_permission` does

[`ai-customer-support/crates/api/src/app_rbac_authz.rs:154-197`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/app_rbac_authz.rs#L154-L197).

```text
App action access requires a solution installation              (:170-172)
App action access requires an authenticated portal user         (:176-178)
Missing permission '{permission}'                               (:193-195)
```

`:162-164` short-circuits to `Ok(())` for non-portal callers, so an SDK-app
tool invocation that reaches `execute_runtime_tool` never hits this layer.

The sibling `require_entity_permission` at `:99-150` is what every entity
op path in `runtime_adapter.rs:2975-2991` calls; it produces the same
`Missing permission '{permission}'` string.

### How the failure becomes an HTTP status

`ApiError::forbidden` is applied only by **string sniffing** at
[`solutions_plane.rs:4088-4094`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/routes/solutions_plane.rs#L4088-L4094):

```rust
if message.to_lowercase().contains("missing permission")
    || message.to_lowercase().contains("forbidden")
{ /* 403 */ } else { /* 400 */ }
```

Anything else surfaces as `bad_request`.

:::warning Do not rely on `required_permission` on actions
Until the field name is reconciled, an action's `required_permission` value
is **publish metadata** and nothing more. If you need a hard gate at the
action level, the only safe pattern today is to declare a `tool` arm whose
implementation calls `require_entity_permission` inside the adapter. See
[Auxiliary components → Actions](/docs/solutions/auxiliary-reference#actions).
:::

## 4 · HTTP tool scopes and channel access

Fields live on `HttpToolSpec`
([`flow_engine/http_executor.rs:216-219`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/http_executor.rs#L216-L219)):

```rust
#[serde(default)]
pub required_scopes: Vec<String>,
#[serde(default)]
pub access: super::http_policy::HttpToolAccess,
```

### `access.surfaces`

Enforced at [`http_executor.rs:799`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/http_executor.rs#L799):

```rust
super::http_policy::enforce_surface(&tool.access, exec.surface)?;
```

[`http_policy.rs:222-234`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/http_policy.rs#L222-L234):

```rust
let Some(surface) = surface else { return Ok(()) };
if tool_access.allows(surface) { Ok(()) } else { Err(HttpExecError::ForbiddenSurface) }
```

**Two default-open cases to know about:**
1. `HttpToolAccess::allows` (`:45-52`) returns `true` when `surfaces` is empty.
2. The check **bypasses entirely** when `surface` is `None` at `:226-228`.

Verbatim error string (Display, `http_executor.rs:114-116`):

```text
This capability is not available on this channel
```

### `required_scopes`

Enforced at
[`http_executor.rs:832-843`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/http_executor.rs#L832-L843):

```rust
for scope in &tool.required_scopes {
    let needed = scope.trim();
    if needed.is_empty() { continue; }
    if !crate::http_oauth::granted_covers_scope(&conn.scopes, needed) {
        return Err(HttpExecError::MissingScope {
            name: tool.connection.clone(),
            scope: needed.to_string(),
        });
    }
}
```

Display at `:108-113`:

```text
Workspace connection '{name}' is missing required scope '{scope}'
```

Test proof the check runs **before** any HTTP call:
`http_executor.rs:2264` `missing_required_scope_rejects_before_http` asserts
`transport.captured.is_none()`.

### Identity + workspace gates

`enforce_identity_required` (`http_policy.rs:236-248`) → `IdentityRequired`.
Workspace scoping at `http_executor.rs:801-803`:

```text
HTTP tools require a workspace
```

Connection tenant/workspace mismatch (`:814-818`) → `MissingConnection`.

**Status: enforced.** Empty lists and `None` surfaces fail open by design —
declare them, or the tool is unrestricted.

## 5 · Tool rows vs solution chat tools (agent advertisement)

Two very different paths in the agent.

### Tool rows — the gated path

[`crates/api/src/agent/runtime.rs:126`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/runtime.rs#L126):

```rust
&& core.allows_tool_def(&t.tool).is_ok()
```

`core` is `&AgentCore`
([`agent/core.rs:22-28`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/core.rs#L22-L28)):
`{ role, system_prompt, skills, capabilities: AgentCapabilityFlags,
gates: AgentGates }`.

`allows_tool_def` at `agent/core.rs:82-91`:

```rust
pub fn allows_tool_def(&self, tool: &domain::Tool) -> Result<(), String> {
    self.gates.allows_tool_def(tool)?;
    if !self.capabilities.allows_tool(&tool.name) {
        return Err(format!(
            "capability flags disallow tool '{}' for this agent",
            tool.name
        ));
    }
    Ok(())
}
```

`AgentGates::allows_tool_def` at `agent/capabilities.rs:172-184` refuses with:

```text
payment operations are not allowed through the agent                 (:163)
write operations are disabled for this agent phase                   (:166)
tool '{name}' is not confidently read-only for this agent phase       (:178-181)
```

It takes `&domain::Tool` — a **Tool row**. Runs only inside `advertise_tools`
(`runtime.rs:113-131`), over `req.tools`. Other callers: `agent/executor.rs:189`,
`agent/staging.rs:180`.

### Solution `chat_tools` — the ungated path

```rust
chat_tools = c.chat_tools;                                  // runtime.rs:218
```

…then pushed into the LLM payload with **no capability, gate, role or RBAC
check** at [`runtime.rs:332-338`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/runtime.rs#L332-L338):

```rust
for t in &chat_tools {
    defs.push(LlmToolDefinition {
        name: t.llm_name.clone(),
        description: t.description.clone(),
        parameters: t.parameters.clone(),
    });
}
```

`entity_defs` are likewise pushed unconditionally at `:339-343`.

At invocation time (`runtime.rs:737-770`), the only check is the name-based
policy gate: `classify_tool_name_action(&sol.tool)` + `evaluate_action`
(`:757-769`) followed by `strip_authority_overrides` (`:772-773`). No
`allows_tool_def`, no role filter, no `rbac_allows_tool` on that path.

:::warning The gate on chat-tool advertisement is name-based, not metadata-based
`chat_tools` are pushed to the LLM unconditionally. A tool named `list_orders`
passes the read-only name filter and executes without any capability, role or
RBAC check. A tool named `charge_and_notify` classifies as Financial and is
blocked. **Naming matters more than declaring** on this path. See
[Runtime capabilities §7](/docs/solutions/runtime-capabilities#7--agent-decisions-vs-deterministic-enforcement).
:::

## 6 · `agent.roles.*.capabilities` is not RBAC

### Publish gate

[`manifest.rs:1130-1193`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L1130-L1193)
`validate_agent_manifest`. Verbatim:

```text
manifest.yaml: agent.roles.{role}: unknown capability '{cap}'                        (:1155-1158)
manifest.yaml: agent.roles.{role}: '{cap}' looks like a permission grant;
               agent metadata declares capabilities only, never RBAC                  (:1161-1172)
manifest.yaml: agent.roles.{role}: tool '{tool}' is not declared in tools/http_tools  (:1173-1182)
manifest.yaml: agent.roles.{role}: flow '{f}' is not declared in flows                (:1183-1190)
```

The RBAC-shaped refusal fires whenever the token contains `.` or `:`. That is
the whole check — it does not attempt to interpret the string.

Struct: `KNOWN_AGENT_CAPABILITIES` at `manifest.rs:162-181` is the closed
vocabulary:

```text
knowledge  orders  analytics  customer_insights  inventory  crm  customers
reservations  bookings  promotions  pricing  refunds  properties  listings
leads  viewings  enquiries
```

### Runtime effect

[`ai-customer-support/crates/api/src/agent/metadata.rs:83-120`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/metadata.rs#L83-L120)
`flags_from_capability_names` maps each token onto one of nine booleans on
`AgentCapabilityFlags`:

| Token(s) | Flag |
| --- | --- |
| `knowledge` | `.knowledge` |
| `orders` | `.orders` **and** `.reservations` (`:99-102`) |
| `analytics` | `.analytics` |
| `customer_insights \| customers \| crm` | `.customer_insights` |
| `inventory` | `.inventory` |
| `reservations \| bookings` | `.reservations` |
| `promotions` | `.promotions` |
| `pricing` | `.pricing` |
| `refunds` | `.refunds` |
| `properties \| listings \| leads \| viewings \| enquiries` | `.customers` + `.orders` (`:112-115`) |
| Anything else | `_ => {}` (`:116`) — silently ignored |

Consumed at `runtime.rs:215`
(`core = core.with_capabilities(meta.flags_for_role(role))`). Two effects:

1. Tool **name** heuristic filtering — `capabilities.rs:100-124`
   (`looks_like(name, &["order", …]) && !self.orders → false`), a substring
   deny-list applied to Tool rows only (see section 5 above).
2. RAG retrieval gate: `runtime.rs:299` —
   `if core.capabilities.knowledge { …execute_rag… }`.

Nothing else. It never produces a permission string and never reaches
`app_rbac_authz`.

### Fail-closed on empty list

[`metadata.rs:66-76`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/metadata.rs#L66-L76)
`flags_for_role`: when `enabled: true` but the capability list is empty, all
nine booleans become `false`. Test `enabled_empty_caps_fail_closed` at
`:167-178`.

When `enabled: false`, the role default applies. `flags_from_capability_names`
never grants anything on its own.

### The authoritative test

[`metadata.rs:147-165`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/agent/metadata.rs#L147-L165)
`metadata_does_not_imply_rbac_grants`:

```rust
assert!(flags.analytics && flags.orders);
// Flags are advertising only — no permission strings produced.
assert!(serde_json::to_value(&flags)
    .unwrap()
    .get("permissions")
    .is_none());
```

**Verdict:** capability tokens bias tool advertisement and RAG. They do not
grant access. There is no path from `manifest.agent` to a permission check.

## 7 · Workspace and tenant scoping

### Chat context — one primary install per workspace

[`services/solution-service/src/api/chat_context.rs:190-219`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/chat_context.rs#L190-L219)

```rust
// One primary application per workspace: only that install contributes
// prompts/tools/chips (Tenant → Workspace → Application).
let installs: Vec<_> =
    match crate::repo::TenantRepo::find_primary_active(
        &state.pool,
        ctx.tenant_id,
        ctx.workspace_id,
    )
```

Then `TenantRepo::get_state(&state.pool, ctx.tenant_id, ctx.workspace_id,
&p.solution_name)` (`:203-208`), and a `state == "paused"` exclusion
(`:212-216`). `ctx` arrives via `TenantExtractor(ctx)`
(`api/chat_context.rs:169`, defined at
`qefro-plugin-platform/crates/qefro-plugin-common/src/context.rs:147`).

### SQL filters

`repo/tenant.rs:436-445` — `tenant_solutions`:

```sql
FROM tenant_solutions
WHERE tenant_id = $1
  AND status IN ('active', 'installing', 'upgrading')
  AND (workspace_id = $2 OR ($2::uuid IS NULL AND workspace_id IS NULL))
```

`repo/tenant.rs:707-713` — `tenant_solution_state`:

```sql
FROM tenant_solution_state
WHERE tenant_id = $1 AND solution_name = $2
  AND (workspace_id = $3 OR ($3::uuid IS NULL AND workspace_id IS NULL))
```

`service/installer.rs:1538` reads `TenantRepo::get_state(pool,
ctx.tenant_id, ctx.workspace_id, solution_name)`; `:381`, `:492`
(`find_primary_active`); `:1153` re-checks against `existing.workspace_id`.
Write path: `TenantRepo::upsert_state(tx, tenant_id, organization_id,
workspace_id, solution_name, …)` at `repo/tenant.rs:565-577`.

### Schema backing

`qefro-plugin-platform/migrations/solution/003_workspace_scoping.sql`:
- `:7-9` adds `workspace_id` to `tenant_solutions`, `tenant_solution_settings`,
  `tenant_solution_state`.
- `:46-56` drops the legacy `(tenant_id, solution_name)` constraint and
  creates **two partial uniques**:
  - `uq_tenant_solution_state_legacy … WHERE workspace_id IS NULL`
  - `uq_tenant_solution_state_workspace ON (tenant_id, workspace_id,
    solution_name) WHERE workspace_id IS NOT NULL`

The legacy `IS NULL` branch means a package that installs without a
`workspace_id` still works and does not collide with workspace-scoped rows.

## 8 · Authority fields

### Entity side — package cannot declare

[`solution/entities.rs:19-25`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/entities.rs#L19-L25)

```rust
const FORBIDDEN_AUTHORITY_FIELDS: &[&str] = &[
    "workspace_id",
    "tenant_id",
    "installation_id",
    "organization_id",
];
```

Refused at publish (`entities.rs:348-358`):

```text
entities: entity '{id}' field '{name}' is reserved for trusted runtime context
          (metadata cannot specify workspace/tenant authority)
```

**The list here is not the same list as the runtime strip list.** Wider
versions of the same idea exist at:
- `ai-customer-support/services/generator-service/src/domain/entity_spec.rs:16`
  (enforced at `validator/security_validator.rs:206` and
  `compiler/patch.rs:630`).
- `ai-customer-support/crates/api/src/flow_engine/runtime_adapter.rs:24-34`
  (nine keys — see [Runtime capabilities §5b](/docs/solutions/runtime-capabilities#5b--authority-keys-stripped-before-decisions)).

### Caller side — silently stripped

`strip_authority_overrides` (`runtime_adapter.rs:85-103`) removes any of the
nine keys before the tool sees them. Applied at `agent/runtime.rs:772-773`
and `runtime.rs:777` before any invoke. The tool has no way to know they were
there; **no error is produced** — a caller who thinks they are asserting
`workspace_id` for scoping is silently ignored.

## 9 · Route-level admin gates

### `solution-service` catalog mutations

Not declared in `api/mod.rs` (the route table is bare). Enforced inside the
handlers at
[`services/solution-service/src/api/catalog.rs:26-57`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/catalog.rs#L26-L57):

```text
admin access required                                                  (:26-34)
invalid x-qefro-admin-id                                               (:26-34)
invalid x-qefro-admin-id uuid                                          (:26-34)
platform admin required to publish or yank solutions                   (:41-43)
platform admin allowlist not configured (set QEFRO_PLATFORM_ADMIN_IDS) (:54-56)
```

`require_platform_admin` call sites:
- `catalog.rs:65` → `POST /v1/solutions/publish`
- `catalog.rs:184` → `DELETE /v1/solutions/:name/:version` (yank)
- `catalog.rs:200` → `POST /v1/solutions/:name/:version/assets` (upload)

A separate `pub(crate) fn require_admin` lives at
`services/solution-service/src/catalog/api/connectors.rs:36-44` and is
reused at `catalog/api/solutions.rs:39`, `catalog/api/keys.rs:86,114,151`.
`connectors.rs:52-57` adds `"publisher_id must match x-qefro-admin-id"`.

**Not** admin-gated by this mechanism: `GET /v1/solutions`,
`GET /v1/solutions/:name/versions`, `GET /v1/solutions/:name/:version`,
asset download. All `/v1/tenant/*` and `/v1/internal/*` routes use
`TenantExtractor` headers, not `x-qefro-admin-id`.

### `ai-customer-support` (ACS)

Definition:
[`crates/api/src/authz.rs:22-29`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/authz.rs#L22-L29)

```rust
pub fn require_admin(claims: &Claims) -> Result<(), ApiError> {
    match claims.role {
        UserRole::Owner | UserRole::Admin => Ok(()),
        UserRole::Member | UserRole::SuperAdmin => {
            Err(ApiError::forbidden("Requires admin or owner role"))
        }
    }
}
```

Note: **`SuperAdmin` is *not* allowed** by this helper — the ACS route layer
treats Owner+Admin as the admin scope.

Routes protected (declared at `crates/api/src/routes/router.rs:1301-1347`;
gates inside `solutions_plane.rs`):

| Route | Handler line | `require_admin` line |
| --- | --- | --- |
| `GET /api/v1/installations` | 2740 | `:2745` |
| `POST /api/v1/installations` | 2762 | `:2767` (+ `require_workspace_access` `:2772`) |
| `GET /api/v1/installations/:name` | 2883 | `:2889` |
| `PATCH /api/v1/installations/:name` | 2952 | `:2959` |
| `DELETE /api/v1/installations/:name` | 3003 | `:3009` |
| `POST /api/v1/installations/:name/upgrade` | 3033 | `:3040` (+ workspace `:3047`) |
| `GET /api/v1/installations/:name/updates` | 3115 | `:3121` |
| `GET /api/v1/installations/:name/upgrade-review` | 3136 | `:3142` |
| `GET /api/v1/installations/:name/connectors` | 3409 | `:3415` |
| `POST /api/v1/installations/:name/onboarding/:step_id/complete` | 3430 | `:3436` |
| `GET /api/v1/installations/:name/ui` | 3817 | `:3823` |

Adjacent: `POST /api/v1/packages/upload` → `:3165`;
`POST /api/v1/runtime/workflows/trigger` → `:3519`.

**`POST /api/v1/runtime/ui/data` uses `require_member` (`:3969`) +
`require_workspace_access` (`:3989`), not `require_admin`.** That endpoint is
the widget → platform data plane, and it is intentionally available to any
workspace member with a granted capability. The ACS forwarder injects
`x-qefro-admin-id: claims.sub` at `solutions_plane.rs:3238` when calling
solution-service — so the two auth layers talk through distinct mechanisms
and never merge.

## 10 · `record_bound` on actions

Declared at
[`manifest.rs:590-595`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L590-L595):

```rust
pub struct ActionTarget {
    pub entity: String,
    #[serde(default)]
    pub record_bound: bool,
}
```

Mirrored as `ActionTargetDto` at
`qefro-plugin-platform/crates/qefro-plugin-proto/src/solution.rs:339-345`.

**Grep across both repos for `record_bound`: exactly four hits.** The two
field declarations, one test fixture JSON (`validator.rs:1501`), and one
documentation example. **No reader at any stage.** Nothing validates it,
nothing branches on it, and no test asserts behaviour keyed to it.

What the runtime *actually* reads on this shape is
[`action_runtime.rs:143-147`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/action_runtime.rs#L143-L147):

```rust
let target_kind = action_def
    .get("target")
    .and_then(|t| t.get("kind"))
    .and_then(Value::as_str)
    .unwrap_or("record");
```

`kind` is not a field on `ActionTarget`, so no typed manifest round-trip can
emit it. The runtime falls back to `"record"` and applies `:154-162` — error:

```text
Action '{action_id}' targets a record but no 'id' parameter was provided
```

Record-boundedness is therefore **inferred from the absence of `kind`**, never
from `record_bound`.

## The vocabulary split summary

Four publish-side names have a different runtime-side counterpart:

| Publish | Runtime read | Effect |
| --- | --- | --- |
| `actions[].required_permission` | `action.permission` | Gate silently skipped. |
| `actions[].target.record_bound` | `target.kind` (default `"record"`) | Publisher metadata with no reader. |
| `actions[].execution.target_state` | `execution.target_status` | Runtime falls back to a `status` parameter; if neither exists, error `"Action '{action_id}' missing target_status"`. |
| `actions[].events: Vec<String>` | `action.emit_event` (single string, `:271`) | Nothing reads the list. |

The chat-context action export path
([`chat_context.rs:365-379`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/chat_context.rs#L365-L379))
re-serializes through `ActionDefinition`, which is a **closed struct** with
`deny_unknown_fields` off — the four runtime names on the table above are not
declared fields, so they cannot survive the round-trip from a Marketplace
package. Any executor-visible behaviour tied to those names today can only
be produced by a non-Marketplace path.

## What a developer can rely on

| Mechanism | Status | Notes |
| --- | --- | --- |
| `permissions[]` grammar | **Enforced** | Publish fails on malformed strings. |
| `permissions[]` → UI capability grant | **Enforced** | Missing grant → 403 `CAPABILITY_NOT_GRANTED`. |
| `permissions[]` → connector binding | **Enforced** | Written into `/qefro` SDK connector `caps`. |
| `permissions[]` → staff RBAC | **Metadata only** | Different table entirely. |
| `capabilities[]` ∈ host ∪ plane | **Enforced** (union only) | Host/plane distinction not enforced at publish. |
| Action `required_permission` gate | **Broken name** | Executor reads `permission`. Do not rely. |
| HTTP tool `required_scopes` | **Enforced** | Fails before network. |
| HTTP tool `access.surfaces` | **Enforced, default-open** | Empty list and `None` surface bypass. |
| Tool-row agent gating (`allows_tool_def`) | **Enforced** (Tool rows only) | |
| Solution `chat_tools` advertisement | **Convention only** at invocation | Pushed unconditionally; only the name-class policy gate protects. |
| Workspace/tenant scoping | **Enforced** | SQL filters on every read/write path. |
| Entity authority fields forbidden | **Enforced** | Publish refuses. |
| Caller authority-field strip | **Enforced, silent** | No error — keys are removed. |
| `x-qefro-admin-id` on catalog mutations | **Enforced** | Publish / yank / asset upload. |
| `require_admin` on `/api/v1/installations/*` | **Enforced** | Owner+Admin only; `SuperAdmin` deliberately excluded. |
| `record_bound` on actions | **Metadata only / Unsupported** | No reader. |

## Related pages

- [Runtime capabilities](/docs/solutions/runtime-capabilities)
- [Auxiliary components reference](/docs/solutions/auxiliary-reference)
- [Attribute inventory](/docs/solutions/attribute-inventory)
- [Support matrix](/docs/solutions/support-matrix)
- [Security](/docs/solutions/security)
- [Handbook](/docs/solutions/handbook)
