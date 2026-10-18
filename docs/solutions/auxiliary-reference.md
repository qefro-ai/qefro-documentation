---
title: "Auxiliary components reference"
description: "Everything outside the four canonical folders — prompts, onboarding, policies, channels, migrations, connections, HTTP tools, triggers, actions and the agent block: who parses each, where it is stored, which of the four carriers ships it, and which runtime reader (if any) actually consumes it."
sidebar_label: "Auxiliary components"
---

# Auxiliary components reference

A Marketplace App is more than `manifest.yaml` + `entities/` + `flows/` +
`ui/`. Around those canonical folders sit eleven auxiliary component types,
each with a different producer, storage path, carrier and — crucially — a
different **runtime reader**. Some are read at every chat turn; some are read
only by the catalog page; some are parsed, validated and then never looked at
again by anything that runs.

This page documents each auxiliary component against the code as it is now, so
you can tell the difference between a key that changes behaviour and a key that
merely survives the pipeline.

## The envelope every component travels in

`PublishPackageComponents`
([`crates/qefro-plugin-proto/src/solution.rs:15-49`](file:///Users/abu/qefro/qefro-plugin-platform/crates/qefro-plugin-proto/src/solution.rs#L15-L49))
is the only envelope a package can put components in:

```rust
pub struct PublishPackageComponents {
    pub workflows: Vec<Value>,
    pub prompts: Vec<Value>,
    pub settings: Value,
    pub onboarding: Vec<Value>,
    pub policies: Vec<Value>,
    pub channels: Value,
    pub migrations: Vec<String>,
    pub ui: Vec<Value>,
    pub entities: Vec<Value>,
    pub events: Vec<Value>,
    pub http_tools: Vec<Value>,
    pub connections: Vec<Value>,
    pub actions: Vec<Value>,
}
```

Every item inside a `Vec<Value>` is stored as raw JSON, so **unknown keys per
item survive** the publish round-trip. The single `Value` fields (`settings`,
`channels`) are opaque maps. `migrations` is a `Vec<String>` of names only.
`actions` is a `Vec<Value>` in the type but **both assemblers leave it empty**
— see the [Actions](#actions) section.

The version document persisted at publish
([`service/publisher.rs:137-141`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/service/publisher.rs#L137-L141))
is `{ "manifest": <raw>, "components": <serialized PublishPackageComponents> }`
— so `manifest.*` keys reach the runtime raw and `components.*` reach it
re-serialized but still item-level raw.

## Routing table

| Component | Producer | Stored in | Carrier | Runtime reader | Status |
| --- | --- | --- | --- | --- | --- |
| `prompts/*.yaml` | CLI `load_prompts`; ZIP `load_prompts` auto-discovery | `solution_prompts (prompt_id, system, variables)` | `N:plan`, `N:ctx` (only the three fields survive) | `chat_context.rs:465-507` selects conversational prompts and resolves `{{var}}` | **Partial** — `description`, `model`, `temperature` are parsed and validated but **not persisted**; see below |
| `onboarding/*.yaml` | CLI `load_onboarding`; ZIP **only via `components.json`** | `solution_onboarding (step_id, title, action, connector, required, step_order, definition)` | `N:plan` seeds `onboarding_initial` | Portal wizard via `GET /v1/tenant/solutions/:name/onboarding` and `POST …/:step_id/complete`; ACS proxy at `router.rs:1344-1347` | **Supported** |
| `policies` | **`components.json` overrides only** — no directory is read | `solution_policies` | `N:raw` | Catalog display only (`publisher.rs:301` → `SolutionPolicyDto`) | **Metadata only** |
| `channels` | `components.json` overrides; ZIP `components.channels` | `solution_channels (channel, config)` | `N:raw` | Config is stored; **no runtime reader**. Portal derives its channel list from `manifest.channels`, not the config. | **Partial** — see the `channels` section below |
| `migrations` | `components.json` overrides only | `InstallPlan.migrations` | `N:plan` field that no consumer reads | None — `applied_migrations` / `pending_migrations` are **not called** in production | **Metadata only** |
| `connections/*.yaml` | CLI / ZIP `load_named_yaml` + auto-discovery | in the version document only | `N:raw` → `N:ctx` `desc.connections` | `chat_context.rs:323-330`; `http_oauth.rs:88-268` builds the profile | **Supported** |
| `tools/*.yaml` (HTTP tools) | CLI / ZIP `load_named_yaml` | in the version document only | `N:ctx` `desc.http_tools` | `chat_context.rs:296-322` (GET only); ACS `flow_engine/http_executor.rs` executes the whole spec | **Supported** |
| `manifest.triggers[]` | manifest key | raw in `version_row.manifest["manifest"]["triggers"]` | `N:ctx` | `chat_context.rs:227-251` exports; ACS consumes event/trigger bindings | **Supported** |
| `manifest.actions[]` | manifest key (CLI and ZIP both set `components.actions = vec![]`) | typed `desc.manifest.actions` | `N:ctx` (see trap below) | ACS `flow_engine/action_runtime.rs` | **Partial** — see [Actions](#actions) |
| `manifest.agent` | manifest key | `N:ctx` `desc.agent` | `chat_context.rs:346-350`; ACS `agent/metadata.rs` | Prompt-shaping only; **never grants RBAC** | **Supported (as metadata)** |
| `components.json` | opt-in root file | feeds the ZIP/CLI assembler directly | — | Overrides `onboarding`, `policies`, `channels`, `migrations`, `settings` | **Supported** |

Gate chain legend matches [Attribute inventory](/docs/solutions/attribute-inventory):
**P** Parsed · **V** Validated · **N** Normalized (carrier: `plan`, `ctx`,
`raw`, `bundle`) · **C** Consumed · **O** Observable.

## `prompts/` — prompt templates

**Parsed by** `PromptDefinition::from_yaml` / `from_value`
([`solution/prompts.rs:29-42`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/prompts.rs#L29-L42)).

```yaml
# prompts/booking-assistant.yaml
id: booking-assistant
system: |
  You are a restaurant assistant helping {{customer_name}}.
  Table date under discussion: {{reservation_date}}.
variables:
  - customer_name
  - reservation_date
description: Optional UI text                # parsed, not stored
model: gpt-4o-mini                            # parsed, not stored
temperature: 0.2                              # parsed, validated, not stored
```

**Struct** ([`prompts.rs:12-27`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/prompts.rs#L12-L27)):

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | kebab/snake via `validate_package_id`; duplicates refused |
| `system` | string | yes | must be non-empty after `.trim()` |
| `variables` | list[string] | no, `[]` | first char `a-z`, rest `a-z 0-9 _`; duplicates refused |
| `description` | string | no | parsed, **not persisted** — see below |
| `model` | string | no | parsed, **not persisted** |
| `temperature` | float | no | must be `0.0..=2.0`; **not persisted** |

**Verbatim errors** (`prompts.rs:44-79`):

```text
prompt {id}: system template is empty
prompt {id}: temperature out of range [0, 2]: {temperature}
prompt {id}: invalid variable name '{variable}'
prompt {id}: duplicate variable '{variable}'
```

`manifest.prompts[]` must set-match `prompts/*.yaml` files
(`validator.rs:149-155`); either direction fails with:

```text
manifest references prompts '{id}' which is missing from the package
prompts '{id}' is not referenced by the manifest
```

**Where it lands**
[`repo/components.rs`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/repo/components.rs)
inserts `solution_prompts (prompt_id, system, variables)` — the column list
proves `description`, `model`, `temperature` are **not persisted**. The
install plan also drops them: `installer.rs:101-105` builds
`(id, system, variables)` triples only.

**Chat context reader**
[`chat_context.rs:465-507`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/chat_context.rs#L465-L507)
loads prompt rows, filters to conversational ids (see
`conversational_prompt_ids` at
[`chat_context.rs:553-580`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/chat_context.rs#L553-L580),
which walks `triggers.type == conversation` and step `type: ask` with a
`step.prompt`), and resolves `{{var}}` against workspace settings. **Unresolved
placeholders are dropped, not left as literal text.**

`undeclared_variables()` exists at `prompts.rs:83-102` and is called only from
its own test. A `{{missing}}` reference is not a publish error and is not a
runtime error — it is silently stripped.

## `onboarding/` — tenant setup wizard

**Parsed by** `OnboardingStep::from_yaml` / `from_value`
([`solution/onboarding.rs:53-66`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/onboarding.rs#L53-L66)).

```yaml
# onboarding/connect_whatsapp.yaml
id: connect_whatsapp
title: Connect WhatsApp
action: connector.connect
connector: whatsapp
required: true                 # default true
description: Optional help line
```

**Struct** ([`onboarding.rs:28-47`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/onboarding.rs#L28-L47)):

| Key | Type | Required | Default |
| --- | --- | --- | --- |
| `id` | string | yes | — (kebab/snake) |
| `title` | string | yes | — (non-empty after trim) |
| `action` | string | yes | — (non-empty; **closed list not enforced**) |
| `connector` | string | conditional | required for `connector.connect` |
| `channel` | string | conditional | required for `channel.enable` |
| `required` | bool | no | `true` |
| `description` | string | no | absent |
| `#[serde(flatten)] extra` | map | — | `{}` — unknown keys **survive** into `to_json()` |

The four constants at `onboarding.rs:13-19` name
`connector.connect`, `upload`, `configure`, `channel.enable`. `KNOWN_ACTIONS`
is declared at `:21-26` and referenced only in a doc comment. **Nothing
enforces it.** A step with `action: my_custom_thing` publishes and installs
fine; the portal just renders the raw action string.

**Verbatim errors** (`onboarding.rs:68-93`):

```text
onboarding step {id}: title is empty
onboarding step {id}: action is empty
onboarding step {id}: `connector.connect` requires `connector`
onboarding step {id}: `channel.enable` requires `channel`
```

Cross-gate at [`validator.rs:223-235`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/validator.rs#L223-L235):
a connector reference must be declared in `manifest.connectors[]`:

```text
step '{id}' references connector '{connector}' not declared in the manifest
```

**Producer asymmetry** — the CLI reads a `onboarding/` directory
([`qefro-cli/src/main.rs:544-572`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs#L544-L572));
the ZIP assembler
([`zip_assemble.rs:138-174`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/zip_assemble.rs#L138-L174))
pulls `onboarding`, `policies`, `channels`, `migrations` **only** from a
`components.json` override at the package root. A ZIP with `onboarding/*.yaml`
but no `components.json` publishes **zero** onboarding steps.

**Where it lands** `solution_onboarding (step_id, title, action, connector,
required, step_order, definition)` — the JSON `definition` column carries the
flattened extras. `plan_install` seeds `onboarding_initial` at
`installer.rs:107-113` as `{ step_id: { status: "pending", required } }`.

**Runtime readers**:
- `GET /v1/tenant/solutions/:name/onboarding` merges rows with
  `onboarding_state` blob and emits `{step_id, title, action, connector,
  required, step_order, status}`
  ([`api/tenant.rs:307-357`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/api/tenant.rs#L307-L357)).
- `POST /v1/tenant/solutions/:name/onboarding/:step_id/complete` — path
  params only, no body. Proxied from ACS at
  `crates/api/src/routes/solutions_plane.rs:3428-3451`, route
  `POST /api/v1/installations/:name/onboarding/:step_id/complete` behind
  `require_admin` (`router.rs:1344-1347`).

The portal helper `packageOnboardingSteps`
([`ai-customer-support-portal/src/pages/solutions/ui/marketplaceSetup.ts`](file:///Users/abu/qefro/ai-customer-support-portal/src/pages/solutions/ui/marketplaceSetup.ts))
exists but has **no production importer** — the wizard is fed by the API, not
by the manifest.

## `policies` — declarative guardrails

**Parsed by** `PolicyDefinition::from_value`
([`solution/policies.rs:25-38`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/policies.rs#L25-L38)).

```yaml
# Only reachable via components.json overrides — see the CLI section
- id: refund-limit
  kind: limit
  rules:
    max_refund_inr: 10000
    requires_approval_over: 5000
```

**Struct** (`policies.rs:12-23`):

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | kebab/snake |
| `kind` | string | no, absent | free text — no closed vocabulary |
| `description` | string | no | absent |
| `rules` | any | no, `null` | **must not be null and must not be an empty object** |

**Verbatim error** (`policies.rs:40-50`):

```text
policy {id}: rules must not be empty
```

Nothing else. There is no rule grammar, no schema check on `rules`, and no
evaluation engine.

**Producer** — the CLI **never reads a `policies/` folder**
([`main.rs:317-318`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs#L317-L318)
pulls the array out of `components.json`). The ZIP assembler does the same.
So `policies/*.yaml` files in your source tree do **nothing** unless you
compile them into `components.json.policies` yourself.

**Reader** — `ComponentRepo::list_policies`
([`repo/components.rs:284`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/repo/components.rs#L284))
is called **only** at `publisher.rs:301` for the catalog DTO. Nothing on the
chat, install or runtime path reads a policy. **Status: Metadata only.**

## `channels` — per-channel configuration map

The manifest declares which channels the app supports:

```yaml
# manifest.yaml
channels: [widget, whatsapp]
```

`channels` is `Vec<String>`
([`manifest.rs:17-109`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L17-L109))
and the only enforcement is that the entry list is the vocabulary the config
must match.

The **config** side arrives as `components.channels` — a top-level map keyed
by channel id. `parse_channel_configs`
([`validator.rs:420-442`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/validator.rs#L420-L442)):

**Verbatim errors:**

```text
channels: expected a mapping of channel -> config
channels: config for undeclared channel '{channel}'
```

**Producer** — neither assembler reads a `channels/` directory. Both pull
`components.channels` from `components.json` overrides
(`main.rs:320-324`, `zip_assemble.rs:138-174`).

**Where it lands** `solution_channels (channel, config)` in
`repo/components.rs`.

**Reader** — the portal derives its channel list from
`manifest.channels`, not from `solution_channels`.
`MarketplaceSetup.tsx:141` uses `packageChannelIds(detail.data.channels?.length
? detail.data.channels : manifest?.channels)`, filtered through
`isWebsiteChannel` which strips ids that lowercase to `website`, `web`, `site`
or `www`.
Nothing on the ACS side reads the stored `config` blob. **Status: Partial —
the declaration is consumed; the per-channel config is stored and never read.**

The four onboarding-channel actions (`widget`, `whatsapp`, plus any others you
declare) all pass through, but only the manifest list is *observable*.

## `migrations` — tenant data migrations (declared, not run)

Names must be `NNN_snake_case` optionally with a `.sql` suffix. Exactly three
digits; the label after `_` is `[a-z0-9_]`.

**Verbatim errors** (`solution/migrations.rs`):

```text
invalid migration name '{name}': expected NNN_snake_case(.sql)
duplicate migration '{name}'
migration '{name}' is out of order
```

Ordering is **strictly increasing** on the numeric prefix, checked in the
input order. `001_a.sql, 001_b.sql` fails as duplicate. `002_x, 001_y` fails
as out-of-order. `001_a.sql, 002_b.sql` passes.

**Producer** — again, `components.json.migrations` only. No directory is read.

**Where it lands** `plan_install` copies the array into
`InstallPlan.migrations` ([`installer.rs:135`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/installer.rs#L135)).
**Nothing consumes that field**. Grep across `src/` returns no read sites. The
helper functions `applied_migrations` and `pending_migrations` in
`migrations.rs:65-83` exist and are tested, but no production caller uses
them; `_applied_migrations` is only mentioned in the module docstring, never
written.

**Status: Metadata only.** Migrations are validated, packaged, and filed. The
install pipeline records no "migration applied" state and no runtime reads
them.

## `connections/` — named HTTP connection profiles

```yaml
# connections/shopify.yaml
id: shopify
auth_type: oauth
oauth:
  authorization_url: https://{shop_host}.myshopify.com/oauth/authorize
  token_url: https://{shop_host}.myshopify.com/admin/oauth/access_token
  client_id_source: workspace
  client_secret_source: workspace
  scopes:
    - read_products
    - read_orders
```

**Parsed by** `http_tools::connection_id` + `validate_connection_auth_and_webhooks`
([`solution/http_tools.rs:34-173`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/http_tools.rs#L34-L173)).
The parser is a thin gate over a raw JSON object — nothing else — so
connections are the only auxiliary type where **unknown keys are preserved by
name** and read at execution by `HttpConnectionProfile::from_connection_value`
in ACS ([`http_oauth.rs:88-268`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/http_oauth.rs#L88-L268)).

**Closed vocabularies enforced at publish:**

```text
auth_type ∈ { bearer, named_header, basic, none }         # ALLOWED_AUTH_TYPES
token_auth_method ∈ { client_secret_post, client_secret_basic }
hmac.encoding ∈ { hex, base64 }
signature.format ∈ { raw, timestamped, prefixed }
identity.source == "header"
topic.source ∈ { header, json }
oauth.*_url → must be HTTPS
```

**Forbidden content** (`http_tools.rs:10-32`):
`FORBIDDEN_CONNECTION_KEYS` and `FORBIDDEN_HEADER_KEYS` reject anything that
looks like a secret. `reject_map_keys` at `:401` also refuses any key whose
name contains `secret`, `access-token` or `access_token`.

**Verbatim error:**

```text
connections must not contain credentials ('{key}'); use the workspace connection
```

`manifest.connections[]` set-matches `connections/*.yaml`
(`validator.rs:188-197`). CLI/ZIP auto-discovery: `load_named_yaml(dir,
manifest, "connections", "connections")` in the CLI, `load_named_list` in
the ZIP assembler (which globs `dir/*.yaml` when nothing is declared).

**Reader** `chat_context.rs:323-330` exports the array into
`desc.connections` on the chat context; ACS `http_executor.rs` builds
`HttpConnectionProfile` from these at execution. **Status: Supported.**

## `tools/` — HTTP tools

```yaml
# tools/list_orders.yaml
id: list_orders
connection: shopify
method: GET
path: /admin/api/2024-10/orders.json
query:
  status: any
  limit: 25
emits:
  - order.created
pagination:
  style: page
  limit_param: limit
  max_limit: 250
response:
  items: orders
  item:
    id: id
    title: name
```

**Parsed by** `http_tools::http_tool_id`
([`http_tools.rs:52-180`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/http_tools.rs#L52-L180)).
The gate is intentionally shallow — it enforces the shape without owning the
schema.

**Enforced at publish:**

```text
method ∈ { GET, POST, PUT, PATCH, DELETE }
path must start with '/'
path must not contain '://' or '\' or '../'
request.encoding ∈ { json, form }
response.items must be a JSON path or "$root"
emits[] entries must contain '.'
no secret-looking header or query key
```

**Verbatim errors include** (`http_tools.rs:102`):

```text
tool '{id}' path must not contain a URL or path traversal
http_tools: tool '{id}' references undeclared connection '{conn}'
```

The last message fires from `validator.rs:207-211`.

`manifest.tools[]` set-matches `tools/*.yaml` (`validator.rs:215-220`).

**Reader at chat context** — `chat_context.rs:296-322` walks
`components.http_tools`, calls `is_readonly_chat_method`
([`http_tools.rs:305-311`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/http_tools.rs#L305-L311)),
and **only GET tools** become LLM-visible `SolutionChatToolDto`s with
`implementation_kind: "runtime"`. Their parameters come from
`chat_tool_parameters` (`http_tools.rs:328-399`): every `{placeholder}` in
`path` and every key in `query` becomes a `string` arg;
`pagination.limit_param` becomes an `integer` arg. `reply_signals` is always
emitted as `[]` from this path.

**Reader at execution** — ACS
`crates/api/src/flow_engine/http_executor.rs` re-parses the raw spec into
`HttpToolSpec` (`:184-224`) with fields `id, description, connection, method,
path, query, headers, body, request, emits, timeout_seconds, retry,
pagination, response, errors, required_scopes, access, identity, ownership`.
Runtime defaults: `DEFAULT_TIMEOUT_SECS = 15`, `DEFAULT_MAX_RETRIES = 2`,
pagination `limit.unwrap_or(50)`, `max_limit.unwrap_or(250)`
(`:1094-1101`). **Status: Supported.**

## Triggers (`manifest.triggers[]`)

```yaml
triggers:
  - id: welcome-flow
    workflow: greet-customer
    type: conversation
    input_variable: customer_message
    match:
      channel: whatsapp
    identity:
      source: header
    confirmation_message: "Thanks, we'll be with you shortly."
```

**Struct** `AppTrigger`
([`manifest.rs:400-421`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L400-L421)).
`input_variable_name()` derives a default when `input_variable` is absent:
the workflow id with `-` rewritten to `_`, then `_input` appended.

**Verbatim errors** (`validator.rs:237-300`):

```text
triggers[].id must be non-empty
duplicate trigger id '{id}'
trigger '{id}' references workflow '{workflow}' not declared in flows
```

**Reader** `chat_context.rs:227-251` exports triggers into the DTO ACS uses
for event routing. **Status: Supported.**

## Actions

Two shapes exist and the vocabulary split is the single biggest trap in the
metadata system.

```yaml
# manifest.actions[] — publish-side shape
- id: cancel-order
  name: Cancel order                       # parsed, no reader
  required_permission: orders.write        # publish key; executor reads `permission`
  description: Cancel a placed order
  parameters:
    - name: order_id
      type: string
      required: true
    - name: reason
      type: string
  target:
    entity: order
    record_bound: true                     # parsed, no reader
  execution:
    type: state_transition
    target_state: cancelled                # publish key; executor reads `target_status`
  events:                                  # parsed, executor reads emit_event (string)
    - order.cancelled
```

**Publish-side struct** `ActionDefinition`
([`manifest.rs:572-625`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L572-L625))
is typed, not `Value`. It has **no `enum_values`** field, so declaring a
closed parameter domain on the manifest is impossible. Cross-consistency
enforced at publish (`validator.rs:344-400`):

```text
action '{id}' targets undeclared entity '{e}'
action '{id}' references undeclared workflow '{w}'
action '{id}' target state '{s}' is not a transition destination in entity '{e}' state machine
action '{id}' specifies state_transition but target entity '{e}' declares no state_machine
action '{id}' has unsupported execution type '{t}' (state_transition | mutation | workflow | tool)
```

The last error is at `manifest.rs:749-763`. **`execution.type` defaults to
`"mutation"`** in the executor (`action_runtime.rs:132-135`).

**Executor-side reads**
([`ai-customer-support/crates/api/src/flow_engine/action_runtime.rs`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/action_runtime.rs)):

| Executor reads | Publish calls it | Same key? |
| --- | --- | --- |
| `action.permission` (`:112`) | `required_permission` | **No** |
| `target.kind` (`:143-147`), default `"record"` | `target.record_bound` (bool) | **No** |
| `execution.target_status` (`:165`), falls back to a `status` parameter | `execution.target_state` | **No** |
| `action.emit_event` (single string, `:271`) | `events: Vec<String>` | **No** |
| `execution.mutation_op` default `"update"` (`:205`) | same name | Yes |
| `execution.tool_id` (`:244`) → `RuntimeAdapter::execute` | same name | Yes |
| `execution.workflow_id` (`:226`) | same name | **Yes but stub — see below** |

`workflow` arm ([`action_runtime.rs:226-242`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/action_runtime.rs#L226-L242)):

```rust
"workflow" => {
    let workflow_id = execution
        .get("workflow_id")
        .and_then(Value::as_str)
        .ok_or_else(|| format!("Action '{action_id}' missing workflow_id"))?;
    let execution_id = Uuid::new_v4();
    AdapterOutcome::Success {
        output: json!({
            "action_id": action_id,
            "workflow_id": workflow_id,
            "execution_id": execution_id,
            "status": "triggered"
        }),
        media_fields: None,
        entity_def: None,
    }
}
```

Nothing is enqueued or dispatched. The success is **synthesized**. There is no
observable behaviour. **Status: `workflow` arm is Unsupported (stub).**

Anything else in `execution.type` dies at runtime
(`action_runtime.rs:264-266`) with:

```text
Unsupported action execution type '{other}'
```

**Carrier** — both assemblers set `components.actions = vec![]`
(`zip_assemble.rs:138-174`; the CLI does not read an actions directory).
`chat_context.rs:365-379` walks three lookups:
`version_row.manifest["components"]["actions"]` (empty),
`version_row.manifest["actions"]` (also empty — the wrapper doc is
`{manifest, components}` with no top-level `actions`), then
`serde_json::to_value(&desc.manifest.actions)`. Only the third path is live,
which **re-serializes through `ActionDefinition` and therefore drops every
executor-only key not on that struct**: `permission`, `target.kind`,
`execution.target_status`, `emit_event`.

**Practical consequence.** From a Marketplace package you cannot ship an
executor-readable `permission`, `target.kind`, `target_status` or `emit_event`
— the metadata type will not carry them. To make the executor behave as
declared, rename the publish fields on `ActionDefinition` and re-publish
solution-service. Until then, use `mutation` or `tool` arms and accept the
defaults.

## `agent` — LLM role hints

```yaml
agent:
  enabled: true
  roles:
    customer:
      capabilities: [orders, knowledge]
      tools: ["list_orders"]              # must be declared in tools[] or http_tools[]
      flows: ["greet-customer"]            # must be declared in flows[]
    business:
      capabilities: [analytics, refunds]
```

**Struct** `AgentManifestBlock`
([`manifest.rs:130-186`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L130-L186)).
`KNOWN_AGENT_CAPABILITIES` is a closed vocabulary:
`knowledge, orders, analytics, customer_insights, inventory, crm, customers,
reservations, bookings, promotions, pricing, refunds, properties, listings,
leads, viewings, enquiries`.

**Verbatim errors** (`validate_agent_manifest`, `manifest.rs:1130-1193`):

```text
agent.roles.{role}: unknown capability '{c}'
agent.roles.{role}: '{c}' looks like a permission grant; agent metadata declares capabilities only, never RBAC
tool '{t}' is not declared in tools/http_tools
flow '{f}' is not declared in flows
```

**Reader** — ACS `agent/metadata.rs:18-120`
`AgentManifestMetadata{enabled, roles}` computes a boolean flag set per role
via `flags_from_capability_names`. Unknown tokens hit a `_ => {}` arm and are
silently ignored. When `enabled: true` and the capability list is empty, the
result is **fail-closed all-false** (not all-true). At
`agent/runtime.rs:213-216` the flag set is passed to
`core.with_capabilities` and biases prompt shaping.

The test `metadata_does_not_imply_rbac_grants` in `agent/metadata.rs` is the
authoritative statement of what `agent` is *not*: it does not grant any RBAC.
`core.allows_tool_def(&t.tool)` at `agent/runtime.rs:126` filters **Tool
rows** only; solution-advertised `chat_tools` are pushed to the LLM
unconditionally at `agent/runtime.rs:332-338`.

**Status: Supported as metadata (prompt shaping). Not a security boundary.**

## `components.json` — the override channel

A root file only the ZIP and CLI assemblers read:

```json
{
  "onboarding": [ /* OnboardingStep[] raw JSON */ ],
  "policies":   [ /* PolicyDefinition[] raw JSON */ ],
  "channels":   { "widget": { /* opaque config */ } },
  "migrations": ["001_init.sql", "002_add_loyalty.sql"],
  "settings":   { /* SettingsSchema raw */ }
}
```

Parsed at [`qefro-cli/src/main.rs:270-330`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs#L270-L330)
and [`zip_assemble.rs:138-174`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/zip_assemble.rs#L138-L174).
This is the **only** channel for `policies`, `channels` (config), `migrations`
and for `onboarding` under the ZIP path. Anything not declared here is
silently `[]` or `null`.

Empty arrays are **not inserted** — `load_package` skips them so `components`
stays minimal.

## Support status summary

| Auxiliary | Supported | Notes |
| --- | --- | --- |
| Prompts | **Partial** | Three of six keys reach the runtime. |
| Onboarding | **Supported** | ZIP requires `components.json`. |
| Policies | **Metadata only** | No runtime reader. |
| Channels declaration | **Supported** | Consumed by portal UI. |
| Channels config blob | **Partial** | Stored; nothing reads it. |
| Migrations | **Metadata only** | Validated but never applied. |
| Connections | **Supported** | Whole spec reaches the OAuth layer. |
| HTTP tools | **Supported** | GET-only chat advertising; full spec executes. |
| Triggers | **Supported** | Consumed via chat context. |
| Actions | **Partial** | Executor-only keys are dropped on the way in. |
| `agent` | **Supported (as metadata)** | Prompt bias, never RBAC. |
| `components.json` | **Supported** | The only channel for four of the components above. |

## Related pages

- [Attribute inventory](/docs/solutions/attribute-inventory) — §2.6 actions,
  §11 settings, §12 auxiliary
- [Settings reference](/docs/solutions/settings-reference)
- [HTTP tools](/docs/solutions/http-tools)
- [Connectors](/docs/solutions/connectors)
- [Events](/docs/solutions/events)
- [Workflows](/docs/solutions/workflows)
- [Package structure](/docs/solutions/package-structure)
- [Handbook](/docs/solutions/handbook)
